const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyAdminsOfSubmission } = require('../middleware/notifications');

const router = express.Router();

// Helper to parse db result rows
function parseRows(results) {
  if (!results.length) return [];
  const cols = results[0].columns;
  return results[0].values.map(row => { const o = {}; cols.forEach((c,i) => o[c] = row[i]); return o; });
}

// GET /api/v1/media — public list
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { media_type, album_id, tag, page = 1, limit = 20 } = req.query;
    let where = ["m.status = 'PUBLISHED'"];
    let params = [];
    if (media_type) { where.push('m.media_type = ?'); params.push(media_type); }
    if (album_id) { where.push('m.album_id = ?'); params.push(album_id); }
    
    const whereClause = 'WHERE ' + where.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const countR = db.exec(`SELECT COUNT(*) FROM media_items m ${whereClause}`, params);
    const total = countR.length ? countR[0].values[0][0] : 0;
    
    const rows = db.exec(`SELECT m.*, a.name as album_name FROM media_items m LEFT JOIN albums a ON m.album_id = a.id ${whereClause} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    const items = parseRows(rows);

    // Get tags for each item
    for (const item of items) {
      const tagRows = db.exec('SELECT t.id, t.name FROM tags t JOIN media_tags mt ON t.id = mt.tag_id WHERE mt.media_id = ?', [item.id]);
      item.tags = parseRows(tagRows);
    }

    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// GET /api/v1/media/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = db.exec("SELECT m.*, a.name as album_name FROM media_items m LEFT JOIN albums a ON m.album_id = a.id WHERE m.slug = ? AND m.status = 'PUBLISHED'", [req.params.slug]);
    if (!rows.length || !rows[0].values.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Media not found.' } });
    const item = parseRows(rows)[0];
    const tagRows = db.exec('SELECT t.id, t.name FROM tags t JOIN media_tags mt ON t.id = mt.tag_id WHERE mt.media_id = ?', [item.id]);
    item.tags = parseRows(tagRows);
    res.json({ item });
  } catch (err) { next(err); }
});

// GET /api/v1/media/admin/all
router.get('/admin/all', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    let q = 'SELECT m.*, a.name as album_name FROM media_items m LEFT JOIN albums a ON m.album_id = a.id';
    if (req.user.role !== 'ADMIN') q += " WHERE m.status != 'ARCHIVED'";
    q += ' ORDER BY m.created_at DESC';
    const rows = db.exec(q);
    res.json({ items: parseRows(rows) });
  } catch (err) { next(err); }
});

// POST /api/v1/media — create media item
router.post('/', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    const b = req.body;
    const id = uuidv4();
    const slug = (b.title || 'media').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(0,8);

    if (req.user.role === 'EDITOR') {
      const pendingId = uuidv4();
      const payload = JSON.stringify({ ...b, slug });
      db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
        [pendingId, 'media', null, 'CREATE', payload, 'PENDING', req.user.id]);
      saveDb();
      await notifyAdminsOfSubmission({ fromUserId: req.user.id, fromUserName: req.user.name, entityType: 'media', action: 'CREATE' });
      return res.status(201).json({ pending_id: pendingId, message: 'Submitted for admin approval.' });
    }

    db.run(`INSERT INTO media_items (id,title,title_hi,slug,description,description_hi,media_type,file_path,thumbnail_path,original_filename,mime_type,file_size,width,height,duration,credit,location,taken_date,licence,resolution,album_id,expedition_id,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, b.title, b.title_hi||null, slug, b.description||null, b.description_hi||null, b.media_type||'PHOTO', b.file_path||null, b.thumbnail_path||null, b.original_filename||null, b.mime_type||null, b.file_size||null, b.width||null, b.height||null, b.duration||null, b.credit||null, b.location||null, b.taken_date||null, b.licence||null, b.resolution||null, b.album_id||null, b.expedition_id||null, 'DRAFT', req.user.id]);
    saveDb();
    res.status(201).json({ id, slug });
  } catch (err) { next(err); }
});

// PUT /api/v1/media/:id
router.put('/:id', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    const fields = req.body;

    if (req.user.role === 'EDITOR') {
      const pendingId = uuidv4();
      const payload = JSON.stringify(fields);
      db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
        [pendingId, 'media', req.params.id, 'UPDATE', payload, 'PENDING', req.user.id]);
      saveDb();
      await notifyAdminsOfSubmission({ fromUserId: req.user.id, fromUserName: req.user.name, entityType: 'media', action: 'UPDATE' });
      return res.json({ pending_id: pendingId, message: 'Changes submitted for admin approval.' });
    }

    const sets = []; const vals = [];
    const allowed = ['title','title_hi','description','description_hi','media_type','credit','location','taken_date','licence','resolution','album_id','expedition_id','status'];
    for (const k of allowed) { if (fields[k] !== undefined) { sets.push(`${k} = ?`); vals.push(fields[k]); } }
    if (!sets.length) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'No fields.' } });
    sets.push('updated_at = datetime("now")');
    vals.push(req.params.id);
    db.run(`UPDATE media_items SET ${sets.join(', ')} WHERE id = ?`, vals);
    saveDb();
    res.json({ message: 'Updated.' });
  } catch (err) { next(err); }
});

// GET /api/v1/albums
router.get('/albums/list', async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = db.exec('SELECT * FROM albums ORDER BY name');
    res.json({ albums: parseRows(rows) });
  } catch (err) { next(err); }
});

// POST /api/v1/albums
router.post('/albums', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, name_hi, description, description_hi } = req.body;
    const id = uuidv4();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    db.run('INSERT INTO albums (id,name,name_hi,slug,description,description_hi,created_by) VALUES (?,?,?,?,?,?,?)',
      [id, name, name_hi||null, slug, description||null, description_hi||null, req.user.id]);
    saveDb();
    res.status(201).json({ id, slug });
  } catch (err) { next(err); }
});

module.exports = router;
