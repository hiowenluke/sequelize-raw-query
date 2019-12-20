
const Sequelize = require('sequelize');
const config = require('./config');

const nmpath = require('nmpath');
const node_modules = nmpath();

// Based on sequelize 5.9.4
const pathOfDialects = node_modules + '/sequelize/lib/dialects';
const AbstractQueryGenerator = require(pathOfDialects + '/abstract/query-generator');
const MSSQLQueryGenerator = require(pathOfDialects + '/mssql/query-generator');

const isHasSymbol = (where) => {
	if (Object.getOwnPropertySymbols(where).length) {
		return true;
	}

	const item = Object.keys(where).find(key => {
		const item = where[key];
		if (typeof item === 'object') {
			if (isHasSymbol(item)) {
				return item;
			}
		}
	});

	return !!item;
};

const convert$toOp = (where) => {
	const jsonStr = typeof where === 'object' ? JSON.stringify(where) : where;
	const str = jsonStr.replace(/"\$(\S+?)"/g, (str) => {
		return "[Op." + str.replace(/[$"]/g, '') + "]";
	});

	// Simplify logic with eval
	const Op = Sequelize.Op;
	eval("where = " + str);

	return where;
};

const getOrderFieldNamesStr = (fieldNames) => {
	let fieldNamesStr = '';

	if (typeof fieldNames === 'string') { // 'type, name desc'
		fieldNamesStr = fieldNames;
	}

	if (Array.isArray(fieldNames)) {

		// Convert a one-dimensional array to a string:
		// ['type', 'name'] => 'type, name'
		if (typeof fieldNames[0] === 'string') {
			fieldNamesStr = fieldNames.join(', '); //
		}

		else

		// Convert a two-dimensional array to a string:
		// [['type'], ['name', 'desc']] => 'type, name desc'
		if (Array.isArray(fieldNames[0])) {
			fieldNamesStr = fieldNames.map(item => item.join(' ')).join(', ');
		}
	}

	return fieldNamesStr;
};

const convertFieldNames = (fieldNamesStr) => {
	const dialect = config.getConfig().dialect;

	// type, name desc => `type`, `name` desc
	if (dialect === 'mysql') {
		fieldNamesStr = fieldNamesStr.replace(/\w+/g, (match) => {
			const word = match.toLowerCase();
			return word === 'desc' || word === 'asc' ? word : '`' + match + '`';
		});
	}

	return fieldNamesStr;
};

const replaceWithTableName = (fieldNamesStr, tableName) => {
	if (!tableName) return fieldNamesStr;

	const dialect = config.getConfig().dialect;

	// fullname or prefix such as "[m]." (mssql) or "`m`." (mysql)
	const prefix = dialect === 'mssql' ? '[' + tableName + '].' : '`' + tableName + '`.';
	fieldNamesStr = fieldNamesStr.replace(/^|(,\s*)/g, (match) => {
		return match !== '' ? ', ' + prefix : prefix;
	});

	return fieldNamesStr;
};

const me = {
	init() {
		const dialect = config.getConfig().dialect;
		const QueryGenerator = dialect === 'mssql' ? MSSQLQueryGenerator : AbstractQueryGenerator;
		const queryGenerator = new QueryGenerator({sequelize: Sequelize, _dialect: dialect});

		// These properties will be used in queryGenerator
		queryGenerator.dialect = dialect;
		queryGenerator.sequelize = {options: {}};

		config.setQueryGenerator(queryGenerator);
	},

	getWhereConditions(where, tableName) {

		// where usage:
		// http://docs.sequelizejs.com/manual/querying.html#where

		if (!where) return '';

		// If symbol is used in the where object
		if (typeof where === 'object' && isHasSymbol(where)) {
			// do nothing
		}
		else {
			// Convert $like to [Op.like]
			// {'fullname': {$like: '%owen%'}} => {'fullname': {[Op.like]: '%owen%'}};
			where = convert$toOp(where);
		}

		return config.getQueryGenerator().getWhereConditions(where, tableName);
	},

	getGroupClause(group, tableName) {
		let fieldNamesStr = group;
		fieldNamesStr = convertFieldNames(fieldNamesStr);

		if (tableName) {
			fieldNamesStr = replaceWithTableName(fieldNamesStr, tableName);
		}

		return fieldNamesStr ? ' group by ' + fieldNamesStr : '';
	},

	getOrderClause(order, tableName) {

		// options.order usage:
		// http://docs.sequelizejs.com/manual/querying.html#ordering

		let fieldNamesStr = getOrderFieldNamesStr(order);
		fieldNamesStr = convertFieldNames(fieldNamesStr);

		if (tableName) {
			fieldNamesStr = replaceWithTableName(fieldNamesStr, tableName);
		}

		return fieldNamesStr ? ' order by ' + fieldNamesStr : '';
	},

	getLimitClause(options, tableName) {

		// options.offset, options.limit usage:
		// http://docs.sequelizejs.com/manual/querying.html#pagination---limiting

		// Initialize order
		const order = options.order;
		if (!order) throw new Error('The order is missing. Offset and limit need to be used with order');

		const orderStr = this.getOrderClause(order, tableName);

		// Set options.order to an empty array to avoid errors for sequelize
		options.order = [];
		const limitStr = config.getQueryGenerator().addLimitAndOffset(options);

		return orderStr + limitStr.toLowerCase();
	}
};

module.exports = me;
