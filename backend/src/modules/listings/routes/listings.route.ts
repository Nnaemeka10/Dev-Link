import express from "express";

import { arcjetProtection } from "../../../middleware/arcject.middleware.js";
import {
    addSavedListing,
    getCuratedServices,
    getListingDetails,
    getListings,
    getPopularHalls,
    getSavedListings,
    getSimilarListings,
    getTrendingHalls,
    getTrendingServices,
    removeSavedListing,
} from "../controllers/listings.controller.js";
import { authenticateUser } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.use(arcjetProtection);

router.get("/popular-halls", getPopularHalls);
router.get("/curated-services", getCuratedServices);
router.get("/trending-halls", getTrendingHalls);
router.get("/trending-services", getTrendingServices);
router.get("/", getListings);
router.get("/similar", getSimilarListings);

//protected routes
router.get("/saved", authenticateUser, getSavedListings);
router.post("/saved/:id", authenticateUser, addSavedListing);
router.delete("/saved/:id", authenticateUser, removeSavedListing);

//parameterized routes
router.get("/:id", getListingDetails);





export default router;
