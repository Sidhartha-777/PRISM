const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  const dbDir = path.dirname(path.resolve(config.DATABASE_PATH));
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.resolve(config.DATABASE_PATH);
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL mode for better concurrency
  db.run('PRAGMA journal_mode=WAL;');
  db.run('PRAGMA foreign_keys=ON;');

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEDIA' CHECK(role IN ('ADMIN','EDITOR','MEDIA')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pending_changes (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      action TEXT NOT NULL CHECK(action IN ('CREATE','UPDATE')),
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
      submitted_by TEXT NOT NULL REFERENCES users(id),
      reviewed_by TEXT REFERENCES users(id),
      review_note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hi TEXT,
      location TEXT,
      region TEXT CHECK(region IN ('ARCTIC','ANTARCTIC','SOUTHERN_OCEAN','HIMALAYA')),
      latitude REAL,
      longitude REAL,
      description TEXT,
      description_hi TEXT,
      established_year INTEGER,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expeditions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_hi TEXT,
      slug TEXT UNIQUE NOT NULL,
      summary TEXT,
      summary_hi TEXT,
      description TEXT,
      description_hi TEXT,
      region TEXT CHECK(region IN ('ARCTIC','ANTARCTIC','SOUTHERN_OCEAN','HIMALAYA')),
      station_id TEXT REFERENCES stations(id),
      start_date TEXT,
      end_date TEXT,
      year INTEGER,
      status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
      expedition_status TEXT DEFAULT 'PLANNED' CHECK(expedition_status IN ('PLANNED','ONGOING','COMPLETED')),
      objectives TEXT,
      objectives_hi TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expedition_members (
      id TEXT PRIMARY KEY,
      expedition_id TEXT NOT NULL REFERENCES expeditions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT,
      institution TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_hi TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      description_hi TEXT,
      discipline TEXT,
      parameters TEXT,
      spatial_coverage TEXT,
      temporal_coverage_start TEXT,
      temporal_coverage_end TEXT,
      format TEXT,
      file_size INTEGER,
      file_path TEXT,
      licence TEXT,
      doi TEXT,
      citation TEXT,
      version TEXT DEFAULT '1.0',
      access_level TEXT DEFAULT 'PUBLIC' CHECK(access_level IN ('PUBLIC','REGISTERED','RESTRICTED')),
      embargo_date TEXT,
      contact_name TEXT,
      contact_email TEXT,
      status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
      expedition_id TEXT REFERENCES expeditions(id),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS publications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_hi TEXT,
      slug TEXT UNIQUE NOT NULL,
      abstract TEXT,
      abstract_hi TEXT,
      pub_type TEXT CHECK(pub_type IN ('PAPER','TECHNICAL_REPORT','ANNUAL_REPORT','NEWSLETTER','BOOK')),
      authors TEXT,
      journal TEXT,
      year INTEGER,
      volume TEXT,
      issue TEXT,
      pages TEXT,
      doi TEXT,
      keywords TEXT,
      pdf_path TEXT,
      status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
      expedition_id TEXT REFERENCES expeditions(id),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_hi TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      description_hi TEXT,
      media_type TEXT CHECK(media_type IN ('PHOTO','VIDEO')),
      file_path TEXT,
      thumbnail_path TEXT,
      original_filename TEXT,
      mime_type TEXT,
      file_size INTEGER,
      width INTEGER,
      height INTEGER,
      duration INTEGER,
      credit TEXT,
      location TEXT,
      taken_date TEXT,
      licence TEXT,
      resolution TEXT,
      album_id TEXT REFERENCES albums(id),
      expedition_id TEXT REFERENCES expeditions(id),
      status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hi TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      description_hi TEXT,
      cover_image_id TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      name_hi TEXT,
      category TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS media_tags (
      media_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (media_id, tag_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS news_articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_hi TEXT,
      slug TEXT UNIQUE NOT NULL,
      summary TEXT,
      summary_hi TEXT,
      body TEXT,
      body_hi TEXT,
      cover_image_id TEXT REFERENCES media_items(id),
      publish_date TEXT,
      status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_hi TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      description_hi TEXT,
      location TEXT,
      start_date TEXT,
      end_date TEXT,
      event_type TEXT,
      status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS education_resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_hi TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      description_hi TEXT,
      resource_type TEXT CHECK(resource_type IN ('TEACHING_KIT','WORKSHOP','LECTURE','QUIZ','PROGRAMME')),
      file_path TEXT,
      target_audience TEXT,
      status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS glossary_terms (
      id TEXT PRIMARY KEY,
      term TEXT UNIQUE NOT NULL,
      term_hi TEXT,
      definition TEXT NOT NULL,
      definition_hi TEXT,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS question_submissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      question TEXT NOT NULL,
      response TEXT,
      is_published INTEGER DEFAULT 0,
      moderated_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS generated_content (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      content TEXT NOT NULL,
      fact_annotations TEXT,
      status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','APPROVED','REJECTED')),
      approved_by TEXT REFERENCES users(id),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id TEXT PRIMARY KEY,
      generated_content_id TEXT REFERENCES generated_content(id),
      platform TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      published INTEGER DEFAULT 0,
      published_at TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      old_values TEXT,
      new_values TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dataset_download_log (
      id TEXT PRIMARY KEY,
      dataset_id TEXT REFERENCES datasets(id),
      user_id TEXT,
      ip_address TEXT,
      accepted_terms INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      from_user_id TEXT REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Indexes for search and filtering
  db.run('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)');
  db.run('CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)');

  db.run('CREATE INDEX IF NOT EXISTS idx_expeditions_region ON expeditions(region)');
  db.run('CREATE INDEX IF NOT EXISTS idx_expeditions_year ON expeditions(year)');
  db.run('CREATE INDEX IF NOT EXISTS idx_expeditions_status ON expeditions(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_datasets_discipline ON datasets(discipline)');
  db.run('CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_publications_year ON publications(year)');
  db.run('CREATE INDEX IF NOT EXISTS idx_publications_type ON publications(pub_type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_media_type ON media_items(media_type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_media_status ON media_items(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_news_status ON news_articles(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_changes(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_pending_submitted_by ON pending_changes(submitted_by)');

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dbPath = path.resolve(config.DATABASE_PATH);
  fs.writeFileSync(dbPath, buffer);
}

// Auto-save every 30 seconds
setInterval(saveDb, 30000);

// Save on process exit
process.on('exit', saveDb);
process.on('SIGINT', () => { saveDb(); process.exit(); });
process.on('SIGTERM', () => { saveDb(); process.exit(); });

module.exports = { getDb, saveDb };
