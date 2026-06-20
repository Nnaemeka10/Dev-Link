import express from "express";

import { arcjetProtection } from "../../../middleware/arcject.middleware.js";
import { getListings } from "../controllers/listings.controller.js";

const router = express.Router();

router.use(arcjetProtection);

router.get("/", getListings);

export default router;