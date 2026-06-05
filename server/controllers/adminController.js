const { promisePool } = require('../config/db');
const bcrypt = require('bcrypt');

exports.getStats = async (req, res) => {
    try {
        const [[{ users }]] = await promisePool.query(
            'SELECT COUNT(*) as users FROM Users'
        );
        const [[{ posts }]] = await promisePool.query(
            'SELECT COUNT(*) as posts FROM Posts'
        );
        const [[{ groups }]] = await promisePool.query(
            'SELECT COUNT(*) as groups FROM `Groups`'
        );
        const [[{ projects }]] = await promisePool.query(
            'SELECT COUNT(*) as projects FROM Projects'
        );
        const [[{ pendingReports }]] = await promisePool.query(
            'SELECT COUNT(*) as pendingReports FROM Reports WHERE status = "pending"'
        );

        res.json({
            success: true,
            stats: { users, posts, groups, projects, pendingReports }
        });
    } catch (error) {
        console.error('Error in getStats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.search = async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ success: false, message: 'Search term is required' });
    }

    const searchTerm = `%${q.trim()}%`;

    try {
        const [users] = await promisePool.query(
            `SELECT id, name, username, email, profile_picture, role, is_active
             FROM Users
             WHERE name LIKE ? OR username LIKE ?
             LIMIT 20`,
            [searchTerm, searchTerm]
        );

        const [groups] = await promisePool.query(
            `SELECT id, name, description, group_image, creator_id, created_at
             FROM \`Groups\`
             WHERE name LIKE ?
             LIMIT 20`,
            [searchTerm]
        );

        const [posts] = await promisePool.query(
            `SELECT p.id, p.content, p.user_id, p.created_at,
                    u.name as author_name, u.username as author_username
             FROM Posts p
             LEFT JOIN Users u ON p.user_id = u.id
             WHERE p.content LIKE ?
             ORDER BY p.created_at DESC
             LIMIT 20`,
            [searchTerm]
        );

        res.json({
            success: true,
            results: {
                users:  { count: users.length,  data: users  },
                groups: { count: groups.length, data: groups },
                posts:  { count: posts.length,  data: posts  }
            }
        });
    } catch (error) {
        console.error('Error in search:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    const { page = 1, limit = 10, search = '', role = 'all' } = req.query;
    const offset = (page - 1) * limit;

    try {
        let sql = `SELECT id, name, email, username, role, is_active, created_at FROM Users WHERE 1=1`;
        const params = [];

        if (search) {
            sql += ` AND (name LIKE ? OR email LIKE ? OR username LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        if (role !== 'all') {
            sql += ` AND role = ?`;
            params.push(role);
        }

        const countSql = sql.replace(
            'SELECT id, name, email, username, role, is_active, created_at',
            'SELECT COUNT(*) as total'
        );
        const [[{ total }]] = await promisePool.query(countSql, params);

        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await promisePool.query(sql, params);

        res.json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deactivateUser = async (req, res) => {
    const { id } = req.params;
    try {
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
        }

        const [result] = await promisePool.query(
            'UPDATE Users SET is_active = 0 WHERE id = ?', [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Error in deactivateUser:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.activateUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await promisePool.query(
            'UPDATE Users SET is_active = 1 WHERE id = ?', [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User activated successfully' });
    } catch (error) {
        console.error('Error in activateUser:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        const [result] = await promisePool.query(
            'DELETE FROM Users WHERE id = ?', [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error in deleteUser:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.changeUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['student', 'doctor', 'investor', 'admin'];

    if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    try {
        const [result] = await promisePool.query(
            'UPDATE Users SET role = ? WHERE id = ?', [role, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: `User role changed to ${role}` });
    } catch (error) {
        console.error('Error in changeUserRole:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.resetUserPassword = async (req, res) => {
    const { id } = req.params;
    try {
        const [[user]] = await promisePool.query(
            'SELECT id FROM Users WHERE id = ?', [id]
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const newPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await promisePool.query(
            'UPDATE Users SET password = ? WHERE id = ?', [hashedPassword, id]
        );

        res.json({ success: true, message: 'Password reset successfully', newPassword });
    } catch (error) {
        console.error('Error in resetUserPassword:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllReports = async (req, res) => {
    const { page = 1, limit = 10, status = 'all', type = 'all' } = req.query;
    const offset = (page - 1) * limit;

    try {
        let sql = `
            SELECT r.*,
                   u.name as reporter_name, u.email as reporter_email
            FROM Reports r
            LEFT JOIN Users u ON r.reporter_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status !== 'all') {
            sql += ` AND r.status = ?`;
            params.push(status);
        }
        if (type !== 'all') {
            sql += ` AND r.reported_type = ?`;
            params.push(type);
        }

        const countSql = sql.replace(
            'SELECT r.*, u.name as reporter_name, u.email as reporter_email',
            'SELECT COUNT(*) as total'
        );
        const [[{ total }]] = await promisePool.query(countSql, params);

        sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [reports] = await promisePool.query(sql, params);

        res.json({
            success: true,
            reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllReports:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.resolveReport = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await promisePool.query(
            `UPDATE Reports SET status = 'resolved' WHERE id = ?`, [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.json({ success: true, message: 'Report resolved' });
    } catch (error) {
        console.error('Error in resolveReport:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.dismissReport = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await promisePool.query(
            `UPDATE Reports SET status = 'dismissed' WHERE id = ?`, [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.json({ success: true, message: 'Report dismissed' });
    } catch (error) {
        console.error('Error in dismissReport:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteReportedContent = async (req, res) => {
    const { id } = req.params;
    const { content_type, content_id } = req.body;

    try {
        await promisePool.query(
            `UPDATE Reports SET status = 'resolved' WHERE id = ?`, [id]
        );

        if (content_type === 'post') {
            await promisePool.query('DELETE FROM Posts WHERE id = ?', [content_id]);
        } else if (content_type === 'comment') {
            await promisePool.query('DELETE FROM Comments WHERE id = ?', [content_id]);
        }

        res.json({ success: true, message: 'Content deleted and report resolved' });
    } catch (error) {
        console.error('Error in deleteReportedContent:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};