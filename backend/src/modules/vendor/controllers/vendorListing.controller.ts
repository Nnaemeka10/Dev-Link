import { Request, Response } from 'express';
import { VendorListingModel } from '../models/VendorListing.js';
import { VendorModel } from '../../payments/models/VendorModel.js';
import { listingSubmitSchema } from '../schema/listingSchema.js';

/**
 * Display status for My Listings. `archived` is the vendor's own "Unlisted"
 * state (they took it down, they can relist it); `suspended` is ours, and
 * stays a distinct "Offline" so the two are never confused.
 */
const LISTING_STATUS_DISPLAY_MAP: Record<
  string,
  'active' | 'draft' | 'in_review' | 'rejected' | 'unlisted' | 'offline'
> = {
  published: 'active',
  draft: 'draft',
  pending_review: 'in_review',
  suspended: 'offline',
  rejected: 'rejected',
  archived: 'unlisted',
};

const EDITABLE_STATUSES = ['draft', 'rejected', 'published', 'pending_review', 'archived'];
const LIVE_STATUSES = ['published', 'pending_review'];

export const getMyListings = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const rows = await VendorListingModel.getListingsByVendor(req.user.userId);

    const formatted = rows.map((l: any) => {
      const upcomingBookings = parseInt(l.upcoming_bookings, 10) || 0;
      const isLive = LIVE_STATUSES.includes(l.status);
      const isUnlisted = l.status === 'archived';

      return {
        id: l.id,
        title: l.title,
        location: l.location || 'Location not set',
        status: LISTING_STATUS_DISPLAY_MAP[l.status] ?? 'offline',
        canEdit: EDITABLE_STATUSES.includes(l.status),
        /** Deletion is refused while events are still owed - Unlist instead. */
        canDelete: upcomingBookings === 0,
        canUnlist: isLive,
        canRelist: isUnlisted,
        hasPendingEdits: l.pending_review_at != null,
        hasDraft: l.has_draft === true,
        upcomingBookings,
        pricePerUnit: Number(l.base_price_kobo) / 100, // kobo → naira for the UI
        unit: (l.price_unit || 'per event').replace(/^per\s+/i, ''),
        thumbnailUrl: l.thumbnail_url || '/placeholder-listing.jpg',
        viewsLast30Days: parseInt(l.views_last_30_days, 10) || 0,
        bookingsLast30Days: parseInt(l.bookings_last_30_days, 10) || 0,
      };
    });

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(formatted);
  } catch (error: any) {
    console.error('Get my listings error:', error);
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
};

export const getListingDraft = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const listing = await VendorListingModel.getDraftById(req.params.id, req.user.userId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (!EDITABLE_STATUSES.includes(listing.status)) {
      return res.status(409).json({
        message: `This listing can't be edited (status: ${listing.status}).`,
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      id: listing.id,
      kind: listing.kind,
      status: listing.status,
      draftPayload: listing.draft_payload ?? null,
      hasPendingEdits: listing.pending_review_at != null,
    });
  } catch (error: any) {
    console.error('Get draft error:', error);
    res.status(500).json({ message: 'Failed to fetch draft' });
  }
};

export const createListingDraft = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { kind } = req.body;
    if (kind !== 'hall' && kind !== 'service') {
      return res.status(400).json({ message: 'kind must be "hall" or "service"' });
    }

    const draft = await VendorListingModel.createDraft(req.user.userId, kind);
    res.status(201).json(draft);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create draft' });
  }
};

/**
 * DELETE /api/vendor/listings/:id
 * Soft delete. Refused with 409 + ACTIVE_BOOKINGS while the listing still has
 * upcoming paid/confirmed events - the client then offers Unlist instead.
 */
export const deleteListingDraft = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    await VendorListingModel.deleteListing(req.params.id, req.user.userId);
    res.status(200).json({ status: 'deleted' });
  } catch (error: any) {
    const message = String(error?.message ?? '');
    if (message === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Listing not found or already deleted.' });
    }
    if (message === 'ACTIVE_BOOKINGS') {
      return res.status(409).json({
        code: 'ACTIVE_BOOKINGS',
        message:
          'This listing still has upcoming bookings. Unlist it instead - it disappears from search, your existing bookings are honoured, and you can relist it any time.',
      });
    }
    console.error('Delete listing error:', error);
    res.status(500).json({ message: 'Failed to delete listing' });
  }
};

/** PATCH /api/vendor/listings/:id/unlist - hide from search, keep bookings. */
export const unlistListing = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const unlisted = await VendorListingModel.unlistListing(req.params.id, req.user.userId);
    if (!unlisted) {
      return res.status(409).json({ message: 'Only a live listing can be unlisted.' });
    }
    res.status(200).json({
      status: 'unlisted',
      message: 'Listing unlisted. Existing bookings are unaffected.',
    });
  } catch (error: any) {
    console.error('Unlist listing error:', error);
    res.status(500).json({ message: 'Failed to unlist listing' });
  }
};

/** PATCH /api/vendor/listings/:id/relist - bring an unlisted listing back. */
export const relistListing = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const vendor = await VendorModel.findByUserId(req.user.userId);
    if (!vendor || vendor.verification_status !== 'verified') {
      return res.status(403).json({
        code: 'VERIFICATION_REQUIRED',
        status: vendor?.verification_status ?? 'unregistered',
        message: 'Your bank account must be verified before this listing can go live again.',
      });
    }

    const { status, staged } = await VendorListingModel.relistListing(req.params.id, req.user.userId);
    res.status(200).json({ status, staged });
  } catch (error: any) {
    const message = String(error?.message ?? '');
    if (message === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    if (message === 'NOT_ARCHIVED') {
      return res.status(409).json({ message: 'Only an unlisted listing can be relisted.' });
    }
    console.error('Relist listing error:', error);
    res.status(500).json({ message: 'Failed to relist listing' });
  }
};

export const autosaveDraft = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    await VendorListingModel.updateDraft(req.params.id, req.user.userId, req.body);
    res.status(200).json({ status: 'saved' });
  } catch (error: any) {
    if (error?.message === 'NOT_EDITABLE') {
      return res.status(409).json({ message: "This listing can't be edited in its current state." });
    }
    console.error('Autosave error:', error);
    res.status(500).json({ message: 'Failed to save draft' });
  }
};

export const publishListing = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const vendor = await VendorModel.findByUserId(req.user.userId);
    if (!vendor || vendor.verification_status !== 'verified') {
      return res.status(403).json({
        code: 'VERIFICATION_REQUIRED',
        status: vendor?.verification_status ?? 'unregistered',
        message:
          'Your bank account must be verified before you can publish. Save this listing as a draft and publish later.',
      });
    }

    const parsed = listingSubmitSchema.safeParse(req.body.draft_payload);
    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    const { status, staged } = await VendorListingModel.publishDraft(
      req.params.id,
      req.user.userId,
      parsed.data
    );

    res.status(200).json({
      status,
      staged,
      message: staged
        ? 'Changes submitted for review. Your current listing stays live until they are approved.'
        : 'Listing published.',
    });
  } catch (error: any) {
    if (error.message === 'NOT_EDITABLE') {
      return res.status(409).json({ message: "This listing can't be published in its current state." });
    }
    console.error('Publish listing error:', error);
    res.status(500).json({ message: 'Failed to publish listing' });
  }
};

export const signUpload = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    const { listingId } = req.body;
    const signatureData = await VendorListingModel.signCloudinaryUpload(listingId, req.user.userId);
    res.status(200).json(signatureData);
  } catch (error: any) {
    if (error.message.includes('Forbidden')) return res.status(403).json({ message: error.message });
    res.status(500).json({ message: 'Failed to sign upload' });
  }
};