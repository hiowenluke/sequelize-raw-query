
const config = require('./config');
const exec = require('./exec');
const queryGenerator = require('./queryGenerator');

const me = Object.assign(Object.create(queryGenerator), {
	init(cfg) {
		config.init(cfg);
		exec.init();
		queryGenerator.init();
	},

	async do(...args) {
		return await exec.do(...args);
	}
});

module.exports = me;
