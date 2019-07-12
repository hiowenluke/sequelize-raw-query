
const config = require('./config');
const exec = require('./exec');
const queryGenerator = require('./queryGenerator');
const Sequelize = require('sequelize');

const me = Object.assign(Object.create(queryGenerator), {
	init(cfg) {

		// Create a namespace in global to save data so that
		// the entire user project with multi-sequery uses the same them.
		global.__sequelize_raw_query = {config: undefined, sequelize: undefined, queryGenerator: undefined};

		config.init(cfg);
		exec.init();
		queryGenerator.init();

		// See ../test/mysql/queryGenerator.test.js for usage
		this.Op = Sequelize.Op;

		return this;
	},

	async do(...args) {
		return await exec.do(...args);
	}
});

module.exports = me;
