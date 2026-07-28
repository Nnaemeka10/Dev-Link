// src/modules/vendor/controllers/vendorDashboard.controller.ts
import { Request, Response } from 'express';
import { VendorDashboardModel } from '../models/VendorDashboard.js';

export const getSummary = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    const summary = await VendorDashboardModel.getFinancialSummary(req.user.userId);
    
    res.status(200).json({
      totalRevenue: parseFloat(summary.total_revenue) || 0,
      confirmedBookings: parseInt(summary.confirmed_bookings, 10) || 0,
      pendingBookings: parseInt(summary.pending_bookings, 10) || 0,
      nextPayoutDate: summary.nextPayout?.dispute_window_closes_at || null,
      nextPayoutListing: summary.nextPayout?.listing_title || null,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch financial summary' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    const transactions = await VendorDashboardModel.getTransactions(req.user.userId, 5);
    
    // Format for frontend Transaction[] type
    const formatted = transactions.map((txn: any) => ({
      id: txn.id,
      title: txn.description,
      referenceId: txn.paystack_reference || txn.id,
      date: new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: txn.amount_kobo / 100, // Convert kobo back to naira for UI
      direction: txn.direction === 'credit' ? 'credit' : 'debit',
      status: 'completed', // Ledger entries are immutable, so they represent completed facts
      icon: 'venue', // Icon mapping can be done dynamically later based on listing type
    }));

    res.status(200).json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

export const getBookings = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const filter = (req.query.filter as string) || 'all';
    const page = parseInt(req.query.page as string, 10) || 1;
    const perPage = parseInt(req.query.perPage as string, 10) || 4;

    const { bookings, totalItems } = await VendorDashboardModel.getBookings(req.user.userId, filter, page, perPage);
    
    const formatted = bookings.map((b: any) => ({
      id: b.id,
      bookingRef: b.booking_reference,
      clientName: `${b.client_first_name} ${b.client_last_name}`,
      clientAvatarUrl: b.client_avatar_url || '/placeholder-avatar.jpg',
      eventType: b.listing_type === 'hall' ? 'Venue Booking' : 'Service Booking',
      dateRange: {
        start: new Date(b.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        end: b.end_date ? new Date(b.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
      },
      time: b.start_time ? `${b.start_time.substring(0, 5)}` : 'N/A',
      listing: {
        type: b.listing_type,
        name: b.listing_name,
        label: b.listing_type === 'hall' ? 'Venue' : 'Service',
      },
      totalPrice: parseFloat(b.total_amount),
      status: b.status,
    }));

    res.status(200).json({
      bookings: formatted,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / perPage),
        totalItems,
        itemsPerPage: perPage,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

export const getMyListingsStats = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    const stats = await VendorDashboardModel.getMyListingsStats(req.user.userId);
    
    res.status(200).json({
      totalListings: parseInt(stats.total_listings, 10) || 0,
      activeListings: parseInt(stats.active_listings, 10) || 0,
      totalViews: parseInt(stats.views_last_30_days, 10) || 0,
      avgRating: parseFloat(stats.avg_rating) || 0,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch listing stats' });
  }
};