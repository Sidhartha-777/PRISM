const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyAdminsOfSubmission } = require('../middleware/notifications');
const router = express.Router();

function parseRows(r) { if(!r.length)return[]; const c=r[0].columns; return r[0].values.map(row=>{const o={};c.forEach((k,i)=>o[k]=row[i]);return o;}); }

// --- NEWS ---
// GET /api/v1/news
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { page=1, limit=10 } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const cnt = db.exec("SELECT COUNT(*) FROM news_articles WHERE status='PUBLISHED'");
    const total = cnt.length ? cnt[0].values[0][0] : 0;
    const rows = db.exec("SELECT * FROM news_articles WHERE status='PUBLISHED' ORDER BY publish_date DESC LIMIT ? OFFSET ?", [parseInt(limit), offset]);
    res.json({ articles: parseRows(rows), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// GET /api/v1/news/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = db.exec("SELECT * FROM news_articles WHERE slug = ? AND status = 'PUBLISHED'", [req.params.slug]);
    if (!rows.length||!rows[0].values.length) return res.status(404).json({ error: { code:'NOT_FOUND', message:'Article not found.' } });
    res.json({ article: parseRows(rows)[0] });
  } catch (err) { next(err); }
});

// POST /api/v1/news
router.post('/', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb(); const b=req.body; const id=uuidv4();
    const slug = (b.title||'news').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

    if (req.user.role === 'EDITOR') {
      const pendingId = uuidv4();
      const payload = JSON.stringify({ ...b, slug });
      db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
        [pendingId, 'news', null, 'CREATE', payload, 'PENDING', req.user.id]);
      saveDb();
      await notifyAdminsOfSubmission({ fromUserId: req.user.id, fromUserName: req.user.name, entityType: 'news', action: 'CREATE' });
      return res.status(201).json({ pending_id: pendingId, message: 'Submitted for admin approval.' });
    }

    db.run(`INSERT INTO news_articles (id,title,title_hi,slug,summary,summary_hi,body,body_hi,publish_date,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id,b.title,b.title_hi||null,slug,b.summary||null,b.summary_hi||null,b.body||null,b.body_hi||null,b.publish_date||null,'DRAFT',req.user.id]);
    saveDb(); res.status(201).json({ id, slug });
  } catch (err) { next(err); }
});

// PUT /api/v1/news/:id
router.put('/:id', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb(); const f=req.body;

    if (req.user.role === 'EDITOR') {
      const pendingId = uuidv4();
      const payload = JSON.stringify(f);
      db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
        [pendingId, 'news', req.params.id, 'UPDATE', payload, 'PENDING', req.user.id]);
      saveDb();
      await notifyAdminsOfSubmission({ fromUserId: req.user.id, fromUserName: req.user.name, entityType: 'news', action: 'UPDATE' });
      return res.json({ pending_id: pendingId, message: 'Changes submitted for admin approval.' });
    }

    const sets=[]; const vals=[];
    const allowed = ['title','title_hi','summary','summary_hi','body','body_hi','publish_date','status'];
    for (const k of allowed) { if(f[k]!==undefined){sets.push(`${k}=?`);vals.push(f[k]);} }
    if(!sets.length) return res.status(400).json({error:{code:'BAD_REQUEST',message:'No fields.'}});
    sets.push('updated_at=datetime("now")'); vals.push(req.params.id);
    db.run(`UPDATE news_articles SET ${sets.join(',')} WHERE id=?`, vals);
    saveDb(); res.json({ message: 'Updated.' });
  } catch (err) { next(err); }
});

router.get('/admin/all', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    let q = 'SELECT * FROM news_articles';
    if (req.user.role !== 'ADMIN') q += " WHERE status != 'ARCHIVED'";
    q += ' ORDER BY created_at DESC';
    const rows = db.exec(q);
    res.json({ articles: parseRows(rows) });
  } catch (err) { next(err); }
});

module.exports = router;
