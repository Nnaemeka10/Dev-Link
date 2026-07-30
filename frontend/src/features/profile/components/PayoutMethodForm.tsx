"use client";

import { useState } from "react";
import { useBankDirectory, useSubmitPayoutMethod, PayoutMethodPayload } from "../hooks/usePayoutVerification";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";

interface PayoutMethodFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PayoutMethodForm({ isOpen, onClose }: PayoutMethodFormProps) {
  const { data: banks = [], isLoading: isLoadingBanks } = useBankDirectory();
  const mutation = useSubmitPayoutMethod();
  
  const [form, setForm] = useState<PayoutMethodPayload>({
    bankCode: "",
    accountNumber: "",
    legalFirstName: "",
    legalLastName: "",
    idType: "bvn",
    idNumber: "",
  });

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.idNumber.length < 11) {
      setError("BVN/NIN must be at least 11 digits.");
      return;
    }

    try {
      await mutation.mutateAsync(form);
      // On success, close modal. The parent component will show the polling status.
      onClose();
    } catch (err: unknown) {
        const message =
            err instanceof Error ? err.message : "Failed to submit. Please try again.";
        setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[95vh] flex flex-col animate-fade-up">
        {/* Header */}
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D65C3A]/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#D65C3A]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">Verify Payout Method</h2>
                <p className="text-xs text-stone-500">Required to receive escrow payouts</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500">✕</button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Legal First Name</label>
              <input name="legalFirstName" value={form.legalFirstName} onChange={handleChange} required className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#D65C3A]/20 focus:border-[#D65C3A]/30 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Legal Last Name</label>
              <input name="legalLastName" value={form.legalLastName} onChange={handleChange} required className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#D65C3A]/20 focus:border-[#D65C3A]/30 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Bank</label>
            <select name="bankCode" value={form.bankCode} onChange={handleChange} required className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#D65C3A]/20 focus:border-[#D65C3A]/30 outline-none">
              <option value="">Select Bank</option>
              {isLoadingBanks ? <option>Loading banks...</option> : banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Account Number</label>
            <input name="accountNumber" value={form.accountNumber} onChange={handleChange} required maxLength={10} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm tracking-widest focus:ring-2 focus:ring-[#D65C3A]/20 focus:border-[#D65C3A]/30 outline-none" />
          </div>

          <div className="pt-4 border-t border-stone-100">
            <h3 className="text-sm font-bold text-stone-800 mb-2">Identity Verification</h3>
            <p className="text-xs text-stone-500 mb-4">Required by CBN regulations. Your data is encrypted securely.</p>
            
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setForm(p => ({...p, idType: "bvn"}))} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${form.idType === "bvn" ? "border-[#D65C3A] bg-[#D65C3A]/10 text-[#D65C3A]" : "border-stone-200 text-stone-500"}`}>BVN</button>
              <button type="button" onClick={() => setForm(p => ({...p, idType: "nin"}))} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${form.idType === "nin" ? "border-[#D65C3A] bg-[#D65C3A]/10 text-[#D65C3A]" : "border-stone-200 text-stone-500"}`}>NIN</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">{form.idType.toUpperCase()} Number</label>
              <input name="idNumber" value={form.idNumber} onChange={handleChange} required className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm tracking-widest focus:ring-2 focus:ring-[#D65C3A]/20 focus:border-[#D65C3A]/30 outline-none" />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-stone-100">
          <button 
            onClick={handleSubmit} 
            disabled={mutation.isPending} 
            className="w-full flex items-center justify-center gap-2 bg-[#D65C3A] text-white py-3.5 rounded-xl text-sm font-bold hover:bg-[#c24e2f] transition-colors disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Verify & Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}