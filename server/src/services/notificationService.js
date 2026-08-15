import { Notification } from '../models/interactions.js';
import { emitToUser } from '../sockets/index.js';

/* Creates a notification and pushes it in real time. Skips self-notifications to
   avoid noise (e.g. commenting on your own blog). */
export async function notify({ recipient, type, actor, blog, message, link = '' }) {
  if (actor && String(actor) === String(recipient)) return null;
  const doc = await Notification.create({ recipient, type, actor, blog, message, link });
  emitToUser(recipient, 'notification', {
    id: doc._id,
    type,
    message,
    link,
    createdAt: doc.createdAt,
  });
  return doc;
}

export async function notifyMany(recipients, payload) {
  return Promise.all(recipients.map((r) => notify({ ...payload, recipient: r })));
}
