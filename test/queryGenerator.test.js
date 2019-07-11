
const sequery = require('../src');
const expect = require('chai').expect;
const config = require('./config');

describe('For queryGenerator', () => {
	sequery.init(config);

	it(`.getWhereConditions(where) // where = {"id": 2}`, () => {
		const where = {"id": 2};
		const whereStr = sequery.getWhereConditions(where);
		expect(whereStr === '[id] = 2').to.be.true;
	});

	it('.getOrderClause()', () => {
		const order = ['type', 'name desc'];
		const orderStr = sequery.getOrderClause(order);
		expect(orderStr === 'order by type, name desc').to.be.true;
	});

	it('.getLimitClause()', () => {
		const limitOffset = {limit: 10, offset: 5};
		const limitStr = sequery.getLimitClause(limitOffset);
		expect(limitStr === 'offset 5 rows fetch next 10 rows only').to.be.true;
	});
});
