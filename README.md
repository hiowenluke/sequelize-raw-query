
# Sequelize raw query

Sequelize-raw-query (sequery) executes raw sql statements, supports where, order and limit objects which sequelize.query() does not. Sequery provides templateData which is more friendly than replacements, the difference is: 

```
* Replacements
The parameter form ":xxx" is used to specify the field value, for example "id = :id".

* TemplateData
The parameter form "{xxx}" is used to construct sql statements such as "where id > {id} and {dateCondition}".

TemplateData contains the functionality of replacements.
This is to avoid using both the replacements and templateData.
```

Sequery supports mssql and mysql. Sequery depends on sequelize 5.x.

## Installation

```sh
npm i sequelize-raw-query --save
```

## Test

The below usages are come from test cases, run test first to learn more.

```sh
git clone https://github.com/hiowenluke/sequelize-raw-query
cd sequelize-raw-query
npm install
npm test
```

## Usage

Initialize sequery first:
```js
const sequery = require('sequelize-raw-query');

// See "Config" section at the last to learn more
const config = {
    dialect: 'mysql', // mysql or mssql
    database: 'sys',
    username: 'root', 
    password: 'playboy',
    host: '127.0.0.1', // your db host
    port: 3306,
};

sequery.init(config);
```

Then simulate a table for demo (you don't need to do this in your project):
```js
const table = `(
    select 1 as id, '2019-02-01' as date 
    union 
    select 2, '2019-03-10' 
    union 
    select 3, '2019-10-16'
)`;
````

Then try the below usages.

### .exec() or .do(), the alias of .exec  [demo](./test/generic/exec.test.js)

```js
async function () {
    const sql = `select * from ${table} m`;
    const result = await sequery.exec(sql);
    console.log(result[0].id ) // 1
}
```

```js
async function () {
    const sql = `select * from ${table} m where id = :id`;
    const replacements = {id: 2};
    const result = await sequery.exec(sql, {replacements});
    console.log(result[0].id) // 2
}
```

```js
async function () {
    const sql = `select * from ${table} m where id > :id`;
    const result = await sequery.exec(sql, {id: 1});
    console.log(result.length) // 2`
}
```

```js
async function () {
    const sql = `select * from ${table} m where id = {id}`;
    const templateData = {id: 2};
    const result = await sequery.exec(sql, {templateData});
    console.log(result[0].id) // 2
}
```

```js
async function () {
    const sql = `select * from ${table} m where id > {id}`;
    const result = await sequery.exec(sql, {id: 1});
    console.log(result.length) // 2
}
```

```js
async function () {
    const sql = `select * from ${table} m where {condition}`;
    const result = await sequery.exec(sql, {condition: 'id > 1 and 1 > 0'});
    console.log(result.length) // 2
}
```

```js
async function () {
    const sql = `select * from ${table} m where {idCondition} and {dateCondition}`;
    const result = await sequery.exec(sql, {idCondition: 'id > 1 and 1 > 0', dateCondition: "date >= '2019-03-10'"});
    console.log(result.length) // 2
}
```

```js
async function () {
    const sql = `select * from ${table} m where {condition} and id > :id`;
    const replacements = {id: 2};
    const templateData = {condition: 'id > 1'};
    const result = await sequery.exec(sql, {replacements, templateData});
    console.log(result[0].id) // 3
}
```

```js
async function () {
    const sql = `select * from {table} m where id > {id}`;
    const result = await sequery.exec(sql, {id: 1, table});
    console.log(result.length) // 2
}
```

```js
async function () {
    const sql = `select * from ${table} m where {condition} and id > :id`;
    const beforeExec = ({sql}) => {
        sql = 'select 1 as id';
        return {sql};
    };

    const result = await sequery.exec(sql, {beforeExec});
    console.log(result[0].id) // 1
}
```

```js
async function () {
    const sql = `select * from ${table} m where {condition} and id > :id`;
    const beforeExec = ({sql}) => {
        sql = 'select 1 as id';
        return {sql};
    };

    const result = await sequery.exec(sql, beforeExec);
    console.log(result[0].id) // 1
}
```

```js
async function () {
    const sql = `select * from ${table} m`;
    const beforeExec = () => {
        return undefined;
    };

    const result = await sequery.exec(sql, beforeExec);
    console.log(result.length) // 3
}
```

```js
async function () {
    const sql = `select * from ${table} m where id > :id`;
    const afterExec = (result) => {
        result.push(5);
    };

    const result = await sequery.exec(sql, {id: 2}, {afterExec});
    console.log(result.length) // 2
}
```

```js
async function () {
    const sql = `select * from ${table} m where id > :id`;
    const afterExec = (result) => {
        result.push(5);
    };

    const result = await sequery.exec(sql, {id: 2}, afterExec);
    console.log(result.length) // 2
}
```

```js
async function () {
    const sql = `select * from ${table} m where id > :id`;
    const afterExec = (result) => {
        result = [];
        return result;
    };

    const result = await sequery.exec(sql, {id: 2}, afterExec);
    console.log(result.length) // 0
}
```

```js
async function () {
    const sql = `select * from ${table} m where id > :id`;
    const afterExec = (result) => {
        result = [];
        return result;
    };

    const result = await sequery.exec(sql, {id: 2}, afterExec);
    console.log(result.length) // 0
}
```

```js
async function () {
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

    const result = await sequery.exec(sql);
    console.log(result[0].result) // 2
}
```

### .getWhereConditions(where) [demo](./test/mysql/queryGenerator.test.js)

```js
async function () {
    const where = {"id": 2};
    const whereStr = sequery.getWhereConditions(where);
    console.log(whereStr) // '`id` = 2'
}
```

```js
async function () {
    const where = {"id": 2};
    const tableAs = 'm';
    const whereStr = sequery.getWhereConditions(where, tableAs);
    console.log(whereStr) // '`m`.`id` = 2'
}
```

```js
async function () {
    const where = '{"id": 2}';
    const whereStr = sequery.getWhereConditions(where);
    console.log(whereStr) // '`id` = 2'
}
```

```js
async function () {
    const where = {"id": {$gt: 2}};
    const whereStr = sequery.getWhereConditions(where);
    console.log(whereStr) // '`id` > 2'
}
```

```js
async function () {
    const Op = sequery.Sequelize.Op;
    const where = {
        id: {
            [Op.or]: {
                [Op.lt]: 1000,
                [Op.eq]: null
            }
        }
    };

    const whereStr = sequery.getWhereConditions(where);
    console.log(whereStr) // '(`id` < 1000 OR `id` IS NULL)'
}
```

### .getOrderClause(order) [demo](./test/mysql/queryGenerator.test.js)

```js
async function () {
    const order = 'id';
    const orderStr = sequery.getOrderClause(order);
    console.log(orderStr) // ' order by `id`'
}
```

```js
async function () {
    const order = 'type, name desc';
    const orderStr = sequery.getOrderClause(order);
    console.log(orderStr) // ' order by `type`, `name` desc'
}
```

```js
async function () {
    const order = ['type', 'name desc'];
    const orderStr = sequery.getOrderClause(order);
    console.log(orderStr) // ' order by `type`, `name` desc'
}
```

```js
async function () {
    const order = [['type'], ['name', 'desc']];
    const orderStr = sequery.getOrderClause(order);
    console.log(orderStr) // ' order by `type`, `name` desc'
}
```

```js
async function () {
    const order = ['type', 'name desc'];
    const tableAs = 'm';
    const orderStr = sequery.getOrderClause(order, tableAs);
    console.log(orderStr) // ' order by `m`.`type`, `m`.`name` desc'
}
```

### .getGroupClause(group) [demo](./test/mysql/queryGenerator.test.js)

```js
async function () {
    const group = 'id';
    const groupStr = sequery.getGroupClause(group);
    console.log(groupStr) // ' group by `id`'
}
```

### .getLimitClause(options) [demo](./test/mysql/queryGenerator.test.js)

```js
async function () {
    const options = {order: 'id', limit: 10, offset: 5};
    const limitStr = sequery.getLimitClause(options);
    console.log(limitStr) // ' order by `id` limit 5, 10'
}
```

```js
async function () {
    const options = {order: 'id', tableAs: 'm', limit: 10, offset: 5};
    const tableAs = 'm';
    const limitStr = sequery.getLimitClause(options, tableAs);
    console.log(limitStr) // ' order by `m`.`id` limit 5, 10'
}
```

## Config

Base configuration
```js
// For mssql
const config = {
    dialect: 'mssql',
    database: 'master',
    username: 'sa',
    password: 'playboy',
    host: '192.168.197.80',
    port: 1433,
};

// For mysql
const config = {
    dialect: 'mysql',
    database: 'sys',
    username: 'root',
    password: 'playboy',
    host: '127.0.0.1',
    port: 3306,
};
```

### config.isSimplifyResult [demo](./test/generic/config.isSimplifyResult.test.js)

If it is true, simplify the result:
    If the result array has only one object element:
        If the object element has only one property, return the value of the property.
        Otherwise, return the whole object.

**For one row**

```js
config.isSimplifyResult = true;
sequery.init(config);

...

async function () {
    const sql = `select * from ${table} m limit 1`;
    const result = await sequery.do(sql);
    console.log(result.id) // 1
}
```

**For one field**

```js
config.isSimplifyResult = true;
sequery.init(config);

...

async function () {
    const sql = `select id from ${table} m limit 1`;
    const result = await sequery.do(sql);
    console.log(result) // 1
}
```

### config.beforeExec [demo](./test/generic/config-hooks.test.js)

```js
config.beforeExec = ({sql, replacements}) => {
    sql = sql + ' where date >= "2019-03-10"';
    return {sql};
};
sequery.init(config);

...

async function () {
    const sql = `select * from ${table} m`;
    const result = await sequery.do(sql);
    console.log(result.length) // 1
}
```

### config.afterExec [demo](./test/generic/config-hooks.test.js)

```js
config.afterExec = (result) => {
    if (!config.times) {
        config.times = 1;
        result.pop();
    }
    return result;
};
sequery.init(config);

...

async function () {
    const sql = `select * from ${table} m`;
    const result = await sequery.do(sql);
    console.log(result.length) // 2
}
```

### config.enableGlobal [demo](./test/generic/config.enableGlobal.test.js)

If it is true, save the data to global.__sequelize_raw_query.

If your project includes multiple subprojects, it is needed to enable global mode. Otherwise, since the sequelize in each subproject is a different instance and cannot share the same data, it will cause an error.

```js
config.enableGlobal = true;
sequery.init(config);
```

## License

[MIT](LICENSE)

Copyright (c) 2019, Owen Luke
