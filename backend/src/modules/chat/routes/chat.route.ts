import express from 'express';
import { arcjetProtection } from "../../../middleware/arcject.middleware.js";
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import {
  getConversations,
  getConversation,
  getUnreadSummary,
  getMessages,
  getMessageById,
  editMessage,
  deleteMessage,
  markRead,
  setArchived,
  setMuted,
  createConversation,
  generateUploadSignature,
  listSupportAgents,
  addSupportAgent,
  removeSupportAgent,
} from '../controllers/chat.controller.js';

const router = express.Router();

router.use(arcjetProtection);
router.use(authenticateUser);

// Inbox. /unread must precede /conversations/:id so it is never read as an id.
router.get('/unread', getUnreadSummary);
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversation);
router.post('/conversations/:id/read', markRead);
router.patch('/conversations/:id/archive', setArchived);
router.patch('/conversations/:id/mute', setMuted);

// Messages
router.get('/conversations/:id/messages', getMessages);
router.get('/conversations/:id/messages/:messageId', getMessageById);
router.patch('/conversations/:id/messages/:messageId', editMessage);
router.delete('/conversations/:id/messages/:messageId', deleteMessage);

// Attachments. POST is canonical; GET is kept as an alias so any cached client
// bundle calling the old method keeps working through the rollout.
router.post('/upload-signature', generateUploadSignature);
router.get('/upload-signature', generateUploadSignature);

// Support agent management (agent-gated in the controller)
router.get('/support/agents', listSupportAgents);
router.post('/support/agents', addSupportAgent);
router.delete('/support/agents/:userId', removeSupportAgent);

export default router;  