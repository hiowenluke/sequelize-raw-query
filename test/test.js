
const seqWhere = require('../src');

const fn = () => {
	seqWhere.init('mssql');

	const where = {"id": {$eq: 2}};
	const whereStr = seqWhere.getWhereConditions(where);
	console.log(whereStr);

	const orderStr = seqWhere.getOrderClause(['type', 'name desc']);
	console.log(orderStr);

	const limitStr = seqWhere.getLimitClause({limit: 10, offset: 5});
	console.log(limitStr);
};

fn();
