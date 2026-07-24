import { ChatModel } from '../models/Chat.js';
import cloudinary from '../../../lib/cloudinary.js';
import { ENV } from '../../../lib/env.js';
import { getDB } from '../../../lib/db.js';
export const getConversations = async (req, res) => {
    try {
        if (!req.user?.userId)
            return res.status(401).json({ message: 'Unauthorized' });
        await ChatModel.findOrCreateSupportConversation(req.user.userId);
        const conversations = await ChatModel.getUserConversations(req.user.userId);
        res.status(200).json(conversations);
    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: 'Failed to fetch conversations' });
    }
};
export const getMessages = async (req, res) => {
    try {
        if (!req.user?.userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { id: conversationId } = req.params;
        const { cursor, direction = 'before', limit = '50' } = req.query;
        // Security: Validate user is in this conversation
        const isParticipant = await ChatModel.isParticipant(conversationId, req.user.userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'Forbidden: You are not in this conversation.' });
        }
        const messages = await ChatModel.getMessages(conversationId, cursor, direction, parseInt(limit, 10));
        res.status(200).json(messages);
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};
export const getMessageById = async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id: conversationId, messageId } = req.params;
        const isParticipant = await ChatModel.isParticipant(conversationId, req.user.userId);
        if (!isParticipant) {
            return res.status(403).json({ message: "Forbidden: You are not in this conversation." });
        }
        const message = await ChatModel.getMessageById(conversationId, Number(messageId));
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        res.status(200).json(message);
    }
    catch (error) {
        console.error("Get message by id error:", error);
        res.status(500).json({ message: "Failed to fetch message" });
    }
};
export const generateUploadSignature = async (req, res) => {
    try {
        if (!req.user?.userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!ENV.CLOUDINARY_API_SECRET) {
            return res.status(500).json({ message: 'Cloudinary is not configured' });
        }
        // 1. Generate a Unix timestamp
        const timestamp = Math.round(new Date().getTime() / 1000);
        // 2. Define the folder path to keep user uploads organized
        const folder = `eventvnv_chat_attachments/${req.user.userId}`;
        // 3. Create the parameters to sign
        const paramsToSign = {
            timestamp,
            folder,
        };
        // 4. Generate the cryptographic signature using your Cloudinary API Secret
        const signature = cloudinary.utils.api_sign_request(paramsToSign, ENV.CLOUDINARY_API_SECRET);
        // 5. Send the necessary data to the frontend
        res.status(200).json({
            signature,
            timestamp,
            folder,
            apiKey: ENV.CLOUDINARY_API_KEY,
            cloudName: ENV.CLOUDINARY_CLOUD_NAME,
        });
    }
    catch (error) {
        console.error('Generate signature error:', error);
        res.status(500).json({ message: 'Failed to generate upload signature' });
    }
};
export const createConversation = async (req, res) => {
    try {
        if (!req.user?.userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { listingId } = req.body;
        if (!listingId)
            return res.status(400).json({ message: 'Listing ID is required' });
        // Fetch listing to get the vendor_id
        const db = getDB();
        const listingRes = await db.query('SELECT vendor_id FROM listings WHERE id = $1 AND status = \'published\'', [listingId]);
        if (listingRes.rows.length === 0)
            return res.status(404).json({ message: 'Listing not found' });
        const vendorId = listingRes.rows[0].vendor_id;
        if (vendorId === req.user.userId)
            return res.status(400).json({ message: 'Cannot chat with yourself' });
        // Find or create conversation
        const conversationId = await ChatModel.findOrCreateDirectConversation(req.user.userId, vendorId, 'listing', listingId);
        res.status(200).json({ id: conversationId });
    }
    catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({ message: 'Failed to create conversation' });
    }
};
//# sourceMappingURL=chat.controller.js.map