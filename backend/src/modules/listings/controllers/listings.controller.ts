import { Request, Response } from 'express';
import { ListingModel } from '../models/Listing.js';
import type {
    ListingCard,
    ListingCardSmall,
    ListingKind,
    ListingRow,
    ListingSearchQuery,
    ListingSort,
    RankingMode,
} from '../types/listing.js';
import { mapListingCard, mapListingCardSmall, mapListingDetails, mapTrendingCard } from '../utils/listingMapper.js';
import {
    createPaginatedResponse,
    decodeCursor,
    getNextCursor,
    HOME_PAGE_SIZE,
    LISTINGS_PAGE_SIZE,
    parseLimit,
    parseListingSort,
    parseSearchQuery,
    parseSortDirection,
    TRENDING_LIMIT,
    trimPaginationRows,
} from '../utils/pagination.js';

function mapRows(rows: ListingRow[]): ListingCard[] {
    return rows.map(mapListingCard);
}

function mapSmallRows (rows: ListingRow[]): ListingCardSmall[] {
    return rows.map(mapListingCardSmall);
}

async function getCursorPage(req: Request<{}, {}, {}, ListingSearchQuery>, kind?: ListingKind, fallbackLimit = LISTINGS_PAGE_SIZE) {
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

async function getRatingPage(req: Request<{}, {}, {}, ListingSearchQuery>, kind: ListingKind) {
    const limit = parseLimit(req.query.limit, HOME_PAGE_SIZE);
    const sort: ListingSort = 'rating';
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

async function getTrending(kind: ListingKind, mode: RankingMode = 'trending') {
    const rows = await ListingModel.findRankedByKind(kind, 5, mode);

    return rows.map(mapTrendingCard)
        // .sort((a, b) => (b.rankScore ?? 0) - (a.rankScore ?? 0))
        .slice(0, TRENDING_LIMIT);
}

export const getListings = async (req: Request<{}, {}, {}, ListingSearchQuery>, res: Response) => {
    try {
        const response = await getCursorPage(req);
        res.status(200).json(response);
    } catch (error: any) {
        console.error('Get listings error:', error);
        res.status(500).json({ message: 'Failed to fetch listings' });
    }
};

export const getListingDetails = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const listing = await ListingModel.findById(req.params.id);

        if (!listing) {
            res.status(404).json({ message: 'Listing not found' });
            return;
        }

        res.status(200).json(mapListingDetails(listing));
    } catch (error: any) {
        console.error('Get listing details error:', error);
        res.status(500).json({ message: 'Failed to fetch listing details' });
    }
};

export const getPopularHalls = async (req: Request<{}, {}, {}, ListingSearchQuery>, res: Response) => {
    try {
        const response = await getRatingPage(req, 'hall');
        res.status(200).json(response);
    } catch (error: any) {
        console.error('Get popular halls error:', error);
        res.status(500).json({ message: 'Failed to fetch popular halls' });
    }
};

export const getCuratedServices = async (req: Request<{}, {}, {}, ListingSearchQuery>, res: Response) => {
    try {
        const response = await getRatingPage(req, 'service');
        res.status(200).json(response);
    } catch (error: any) {
        console.error('Get curated services error:', error);
        res.status(500).json({ message: 'Failed to fetch curated services' });
    }
};

export const getTrendingHalls = async (_req: Request, res: Response) => {
    try {
        const listings = await getTrending('hall');
        res.status(200).json({ data: listings });
    } catch (error: any) {
        console.error('Get trending halls error:', error);
        res.status(500).json({ message: 'Failed to fetch trending halls' });
    }
};

export const getTrendingServices = async (_req: Request, res: Response) => {
    try {
        const listings = await getTrending('service');
        res.status(200).json({ data: listings });
    } catch (error: any) {
        console.error('Get trending services error:', error);
        res.status(500).json({ message: 'Failed to fetch trending services' });
    }
};

export const getSimilarListings = async (req: Request, res: Response) => {
    try {
        // Default to 3 items. The frontend can pass ?limit=6 if it wants more
        const query = req.query as any;
        const limit = parseLimit(req.query.limit, 3); 
        

        const rows = await ListingModel.findPage({
            filters: {
                // If kind is provided (e.g., 'hall'), filter by it. Otherwise get both.
                kind: query.kind as ListingKind | undefined,
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
    } catch (error: any) {
        console.error('Get similar listings error:', error);
        res.status(500).json({ message: 'Failed to fetch similar listings' });
    }
};

