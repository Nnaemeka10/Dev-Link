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

function mapSmallRows(rows: ListingRow[]): ListingCardSmall[] {
  return rows.map(mapListingCardSmall);
}

async function getCursorPage(
  req: Request<{}, {}, {}, ListingSearchQuery>,
  kind?: ListingKind,
  fallbackLimit = LISTINGS_PAGE_SIZE,
) {
  const sort = parseListingSort(req.query.sort);
  const limit = parseLimit(req.query.limit, fallbackLimit);
  const filters = parseSearchQuery(req.query);

  const rows = await ListingModel.findPage({
    filters: { ...filters, kind: kind ?? filters.kind },
    limit,
    // Sort-aware decode: a cursor from a different ordering is rejected to
    // null - clean restart at page one, never a 500 and never rows skipped
    // under the wrong keyset predicate.
    cursor: decodeCursor(req.query.cursor, sort),
    sort,
    sortDirection: parseSortDirection(req.query.sortOrder),
  });

  const nextCursor = getNextCursor(rows, limit, sort);
  return createPaginatedResponse(mapSmallRows(trimPaginationRows(rows, limit)), nextCursor, limit);
}

async function getRatingPage(req: Request<{}, {}, {}, ListingSearchQuery>, kind: ListingKind) {
  const limit = parseLimit(req.query.limit, HOME_PAGE_SIZE);
  const sort: ListingSort = 'rating';
  const rows = await ListingModel.findPage({
    filters: { kind },
    limit,
    cursor: decodeCursor(req.query.cursor, sort),
    sort,
    sortDirection: 'desc',
  });
  const nextCursor = getNextCursor(rows, limit, sort);
  return createPaginatedResponse(mapSmallRows(trimPaginationRows(rows, limit)), nextCursor, limit);
}

async function getTrending(kind: ListingKind, mode: RankingMode = 'trending') {
  const rows = await ListingModel.findRankedByKind(kind, 5, mode);
  return rows.map(mapTrendingCard).slice(0, TRENDING_LIMIT);
}

export const getListings = async (req: Request<{}, {}, {}, ListingSearchQuery>, res: Response) => {
  try {
    res.status(200).json(await getCursorPage(req));
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
    res.status(200).json(await getRatingPage(req, 'hall'));
  } catch (error: any) {
    console.error('Get popular halls error:', error);
    res.status(500).json({ message: 'Failed to fetch popular halls' });
  }
};

export const getCuratedServices = async (req: Request<{}, {}, {}, ListingSearchQuery>, res: Response) => {
  try {
    res.status(200).json(await getRatingPage(req, 'service'));
  } catch (error: any) {
    console.error('Get curated services error:', error);
    res.status(500).json({ message: 'Failed to fetch curated services' });
  }
};

export const getTrendingHalls = async (_req: Request, res: Response) => {
  try {
    res.status(200).json({ data: await getTrending('hall') });
  } catch (error: any) {
    console.error('Get trending halls error:', error);
    res.status(500).json({ message: 'Failed to fetch trending halls' });
  }
};

export const getTrendingServices = async (_req: Request, res: Response) => {
  try {
    res.status(200).json({ data: await getTrending('service') });
  } catch (error: any) {
    console.error('Get trending services error:', error);
    res.status(500).json({ message: 'Failed to fetch trending services' });
  }
};

export const getSimilarListings = async (req: Request, res: Response) => {
  try {
    const query = req.query as any;
    const limit = parseLimit(req.query.limit, 3);
    const rows = await ListingModel.findPage({
      filters: {
        kind: query.kind as ListingKind | undefined,
        location: query.city || undefined,
        excludeId: query.id,
      },
      limit,
      cursor: null,
      sort: 'rating',
      sortDirection: 'desc',
    });
    res.status(200).json(mapSmallRows(trimPaginationRows(rows, limit)));
  } catch (error: any) {
    console.error('Get similar listings error:', error);
    res.status(500).json({ message: 'Failed to fetch similar listings' });
  }
};

export const getSavedListings = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const rows = await ListingModel.findSavedByUserId(req.user.userId);
    res.status(200).json(rows.map(mapListingCard));
  } catch (error: any) {
    console.error('Get saved listings error:', error);
    res.status(500).json({ message: 'Failed to fetch saved listings' });
  }
};

export const addSavedListing = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Add saved listing error:', error);
    res.status(500).json({ message: 'Failed to save listing' });
  }
};

export const removeSavedListing = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Remove saved listing error:', error);
    res.status(500).json({ message: 'Failed to remove saved listing' });
  }
};

export const getListingAvailability = async (req: Request<{ id: string }>, res: Response) => {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(req.params.id)) {
    res.status(400).json({ message: 'Invalid listing id' });
    return;
  }
  try {
    const dates = await ListingModel.findUnavailableDates(req.params.id);
    res.status(200).json({ unavailableDates: dates });
  } catch (error: any) {
    console.error('Get listing availability error:', error);
    res.status(500).json({ message: 'Failed to fetch availability' });
  }
};