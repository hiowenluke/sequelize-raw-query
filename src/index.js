
const config = require('./config');
const exec = require('./exec');
const queryGenerator = require('./queryGenerator');
const Sequelize = require('sequelize');

const me = Object.assign(Object.create(queryGenerator), {
	init(cfg) {

		// Create a namespace in global to save data so that
		// the entire user project with multi-sequery uses the same data.
		global.__sequelize_raw_query = {
			config: undefined,
			sequelize: undefined,
			queryGenerator: undefined
		};

		config.init(cfg);
		exec.init();
		queryGenerator.init();

		// See ../test/mysql/queryGenerator.test.js for usage
		this.Sequelize = Sequelize;

		return this;
	},

	async exec(...args) {
		return await this.do(...args);
	},

	async do(...args) {
		return await exec.do(...args);
	}
});

me.config = config;
module.exports = me;
