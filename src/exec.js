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
			(sql, {id: 1}) <=> (sql, {replacements: {id: 1}})

	---------------------------------------------------------------
* */

const kdo = require('kdo');
const Sequelize = require('sequelize');
const config = require('./config');

const prepare = {

	// ------------------------------------------------------------------------
	// Identify each parameter from args (since the parameter is not fixed)
	// ------------------------------------------------------------------------
	pickupFromArgs({args}) {
		let sql;
		let fieldValues = {}; // provided by replacements and/or templateData
		let hooks;

		// The first parameter must be the sql statement
		// The remaining parameters may be fieldValues or hooks
		sql = args.shift();

		// If there are no remaining parameters, then do nothing
		if (args.length === 0) {
			// do nothing
		}

		// If there is one parameter left, it may be fieldValues or hooks
		if (args.length === 1) {
			const arg = args[0];

			if (arg) {

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
		this.pass({sql, fieldValues, hooks});
	},

	// ------------------------------------------------------------------------
	// Parameter pre-processing
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

			// If no replacements are specified, an attempt is made to
			// automatically identify replacements from the sql statement
			if (!okValues.replacements) {

				// If there is a :xxx parameter in the sql statement, the options is replacements
				if (/:[a-zA-Z_]+?[a-zA-Z0-9_]+?\b/.test(sql)) {
					okValues.replacements = fieldValues;
				}
			}

			// If there is no replacements, and templateData is not specified,
			// then try to automatically identify templateData from the sql statement
			if (!okValues.replacements && !okValues.templateData) {

				// If there is a :xxx parameter in the sql statement, the options is templateData
				if (/{[a-zA-Z_]+?[a-zA-Z0-9_]+?}/.test(sql)) {
					okValues.templateData = fieldValues;
				}
			}
		}

		// Save replacements and templateData to this.args
		this.pass({...okValues});
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

			// match	'{dateCondition}'
			// capture	'dateCondition''
			return templateData[capture];
		});

		this.pass({sql});
	},

	// ------------------------------------------------------------------------
	// Fetch commandType
	// ------------------------------------------------------------------------
	fetchCommandType({sql}) {
		const temp = sql.match(/^\s*\b(insert|update|delete)\b/i);
		const commandType = temp ? temp[0].toLocaleLowerCase() : '';
		this.pass({commandType});
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

		// This function modifies the properties of the replacements, but does not
		// reset it, so there is no need to save the replacements to this.args.
	},

	// ------------------------------------------------------------------------
	// If it is an update operation, we need to set the set field in the
	// sql statement according to the properties of the replacements

	// For example:
	// 		If there are 10 fields in the sql statement, but there are only 3 fields
	// 		in the replacements, then only these three fields should be set, and
	// 		the remaining fields still retain the old values.
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
		let keys = Object.keys(replacements);

		// Filter undefined fields in replacements
		keys = keys.filter(key => replacements[key] !== undefined);

		// Delete fields which do not exist in replacements
		let i = fields.length;
		while (i --) { // Delete from back to front

			// If the current field is not found in replacements, delete it
			if (keys.indexOf(fields[i]) === -1) {
				fields.splice(i, 1); //
			}
		}

		// If the field does not change, or there are no remaining fields, break
		if (params.length === fields.length || !fields.length) return;

		// Construct a new set statement based on the remaining fields
		let newSetStr = fields.map(field => field + '=:' + field).join(',');
		newSetStr = ' ' + newSetStr + ' ';

		// The final sql statement
		sql = sql.replace(setStr, newSetStr);

		this.pass({sql});
	},

	beforeExec({sql, replacements, hooks}) {
		const beforeExec = hooks && hooks.beforeExec || config.getConfig().beforeExec;
		if (!beforeExec) return;

		const newArgs = beforeExec({sql, replacements});
		if (newArgs && typeof newArgs === 'object') {
			const {sql, replacements} = newArgs;
			sql && this.pass({sql});
			replacements && this.pass({replacements});
		}
	},

	convertSqlToArray({sql}) {
		const dialect = config.getConfig().dialect;
		if (dialect === 'mysql') {
			const delimiterReg = /\bdelimiter\b\s*(\S+?)\s/i; // "delimiter $$", "delimiter //"
			const temp = sql.match(delimiterReg);

			if (temp) {
				const delimiterChar = temp[1];
				if (delimiterChar) {
					sql = sql
						.replace(delimiterReg, '')
						.replace(/\bdelimiter\b\s*?;/i, '') // "delimiter ;"
					;
					sql = sql.split(delimiterChar);
				}
			}
		}

		if (typeof sql === 'string') {
			sql = [sql];
		}

		this.pass({sqlArr: sql});
	},

	return() {
		const {sqlArr, commandType, replacements, hooks} = this.args;
		return {sqlArr, commandType, replacements, hooks};
	}
};

const fetchData = {
	async execSql({sqlArr, commandType, replacements}) {

		// Use the "raw" parameter to indicate the execution of the raw query
		const seqOptions = {replacements, raw: true};

		const sequelize = config.getSequelize();
		let result;

		// Only use the last result
		for (let i = 0; i < sqlArr.length; i ++) {
			const sql = sqlArr[i];
			if (sql.replace(/(^\s+)|(\s+$)/g, '') === '') continue;
			result = await sequelize.query(sql, seqOptions);
		}

		result = result[0];

		// Return the result immediately for insert, update and delete
		if (['insert', 'update', 'delete'].indexOf(commandType) >= 0) {
			return result.affectedRows;
		}

		this.pass({result});
	},

	afterExec({result, hooks}) {
		const afterExec = hooks && hooks.afterExec || config.getConfig().afterExec;
		if (!afterExec) return;

		const newResult = afterExec(result);

		// If there is a new result, use it
		newResult && this.pass({result: newResult});
	},

	simplifyTheResultIfNeeded({result}) {
		if (!config.getConfig().isSimplifyResult) return;
		if (!result || result.length !== 1) return;

		const row = result[0];
		const fields = Object.keys(row);
		if (fields.length === 1) {
			result = row[fields[0]];
		}
		else {
			result = row;
		}

		return result;
	},

	return({result}) {
		return result;
	}
};

const me = {
	init() {
		const cfg = config.getConfig();
		const {database, username, password} = cfg;
		const options = cfg;
		const sequelize = new Sequelize(database, username, password, options);

		config.setSequelize(sequelize);
	},

	async do(...args) {
		const options = kdo.doSync(prepare, {args});
		const result = await kdo.do(fetchData, options);
		return result;
	}
};

module.exports = me;
