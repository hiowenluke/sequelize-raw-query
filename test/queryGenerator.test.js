
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

	it(`.getWhereConditions(where, tableAs) // where = {"id": 2}, tableAs = 'm'`, () => {
		const where = {"id": 2};
		const tableAs = 'm';
		const whereStr = sequery.getWhereConditions(where, tableAs);
		expect(whereStr === '[m].[id] = 2').to.be.true;
	});

	it(`.getWhereConditions(where) // where = '{"id": 2}'`, () => {
		const where = '{"id": 2}';
		const whereStr = sequery.getWhereConditions(where);
		expect(whereStr === '[id] = 2').to.be.true;
	});

	it(`.getWhereConditions(where) // where = {"id": {$gt: 2}}`, () => {
		const where = {"id": {$gt: 2}};
		const whereStr = sequery.getWhereConditions(where);
		expect(whereStr === '[id] > 2').to.be.true;
	});

	it(`.getWhereConditions(where) // where = {id: {[Op.or]: {[Op.lt]: 1000, [Op.eq]: null}}}`, () => {
		const Op = sequery.Op;
		const where = {
			id: {
				[Op.or]: {
					[Op.lt]: 1000,
					[Op.eq]: null
				}
			}
		};

		const whereStr = sequery.getWhereConditions(where);
		expect(whereStr === '([id] < 1000 OR [id] IS NULL)').to.be.true;
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

	it(`.getOrderClause(order, tableAs) // order = ['type', 'name desc'], tableAs = 'm'`, () => {
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

	it(`.getLimitClause(options, tableAs) // options = {order: 'id', limit: 10, offset: 5}, tableAs = 'm'`, () => {
		const options = {order: 'id', tableAs: 'm', limit: 10, offset: 5};
		const tableAs = 'm';
		const limitStr = sequery.getLimitClause(options, tableAs);
		expect(limitStr === ' order by [m].id offset 5 rows fetch next 10 rows only').to.be.true;
	});
});
