require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
  const [tables] = await db.query('SHOW TABLES');
  const data = {};
  for (const row of tables) {
    const name = Object.values(row)[0];
    const [rows] = await db.query(`SELECT * FROM \`${name}\``);
    data[name] = rows;
  }
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  console.log('Done: data.json');
  process.exit();
})();