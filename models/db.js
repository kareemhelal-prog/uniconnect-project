// config/db.js
const mysql = require('mysql2');
require('dotenv').config();

// إنشاء اتصال بقاعدة البيانات
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'uniconnect_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// تحويل pool إلى Promise للاستخدام مع async/await
const promisePool = pool.promise();

// اختبار الاتصال
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    promisePool,
    testConnection
};