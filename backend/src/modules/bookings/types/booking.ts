export interface BookingRow {
    id: string;
    listing_id: string;
    user_id: number;
    start_date: string;
    end_date: string;
    status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed' | 'paid' | 'failed' | 'expired';
    total_amount: number;
    created_at: string;
    booking_reference: string;
    start_time: string | null;
    end_time: string | null;
    currency: string;
    payment_reference: string | null;
    payment_provider: string;
    payment_status: string;
    paid_at: string | null;
}

export interface CreateBookingInput {
    listingId: string;
    startDate: string; // ISO string
    endDate: string;   // ISO string
    startTime: string; // "16:00"
    endTime: string;   // "23:00"
    guests: number;
    preferences?: string;
}

export interface BookingResponse {
    bookingId: string;
    amount: number;
    currency: string;
    status: string;
}

export interface BookingDetailsResponse extends BookingRow {
    listing_title: string;
    listing_image: string | null;
    listing_location: string;
    vendor_first_name: string | null;
    vendor_last_name: string | null;
    vendor_phone: string | null;
    vendor_email: string | null;
}