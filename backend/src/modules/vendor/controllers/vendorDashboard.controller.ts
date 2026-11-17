import { Request, Response } from 'express';
import {
  VendorDashboardModel,
  DECLINE_REASONS,
  clampPerPage,
  mapExcludedDates,
  resolveFilter,
  resolveSort,
} from '../models/VendorDashboard.js';
import { BookingModel } from '../../bookings/models/Booking.js';
import { RefundModel } from '../../payments/models/RefundModel.js';
import { bookingEmailService } from '../../../emails/bookingEmails.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function int(value: unknown): number {
  const n = parseInt(String(value ?? '0'), 10);
  return Number.isFinite(n) ? n : 0;
}

function iso(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(value as string | Date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** "null null" is never a person's name. Fall back to email, then Guest. */
function personName(first: unknown, last: unknown, email?: unknown): string {
  const joined = [first, last].map((v) => String(v ?? '').trim()).filter(Boolean).join(' ');
  return joined || String(email ?? '').trim() || 'Guest';
}

/** 24-hour clock, straight from the TIME column. */
function time24(value: unknown): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value));
  if (!match) return null;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function timeLabel(start: unknown, end: unknown): string {
  const a = time24(start);
  const b = time24(end);
  if (a && b) return `${a} – ${b}`;
  return a ?? b ?? '—';
}

function hallLocation(row: any): string | null {
  return [row.address_line, row.city, row.state].filter(Boolean).join(', ') || null;
}

/** Split the stored money exactly as the ledger does. */
function moneyOf(row: any) {
  const total = num(row.total_amount);
  const subtotal = row.subtotal_amount != null ? num(row.subtotal_amount) : Math.round((total / 1.075) * 100) / 100;
  const vat = row.vat_amount != null ? num(row.vat_amount) : Math.round((total - subtotal) * 100) / 100;
  const commission = row.platform_fee != null ? num(row.platform_fee) : Math.round(subtotal * 0.1 * 100) / 100;
  const vendorNet = row.vendor_net != null ? num(row.vendor_net) : Math.round((subtotal - commission) * 100) / 100;
  return { total, subtotal, vat, commission, vendorNet };
}

function mapBookingListItem(b: any) {
  const money = moneyOf(b);
  const isService = b.listing_kind === 'service';
  return {
    id: b.id,
    bookingRef: b.booking_reference,
    status: b.status,
    kind: b.listing_kind,
    clientName: personName(b.client_first_name, b.client_last_name, b.client_email),
    clientFirstName: String(b.client_first_name ?? '').trim() || 'Guest',
    clientAvatarUrl: b.client_avatar_url ?? null,
    eventType: isService ? 'Service Booking' : 'Venue Booking',
    listing: {
      id: b.listing_id,
      type: isService ? 'service' : 'venue',
      name: b.listing_name,
      label: isService ? 'Service' : 'Venue',
    },
    // ISO days - the client formats and rebuilds split ranges from these.
    dateRange: { start: b.start_date, end: b.end_date ?? null },
    excludedDates: mapExcludedDates(b.excluded_dates),
    time: timeLabel(b.start_time, b.end_time),
    totalPrice: money.total,
    vendorNet: money.vendorNet,
    packageName: b.package_name ?? null,
    eventLocation: b.event_location ?? null,
    createdAt: iso(b.created_at),
    paidAt: iso(b.paid_at),
  };
}

function mapTransactionListItem(t: any) {
  return {
    id: t.id,
    title: t.listing_title ? `Payout · ${t.listing_title}` : 'Payout',
    referenceId: t.booking_reference ?? t.paystack_reference ?? t.id,
    date: iso(t.created_at),
    amount: num(t.amount_kobo) / 100,
    direction: t.direction === 'credit' ? 'credit' : 'debit',
    // Ledger entries are immutable facts: a vendor_payable credit only
    // exists after the transfer was confirmed.
    status: 'completed',
    icon: t.listing_kind === 'service' ? 'hosting' : 'venue',
    bookingId: t.booking_id ?? null,
    listingTitle: t.listing_title ?? null,
    clientName: t.booking_id ? personName(t.client_first_name, t.client_last_name) : null,
  };
}

//  Summary 

export const getSummary = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    const s = await VendorDashboardModel.getFinancialSummary(req.user.userId);

    const totalRevenue = num(s.total_revenue);
    const totalPaidOut = num(s.paid_out);
    const last30 = num(s.revenue_last_30);
    const prev30 = num(s.revenue_prev_30);

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      totalRevenue,
      totalPaidOut,
      inEscrow: Math.max(0, Math.round((totalRevenue - totalPaidOut) * 100) / 100),
      revenueChangePercent: prev30 > 0 ? Math.round(((last30 - prev30) / prev30) * 1000) / 10 : null,
      confirmedBookings: int(s.confirmed_bookings),
      pendingBookings: int(s.pending_bookings),
      nextPayoutDate: iso(s.nextPayout?.dispute_window_closes_at),
      nextPayoutListing: s.nextPayout?.listing_title ?? null,
      filterCounts: {
        pending: int(s.count_pending),
        upcoming: int(s.count_upcoming),
        completed: int(s.count_completed),
        cancelled: int(s.count_cancelled),
      },
    });
  } catch (error: any) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Failed to fetch financial summary' });
  }
};

//  Transactions 

/** GET /api/vendor/transactions?page=1&perPage=10 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    const perPage = clampPerPage(req.query.perPage, 10);
    const page = Math.max(1, int(req.query.page) || 1);
    const { rows, totalItems } = await VendorDashboardModel.getTransactions(
      req.user.userId,
      perPage,
      (page - 1) * perPage
    );

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      transactions: rows.map(mapTransactionListItem),
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalItems / perPage)),
        totalItems,
        itemsPerPage: perPage,
      },
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

/** GET /api/vendor/transactions/:id - deep detail for the receipt page. */
export const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!UUID_RE.test(req.params.id)) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const t = await VendorDashboardModel.getTransactionById(req.user.userId, req.params.id);
    if (!t) return res.status(404).json({ message: 'Transaction not found' });

    const money = moneyOf(t);
    const isService = t.listing_kind === 'service';

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      id: t.id,
      amount: num(t.amount_kobo) / 100,
      currency: t.currency ?? 'NGN',
      direction: t.direction === 'credit' ? 'credit' : 'debit',
      status: 'completed',
      createdAt: iso(t.created_at),
      description: t.description,
      paystackReference: t.paystack_reference ?? null,
      transactionGroup: t.transaction_group,
      idempotencyKey: t.idempotency_key,
      booking: t.booking_id
        ? {
            id: t.booking_id,
            reference: t.booking_reference,
            status: t.booking_status,
            kind: t.listing_kind,
            startDate: t.start_date,
            endDate: t.end_date,
            excludedDates: mapExcludedDates(t.excluded_dates),
            time: timeLabel(t.start_time, t.end_time),
            guests: t.guests ?? 1,
            eventLocation: t.event_location ?? null,
            preferences: t.preferences ?? null,
            packageName: t.package_name ?? null,
            paidAt: iso(t.paid_at),
            disputeWindowClosesAt: iso(t.dispute_window_closes_at),
            totalAmount: money.total,
            subtotal: money.subtotal,
            vat: money.vat,
            commission: money.commission,
            vendorNet: money.vendorNet,
            currency: t.currency ?? 'NGN',
          }
        : null,
      listing: t.listing_id
        ? {
            id: t.listing_id,
            title: t.listing_title,
            kind: t.listing_kind,
            location: hallLocation(t),
          }
        : null,
      client: t.booking_id
        ? {
            name: personName(t.client_first_name, t.client_last_name),
            avatarUrl: t.client_avatar_url ?? null,
          }
        : null,
      payout: t.dispatch_reference
        ? {
            status: t.payout_status,
            dispatchReference: t.dispatch_reference,
            transferCode: t.paystack_transfer_code ?? null,
            dispatchedAt: iso(t.payout_created_at),
            completedAt: iso(t.payout_updated_at),
          }
        : null,
      destination: t.account_number_last4
        ? {
            bankName: t.bank_name ?? 'Bank',
            accountLast4: t.account_number_last4,
            accountName: t.resolved_account_name ?? null,
          }
        : null,
      isService,
    });
  } catch (error: any) {
    console.error('Get transaction details error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction' });
  }
};

//  Bookings 

export const getBookings = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    const filter = resolveFilter(req.query.filter);
    const sort = resolveSort(req.query.sort);
    const perPage = clampPerPage(req.query.perPage, 10);
    const page = Math.max(1, int(req.query.page) || 1);

    const { bookings, totalItems } = await VendorDashboardModel.getBookings(
      req.user.userId,
      filter,
      page,
      perPage,
      sort
    );

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      bookings: bookings.map(mapBookingListItem),
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalItems / perPage)),
        totalItems,
        itemsPerPage: perPage,
      },
    });
  } catch (error: any) {
    console.error('Get vendor bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

/** GET /api/vendor/bookings/:id - everything the vendor needs to decide. */
export const getBookingDetails = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!UUID_RE.test(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const b = await VendorDashboardModel.getBookingById(req.user.userId, req.params.id);
    if (!b) return res.status(404).json({ message: 'Booking not found' });

    const money = moneyOf(b);
    const isService = b.listing_kind === 'service';
    const awaitingDecision = b.status === 'paid' || b.status === 'funds_held';

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      ...mapBookingListItem(b),
      client: {
        name: personName(b.client_first_name, b.client_last_name, b.client_email),
        firstName: String(b.client_first_name ?? '').trim() || 'Guest',
        avatarUrl: b.client_avatar_url ?? null,
        email: b.client_email ?? null,
        phone: b.client_phone ?? null,
      },
      listing: {
        id: b.listing_id,
        type: isService ? 'service' : 'venue',
        name: b.listing_name,
        label: isService ? 'Service' : 'Venue',
        kind: b.listing_kind,
        location: hallLocation(b),
        address: b.address_line ?? null,
        capacity: b.capacity ?? null,
      },
      // Services travel to the customer; halls host at their own address.
      location: isService ? b.event_location ?? null : hallLocation(b),
      guests: b.guests ?? 1,
      preferences: b.preferences ?? null,
      startTime: time24(b.start_time),
      endTime: time24(b.end_time),
      money: {
        total: money.total,
        subtotal: money.subtotal,
        vat: money.vat,
        commission: money.commission,
        vendorNet: money.vendorNet,
        currency: b.currency ?? 'NGN',
      },
      paymentStatus: b.payment_status,
      paidAt: iso(b.paid_at),
      cancelledAt: iso(b.cancelled_at),
      cancellationReason: b.cancellation_reason ?? null,
      disputeWindowClosesAt: iso(b.dispute_window_closes_at),
      payoutHold: Boolean(b.payout_hold),
      refund: b.refund_status
        ? {
            status: b.refund_status,
            reason: b.refund_reason,
            description: b.refund_description ?? null,
            amount: num(b.refund_amount_kobo) / 100,
            createdAt: iso(b.refund_created_at),
            processedAt: iso(b.refund_processed_at),
          }
        : null,
      payout: b.dispatch_reference
        ? {
            status: b.payout_status,
            dispatchReference: b.dispatch_reference,
            transferCode: b.paystack_transfer_code ?? null,
            amount: num(b.payout_amount_kobo) / 100,
            createdAt: iso(b.payout_created_at),
            completedAt: iso(b.payout_updated_at),
          }
        : null,
      canConfirm: awaitingDecision,
      canDecline: awaitingDecision,
    });
  } catch (error: any) {
    console.error('Get vendor booking details error:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
};

export const confirmBooking = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });

    // Read first so we can email the customer after a successful confirm.
    const before = await VendorDashboardModel.getBookingById(req.user.userId, req.params.id);
    const booking = await BookingModel.confirmVendorBooking(req.params.id, req.user.userId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (before?.client_email) {
      try {
        await bookingEmailService.sendBookingConfirmedToCustomer(
          before.client_email,
          personName(before.client_first_name, before.client_last_name, before.client_email),
          before.listing_name,
          before.booking_reference,
          num(before.total_amount)
        );
      } catch (emailError) {
        console.error('Confirm email failed (booking still confirmed):', emailError);
      }
    }

    res.status(200).json({
      bookingId: booking.id,
      status: booking.status,
      message: 'Booking confirmed',
    });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') {
      return res.status(403).json({ message: 'You do not own this listing' });
    }
    if (String(error.message).startsWith('INVALID_STATUS')) {
      return res.status(409).json({ message: String(error.message).split(': ')[1] });
    }
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Failed to confirm booking' });
  }
};

/**
 * PATCH /api/vendor/bookings/:id/decline
 * Declining a paid booking triggers a FULL refund through the existing
 * vendor_decline path (RefundModel reverses escrow, frees the dates and
 * writes the refund row), then notifies both parties.
 */
export const declineBooking = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!UUID_RE.test(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const { reason, note } = req.body as { reason?: string; note?: string };
    if (!reason || !DECLINE_REASONS[reason]) {
      return res.status(400).json({ message: 'Please choose a valid reason for declining' });
    }
    const trimmedNote = String(note ?? '').trim();
    if (reason === 'other' && trimmedNote.length < 10) {
      return res.status(400).json({ message: 'Please add a short explanation (at least 10 characters)' });
    }

    // Ownership + current state, read under the vendor scope.
    const booking = await VendorDashboardModel.getBookingById(req.user.userId, req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'paid' && booking.status !== 'funds_held') {
      return res.status(409).json({
        message: `This booking can no longer be declined (current status: ${booking.status})`,
      });
    }

    const description = `${DECLINE_REASONS[reason]}${trimmedNote ? ` — ${trimmedNote}` : ''}`;

    // executeRefund re-reads and locks the booking, reverses the escrow
    // ledger under `refund:<bookingId>`, releases the blocked dates and
    // upserts the refund row - all idempotent.
    const refund = await RefundModel.executeRefund(req.params.id, {
      source: 'vendor_decline',
      reason: 'vendor_declined',
      description,
      requestedBy: Number(req.user.userId),
    });

    const amount = num(booking.total_amount);
    const clientName = personName(booking.client_first_name, booking.client_last_name, booking.client_email);

    try {
      if (booking.client_email) {
        await bookingEmailService.sendBookingDeclinedToCustomer(
          booking.client_email, clientName, booking.listing_name,
          booking.booking_reference, amount, DECLINE_REASONS[reason]
        );
      }
      const vendorEmail = req.user.email;
      if (vendorEmail) {
        await bookingEmailService.sendBookingDeclinedToVendor(
          vendorEmail, booking.listing_name, booking.booking_reference
        );
      }
    } catch (emailError) {
      console.error('Decline emails failed (refund still processed):', emailError);
    }

    res.status(200).json({
      bookingId: req.params.id,
      status: 'cancelled',
      refundStatus: refund.status,
      message: 'Booking declined. The customer has been refunded in full.',
    });
  } catch (error: any) {
    const message = String(error?.message ?? '');
    if (message.startsWith('INVALID_STATUS')) {
      return res.status(409).json({ message: 'This booking is no longer eligible for a decline' });
    }
    if (message === 'NO_PAYMENT_REFERENCE') {
      return res.status(409).json({ message: 'No captured payment to refund on this booking' });
    }
    console.error('Decline booking error:', error);
    res.status(502).json({ message: 'Could not process the refund. Please try again or contact support.' });
  }
};

export const getMyListingsStats = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ message: 'Unauthorized' });
    const stats = await VendorDashboardModel.getMyListingsStats(req.user.userId);
    res.status(200).json({
      totalListings: int(stats.total_listings),
      activeListings: int(stats.active_listings),
      totalViews: int(stats.views_last_30_days),
      avgRating: num(stats.avg_rating),
    });
  } catch (error: any) {
    console.error('Get listing stats error:', error);
    res.status(500).json({ message: 'Failed to fetch listing stats' });
  }
};