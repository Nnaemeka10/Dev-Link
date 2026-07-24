import { ListingModel } from '../models/Listing.js';
import { mapListingCard, mapListingCardSmall, mapListingDetails, mapTrendingCard } from '../utils/listingMapper.js';
import { createPaginatedResponse, decodeCursor, getNextCursor, HOME_PAGE_SIZE, LISTINGS_PAGE_SIZE, parseLimit, parseListingSort, parseSearchQuery, parseSortDirection, TRENDING_LIMIT, trimPaginationRows, } from '../utils/pagination.js';
function mapRows(rows) {
    return rows.map(mapListingCard);
}
function mapSmallRows(rows) {
    return rows.map(mapListingCardSmall);
}
async function getCursorPage(req, kind, fallbackLimit = LISTINGS_PAGE_SIZE) {
    const sort = parseListingSort(req.query.sort);
    const limit = parseLimit(req.query.limit, fallbackLimit);
    const filters = parseSearchQuery(req.query);
    const rows = await ListingModel.findPage({
        filters: {
            ...filters,
            kind: kind ?? filters.kind,
        },
        limit,
        cursor: decodeCursor(req.query.cursor),
        sort,
        sortDirection: parseSortDirection(req.query.sortOrder),
    });
    const nextCursor = getNextCursor(rows, limit, sort);
    const visibleRows = trimPaginationRows(rows, limit);
    return createPaginatedResponse(mapSmallRows(visibleRows), nextCursor, limit);
}
async function getRatingPage(req, kind) {
    const limit = parseLimit(req.query.limit, HOME_PAGE_SIZE);
    const sort = 'rating';
    const rows = await ListingModel.findPage({
        filters: { kind },
        limit,
        cursor: decodeCursor(req.query.cursor),
        sort,
        sortDirection: 'desc',
    });
    const nextCursor = getNextCursor(rows, limit, sort);
    const visibleRows = trimPaginationRows(rows, limit);
    return createPaginatedResponse(mapSmallRows(visibleRows), nextCursor, limit);
}
async function getTrending(kind, mode = 'trending') {
    const rows = await ListingModel.findRankedByKind(kind, 5, mode);
    return rows.map(mapTrendingCard)
        // .sort((a, b) => (b.rankScore ?? 0) - (a.rankScore ?? 0))
        .slice(0, TRENDING_LIMIT);
}
export const getListings = async (req, res) => {
    try {
        const response = await getCursorPage(req);
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Get listings error:', error);
        res.status(500).json({ message: 'Failed to fetch listings' });
    }
};
export const getListingDetails = async (req, res) => {
    try {
        const listing = await ListingModel.findById(req.params.id);
        if (!listing) {
            res.status(404).json({ message: 'Listing not found' });
            return;
        }
        res.status(200).json(mapListingDetails(listing));
    }
    catch (error) {
        console.error('Get listing details error:', error);
        res.status(500).json({ message: 'Failed to fetch listing details' });
    }
};
export const getPopularHalls = async (req, res) => {
    try {
        const response = await getRatingPage(req, 'hall');
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Get popular halls error:', error);
        res.status(500).json({ message: 'Failed to fetch popular halls' });
    }
};
export const getCuratedServices = async (req, res) => {
    try {
        const response = await getRatingPage(req, 'service');
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Get curated services error:', error);
        res.status(500).json({ message: 'Failed to fetch curated services' });
    }
};
export const getTrendingHalls = async (_req, res) => {
    try {
        const listings = await getTrending('hall');
        res.status(200).json({ data: listings });
    }
    catch (error) {
        console.error('Get trending halls error:', error);
        res.status(500).json({ message: 'Failed to fetch trending halls' });
    }
};
export const getTrendingServices = async (_req, res) => {
    try {
        const listings = await getTrending('service');
        res.status(200).json({ data: listings });
    }
    catch (error) {
        console.error('Get trending services error:', error);
        res.status(500).json({ message: 'Failed to fetch trending services' });
    }
};
export const getSimilarListings = async (req, res) => {
    try {
        // Default to 3 items. The frontend can pass ?limit=6 if it wants more
        const query = req.query;
        const limit = parseLimit(req.query.limit, 3);
        const rows = await ListingModel.findPage({
            filters: {
                // If kind is provided (e.g., 'hall'), filter by it. Otherwise get both.
                kind: query.kind,
                // Using the existing ILIKE location filter. Passing "Lagos" will match "Victoria Island, Lagos"
                location: query.city || undefined,
                // Critical: Exclude the listing the user is currently looking at
                excludeId: query.id,
            },
            limit,
            cursor: null,
            sort: 'rating',
            sortDirection: 'desc',
        });
        // We reuse trimPaginationRows just in case they ask for more later
        const visibleRows = trimPaginationRows(rows, limit);
        // We reuse mapSmallRows because Similar Venues don't need rankScore or heavy data
        res.status(200).json(mapSmallRows(visibleRows));
    }
    catch (error) {
        console.error('Get similar listings error:', error);
        res.status(500).json({ message: 'Failed to fetch similar listings' });
    }
};
export const getSavedListings = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const rows = await ListingModel.findSavedByUserId(req.user.userId);
        // Reuse your existing mapper to get full ListingCard objects
        const savedListings = rows.map(mapListingCard);
        res.status(200).json(savedListings);
    }
    catch (error) {
        console.error('Get saved listings error:', error);
        res.status(500).json({ message: 'Failed to fetch saved listings' });
    }
};
export const addSavedListing = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const listingId = req.params.id;
        if (!listingId) {
            res.status(400).json({ message: 'Listing ID is required' });
            return;
        }
        await ListingModel.saveListing(req.user.userId, listingId);
        res.status(201).json({ message: 'Listing saved successfully' });
    }
    catch (error) {
        console.error('Add saved listing error:', error);
        res.status(500).json({ message: 'Failed to save listing' });
    }
};
export const removeSavedListing = async (req, res) => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const listingId = req.params.id;
        if (!listingId) {
            res.status(400).json({ message: 'Listing ID is required' });
            return;
        }
        await ListingModel.unsaveListing(req.user.userId, listingId);
        res.status(200).json({ message: 'Listing removed successfully' });
    }
    catch (error) {
        console.error('Remove saved listing error:', error);
        res.status(500).json({ message: 'Failed to remove saved listing' });
    }
};
// controllers/listings.controller.ts
export const getListingAvailability = async (req, res) => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(req.params.id)) {
        res.status(400).json({ message: 'Invalid listing id' });
        return;
    }
    try {
        const dates = await ListingModel.findUnavailableDates(req.params.id);
        res.status(200).json({ unavailableDates: dates });
    }
    catch (error) {
        console.error('Get listing availability error:', error);
        res.status(500).json({ message: 'Failed to fetch availability' });
    }
};
//# sourceMappingURL=listings.controller.js.map