
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

	it(`.getWhereConditions(where) // where = {"id": {$gt: 2}}`, () => {
		const where = {"id": {$gt: 2}};
		const whereStr = sequery.getWhereConditions(where);
		expect(whereStr === '[id] > 2').to.be.true;
	});

	it(`.getOrderClause(order) // order = 'id'`, () => {
		const order = 'id';
		const orderStr = sequery.getOrderClause(order);
		expect(orderStr === ' order by id').to.be.true;
	});

	it(`.getOrderClause(order) // order = 'type, name desc'`, () => {
		const order = 'type, name desc';
		const orderStr = sequery.getOrderClause(order);
		expect(orderStr === ' order by type, name desc').to.be.true;
	});

	it(`.getOrderClause(order) // order = ['type', 'name desc']`, () => {
		const order = ['type', 'name desc'];
		const orderStr = sequery.getOrderClause(order);
		expect(orderStr === ' order by type, name desc').to.be.true;
	});

	it(`.getOrderClause(order) // order = [['type'], ['name', 'desc']]`, () => {
		const order = [['type'], ['name', 'desc']];
		const orderStr = sequery.getOrderClause(order);
		expect(orderStr === ' order by type, name desc').to.be.true;
	});

	it(`.getOrderClause(order, tableAs)`, () => {
		const order = ['type', 'name desc'];
		const tableAs = 'm';
		const orderStr = sequery.getOrderClause(order, tableAs);
		expect(orderStr === ' order by [m].type, [m].name desc').to.be.true;
	});

	it(`.getLimitClause(options) // options = {order: 'id', limit: 10, offset: 5}`, () => {
		const options = {order: 'id', limit: 10, offset: 5};
		const limitStr = sequery.getLimitClause(options);
		expect(limitStr === ' order by id offset 5 rows fetch next 10 rows only').to.be.true;
	});

	it(`.getLimitClause(options) // options = {order: 'id', tableAs: 'm', limit: 10, offset: 5}`, () => {
		const options = {order: 'id', tableAs: 'm', limit: 10, offset: 5};
		const limitStr = sequery.getLimitClause(options);
		expect(limitStr === ' order by [m].id offset 5 rows fetch next 10 rows only').to.be.true;
	});
});
