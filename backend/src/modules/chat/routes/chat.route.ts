import express from 'express';
import { arcjetProtection } from "../../../middleware/arcject.middleware.js";
import { authenticateUser } from '../../../middleware/auth.middleware.js';
import { getConversations, getMessages, generateUploadSignature, createConversation } from '../controllers/chat.controller.js';


const router = express.Router();

router.use(arcjetProtection);
router.use(authenticateUser);

router.get('/conversations', getConversations);
router.get('/conversations/:id/messages', getMessages);
router.post('/upload-signature', generateUploadSignature);
router.post('/conversations', createConversation);

export default router;