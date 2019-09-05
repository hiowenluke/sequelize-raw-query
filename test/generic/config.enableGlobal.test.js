
const sequery = require('../../src');
const expect = require('chai').expect;
const config = require('../__config/default');

describe('For config.enableGlobal', async () => {

	// The string in the sql statement of mssql must be a single quote
	const table = `(select 1 as id, '2019-02-01' as date union select 2, '2019-03-10' union select 3, '2019-10-16')`;

	it('init sequery', async () => {
		const cfg = config.use('mysql');
		cfg.enableGlobal = true;
		sequery.init(cfg);
	});

	it(`.exec(sql) // .exec() is an alias of .do()`, async () => {
		const sql = `select * from ${table} m`;
		const result = await sequery.do(sql);
		expect(result[0].id === 1).to.be.true;
	});
});
