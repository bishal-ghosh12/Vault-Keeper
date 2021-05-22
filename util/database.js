const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
const pool = mysql.createPool({
    host: 'localhost',
    user: process.env.user,
    database: process.env.database,
    password: process.env.password  
});

module.exports = pool.promise();