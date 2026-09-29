const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyEditorOfReview } = require('../middleware/notifications');
const router = express.Router();

function parseRows(r) { if(!r.length)return[]; const c=r[0].columns; return r[0].values.map(row=>{const o={};c.forEach((k,i)=>o[k]=row[i]);return o;}); }

// Table mapping for entity types
const TABLE_MAP = {
  expedition: 'expeditions',
  dataset: 'datasets',
  publication: 'publications',
  news: 'news_articles',
  event: 'events',
  media: 'media_items',
  education: 'education_resources',
};

// Column mapping per entity type for INSERT operations
const INSERT_MAP = {
  expedition: {
    table: 'expeditions',
    columns: 'id,title,title_hi,slug,summary,summary_hi,description,description_hi,region,station_id,start_date,end_date,year,status,expedition_status,objectives,objectives_hi,created_by',
    build: (id, p, userId) => [id, p.title, p.title_hi||null, p.slug, p.summary||null, p.summary_hi||null, p.description||null, p.description_hi||null, p.region||null, p.station_id||null, p.start_date||null, p.end_date||null, p.year||null, 'DRAFT', p.expedition_status||'PLANNED', p.objectives||null, p.objectives_hi||null, userId],
  },
  dataset: {
    table: 'datasets',
    columns: 'id,title,title_hi,slug,description,description_hi,discipline,parameters,spatial_coverage,temporal_coverage_start,temporal_coverage_end,format,file_size,file_path,licence,doi,citation,version,access_level,embargo_date,contact_name,contact_email,status,expedition_id,created_by',
    build: (id, p, userId) => [id, p.title, p.title_hi||null, p.slug, p.description||null, p.description_hi||null, p.discipline||null, p.parameters||null, p.spatial_coverage||null, p.temporal_coverage_start||null, p.temporal_coverage_end||null, p.format||null, p.file_size||null, p.file_path||null, p.licence||null, p.doi||null, p.citation||null, p.version||'1.0', p.access_level||'PUBLIC', p.embargo_date||null, p.contact_name||null, p.contact_email||null, 'DRAFT', p.expedition_id||null, userId],
  },
  publication: {
    table: 'publications',
    columns: 'id,title,title_hi,slug,abstract,abstract_hi,pub_type,authors,journal,year,volume,issue,pages,doi,keywords,pdf_path,status,expedition_id,created_by',
    build: (id, p, userId) => [id, p.title, p.title_hi||null, p.slug, p.abstract||null, p.abstract_hi||null, p.pub_type||'PAPER', p.authors||null, p.journal||null, p.year||null, p.volume||null, p.issue||null, p.pages||null, p.doi||null, p.keywords||null, p.pdf_path||null, 'DRAFT', p.expedition_id||null, userId],
  },
  news: {
    table: 'news_articles',
    columns: 'id,title,title_hi,slug,summary,summary_hi,body,body_hi,publish_date,status,created_by',
    build: (id, p, userId) => [id, p.title, p.title_hi||null, p.slug, p.summary||null, p.summary_hi||null, p.body||null, p.body_hi||null, p.publish_date||null, 'DRAFT', userId],
  },
  event: {
    table: 'events',
    columns: 'id,title,title_hi,slug,description,description_hi,location,start_date,end_date,event_type,status,created_by',
    build: (id, p, userId) => [id, p.title, p.title_hi||null, p.slug, p.description||null, p.description_hi||null, p.location||null, p.start_date||null, p.end_date||null, p.event_type||null, 'DRAFT', userId],
  },
  media: {
    table: 'media_items',
    columns: 'id,title,title_hi,slug,description,description_hi,media_type,file_path,thumbnail_path,original_filename,mime_type,file_size,width,height,duration,credit,location,taken_date,licence,resolution,album_id,expedition_id,status,created_by',
    build: (id, p, userId) => [id, p.title, p.title_hi||null, p.slug, p.description||null, p.description_hi||null, p.media_type||'PHOTO', p.file_path||null, p.thumbnail_path||null, p.original_filename||null, p.mime_type||null, p.file_size||null, p.width||null, p.height||null, p.duration||null, p.credit||null, p.location||null, p.taken_date||null, p.licence||null, p.resolution||null, p.album_id||null, p.expedition_id||null, 'DRAFT', userId],
  },
  education: {
    table: 'education_resources',
    columns: 'id,title,title_hi,slug,description,description_hi,resource_type,file_path,target_audience,status,created_by',
    build: (id, p, userId) => [id, p.title, p.title_hi||null, p.slug, p.description||null, p.description_hi||null, p.resource_type||'TEACHING_KIT', p.file_path||null, p.target_audience||null, 'DRAFT', userId],
  },
};

// GET /api/v1/approvals — list all pending changes (admin only)
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const db = await getDb();
    const { status = 'PENDING' } = req.query;
    const rows = db.exec(
      'SELECT pc.*, u.name as submitted_by_name, u.email as submitted_by_email FROM pending_changes pc LEFT JOIN users u ON pc.submitted_by = u.id WHERE pc.status = ? ORDER BY pc.created_at DESC',
      [status]
    );
    const items = parseRows(rows);
    // Parse payload JSON for each item
    for (const item of items) {
      try { item.payload = JSON.parse(item.payload); } catch { /* keep as string */ }
    }
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

// GET /api/v1/approvals/my — list editor's own submissions
router.get('/my', authenticate, authorize('EDITOR'), async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = db.exec(
      'SELECT * FROM pending_changes WHERE submitted_by = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    const items = parseRows(rows);
    for (const item of items) {
      try { item.payload = JSON.parse(item.payload); } catch { /* keep as string */ }
    }
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

// PUT /api/v1/approvals/:id/approve — admin approves a pending change
router.put('/:id/approve', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const db = await getDb();

    // Get the pending change
    const rows = db.exec('SELECT * FROM pending_changes WHERE id = ? AND status = ?', [req.params.id, 'PENDING']);
    if (!rows.length || !rows[0].values.length) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pending change not found or already processed.' } });
    }
    const change = parseRows(rows)[0];
    let payload;
    try { payload = JSON.parse(change.payload); } catch { payload = change.payload; }

    const mapping = INSERT_MAP[change.entity_type];
    const table = TABLE_MAP[change.entity_type];

    if (!table) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Unknown entity type.' } });
    }

    if (change.action === 'CREATE' && mapping) {
      // Create the new entity
      const newId = uuidv4();
      const placeholders = mapping.columns.split(',').map(() => '?').join(',');
      const values = mapping.build(newId, payload, change.submitted_by);
      db.run(`INSERT INTO ${mapping.table} (${mapping.columns}) VALUES (${placeholders})`, values);
    } else if (change.action === 'UPDATE' && change.entity_id) {
      // Apply updates to existing entity
      const sets = [];
      const vals = [];
      for (const [key, value] of Object.entries(payload)) {
        if (key !== 'id' && key !== 'created_by' && key !== 'created_at') {
          sets.push(`${key} = ?`);
          vals.push(value);
        }
      }
      if (sets.length > 0) {
        sets.push('updated_at = datetime("now")');
        vals.push(change.entity_id);
        db.run(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`, vals);
      }
    }

    // Mark as approved
    db.run('UPDATE pending_changes SET status = ?, reviewed_by = ?, review_note = ?, updated_at = datetime("now") WHERE id = ?',
      ['APPROVED', req.user.id, req.body.note || null, req.params.id]);
    saveDb();

    // Notify the editor
    await notifyEditorOfReview({
      editorUserId: change.submitted_by,
      reviewerUserId: req.user.id,
      reviewerName: req.user.name,
      entityType: change.entity_type,
      status: 'APPROVED',
      reviewNote: req.body.note,
    });

    res.json({ message: 'Change approved and applied.' });
  } catch (err) { next(err); }
});

// PUT /api/v1/approvals/:id/reject — admin rejects a pending change
router.put('/:id/reject', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const db = await getDb();

    const rows = db.exec('SELECT * FROM pending_changes WHERE id = ? AND status = ?', [req.params.id, 'PENDING']);
    if (!rows.length || !rows[0].values.length) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pending change not found or already processed.' } });
    }

    const change = parseRows(rows)[0];

    db.run('UPDATE pending_changes SET status = ?, reviewed_by = ?, review_note = ?, updated_at = datetime("now") WHERE id = ?',
      ['REJECTED', req.user.id, req.body.note || null, req.params.id]);
    saveDb();

    // Notify the editor
    await notifyEditorOfReview({
      editorUserId: change.submitted_by,
      reviewerUserId: req.user.id,
      reviewerName: req.user.name,
      entityType: change.entity_type,
      status: 'REJECTED',
      reviewNote: req.body.note,
    });

    res.json({ message: 'Change rejected.' });
  } catch (err) { next(err); }
});

module.exports = router;
