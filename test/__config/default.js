
// Your db config
const def = {
	mssql: {
		dialect: 'mssql',
		database: 'master',
		username: 'sa',
		password: 'playboy',
		host: '192.168.197.80',
		port: 1433,
	},

	mysql: {
		dialect: 'mysql',
		database: 'sys',
		username: 'root',
		password: 'playboy',
		host: '127.0.0.1',
		port: 3306,
	},
};

const me = {
	use(type) {
		const config = Object.assign({}, this, def[type]);
		return config;
	}
};

module.exports = me;
