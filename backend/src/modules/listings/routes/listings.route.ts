import express from "express";

import { arcjetProtection } from "../../../middleware/arcject.middleware.js";
import {
    getCuratedServices,
    getListingDetails,
    getListings,
    getPopularHalls,
    getTrendingHalls,
    getTrendingServices,
} from "../controllers/listings.controller.js";

const router = express.Router();

router.use(arcjetProtection);

router.get("/popular-halls", getPopularHalls);
router.get("/curated-services", getCuratedServices);
router.get("/trending-halls", getTrendingHalls);
router.get("/trending-services", getTrendingServices);
router.get("/", getListings);
router.get("/:id", getListingDetails);

export default router;
