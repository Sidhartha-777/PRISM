const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyAdminsOfSubmission } = require('../middleware/notifications');
const router = express.Router();

function parseRows(r) { if(!r.length)return[]; const c=r[0].columns; return r[0].values.map(row=>{const o={};c.forEach((k,i)=>o[k]=row[i]);return o;}); }

// GET /api/v1/publications
router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { pub_type, year, keyword, author, q, page=1, limit=12, sort='year', order='DESC' } = req.query;
    let where = ["p.status = 'PUBLISHED'"]; let params = [];
    if (pub_type) { where.push('p.pub_type = ?'); params.push(pub_type); }
    if (year) { where.push('p.year = ?'); params.push(parseInt(year)); }
    if (keyword) { where.push('p.keywords LIKE ?'); params.push(`%${keyword}%`); }
    if (author) { where.push('p.authors LIKE ?'); params.push(`%${author}%`); }
    if (q) { where.push('(p.title LIKE ? OR p.abstract LIKE ? OR p.authors LIKE ?)'); params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
    const wc = 'WHERE ' + where.join(' AND ');
    const offset = (parseInt(page)-1)*parseInt(limit);
    const cnt = db.exec(`SELECT COUNT(*) FROM publications p ${wc}`, params);
    const total = cnt.length ? cnt[0].values[0][0] : 0;
    const rows = db.exec(`SELECT p.* FROM publications p ${wc} ORDER BY p.${sort==='title'?'title':'year'} ${order==='ASC'?'ASC':'DESC'} LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    res.json({ publications: parseRows(rows), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// GET /api/v1/publications/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = db.exec("SELECT * FROM publications WHERE slug = ? AND status = 'PUBLISHED'", [req.params.slug]);
    if (!rows.length||!rows[0].values.length) return res.status(404).json({ error: { code:'NOT_FOUND', message:'Publication not found.' } });
    res.json({ publication: parseRows(rows)[0] });
  } catch (err) { next(err); }
});

// GET /api/v1/publications/:id/bibtex
router.get('/:id/bibtex', async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = db.exec('SELECT * FROM publications WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: { code:'NOT_FOUND' } });
    const p = parseRows(rows)[0];
    const key = `ncpor${p.year}${(p.authors||'unknown').split(',')[0].trim().split(' ').pop().toLowerCase()}`;
    const bibtex = `@article{${key},
  title = {${p.title}},
  author = {${p.authors || 'Unknown'}},
  journal = {${p.journal || ''}},
  year = {${p.year || ''}},
  volume = {${p.volume || ''}},
  number = {${p.issue || ''}},
  pages = {${p.pages || ''}},
  doi = {${p.doi || ''}}
}`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${key}.bib"`);
    res.send(bibtex);
  } catch (err) { next(err); }
});

// GET /api/v1/publications/:id/ris
router.get('/:id/ris', async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = db.exec('SELECT * FROM publications WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: { code:'NOT_FOUND' } });
    const p = parseRows(rows)[0];
    const ris = `TY  - JOUR\nTI  - ${p.title}\nAU  - ${(p.authors||'').split(',').join('\nAU  - ')}\nJO  - ${p.journal||''}\nPY  - ${p.year||''}\nVL  - ${p.volume||''}\nIS  - ${p.issue||''}\nSP  - ${p.pages||''}\nDO  - ${p.doi||''}\nER  - \n`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="publication.ris"`);
    res.send(ris);
  } catch (err) { next(err); }
});

// POST /api/v1/publications
router.post('/', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb(); const b=req.body; const id=uuidv4();
    const slug = (b.title||'pub').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

    if (req.user.role === 'EDITOR') {
      const pendingId = uuidv4();
      const payload = JSON.stringify({ ...b, slug });
      db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
        [pendingId, 'publication', null, 'CREATE', payload, 'PENDING', req.user.id]);
      saveDb();
      await notifyAdminsOfSubmission({ fromUserId: req.user.id, fromUserName: req.user.name, entityType: 'publication', action: 'CREATE' });
      return res.status(201).json({ pending_id: pendingId, message: 'Submitted for admin approval.' });
    }

    db.run(`INSERT INTO publications (id,title,title_hi,slug,abstract,abstract_hi,pub_type,authors,journal,year,volume,issue,pages,doi,keywords,pdf_path,status,expedition_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id,b.title,b.title_hi||null,slug,b.abstract||null,b.abstract_hi||null,b.pub_type||'PAPER',b.authors||null,b.journal||null,b.year||null,b.volume||null,b.issue||null,b.pages||null,b.doi||null,b.keywords||null,b.pdf_path||null,'DRAFT',b.expedition_id||null,req.user.id]);
    saveDb();
    res.status(201).json({ id, slug });
  } catch (err) { next(err); }
});

// PUT /api/v1/publications/:id
router.put('/:id', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb(); const f=req.body;

    if (req.user.role === 'EDITOR') {
      const pendingId = uuidv4();
      const payload = JSON.stringify(f);
      db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
        [pendingId, 'publication', req.params.id, 'UPDATE', payload, 'PENDING', req.user.id]);
      saveDb();
      await notifyAdminsOfSubmission({ fromUserId: req.user.id, fromUserName: req.user.name, entityType: 'publication', action: 'UPDATE' });
      return res.json({ pending_id: pendingId, message: 'Changes submitted for admin approval.' });
    }

    const sets=[]; const vals=[];
    const allowed = ['title','title_hi','abstract','abstract_hi','pub_type','authors','journal','year','volume','issue','pages','doi','keywords','pdf_path','status','expedition_id'];
    for (const k of allowed) { if(f[k]!==undefined){sets.push(`${k}=?`);vals.push(f[k]);} }
    if(!sets.length)return res.status(400).json({error:{code:'BAD_REQUEST',message:'No fields.'}});
    sets.push('updated_at=datetime("now")'); vals.push(req.params.id);
    db.run(`UPDATE publications SET ${sets.join(',')} WHERE id=?`, vals);
    saveDb(); res.json({ message: 'Updated.' });
  } catch (err) { next(err); }
});

// GET /api/v1/publications/admin/all
router.get('/admin/all', authenticate, authorize('ADMIN','EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    let q = 'SELECT * FROM publications';
    if (req.user.role !== 'ADMIN') q += " WHERE status != 'ARCHIVED'";
    q += ' ORDER BY created_at DESC';
    const rows = db.exec(q);
    res.json({ publications: parseRows(rows) });
  } catch (err) { next(err); }
});

module.exports = router;
