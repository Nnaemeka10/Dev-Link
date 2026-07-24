import type { Transaction, TransactionIcon, TransactionStatus } from "../types";
import { formatCurrency } from "../utils";

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const ICON_PATHS: Record<TransactionIcon, string> = {
  venue: "M4 21V9L12 3L20 9V21H14V14H10V21H4Z",
  photography: "M4 8H7L8.5 5.5H15.5L17 8H20V19H4V8Z M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z",
  sound: "M9 6L4 9H2V15H4L9 18V6Z M15 9C16.2 9.9 17 11.4 17 13C17 14.6 16.2 16.1 15 17",
  hosting: "M12 3L14.5 8.5L20.5 9.3L16 13.2L17.3 19.2L12 16L6.7 19.2L8 13.2L3.5 9.3L9.5 8.5L12 3Z",
  design: "M3 17L9 11L13 15L21 7 M21 7H15 M21 7V13",
  withdrawal: "M12 4V16 M12 16L7 11 M12 16L17 11 M4 20H20",
};

const STATUS_STYLES: Record<TransactionStatus, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  completed: "Completed",
  processing: "Processing",
  failed: "Failed",
};

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <section className="animate-fade-up rounded-card bg-bg-tertiary p-6 shadow-card lg:col-span-2 xl:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-man text-lg font-bold text-text-primary xl:text-xl">Transaction History</h2>
        <button
          type="button"
          className="text-xs font-bold text-accent-primary hover:underline"
        >
          View all
        </button>
      </div>

      <ul className="mt-6 space-y-1">
        {transactions.map((txn) => (
          <li
            key={txn.id}
            className="flex items-center gap-3 rounded-button px-2 py-3 transition-colors hover:bg-black/[0.03]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-primary text-text-primary/60">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d={ICON_PATHS[txn.icon]}
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text-primary">{txn.title}</p>
              <p className="mt-0.5 text-xs text-text-primary/50">
                {txn.date} · {txn.referenceId}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <p className={`text-sm font-bold ${txn.direction === "debit" ? "text-accent-primary" : "text-text-primary"}`}>
                {txn.direction === "debit" ? "− " : "+ "}
                {formatCurrency(txn.amount)}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[txn.status]}`}>
                {STATUS_LABEL[txn.status]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}