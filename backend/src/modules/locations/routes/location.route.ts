import express from 'express';
import { arcjetProtection } from '../../../middleware/arcject.middleware.js';
import { suggestLocations } from '../controllers/location.controller.js';

const router = express.Router();

router.use(arcjetProtection);

router.get('/suggest', suggestLocations);

export default router;