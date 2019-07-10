
const sequelize = require('sequelize');
const Op = sequelize.Op;

// Based on sequelize 5.9.4
const AbstractQueryGenerator = require('../../sequelize/lib/dialects/abstract/query-generator');
const MSSQLQueryGenerator = require('../../sequelize/lib/dialects/mssql/query-generator');

const convert$toOp = (where) => {
	const jsonStr = JSON.stringify(where);
	const str = jsonStr.replace(/"\$(\S+?)"/g, (str) => {
		return "[Op." + str.replace(/[$"]/g, '') + "]";
	});

	// Simplify logic with eval
	eval("where = " + str);

	return where;
};

const getOrderStr = (order) => {

	// If order is a string, no processing is required
	if (typeof order === 'string') { // 'type, name desc'
		// do nothing
	}

	// If order is an array, convert to a string
	if (Array.isArray(order)) {

		// Convert a one-dimensional array to a string:
		// ['type', 'name'] => 'type, name'
		if (typeof order[0] === 'string') {
			order = order.join(', '); //
		}

		// Convert a two-dimensional array to a string:
		// [['type'], ['name', 'desc']] => 'type, name desc'
		if (Array.isArray(order[0])) {
			order = order.map(item => item.join(' ')).join(', ');
		}
	}

	return 'order by ' + order;
};

const me = {
	queryGenerator: null,

	init(dialect) {
		const Class = dialect === 'mssql' ? MSSQLQueryGenerator : AbstractQueryGenerator;
		const queryGenerator = new Class({sequelize, _dialect: dialect});

		// These properties will be used in queryGenerator
		queryGenerator.dialect = dialect;
		queryGenerator.sequelize = {options: {}};

		this.queryGenerator = queryGenerator;
	},

	getWhereConditions(where, tableName, factory, options) {

		// where usage:
		// http://docs.sequelizejs.com/manual/querying.html#where

		// Convert $like to [Op.like]
		// {'fullname': {$like: '%owen%'}} => {'fullname': {[Op.like]: '%owen%'}};
		where = convert$toOp(where);

		return this.queryGenerator.getWhereConditions(where, tableName, factory, options);
	},

	getOrderClause(order) {

		// options.order usage:
		// http://docs.sequelizejs.com/manual/querying.html#ordering

		return getOrderStr(order);
	},

	getLimitClause(options, model) {

		// options.offset, options.limit usage:
		// http://docs.sequelizejs.com/manual/querying.html#pagination---limiting

		// Set options.order to an empty array to avoid errors for sequelize
		options.order = [];

		const limitStr = this.queryGenerator.addLimitAndOffset(options, model);
		return limitStr.toLowerCase().replace(/^\s*/g, '');
	}
};

module.exports = me;
