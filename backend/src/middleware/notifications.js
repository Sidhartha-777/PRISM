const { v4: uuidv4 } = require('uuid');
const { getDb, saveDb } = require('../config/database');

function parseRows(r) { if(!r.length)return[]; const c=r[0].columns; return r[0].values.map(row=>{const o={};c.forEach((k,i)=>o[k]=row[i]);return o;}); }

/**
 * Create a notification for a user.
 * @param {object} opts - { userId, fromUserId, type, title, message, entityType, entityId, link }
 */
async function createNotification({ userId, fromUserId, type, title, message, entityType, entityId, link }) {
  const db = await getDb();
  const id = uuidv4();
  db.run(
    'INSERT INTO notifications (id, user_id, from_user_id, type, title, message, entity_type, entity_id, link) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, userId, fromUserId || null, type, title, message, entityType || null, entityId || null, link || null]
  );
  saveDb();
  return id;
}

/**
 * Notify all admins about a new pending submission from an editor.
 */
async function notifyAdminsOfSubmission({ fromUserId, fromUserName, entityType, action }) {
  const db = await getDb();
  const rows = db.exec("SELECT id FROM users WHERE role = 'ADMIN'");
  const admins = parseRows(rows);
  const actionLabel = action === 'CREATE' ? 'created' : 'updated';
  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      fromUserId,
      type: 'SUBMISSION',
      title: `New ${entityLabel} Submission`,
      message: `${fromUserName || 'An editor'} has ${actionLabel} a ${entityLabel} and it needs your approval.`,
      entityType,
      link: '/admin/approvals',
    });
  }
}

/**
 * Notify an editor that their submission was approved/rejected.
 */
async function notifyEditorOfReview({ editorUserId, reviewerUserId, reviewerName, entityType, status, reviewNote }) {
  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const statusLabel = status === 'APPROVED' ? 'approved' : 'rejected';
  let message = `Your ${entityLabel} submission was ${statusLabel} by ${reviewerName || 'an admin'}.`;
  if (reviewNote) message += ` Note: "${reviewNote}"`;
  await createNotification({
    userId: editorUserId,
    fromUserId: reviewerUserId,
    type: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
    title: `${entityLabel} ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
    message,
    entityType,
    link: '/admin/my-submissions',
  });
}

module.exports = { createNotification, notifyAdminsOfSubmission, notifyEditorOfReview };
