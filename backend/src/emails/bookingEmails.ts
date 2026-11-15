import { resend, getSender } from "../lib/resend.js";

const ACCENT = "#B9401D";
const SUPPORT = "support@eventvnv.com";

const REFUND_REASON_LABELS: Record<string, string> = {
    vendor_unresponsive: "Vendor unresponsive",
    changed_plans: "Changed plans",
    listing_inaccurate: "Listing inaccurate",
    duplicate_booking: "Duplicate booking",
    other: "Other",
};

const COMPLAINT_CATEGORY_LABELS: Record<string, string> = {
    service_quality: "Service quality",
    vendor_behavior: "Vendor behavior",
    listing_mismatch: "Listing mismatch",
    payment_issue: "Payment issue",
    safety: "Safety",
    other: "Other",
};

function shell(title: string, bodyHtml: string): string {
    return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#F7F2EA;padding:32px">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden">
        <div style="background:${ACCENT};padding:24px 32px">
          <h1 style="color:#ffffff;margin:0;font-size:20px">EventVnV</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#252423;font-size:22px;margin:0 0 16px">${title}</h2>
          <div style="color:#5E6588;font-size:15px;line-height:1.6">${bodyHtml}</div>
          <p style="color:#9AA0B5;font-size:12px;margin-top:32px">
            Need help? Reply to this email or write to ${SUPPORT}. Always quote your booking reference.
          </p>
        </div>
      </div>
    </div>`;
}

function naira(value: number): string {
    return `₦${Number(value).toLocaleString("en-NG")}`;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function send(to: string, subject: string, html: string) {
    const sender = getSender();
    const { error } = await resend.emails.send({ from: sender.formatted, to: [to], subject, html });
    if (error) {
        console.error(`[bookingEmails] failed to send "${subject}" to ${to}:`, error);
        throw new Error("Failed to send booking email");
    }
}

export const bookingEmailService = {
    // ── Batch 1: vendor-timeout auto-cancel + refund completion ──

    async sendAutoCancelledToCustomer(email: string, name: string, listingTitle: string, bookingRef: string, amountNaira: number) {
        const html = shell(
            "Your booking was cancelled and refunded",
            `<p>Hi ${escapeHtml(name || "there")},</p>
             <p>The vendor did not confirm your booking for <strong>${escapeHtml(listingTitle)}</strong> within 24 hours of payment,
             so it was automatically cancelled and a <strong>full refund of ${naira(amountNaira)}</strong> has been initiated
             to your original payment method.</p>
             <p>Booking reference: <strong>${escapeHtml(bookingRef)}</strong>. Refunds typically land within 3–10 business days depending on your bank.</p>
             <p>Your dates are open again — you're free to book another vendor.</p>`
        );
        await send(email, `Booking ${bookingRef} cancelled — refund initiated`, html);
    },

    async sendAutoCancelledToVendor(email: string, name: string, listingTitle: string, bookingRef: string) {
        const html = shell(
            "A booking was auto-cancelled",
            `<p>Hi ${escapeHtml(name || "there")},</p>
             <p>A paid booking for <strong>${escapeHtml(listingTitle)}</strong> (ref <strong>${escapeHtml(bookingRef)}</strong>) was automatically
             cancelled because it wasn't confirmed within 24 hours. The customer has been refunded in full.</p>
             <p>To avoid missed bookings, confirm paid bookings promptly from your vendor dashboard.</p>`
        );
        await send(email, `Booking ${bookingRef} auto-cancelled (unconfirmed)`, html);
    },

    async sendRefundCompletedToCustomer(email: string, name: string, listingTitle: string, bookingRef: string, amountNaira: number) {
        const html = shell(
            "Your refund is on its way",
            `<p>Hi ${escapeHtml(name || "there")},</p>
             <p>Your refund of <strong>${naira(amountNaira)}</strong> for <strong>${escapeHtml(listingTitle)}</strong>
             (ref <strong>${escapeHtml(bookingRef)}</strong>) has been processed back to your original payment method.</p>
             <p>It typically lands within 3–10 business days depending on your bank or card provider.</p>`
        );
        await send(email, `Refund processed — booking ${bookingRef}`, html);
    },

    // ── Batch 2: reviewed refund requests ──

    async sendRefundRequestToSupport(
        bookingRef: string, customerName: string, customerEmail: string,
        listingTitle: string, amountNaira: number, reason: string, description: string
    ) {
        const html = shell(
            "New refund request",
            `<p><strong>Booking:</strong> ${escapeHtml(bookingRef)} — ${escapeHtml(listingTitle)}</p>
             <p><strong>Customer:</strong> ${escapeHtml(customerName || "—")} (${escapeHtml(customerEmail)})</p>
             <p><strong>Amount:</strong> ${naira(amountNaira)} (full refund requested)</p>
             <p><strong>Reason:</strong> ${escapeHtml(REFUND_REASON_LABELS[reason] ?? reason)}</p>
             <p><strong>Details:</strong></p>
             <p style="white-space:pre-wrap;background:#F7F2EA;border-radius:12px;padding:16px">${escapeHtml(description)}</p>
             <p>Review this request in the admin tooling (or the refunds table) and approve or reject it.</p>`
        );
        await send(SUPPORT, `[Refund request] ${bookingRef} — ${naira(amountNaira)}`, html);
    },

    async sendRefundRequestAckToCustomer(email: string, name: string, listingTitle: string, bookingRef: string, amountNaira: number) {
        const html = shell(
            "We received your refund request",
            `<p>Hi ${escapeHtml(name || "there")},</p>
             <p>Your request for a full refund of <strong>${naira(amountNaira)}</strong> on
             <strong>${escapeHtml(listingTitle)}</strong> (ref <strong>${escapeHtml(bookingRef)}</strong>) is now with our support team.</p>
             <p>We'll review it and email you once a decision is made. Approved refunds return to your original payment method
             within 3–10 business days.</p>`
        );
        await send(email, `Refund request received — booking ${bookingRef}`, html);
    },

    // ── Batch 2: complaints ──

    async sendComplaintToSupport(
        bookingRef: string, customerName: string, customerEmail: string,
        listingTitle: string, category: string, subject: string, message: string
    ) {
        const html = shell(
            "New booking complaint",
            `<p><strong>Booking:</strong> ${escapeHtml(bookingRef)} — ${escapeHtml(listingTitle)}</p>
             <p><strong>Customer:</strong> ${escapeHtml(customerName || "—")} (${escapeHtml(customerEmail)})</p>
             <p><strong>Category:</strong> ${escapeHtml(COMPLAINT_CATEGORY_LABELS[category] ?? category)}</p>
             ${subject ? `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ""}
             <p><strong>Message:</strong></p>
             <p style="white-space:pre-wrap;background:#F7F2EA;border-radius:12px;padding:16px">${escapeHtml(message)}</p>`
        );
        await send(SUPPORT, `[Complaint] ${bookingRef} — ${COMPLAINT_CATEGORY_LABELS[category] ?? category}`, html);
    },

    async sendComplaintAckToCustomer(email: string, name: string, bookingRef: string) {
        const html = shell(
            "We've received your complaint",
            `<p>Hi ${escapeHtml(name || "there")},</p>
             <p>Thanks for flagging this. Your complaint about booking <strong>${escapeHtml(bookingRef)}</strong>
             has been logged and our support team will review it and reach out shortly.</p>
             <p>If it's urgent, reply to this email and quote your booking reference.</p>`
        );
        await send(email, `Complaint received — booking ${bookingRef}`, html);
    },
};