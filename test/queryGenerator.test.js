
const seqQuery = require('../src');
const expect = require('chai').expect;

describe('QueryGenerator', () => {
	seqQuery.init('mssql');

	it('.getWhereConditions()', () => {
		const where = {"id": {$eq: 2}};
		const whereStr = seqQuery.getWhereConditions(where);
		expect(whereStr === '[id] = 2').to.be.true;
	});

	it('.getOrderClause()', () => {
		const order = ['type', 'name desc'];
		const orderStr = seqQuery.getOrderClause(order);
		expect(orderStr === 'order by type, name desc').to.be.true;
	});

	it('.getLimitClause()', () => {
		const limitOffset = {limit: 10, offset: 5};
		const limitStr = seqQuery.getLimitClause(limitOffset);
		expect(limitStr === 'offset 5 rows fetch next 10 rows only').to.be.true;
	});
});
