// 1. ربط الماسورة (الاتصال بالداتا بيز)
const db = require('../config/db');
const bcrypt = require('bcrypt'); // مكتبة تشفير كلمة المرور

class User {
    
    // 2. دالة إنشاء مستخدم جديد (لعملية الـ Sign Up)
    static async create(userData) {
        const { name, email, password, role } = userData;
        
        // التحقق من وجود البيانات المطلوبة
        if (!name || !email || !password) {
            throw new Error('الاسم والبريد الإلكتروني وكلمة المرور مطلوبة');
        }
        
        // تشفير كلمة المرور قبل التخزين
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(sql, [name, email, hashedPassword, role || 'user']); // role افتراضي 'user'
        
        return result;
    }

    // 3. دالة البحث بالإيميل (لعملية الـ Login)
    static async findByEmail(email) {
        if (!email) {
            throw new Error('البريد الإلكتروني مطلوب');
        }
        
        const sql = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await db.execute(sql, [email]);
        return rows[0]; // بنرجع أول نتيجة تطلع (اليوزر نفسه)
    }

    // 4. دالة البحث بالـ ID (عشان نعرف مين اليوزر اللي بيتحرك في الموقع)
    static async findById(id) {
        if (!id) {
            throw new Error('المعرف (ID) مطلوب');
        }
        
        const sql = 'SELECT * FROM users WHERE id = ?';
        const [rows] = await db.execute(sql, [id]);
        return rows[0];
    }
    
    // 5. دالة إضافية: التحقق من صحة كلمة المرور (لوقت الـ Login)
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
    
    // 6. دالة إضافية: حذف المستخدم (اختياري)
    static async deleteById(id) {
        if (!id) {
            throw new Error('المعرف (ID) مطلوب للحذف');
        }
        
        const sql = 'DELETE FROM users WHERE id = ?';
        const [result] = await db.execute(sql, [id]);
        return result;
    }
    
    // 7. دالة إضافية: تحديث بيانات المستخدم
    static async updateById(id, updateData) {
        if (!id) {
            throw new Error('المعرف (ID) مطلوب للتحديث');
        }
        
        const { name, email, role } = updateData;
        const sql = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
        const [result] = await db.execute(sql, [name, email, role, id]);
        return result;
    }
}

// 8. تصدير الملف عشان نستخدمه في الـ AuthController والـ Routes
module.exports = User;
