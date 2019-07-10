
const queryGenerator = require('./queryGenerator');

const me = {
	init(dialect) {
		queryGenerator.init(dialect);
	}
};

Object.assign(me, queryGenerator);
module.exports = me;
