
const sequery = require('../../src');
const expect = require('chai').expect;
const config = require('../__config/default');

describe('For config hooks', async () => {

	// The string in the sql statement of mssql must be a single quote
	const table = `(select 1 as id, '2019-02-01' as date union select 2, '2019-03-10' union select 3, '2019-10-16')`;

	it('init sequery', async () => {
		const cfg = config.use('mysql');

		cfg.beforeExec = ({sql, replacements}) => {
			sql = sql + ' where date >= "2019-03-10"';
			return {sql};
		};

		cfg.afterExec = (result) => {
			if (!cfg.times) {
				cfg.times = 1;
				result.pop();
			}
			return result;
		};

		sequery.init(cfg);
	});

	it(`config.beforeExec`, async () => {
		const sql = `select * from ${table} m`;
		const result = await sequery.do(sql);
		expect(result.length === 1).to.be.true;
	});

	it(`config.afterExec`, async () => {
		const sql = `select * from ${table} m`;
		const result = await sequery.do(sql);
		expect(result.length === 2).to.be.true;
	});
});
