/*
	---------------------------------------------------------------
	Execute a raw query with sequelize
	---------------------------------------------------------------

	Arguments:
			sql					The sql statement to execute
			fieldValues			The value of the parameter field in the sql statement
			hooks {
				beforeExec,		After the prepare is complete, the user can further process
								the sql statement and replacements before executing the sql statement.
				afterExec, 		After fetching data from db, the user can process the data further
			}

	Call form:
			(sql)
			(sql, fieldValues)
			(sql, fieldValues, hooks)

	E.g.
			1. Shorthand
				(sql)
				(sql, {id: 1})

			2. Complete
				(sql, {replacements: {id: 1}})
				(sql, {templateData: {id: 1}})
		 		(sql, {templateData: {dateCondition: 'date between "2019-05-01" and "2019-05-31"'}})
		 		(sql, {replacements: {id: 1}, templateData: {dateCondition: 'date between "2019-05-01" and "2019-05-31"'})

	About replacements and templateData:

			1. The difference

				replacements		The parameter form ":xxx" is used to specify the field value, for example "id = :id"
				templateData		The parameter form "{xxx}" is used to construct sql statements such as "where id > {id} and {dateCondition}"

				templateData contains the functionality of replacements.
				This is to avoid using both the replacements and templateData.

			2. Precautions

				The names of replacements and templateData can be omitted and the program
				automatically recognizes them. For example, the following is equivalent:
				(sql, {id: 1}) => (sql, {replacements: {id: 1}})

	---------------------------------------------------------------
* */

const kdo = require('kdo');
const Sequelize = require('sequelize');
const config = require('./config');

let sequelize;

const prepare = {

	// ------------------------------------------------------------------------
	// Identify each parameter from args (since the parameter is not fixed)
	// ------------------------------------------------------------------------
	pickupFromArgs({args}) {
		let sql;
		let fieldValues = {}; // provided by replacements and/or templateData
		let hooks;

		// The first parameter must be the sql statement
		// The remaining parameters may be fieldValues, hooks
		sql = args.shift();

		// If there are no remaining parameters, then do nothing
		if (args.length === 0) {
			// do nothing
		}

		// If there is one parameter left, it may be fieldValues or hooks
		if (args.length === 1) {
			const arg = args[0];

			// If arg is a function, wrap it as a hooks object
			if (typeof arg === 'function') {
				hooks = {};
				hooks[arg.name] = arg;
			}

			// If the first property of arg is function, then it is hooks
			else if (typeof arg[Object.keys(arg)[0]] === 'function') {
				hooks = arg;
			}
			else {
				fieldValues = arg;
			}
		}

		// If there are two parameters left, the first one is fieldValues and the second one is hooks
		if (args.length === 2) {
			fieldValues = args[0];
			hooks = args[1];

			// If hooks is a function, wrap it as object
			if (typeof hooks === 'function') {
				const fn = hooks;
				hooks[fn.name] = fn;
			}
		}

		// Save to this.args to pass them to the next functions for kdo
		this.setArgs({sql, fieldValues, hooks});
	},

	// ------------------------------------------------------------------------
	// Parameter preprocessing
	// ------------------------------------------------------------------------
	initArgs({sql, fieldValues}) {
		let okValues = {};

		// If the fieldValues parameter is supplied (it is used to specify
		// the value of a parameter in the sql statement), then do something
		if (fieldValues) {

			// Get the parameter value from fieldValues
			['replacements', 'templateData'].forEach(prop => {
				okValues[prop] = fieldValues[prop];
				delete fieldValues[prop];
			});

			// If no replacements are specified, an attempt is made to automatically identify
			// whether it is a replacements from the sql statement
			if (!okValues.replacements) {

				// If there is a :xxx parameter in the sql statement, the options is replacements
				if (/:[a-zA-Z_]+?[a-zA-Z0-9_]+?\b/.test(sql)) {
					okValues.replacements = fieldValues;
				}
			}

			// If there is no replacements and templateData is not specified,
			// then try to automatically identify whether it is a templateData from the sql statement
			if (!okValues.replacements && !okValues.templateData) {

				// If there is a :xxx parameter in the sql statement, the options is templateData
				if (/{[a-zA-Z_]+?[a-zA-Z0-9_]+?}/.test(sql)) {
					okValues.templateData = fieldValues;
				}
			}
		}

		// Save replacements and templateData to this.args
		this.setArgs({...okValues});
	},

	// ------------------------------------------------------------------------
	// Apply template data (if any)
	// ------------------------------------------------------------------------
	// Input:
	// 		sql = '... where {dateCondition} ...'
	// 		templateData = {dateCondition: 'date > "2019-05-01"'}
	// Output:
	// 		'... where date > "2019-05-01" ...'
	// ------------------------------------------------------------------------
	applySqlTemplateData({sql, templateData}) {
		if (!templateData) return;

		sql = sql.replace(/{([a-zA-Z0-9_]+)}/g, (match, capture) => {

			// match	'{date}'
			// capture	'date''
			return templateData[capture];
		});

		this.setArgs({sql});
	},

	// ------------------------------------------------------------------------
	// Fetch commandType
	// ------------------------------------------------------------------------
	// If the action type is insert/update/delete, add the commandType parameter so that
	// sequelize returns a more accurate result of the operation.

	// Refer to the following comparison:

	// ........................................................................
	// action	w/ type			w/ type			w/o type		w/o type
	//			[has result]	[no result]		[has result]	[no result]
	// ........................................................................
	// insert	[[], 1]			failed			[undefined, 1]	failed
	// update	[undefined, 1]	[undefined, 0]	[[], []]		[[], []]
	// delete	undefined		undefined		[[], []]		[[], []]
	// ........................................................................
	fetchCommandType({sql}) {
		const temp = sql.match(/^\s*\b(insert|update|delete)\b/i);
		const commandType = temp ? temp[0].toLocaleLowerCase() : '';
		this.setArgs({commandType});
	},

	// ------------------------------------------------------------------------
	// If it is an insert operation, set the field that does not exist in replacements to null
	// ------------------------------------------------------------------------
	forInsert({sql, commandType, replacements}) {
		if (!(commandType === 'insert' && replacements)) return;

		// Fetch parameters from the sql statement in the form of :xxx
		const params = sql.match(/:[a-zA-Z0-9_]*\b/g);
		if (!params) return;

		// Check all parameters, set to null if there is no value in replacements
		params.forEach(param => {
			const prop = param.substr(1); // ":id" => "id"
			replacements[prop] === undefined && (replacements[prop] = null);
		});

		// This function modifies the properties of the replacements and does not
		// replace the object, so there is no need to save the replacements to this.args.
	},

	// ------------------------------------------------------------------------
	// If it is an update operation, we need to set the set field in the sql
	// statement according to the properties of the replacements

	// For example:
	// 		If there are 10 fields in the sql statement, but there are only 3 fields
	// 		in the replacements, then only these three fields should be set, and
	// 		the remaining fields still retain the previous values.
	// ------------------------------------------------------------------------
	forUpdate({sql, commandType, replacements}) {
		if (!(commandType === 'update' && replacements)) return;

		// Fetch the parameter name in the form of xxx from the sql statement
		// The reason why it is not constructed according to the attributes of
		// replacements is because replacements may have other data attached.
		const test = sql.match(/^\s*update\s+\S+?\s+set\s+([\s\S]+?)(?=(\bwhere(\b|$))|$)/i);
		if (!test || !test[1].replace(/(^\s+)|(\s+$)/g, '')) return;

		const setStr = test[1]; // Fetch the string between "set ... where", for example "a = :a, b = :b, ..."
		const params = setStr.match(/:[a-zA-Z0-9_]*\b/g); // [":a", ":b", ...]
		if (!params) return;

		// Fetch field name (":a" => "a")
		const fields = params.map(param => param.substr(1));
		const replacementsKeys = Object.keys(replacements);

		// Delete fields that do not exist in replacements
		let i = fields.length;
		while (i --) { // Delete from back to front

			// If the current field is not found in replacements, delete it
			if (replacementsKeys.indexOf(fields[i]) === -1) {
				fields.splice(i, 1); //
			}
		}

		// If the field does not change, or if there are no remaining fields, it will not be processed
		if (params.length === fields.length || !fields.length) return;

		// Construct a new set statement based on the remaining fields
		let newSetStr = fields.map(field => field + '=:' + field).join(',');
		newSetStr = ' ' + newSetStr + ' ';

		sql = sql.replace(setStr, newSetStr);

		this.setArgs({sql});
	},

	beforeExec(args) {
		if (!args.hooks || !args.hooks.beforeExec) return;

		args = args.hooks.beforeExec(args);
		this.setArgs(args);
	},

	return() {
		const {sql, commandType, replacements, hooks} = this.args;
		return {sql, commandType, replacements, hooks};
	}
};

const fetchData = {
	async execSql({sql, commandType, replacements}) {

		// Use the raw parameter to indicate the execution of the original query
		const seqOptions = {replacements, raw: true};

		// Append to seqOptions if there is a commandType (insert/delete/update)
		if (commandType) {
			seqOptions.type = Sequelize.QueryTypes[commandType.toUpperCase()];
		}

		let result = await sequelize.query(sql, seqOptions);

		// If it is delete, the result is null, then it will not continue processing
		if (!result) return null;

		// If it is insert/update, take the value from result[1]
		// Note:
		// 		Although the expression can be abbreviated as commandType (because
		// 		the delete has been filtered before, then the commandType must be
		// 		only insert or update), but the semantics are not clear. It will
		// 		takes a while to read the code, so it is better to write it here.
		if (commandType === 'insert' || commandType === 'update') {
			result = result[1];
		}
		else {
			// Fetch data from [0] if it is another operation (select or exec stored procedure, etc.)
			result = result[0];
		}

		this.setArgs({result});
	},

	afterExec({result, hooks}) {
		if (!hooks || !hooks.afterExec) return;

		const newResult = hooks.afterExec(result);

		// If there is a new result, use it
		newResult && this.setArgs({result: newResult});
	},

	return({result}) {
		return result;
	}
};

const me = {
	init() {
		const {database, username, password} = config;
		const options = config;
		sequelize = new Sequelize(database, username, password, options);
	},

	async do(...args) {
		const options = kdo.sync.do(prepare, {args});
		const result = await kdo.do(fetchData, options);
		return result;
	}
};

module.exports = me;
