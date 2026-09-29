const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

function parseRows(r) { if(!r.length)return[]; const c=r[0].columns; return r[0].values.map(row=>{const o={};c.forEach((k,i)=>o[k]=row[i]);return o;}); }

// GET /api/v1/notifications — get user's notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const db = await getDb();
    const { unread_only } = req.query;
    let sql, params;

    if (req.user.role === 'ADMIN') {
      // Admin sees: new pending submissions, system alerts
      if (unread_only === 'true') {
        sql = 'SELECT n.*, u.name as from_user_name FROM notifications n LEFT JOIN users u ON n.from_user_id = u.id WHERE n.user_id = ? AND n.is_read = 0 ORDER BY n.created_at DESC LIMIT 50';
      } else {
        sql = 'SELECT n.*, u.name as from_user_name FROM notifications n LEFT JOIN users u ON n.from_user_id = u.id WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 50';
      }
      params = [req.user.id];
    } else {
      // Editors see: approval/rejection notifications for their submissions
      if (unread_only === 'true') {
        sql = 'SELECT n.*, u.name as from_user_name FROM notifications n LEFT JOIN users u ON n.from_user_id = u.id WHERE n.user_id = ? AND n.is_read = 0 ORDER BY n.created_at DESC LIMIT 50';
      } else {
        sql = 'SELECT n.*, u.name as from_user_name FROM notifications n LEFT JOIN users u ON n.from_user_id = u.id WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 50';
      }
      params = [req.user.id];
    }

    const rows = db.exec(sql, params);
    const notifications = parseRows(rows);

    // Count unread
    const countRows = db.exec('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    const unreadCount = countRows.length ? countRows[0].values[0][0] : 0;

    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
});

// PUT /api/v1/notifications/:id/read — mark notification as read
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const db = await getDb();
    db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    saveDb();
    res.json({ message: 'Marked as read.' });
  } catch (err) { next(err); }
});

// PUT /api/v1/notifications/read-all — mark all as read
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    const db = await getDb();
    db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
    saveDb();
    res.json({ message: 'All marked as read.' });
  } catch (err) { next(err); }
});

module.exports = router;
