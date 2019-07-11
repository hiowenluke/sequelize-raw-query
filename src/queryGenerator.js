
const Sequelize = require('sequelize');
const config = require('./config');

const path = require('path');

// The absolute path of this file:
// ./node_modules/sequelize-raw-query/src/queryGenerator.js
const root = path.resolve(module.filename, '../../../');

// Based on sequelize 5.9.4
const AbstractQueryGenerator = require(root + '/sequelize/lib/dialects/abstract/query-generator');
const MSSQLQueryGenerator = require(root + '/sequelize/lib/dialects/mssql/query-generator');

const Op = Sequelize.Op;

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
	eval("where = " + str);

	return where;
};

const getOrderStr = (order, tableName) => {
	let orderStr = '';

	// If order is a string, use it
	if (typeof order === 'string') { // 'type, name desc'
		orderStr = order;
	}

	// If order is an array, convert to a string
	if (Array.isArray(order)) {

		// Convert a one-dimensional array to a string:
		// ['type', 'name'] => 'type, name'
		if (typeof order[0] === 'string') {
			orderStr = order.join(', '); //
		}

		// Convert a two-dimensional array to a string:
		// [['type'], ['name', 'desc']] => 'type, name desc'
		if (Array.isArray(order[0])) {
			orderStr = order.map(item => item.join(' ')).join(', ');
		}
	}

	if (tableName) { // fullname or prefix such as 'm'
		const prefix = `[${tableName}].`;
		orderStr = orderStr.replace(/^|(,\s*)/g, (match) => {
			return match !== '' ? ', ' + prefix : prefix;
		})
	}

	return orderStr ? ' order by ' + orderStr : '';
};

const me = {
	queryGenerator: null,

	init() {
		const dialect = config.dialect;
		const QueryGenerator = dialect === 'mssql' ? MSSQLQueryGenerator : AbstractQueryGenerator;
		const queryGenerator = new QueryGenerator({sequelize: Sequelize, _dialect: dialect});

		// These properties will be used in queryGenerator
		queryGenerator.dialect = dialect;
		queryGenerator.sequelize = {options: {}};

		this.queryGenerator = queryGenerator;
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

		return this.queryGenerator.getWhereConditions(where, tableName);
	},

	getOrderClause(order, tableName) {

		// options.order usage:
		// http://docs.sequelizejs.com/manual/querying.html#ordering

		return getOrderStr(order, tableName);
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
		const limitStr = this.queryGenerator.addLimitAndOffset(options);

		return orderStr + limitStr.toLowerCase();
	}
};

module.exports = me;
