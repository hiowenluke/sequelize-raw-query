
const config = require('./config');
const exec = require('./exec');
const queryGenerator = require('./queryGenerator');
const Sequelize = require('sequelize');

const me = {
	init(cfg) {

		config.init(cfg);
		exec.init();
		queryGenerator.init();

		// See ../test/mysql/queryGenerator.test.js for usage
		this.Op = Sequelize.Op;

		return this;
	},

	async do(...args) {
		return await exec.do(...args);
	},

	getWhereConditions(...args) {
		return queryGenerator.getWhereConditions(...args);
	},

	getOrderClause(...args) {
		return queryGenerator.getOrderClause(...args);
	},

	getLimitClause(...args) {
		return queryGenerator.getLimitClause(...args);
	}
};

module.exports = me;
