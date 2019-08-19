
const config = require('./config');
const exec = require('./exec');
const queryGenerator = require('./queryGenerator');
const Sequelize = require('sequelize');

const me = Object.assign(Object.create(queryGenerator), {
	init(cfg) {
		config.init(cfg);
		exec.init();
		queryGenerator.init();

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

// See ../test/mysql/queryGenerator.test.js for usage
me.Sequelize = Sequelize;

module.exports = me;
