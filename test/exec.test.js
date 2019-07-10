
const sequery = require('../src');
const expect = require('chai').expect;
const config = require('./config');

describe('For exec', () => {
	sequery.init(config);

	const table = '(select 1 as id union select 2 union select 3)';

	it(`.do(sql)`, async () => {
		const sql = `select * from ${table} m`;
		const result = await sequery.do(sql);
		expect(result[0].id === 1).to.be.true;
	});

	it(`.do(sql, {replacements}) // replacements = {id: 2}`, async () => {
		const sql = `select * from ${table} m where id = :id`;
		const replacements = {id: 2};
		const result = await sequery.do(sql, {replacements});
		expect(result[0].id === 2).to.be.true;
	});

	it(`.do(sql, replacements) // replacements = {id: 1}`, async () => {
		const sql = `select * from ${table} m where id > :id`;
		const result = await sequery.do(sql, {id: 1});
		expect(result.length === 2).to.be.true;
	});

	it(`.do(sql, {templateData}) // templateData = {id: 2}`, async () => {
		const sql = `select * from ${table} m where id = {id}`;
		const templateData = {id: 2};
		const result = await sequery.do(sql, {templateData});
		expect(result[0].id === 2).to.be.true;
	});

	it(`.do(sql, templateData) // templateData = {id: 1}`, async () => {
		const sql = `select * from ${table} m where id > {id}`;
		const result = await sequery.do(sql, {id: 1});
		expect(result.length === 2).to.be.true;
	});

	it(`.do(sql, templateData) // templateData = {condition: 'id > 1 and 1 > 0'}`, async () => {
		const sql = `select * from ${table} m where {condition}`;
		const result = await sequery.do(sql, {condition: 'id > 1 and 1 > 0'});
		expect(result.length === 2).to.be.true;
	});

	it(`.do(sql, {replacements, templateData}) // replacements = {id: 2}, templateData = {condition: 'id > 1'}`, async () => {
		const sql = `select * from ${table} m where {condition} and id > :id`;
		const replacements = {id: 2};
		const templateData = {condition: 'id > 1'};
		const result = await sequery.do(sql, {replacements, templateData});
		expect(result[0].id === 3).to.be.true;
	});

	it(`.do(sql, templateData) // templateData = {id: 1, table}`, async () => {
		const sql = `select * from {table} m where id > {id}`;
		const result = await sequery.do(sql, {id: 1, table});
		expect(result.length === 2).to.be.true;
	});

	it(`.do(sql, {beforeExec}) // sql = 'select 1 as id'`, async () => {
		const sql = `select * from ${table} m where {condition} and id > :id`;

		const beforeExec = ({sql}) => {
			sql = 'select 1 as id';
			return {sql};
		};

		const result = await sequery.do(sql, {beforeExec});
		expect(result[0].id === 1).to.be.true;
	});

	it(`.do(sql, beforeExec) // sql = 'select 1 as id'`, async () => {
		const sql = `select * from ${table} m where {condition} and id > :id`;

		const beforeExec = ({sql}) => {
			sql = 'select 1 as id';
			return {sql};
		};

		const result = await sequery.do(sql, beforeExec);
		expect(result[0].id === 1).to.be.true;
	});

	it(`.do(sql, {afterExec}) // result.push(5)`, async () => {
		const sql = `select * from ${table} m where id > :id`;

		const afterExec = (result) => {
			result.push(5);
			return result;
		};

		const result = await sequery.do(sql, {id: 2}, {afterExec});
		expect(result.length === 2).to.be.true;
	});

	it(`.do(sql, afterExec) // result.push(5)`, async () => {
		const sql = `select * from ${table} m where id > :id`;

		const afterExec = (result) => {
			result.push(5);
		};

		const result = await sequery.do(sql, {id: 2}, afterExec);
		expect(result.length === 2).to.be.true;
	});

	it(`.do(sql, afterExec) // result = []`, async () => {
		const sql = `select * from ${table} m where id > :id`;

		const afterExec = (result) => {
			result = [];
			return result;
		};

		const result = await sequery.do(sql, {id: 2}, afterExec);
		expect(result.length === 0).to.be.true;
	});
});
