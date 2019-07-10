
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

			// 禁止 sequelize 自动给表名加 s 变为复数
			// freezeTableName: true,

			// 禁止自动创建字段 createAt、updateAt
			// timestamps: false,

			// 如果数据库使用了触发器，则要加上如下设置，否则 insert/create 时会提示如下错误：
			// The target table xxx of the DML statement cannot have any enabled triggers
			// if the statement contains an OUTPUT clause without INTO clause.
			// hasTrigger: true
		},
	},

	init(cfg) {
		Object.assign(this, cfg);
	}
};

module.exports = me;
