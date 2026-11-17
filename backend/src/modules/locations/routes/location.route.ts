import express from 'express';
import { arcjetProtection } from '../../../middleware/arcject.middleware.js';
import { suggestLocations, getStates, getStateLgas } from '../controllers/location.controller.js';

const router = express.Router();

router.use(arcjetProtection);

router.get('/suggest', suggestLocations);
router.get('/states', getStates);
router.get('/states/:stateId/lgas', getStateLgas);

export default router;