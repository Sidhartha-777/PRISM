const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyAdminsOfSubmission } = require('../middleware/notifications');
const router = express.Router();

function parseRows(results) {
  if (!results.length) return [];
  const cols = results[0].columns;
  return results[0].values.map(row => { const o = {}; cols.forEach((c,i) => o[c] = row[i]); return o; });
}

// GET /api/v1/datasets
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { discipline, format, access_level, q, page = 1, limit = 12, sort = 'created_at', order = 'DESC' } = req.query;
    let where = ["d.status = 'PUBLISHED'"];
    let params = [];
    if (discipline) { where.push('d.discipline = ?'); params.push(discipline); }
    if (format) { where.push('d.format = ?'); params.push(format); }
    if (access_level) { where.push('d.access_level = ?'); params.push(access_level); }
    if (q) { where.push('(d.title LIKE ? OR d.description LIKE ? OR d.parameters LIKE ?)'); params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
    const whereClause = 'WHERE ' + where.join(' AND ');
    const offset = (parseInt(page)-1)*parseInt(limit);
    const countR = db.exec(`SELECT COUNT(*) FROM datasets d ${whereClause}`, params);
    const total = countR.length ? countR[0].values[0][0] : 0;
    const validSorts = ['created_at','title','year','discipline'];
    const sortCol = validSorts.includes(sort) ? `d.${sort}` : 'd.created_at';
    const rows = db.exec(`SELECT d.*, e.title as expedition_title FROM datasets d LEFT JOIN expeditions e ON d.expedition_id = e.id ${whereClause} ORDER BY ${sortCol} ${order==='ASC'?'ASC':'DESC'} LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    res.json({ datasets: parseRows(rows), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// GET /api/v1/datasets/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = db.exec("SELECT d.*, e.title as expedition_title FROM datasets d LEFT JOIN expeditions e ON d.expedition_id = e.id WHERE d.slug = ? AND d.status = 'PUBLISHED'", [req.params.slug]);
    if (!rows.length||!rows[0].values.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Dataset not found.' } });
    res.json({ dataset: parseRows(rows)[0] });
  } catch (err) { next(err); }
});

// POST /api/v1/datasets/:id/download — log download
router.post('/:id/download', async (req, res, next) => {
  try {
    const db = await getDb();
    const { accepted_terms } = req.body;
    db.run('INSERT INTO dataset_download_log (id,dataset_id,user_id,ip_address,accepted_terms) VALUES (?,?,?,?,?)',
      [uuidv4(), req.params.id, req.body.user_id||null, req.ip, accepted_terms?1:0]);
    saveDb();
    res.json({ message: 'Download logged.' });
  } catch (err) { next(err); }
});

// POST /api/v1/datasets
router.post('/', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb(); const b = req.body; const id = uuidv4();
    const slug = (b.title||'dataset').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

    if (req.user.role === 'EDITOR') {
      const pendingId = uuidv4();
      const payload = JSON.stringify({ ...b, slug });
      db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
        [pendingId, 'dataset', null, 'CREATE', payload, 'PENDING', req.user.id]);
      saveDb();
      await notifyAdminsOfSubmission({ fromUserId: req.user.id, fromUserName: req.user.name, entityType: 'dataset', action: 'CREATE' });
      return res.status(201).json({ pending_id: pendingId, message: 'Submitted for admin approval.' });
    }

    db.run(`INSERT INTO datasets (id,title,title_hi,slug,description,description_hi,discipline,parameters,spatial_coverage,temporal_coverage_start,temporal_coverage_end,format,file_size,file_path,licence,doi,citation,version,access_level,embargo_date,contact_name,contact_email,status,expedition_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id,b.title,b.title_hi||null,slug,b.description||null,b.description_hi||null,b.discipline||null,b.parameters||null,b.spatial_coverage||null,b.temporal_coverage_start||null,b.temporal_coverage_end||null,b.format||null,b.file_size||null,b.file_path||null,b.licence||null,b.doi||null,b.citation||null,b.version||'1.0',b.access_level||'PUBLIC',b.embargo_date||null,b.contact_name||null,b.contact_email||null,'DRAFT',b.expedition_id||null,req.user.id]);
    saveDb();
    res.status(201).json({ id, slug });
  } catch (err) { next(err); }
});

// PUT /api/v1/datasets/:id
router.put('/:id', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    const f = req.body;

    if (req.user.role === 'EDITOR') {
      const pendingId = uuidv4();
      const payload = JSON.stringify(f);
      db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
        [pendingId, 'dataset', req.params.id, 'UPDATE', payload, 'PENDING', req.user.id]);
      saveDb();
      await notifyAdminsOfSubmission({ fromUserId: req.user.id, fromUserName: req.user.name, entityType: 'dataset', action: 'UPDATE' });
      return res.json({ pending_id: pendingId, message: 'Changes submitted for admin approval.' });
    }

    const sets=[]; const vals=[];
    const allowed = ['title','title_hi','description','description_hi','discipline','parameters','spatial_coverage','temporal_coverage_start','temporal_coverage_end','format','file_size','licence','doi','citation','version','access_level','embargo_date','contact_name','contact_email','status','expedition_id'];
    for (const k of allowed) { if (f[k]!==undefined) { sets.push(`${k}=?`); vals.push(f[k]); } }
    if (!sets.length) return res.status(400).json({ error: { code:'BAD_REQUEST', message:'No fields.' } });
    sets.push('updated_at=datetime("now")'); vals.push(req.params.id);
    db.run(`UPDATE datasets SET ${sets.join(',')} WHERE id=?`, vals);
    saveDb();
    res.json({ message: 'Updated.' });
  } catch (err) { next(err); }
});

// GET /api/v1/datasets/admin/all
router.get('/admin/all', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    let q = 'SELECT d.*, e.title as expedition_title FROM datasets d LEFT JOIN expeditions e ON d.expedition_id = e.id';
    if (req.user.role !== 'ADMIN') q += " WHERE d.status != 'ARCHIVED'";
    q += ' ORDER BY d.created_at DESC';
    const rows = db.exec(q);
    res.json({ datasets: parseRows(rows) });
  } catch (err) { next(err); }
});

module.exports = router;
