
const sequery = require('../../src');
const expect = require('chai').expect;
const config = require('../__config/default');

describe('For exec', async () => {

	// The string in the sql statement of mssql must be a single quote
	const table = `(select 1 as id, '2019-02-01' as date union select 2, '2019-03-10' union select 3, '2019-10-16')`;

	it('init sequery', async () => {

		// We can use any of the configurations of mssql and mysql for this test cases file.
		sequery.init(config.use('mysql'));
	});

	it(`.exec(sql) // .exec() is an alias of .do()`, async () => {
		const sql = `select * from ${table} m`;
		const result = await sequery.do(sql);
		expect(result[0].id === 1).to.be.true;
	});

	it(`.do(sql)`, async () => {
		const sql = `select * from ${table} m`;
		const result = await sequery.do(sql);
		expect(result[0].id === 1).to.be.true;
	});

	it(`.do(sql, undefined)`, async () => {
		const sql = `select * from ${table} m`;
		const result = await sequery.do(sql, undefined);
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

	it(`.do(sql, templateData) // templateData = {idCondition: 'id > 1 and 1 > 0', dateCondition: "date >= '2019-03-10'"}`, async () => {
		const sql = `select * from ${table} m where {idCondition} and {dateCondition}`;
		const result = await sequery.do(sql, {idCondition: 'id > 1 and 1 > 0', dateCondition: "date >= '2019-03-10'"});
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

	it(`.do(sql, {beforeExec}) // return {sql: 'select 1 as id'}`, async () => {
		const sql = `select * from ${table} m where {condition} and id > :id`;

		const beforeExec = ({sql}) => {
			sql = 'select 1 as id';
			return {sql};
		};

		const result = await sequery.do(sql, {beforeExec});
		expect(result[0].id === 1).to.be.true;
	});

	it(`.do(sql, beforeExec) // return {sql: 'select 1 as id'}`, async () => {
		const sql = `select * from ${table} m where {condition} and id > :id`;

		const beforeExec = ({sql}) => {
			sql = 'select 1 as id';
			return {sql};
		};

		const result = await sequery.do(sql, beforeExec);
		expect(result[0].id === 1).to.be.true;
	});

	it(`.do(sql, beforeExec) // return undefined`, async () => {
		const sql = `select * from ${table} m`;

		const beforeExec = () => {
			return undefined;
		};

		const result = await sequery.do(sql, beforeExec);
		expect(result.length === 3).to.be.true;
	});

	it(`.do(sql, {afterExec}) // result.push(5)`, async () => {
		const sql = `select * from ${table} m where id > :id`;

		const afterExec = (result) => {
			result.push(5);
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

	it(`.do(sql, afterExec) // return result = []`, async () => {
		const sql = `select * from ${table} m where id > :id`;

		const afterExec = (result) => {
			result = [];
			return result;
		};

		const result = await sequery.do(sql, {id: 2}, afterExec);
		expect(result.length === 0).to.be.true;
	});

	it(`.do(sql, afterExec) // return result = []`, async () => {
		const sql = `select * from ${table} m where id > :id`;

		const afterExec = (result) => {
			result = [];
			return result;
		};

		const result = await sequery.do(sql, {id: 2}, afterExec);
		expect(result.length === 0).to.be.true;
	});

	it(`.do(sql) // delimiter $$`, async () => {
		const sql = `
			delimiter $$
			drop function if exists fn_sequelize_raw_query $$
			create function fn_sequelize_raw_query(i int) returns int deterministic
			begin
				declare i_return int;
				set i_return = i + 1;
				return i_return;
			end;
			$$
			delimiter ;
			select fn_sequelize_raw_query(1) as result;
		`;

		const result = await sequery.do(sql);
		expect(result[0].result === 2).to.be.true;
	});
});
