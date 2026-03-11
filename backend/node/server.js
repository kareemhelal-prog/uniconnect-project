// app.js
const express = require('express');
const { promisePool, testConnection } = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// اختبار الاتصال بقاعدة البيانات عند بدء التشغيل
testConnection();

// Route بسيط لاختبار قاعدة البيانات
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT 1 + 1 AS solution');
        res.json({ 
            success: true, 
            message: '✅ قاعدة البيانات تعمل', 
            data: rows[0] 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: '❌ خطأ في قاعدة البيانات', 
            error: error.message 
        });
    }
});

// Route لجلب المستخدمين (مثال)
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT * FROM users');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب المستخدمين', 
            error: error.message 
        });
    }
});

// إضافة مستخدم جديد (مثال)
app.post('/api/users', async (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ 
            success: false, 
            message: 'الاسم والبريد الإلكتروني مطلوبان' 
        });
    }
    
    try {
        const [result] = await promisePool.query(
            'INSERT INTO users (name, email) VALUES (?, ?)',
            [name, email]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'تم إضافة المستخدم بنجاح',
            userId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في إضافة المستخدم', 
            error: error.message 
        });
    }
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
});