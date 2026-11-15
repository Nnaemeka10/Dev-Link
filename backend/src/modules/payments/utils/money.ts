/**
 * Money math - the ONLY place commission and VAT are computed.
 * Everything is integer kobo so the split invariant is exact:
 *      vendorNet + commission + vat === total
 * Naira values are exposed for persistence/display only.
 */

export const COMMISSION_RATE = 0.10; // 10% of subtotal (pre-VAT)
export const VAT_RATE = 0.075;       // 7.5% VAT on subtotal

export interface MoneyBreakdown {
    subtotalKobo: number;
    vatKobo: number;
    totalKobo: number;
    commissionKobo: number;
    vendorNetKobo: number;
    subtotal: number;
    vat: number;
    total: number;
    commission: number;
    vendorNet: number;
}

const toNaira = (kobo: number): number => Math.round(kobo) / 100;

function assemble(subtotalKobo: number): MoneyBreakdown {
    const vatKobo = Math.round(subtotalKobo * VAT_RATE);
    const commissionKobo = Math.round(subtotalKobo * COMMISSION_RATE);
    const totalKobo = subtotalKobo + vatKobo;
    const vendorNetKobo = subtotalKobo - commissionKobo;

    return {
        subtotalKobo, vatKobo, totalKobo, commissionKobo, vendorNetKobo,
        subtotal: toNaira(subtotalKobo),
        vat: toNaira(vatKobo),
        total: toNaira(totalKobo),
        commission: toNaira(commissionKobo),
        vendorNet: toNaira(vendorNetKobo),
    };
}

/** Price a stay: base price per day (kobo) × chargeable days. */
export function computeMoney(basePriceKobo: number, days: number): MoneyBreakdown {
    const base = Math.round(Number(basePriceKobo));
    const d = Math.max(1, Math.floor(Number(days)));
    if (!Number.isFinite(base) || base < 0) throw new Error('INVALID_PRICE');
    return assemble(base * d);
}

/**
 * Read the money split off a persisted booking. Prefers the stored components
 * (authoritative, written at creation); falls back to derivation for legacy
 * rows that predate migration 031.
 */
export function moneyFromBooking(row: {
    total_amount: string | number;
    subtotal_amount?: string | number | null;
    vat_amount?: string | number | null;
    platform_fee?: string | number | null;
}): MoneyBreakdown {
    const totalKobo = Math.round(parseFloat(String(row.total_amount)) * 100);

    if (row.subtotal_amount != null && row.vat_amount != null) {
        const subtotalKobo = Math.round(parseFloat(String(row.subtotal_amount)) * 100);
        const vatKobo = Math.round(parseFloat(String(row.vat_amount)) * 100);
        const commissionKobo = row.platform_fee != null
            ? Math.round(parseFloat(String(row.platform_fee)) * 100)
            : Math.round(subtotalKobo * COMMISSION_RATE);
        const vendorNetKobo = subtotalKobo - commissionKobo;
        return {
            subtotalKobo, vatKobo, totalKobo, commissionKobo, vendorNetKobo,
            subtotal: toNaira(subtotalKobo), vat: toNaira(vatKobo), total: toNaira(totalKobo),
            commission: toNaira(commissionKobo), vendorNet: toNaira(vendorNetKobo),
        };
    }

    // Legacy fallback: reverse the VAT out of the gross.
    const subtotalKobo = Math.round(totalKobo / (1 + VAT_RATE));
    const money = assemble(subtotalKobo);
    return { ...money, totalKobo, total: toNaira(totalKobo) };
}

/** Guard used before posting any ledger group. */
export function assertSplitBalances(m: MoneyBreakdown): void {
    if (m.vendorNetKobo + m.commissionKobo + m.vatKobo !== m.totalKobo) {
        throw new Error(`MONEY_SPLIT_IMBALANCE: ${JSON.stringify(m)}`);
    }
}