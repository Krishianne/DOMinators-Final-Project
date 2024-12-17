const mysql = require('mysql2');
const util = require('util');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DOMinators'
});

pool.query = util.promisify(pool.query);

module.exports = pool;
