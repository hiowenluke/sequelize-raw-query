
const myGlobalName = '__sequelize_raw_query';

const defaultValues = {

	// database: 'test',
	// username: 'sa',
	// password: 'playboy',

	// If it is true, save the data to global.__sequelize_raw_query
	enableGlobal: false,

	// For all executing
	beforeExec: null,
	afterExec: null,

	// If it is true, simplify the result:
	//		If the result array has only one object element:
	//			If the object element has only one property, return the value of the property.
	//			Otherwise, return the whole object.
	isSimplifyResult: false,
};

const me = {

	// Configuration
	data: {
		config: undefined,
		sequelize: undefined,
		queryGenerator: undefined,
	},

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
		this.reset();

		// If the user project includes multiple subprojects, it is needed to enable global mode.
		// Otherwise, since the sequelize in each subproject is a different instance
		// and cannot share the same data, it will cause an error.
		if (cfg.enableGlobal) {

			// Create a namespace in global to save data so that
			// the entire user project with multi-sequery uses the same data.
			global[myGlobalName] = {
				config: undefined,
				sequelize: undefined,
				queryGenerator: undefined
			};
		}

		this.set(cfg);
	},

	reset() {
		Object.assign(this, defaultValues);
	},

	__getConfigData() {
		return this.enableGlobal ? global[myGlobalName] : this.data;
	},

	set(cfg) {
		const config = Object.assign(this, cfg);
		this.__getConfigData().config = config;
	},

	get() {
		return this.__getConfigData().config;
	},

	getConfig() {
		return this.__getConfigData().config;
	},

	setConfig(config) {
		this.__getConfigData().config = config;
	},

	getQueryGenerator() {
		return this.__getConfigData().queryGenerator;
	},

	setQueryGenerator(queryGenerator) {
		this.__getConfigData().queryGenerator = queryGenerator;
	},

	getSequelize() {
		return this.__getConfigData().sequelize;
	},

	setSequelize(sequelize) {
		this.__getConfigData().sequelize = sequelize;
	}
};

module.exports = me;
