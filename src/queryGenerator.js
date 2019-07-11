
const Sequelize = require('sequelize');
const config = require('./config');

// Based on sequelize 5.9.4
const AbstractQueryGenerator = require('../../sequelize/lib/dialects/abstract/query-generator');
const MSSQLQueryGenerator = require('../../sequelize/lib/dialects/mssql/query-generator');

const Op = Sequelize.Op;

const convert$toOp = (where) => {
	const jsonStr = JSON.stringify(where);
	const str = jsonStr.replace(/"\$(\S+?)"/g, (str) => {
		return "[Op." + str.replace(/[$"]/g, '') + "]";
	});

	// Simplify logic with eval
	eval("where = " + str);

	return where;
};

const getOrderStr = (order, tableAs) => {
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

	if (tableAs) {
		const prefix = `[${tableAs}].`;
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

	getWhereConditions(where, tableName, factory, options) {

		// where usage:
		// http://docs.sequelizejs.com/manual/querying.html#where

		// Convert $like to [Op.like]
		// {'fullname': {$like: '%owen%'}} => {'fullname': {[Op.like]: '%owen%'}};
		where = convert$toOp(where);

		return this.queryGenerator.getWhereConditions(where, tableName, factory, options);
	},

	getOrderClause(order, tableAs) {

		// options.order usage:
		// http://docs.sequelizejs.com/manual/querying.html#ordering

		return getOrderStr(order, tableAs);
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
