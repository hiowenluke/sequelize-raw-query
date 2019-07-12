
// Save config to global
const me = {

	// database: 'test',
	// username: 'sa',
	// password: 'playboy',

	// For new Sequelize()
	options: {
		// dialect: 'mssql',
		// host: '127.0.0.1',
		// port: 1433,

		// For connection pool
		pool: {
			// max: 10,
			// min: 0,
			// idle: 30000
		},

		// disable logging; default: console.log
		// logging: false,

		// For sequelize.define()
		define: {

			// Forbidden to automatically add s to the table name to become plural
			// freezeTableName: true,

			// Forbidden to automatic creation of fields createAt, updateAt
			// timestamps: false,

			// If the database uses triggers, add the following settings,
			// otherwise insert/create will prompt the following error:
			// 		The target table xxx of the DML statement cannot have any enabled triggers
			// 		if the statement contains an OUTPUT clause without INTO clause.
			// hasTrigger: true
		},
	},

	init(cfg) {
		// Save config to global
		global.__sequelize_raw_query.config = cfg;
	}
};

module.exports = me;
