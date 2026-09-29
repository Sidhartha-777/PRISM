const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../config/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { notifyAdminsOfSubmission } = require('../middleware/notifications');

const router = express.Router();

// GET /api/v1/expeditions — public list
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { region, year, status, station_id, expedition_status, page = 1, limit = 12, sort = 'year', order = 'DESC' } = req.query;
    
    let where = [];
    let params = [];
    
    // Public only sees PUBLISHED
    where.push("e.status = 'PUBLISHED'");
    
    if (region) { where.push('e.region = ?'); params.push(region); }
    if (year) { where.push('e.year = ?'); params.push(parseInt(year)); }
    if (station_id) { where.push('e.station_id = ?'); params.push(station_id); }
    if (expedition_status) { where.push('e.expedition_status = ?'); params.push(expedition_status); }
    
    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const validSorts = ['year', 'title', 'start_date', 'created_at'];
    const sortCol = validSorts.includes(sort) ? `e.${sort}` : 'e.year';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = db.exec(`SELECT COUNT(*) as cnt FROM expeditions e ${whereClause}`, params);
    const total = countResult.length > 0 ? countResult[0].values[0][0] : 0;

    const sql = `
      SELECT e.*, s.name as station_name 
      FROM expeditions e 
      LEFT JOIN stations s ON e.station_id = s.id 
      ${whereClause} 
      ORDER BY ${sortCol} ${sortOrder} 
      LIMIT ? OFFSET ?
    `;
    const results = db.exec(sql, [...params, parseInt(limit), offset]);
    
    let expeditions = [];
    if (results.length > 0) {
      const cols = results[0].columns;
      expeditions = results[0].values.map(row => {
        const obj = {};
        cols.forEach((c, i) => obj[c] = row[i]);
        return obj;
      });
    }

    res.json({ expeditions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// GET /api/v1/expeditions/:slug — public detail
router.get('/:slug', async (req, res, next) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT e.*, s.name as station_name, s.location as station_location, s.latitude, s.longitude
      FROM expeditions e
      LEFT JOIN stations s ON e.station_id = s.id
      WHERE e.slug = ? AND e.status = 'PUBLISHED'
    `);
    stmt.bind([req.params.slug]);
    if (!stmt.step()) { stmt.free(); return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Expedition not found.' } }); }
    const expedition = stmt.getAsObject();
    stmt.free();

    // Get team members
    const membersResult = db.exec('SELECT * FROM expedition_members WHERE expedition_id = ?', [expedition.id]);
    let members = [];
    if (membersResult.length > 0) {
      const cols = membersResult[0].columns;
      members = membersResult[0].values.map(row => { const o = {}; cols.forEach((c,i) => o[c] = row[i]); return o; });
    }

    // Get linked datasets
    const dsResult = db.exec("SELECT id, title, slug, discipline, format FROM datasets WHERE expedition_id = ? AND status = 'PUBLISHED'", [expedition.id]);
    let datasets = [];
    if (dsResult.length > 0) {
      const cols = dsResult[0].columns;
      datasets = dsResult[0].values.map(row => { const o = {}; cols.forEach((c,i) => o[c] = row[i]); return o; });
    }

    // Get linked publications
    const pubResult = db.exec("SELECT id, title, slug, pub_type, authors, year FROM publications WHERE expedition_id = ? AND status = 'PUBLISHED'", [expedition.id]);
    let publications = [];
    if (pubResult.length > 0) {
      const cols = pubResult[0].columns;
      publications = pubResult[0].values.map(row => { const o = {}; cols.forEach((c,i) => o[c] = row[i]); return o; });
    }

    res.json({ expedition: { ...expedition, members, datasets, publications } });
  } catch (err) { next(err); }
});

// POST /api/v1/expeditions — admin/editor create
router.post('/', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    const { title, title_hi, summary, summary_hi, description, description_hi, region, station_id, start_date, end_date, year, expedition_status, objectives, objectives_hi } = req.body;
    const id = uuidv4();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (req.user.role === 'EDITOR') {
      // Editor: save to pending_changes for admin approval
      const pendingId = uuidv4();
      const payload = JSON.stringify({ title, title_hi, slug, summary, summary_hi, description, description_hi, region, station_id, start_date, end_date, year, expedition_status: expedition_status || 'PLANNED', objectives, objectives_hi });
      db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
        [pendingId, 'expedition', null, 'CREATE', payload, 'PENDING', req.user.id]);
      saveDb();
      await notifyAdminsOfSubmission({ fromUserId: req.user.id, fromUserName: req.user.name, entityType: 'expedition', action: 'CREATE' });
      return res.status(201).json({ pending_id: pendingId, message: 'Submitted for admin approval.' });
    }

    // Admin: create directly
    db.run(`INSERT INTO expeditions (id,title,title_hi,slug,summary,summary_hi,description,description_hi,region,station_id,start_date,end_date,year,status,expedition_status,objectives,objectives_hi,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, title, title_hi||null, slug, summary||null, summary_hi||null, description||null, description_hi||null, region, station_id||null, start_date||null, end_date||null, year||null, 'DRAFT', expedition_status||'PLANNED', objectives||null, objectives_hi||null, req.user.id]);
    saveDb();
    res.status(201).json({ id, slug });
  } catch (err) { next(err); }
});

// PUT /api/v1/expeditions/:id — admin/editor update
router.put('/:id', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    const fields = req.body;

    if (req.user.role === 'EDITOR') {
      // Editor: save to pending_changes for admin approval
      const pendingId = uuidv4();
      const payload = JSON.stringify(fields);
      db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
        [pendingId, 'expedition', req.params.id, 'UPDATE', payload, 'PENDING', req.user.id]);
      saveDb();
      await notifyAdminsOfSubmission({ fromUserId: req.user.id, fromUserName: req.user.name, entityType: 'expedition', action: 'UPDATE' });
      return res.json({ pending_id: pendingId, message: 'Changes submitted for admin approval.' });
    }

    // Admin: update directly
    const sets = [];
    const vals = [];
    const allowed = ['title','title_hi','summary','summary_hi','description','description_hi','region','station_id','start_date','end_date','year','status','expedition_status','objectives','objectives_hi'];
    for (const key of allowed) {
      if (fields[key] !== undefined) { sets.push(`${key} = ?`); vals.push(fields[key]); }
    }
    if (sets.length === 0) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'No fields to update.' } });
    sets.push('updated_at = datetime("now")');
    vals.push(req.params.id);
    db.run(`UPDATE expeditions SET ${sets.join(', ')} WHERE id = ?`, vals);
    saveDb();
    res.json({ message: 'Updated.' });
  } catch (err) { next(err); }
});

// GET /api/v1/expeditions/admin/all — admin list (all statuses)
router.get('/admin/all', authenticate, authorize('ADMIN', 'EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    let q = 'SELECT e.*, s.name as station_name FROM expeditions e LEFT JOIN stations s ON e.station_id = s.id';
    if (req.user.role !== 'ADMIN') q += " WHERE e.status != 'ARCHIVED'";
    q += ' ORDER BY e.created_at DESC';
    const results = db.exec(q);
    let expeditions = [];
    if (results.length > 0) {
      const cols = results[0].columns;
      expeditions = results[0].values.map(row => { const o = {}; cols.forEach((c,i) => o[c] = row[i]); return o; });
    }
    res.json({ expeditions });
  } catch (err) { next(err); }
});

// GET /api/v1/stations — list all stations
router.get('/stations/list', async (req, res, next) => {
  try {
    const db = await getDb();
    const results = db.exec('SELECT * FROM stations ORDER BY name');
    let stations = [];
    if (results.length > 0) {
      const cols = results[0].columns;
      stations = results[0].values.map(row => { const o = {}; cols.forEach((c,i) => o[c] = row[i]); return o; });
    }
    res.json({ stations });
  } catch (err) { next(err); }
});

module.exports = router;
