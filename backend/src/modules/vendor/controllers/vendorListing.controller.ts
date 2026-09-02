// src/modules/listings/controllers/vendorListing.controller.ts
import { Request, Response } from 'express';
import { VendorListingModel } from '../models/VendorListing.js';
import { VendorModel } from '../../payments/models/VendorModel.js';
import { listingSubmitSchema } from '../schema/listingSchema.js'; // Assume Zod schema is shared/isomorphic

const LISTING_STATUS_DISPLAY_MAP: Record<string, 'active' | 'draft' | 'in_review' | 'rejected' | 'offline'> = {
  published: 'active',
  draft: 'draft',
  pending_review: 'in_review',
  suspended: 'offline',
  rejected: 'rejected',
  archived: 'offline',
};

export const getMyListings = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const rows = await VendorListingModel.getListingsByVendor(req.user.userId);

    const formatted = rows.map((l: any) => ({
      id: l.id,
      title: l.title,
      location: l.location || 'Location not set',
      status: LISTING_STATUS_DISPLAY_MAP[l.status] ?? 'offline',
      canEdit: l.status === 'draft' || l.status === 'rejected',
      pricePerUnit: Number(l.base_price_kobo) / 100, // kobo → naira for the UI
      unit: (l.price_unit || 'per event').replace(/^per\s+/i, ''),
      thumbnailUrl: l.thumbnail_url || '/placeholder-listing.jpg',
      viewsLast30Days: parseInt(l.views_last_30_days, 10) || 0,
      bookingsLast30Days: parseInt(l.bookings_last_30_days, 10) || 0,
    }));

    res.status(200).json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
};

export const getListingDraft = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch the draft by ID and user ID
    const listing = await VendorListingModel.getDraftById(req.params.id, req.user.userId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // Only true drafts (and rejected listings) can be reopened in the wizard
    if (listing.status !== 'draft' && listing.status !== 'rejected') {
      return res.status(409).json({ message: `This listing can't be edited (status: ${listing.status}).` });
    }

    res.status(200).json({
      id: listing.id,
      kind: listing.kind,
      status: listing.status,
      draftPayload: listing.draft_payload ?? null,
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

export const autosaveDraft = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    await VendorListingModel.updateDraft(req.params.id, req.user.userId, req.body);
    res.status(200).json({ status: 'saved' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to save draft' });
  }
};

export const publishListing = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    // Server-side validation using the shared Zod schema
    const vendor = await VendorModel.findByUserId(req.user.userId);
    if (!vendor || vendor.verification_status !== 'verified') {
      return res.status(403).json({
        code: 'VERIFICATION_REQUIRED',
        status: vendor?.verification_status ?? 'unregistered',
        message: 'Your bank account must be verified before you can publish. Save this listing as a draft and publish later.',
      });
    }

    const parsed = listingSubmitSchema.safeParse(req.body.draft_payload);
    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    await VendorListingModel.publishDraft(req.params.id, req.user.userId, parsed.data);
    res.status(200).json({ status: 'pending_review' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to publish listing' });
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

