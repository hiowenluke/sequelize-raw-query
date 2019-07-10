
const seqWhere = require('../src');
const expect = require('chai').expect;

describe('QueryGenerator', () => {
	seqWhere.init('mssql');

	it('.getWhereConditions()', () => {
		const where = {"id": {$eq: 2}};
		const whereStr = seqWhere.getWhereConditions(where);
		expect(whereStr === '[id] = 2').to.be.true;
	});

	it('.getOrderClause()', () => {
		const order = ['type', 'name desc'];
		const orderStr = seqWhere.getOrderClause(order);
		expect(orderStr === 'order by type, name desc').to.be.true;
	});

	it('.getLimitClause()', () => {
		const limitOffset = {limit: 10, offset: 5};
		const limitStr = seqWhere.getLimitClause(limitOffset);
		expect(limitStr === 'offset 5 rows fetch next 10 rows only').to.be.true;
	});
});
