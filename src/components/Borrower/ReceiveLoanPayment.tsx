"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

import { AlertTriangle, Search, Trash2, User } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { generatePaymentReceiptPdf, IReceiptData } from "./Generatereceiptpdf";

/* ================= TYPES ================= */
interface IAddress {
  division?: string | null;
  district?: string | null;
  thana?: string | null;
  postOffice?: string | null;
  village?: string | null;
}

interface IGuarantorLite {
  id: string;
  name: string;
  fatherName?: string | null;
  mobile1?: string | null;
  relation?: string | null;
  presentAddress?: IAddress | null;
}

interface IInstallmentLite {
  id: string;
  installmentNo: number;
  month: number;
  year: number;
  amount: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  paidAmount: number;
}

interface ILoanLite {
  id: string;
  principalAmount: number;
  profitRate: number;
  profitAmount: number;
  totalPayableAmount: number;
  monthlyInstallment: number;
  totalInstallments: number;
  isActive: boolean;
  guarantors: IGuarantorLite[];
  installments: IInstallmentLite[];
  products?: { name: string }[];
}

interface IBorrowerResult {
  id: string;
  code: string;
  name: string;
  fatherName?: string | null;
  motherName?: string | null;
  mobile1?: string | null;
  mobile2?: string | null;
  presentAddress?: IAddress | null;
  guarantors?: IGuarantorLite[];
  loans?: ILoanLite[];
}

const BANGLA_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const formatAddress = (addr?: IAddress | null) => {
  if (!addr) return "—";
  return (
    [addr.village, addr.postOffice, addr.thana, addr.district, addr.division]
      .filter(Boolean)
      .join(", ") || "—"
  );
};

/* ================= SMALL SUB-COMPONENTS ================= */
const InfoCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow p-4">
    <h3 className="font-semibold text-gray-700 mb-3">{title}</h3>
    {children}
  </div>
);

const GuarantorMiniCard = ({ g }: { g: IGuarantorLite }) => (
  <div className="border rounded-lg p-3 bg-gray-50 text-sm">
    <p className="font-medium">{g.name}</p>
    <p className="text-xs text-gray-500">
      {g.relation ? `${g.relation} • ` : ""}
      {g.mobile1 || "—"}
    </p>
    <p className="text-xs text-gray-400 mt-1">
      {formatAddress(g.presentAddress)}
    </p>
  </div>
);

/* ================= MAIN COMPONENT ================= */
export default function ReceiveLoanPayment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  const [borrowerResults, setBorrowerResults] = useState<IBorrowerResult[]>([]);
  const [selectedBorrower, setSelectedBorrower] =
    useState<IBorrowerResult | null>(null);

  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<
    string[]
  >([]);
  const [method, setMethod] = useState("CASH");
  const [submitting, setSubmitting] = useState(false);

  /* ================= DELETE PAYMENT STATE ================= */
  const [deleteTarget, setDeleteTarget] = useState<IInstallmentLite | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  /* ================= LIVE SEARCH SUGGESTIONS (debounced) =================
     টাইপ করার সাথে সাথে (Enter চাপা লাগবে না) ৪০০ms পর সার্চ কল হয়ে dropdown-এ
     suggestion দেখায়। কমপক্ষে ২ অক্ষর না লিখলে কল হয় না, অযথা রিকোয়েস্ট কমাতে। */
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setBorrowerResults([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get("/api/v1/borrower", {
          params: { searchTerm: searchTerm.trim(), limit: 8, page: 1 },
        });
        setBorrowerResults(res.data.data || []);
        setShowSuggestions(true);
      } catch (err: any) {
        console.error("Borrower search error:", err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ================= CLICK OUTSIDE — dropdown বন্ধ করা ================= */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectBorrower = (b: IBorrowerResult) => {
    setSelectedBorrower(b);
    setSearchTerm(`${b.name} (${b.code})`);
    setShowSuggestions(false);
    setSelectedInstallmentIds([]);
  };

  const resetSearch = () => {
    setSearchTerm("");
    setBorrowerResults([]);
    setSelectedBorrower(null);
    setSelectedInstallmentIds([]);
    setShowSuggestions(false);
  };

  /* ================= ACTIVE LOAN + INSTALLMENTS (sorted) ================= */
  const activeLoan = selectedBorrower?.loans?.[0] || null;

  const unpaidInstallments = (activeLoan?.installments || [])
    .filter((i) => i.status !== "PAID")
    .sort((a, b) => a.installmentNo - b.installmentNo);

  // ✅ PAID installments — সর্বশেষ পরিশোধিতটা আগে দেখাবে
  const paidInstallments = (activeLoan?.installments || [])
    .filter((i) => i.status === "PAID")
    .sort((a, b) => b.installmentNo - a.installmentNo);

  /* ================= SEQUENTIAL SELECTION =================
     ক্লিক করলে ১ম থেকে সেই কার্ড পর্যন্ত সব সিলেক্ট হয়ে যাবে (আগেরটা বাদ দিয়ে
     পরেরটা পরিশোধ করা যাবে না — এই ব্যাকএন্ড নিয়মের সাথে সামঞ্জস্যপূর্ণ UX) */
  const handleCardClick = (index: number) => {
    const alreadyFullySelected =
      selectedInstallmentIds.length === index + 1 &&
      selectedInstallmentIds[index] === unpaidInstallments[index].id;

    if (alreadyFullySelected) {
      // ওই কার্ডেই আবার ক্লিক করলে এক ধাপ পিছিয়ে যাবে (deselect শেষটা)
      setSelectedInstallmentIds(
        unpaidInstallments.slice(0, index).map((i) => i.id),
      );
    } else {
      setSelectedInstallmentIds(
        unpaidInstallments.slice(0, index + 1).map((i) => i.id),
      );
    }
  };

  const totalSelectedAmount = unpaidInstallments
    .filter((i) => selectedInstallmentIds.includes(i.id))
    .reduce((sum, i) => sum + i.amount, 0);

  /* ================= REFRESH SELECTED LOAN (পেমেন্টের পর) ================= */
  const refreshSelectedLoan = async () => {
    if (!activeLoan || !selectedBorrower) return;

    try {
      const res = await api.get(`/api/v1/loan/account/${activeLoan.id}`);
      const refreshedLoan: ILoanLite = res.data.data;

      setSelectedBorrower({
        ...selectedBorrower,
        loans: [refreshedLoan],
      });
    } catch (err) {
      console.error("Refresh loan error:", err);
    }
  };

  /* ================= RECEIVE PAYMENT ================= */
  const handleReceivePayment = async () => {
    if (selectedInstallmentIds.length === 0) {
      return toast.error("কমপক্ষে একটি কিস্তি নির্বাচন করুন!");
    }

    setSubmitting(true);
    try {
      const res = await api.post("/api/v1/loan/installment/pay", {
        installmentIds: selectedInstallmentIds,
        method,
      });

      const receipt: IReceiptData = res.data.data;

      toast.success(
        `পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে! রশিদ নং: ${receipt.roshidNo}`,
      );

      if (selectedBorrower) {
        await generatePaymentReceiptPdf(receipt, {
          name: selectedBorrower.name,
          code: selectedBorrower.code,
          mobile1: selectedBorrower.mobile1,
          presentAddress: selectedBorrower.presentAddress,
        });
      }

      setSelectedInstallmentIds([]);
      await refreshSelectedLoan();
    } catch (err: any) {
      console.error("Payment receive error:", err);
      toast.error(
        err?.response?.data?.message || err.message || "Something went wrong!",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= DELETE / UNDO PAYMENT ================= */
  const handleDeletePayment = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.delete(`/api/v1/loan/installments/${deleteTarget.id}`);

      toast.success("পেমেন্ট সফলভাবে বাতিল করা হয়েছে");
      setDeleteTarget(null);
      await refreshSelectedLoan();
    } catch (err: any) {
      console.error("Delete payment error:", err);
      toast.error(
        err?.response?.data?.message || err.message || "Something went wrong!",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-center items-center flex-col mb-6">
        <h2 className="text-2xl mb-2 font-bold">কিস্তি পরিশোধ গ্রহণ</h2>
        <p className="text-sm text-gray-500">
          ঋণগ্রহীতার নাম বা কোড দিয়ে খুঁজুন, তারপর কিস্তি নির্বাচন করে পরিশোধ
          করুন।
        </p>
      </div>

      {/* ================= SEARCH BAR WITH LIVE SUGGESTIONS ================= */}
      <div className="relative mb-6" ref={suggestionBoxRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="নাম বা কোড লিখুন..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedBorrower(null);
              }}
              onFocus={() => {
                if (borrowerResults.length > 0) setShowSuggestions(true);
              }}
              className="w-full pl-10 pr-3 py-2 border rounded text-sm"
            />
          </div>
          {selectedBorrower && (
            <Button variant="outline" onClick={resetSearch}>
              রিসেট
            </Button>
          )}
        </div>

        {/* ✅ Dropdown — টাইপ করার সাথে সাথে suggestion দেখাবে */}
        {showSuggestions && (
          <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto">
            {searching && (
              <div className="p-3 text-sm text-gray-400 text-center">
                খুঁজছে...
              </div>
            )}
            {!searching && borrowerResults.length === 0 && (
              <div className="p-3 text-sm text-gray-400 text-center">
                কোনো ঋণগ্রহীতা পাওয়া যায়নি
              </div>
            )}
            {!searching &&
              borrowerResults.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSelectBorrower(b)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left border-b last:border-b-0"
                >
                  <User className="text-gray-400 shrink-0" size={16} />
                  <div>
                    <p className="text-sm font-medium">
                      {b.name} ({b.code})
                    </p>
                    <p className="text-xs text-gray-500">{b.mobile1 || "—"}</p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* ================= EMPTY STATE ================= */}
      {!selectedBorrower && (
        <div className="text-center py-16 text-gray-400 text-sm">
          উপরে নাম বা কোড লিখুন — সাজেশন থেকে ঋণগ্রহীতা নির্বাচন করুন।
        </div>
      )}

      {/* ================= SELECTED BORROWER — INFO SECTIONS + INSTALLMENT CARDS ================= */}
      {selectedBorrower && (
        <Fragment>
          {/* Borrower Info */}
          <InfoCard title="ঋণগ্রহীতার তথ্য">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <p>
                <span className="text-gray-500">নাম: </span>
                {selectedBorrower.name}
              </p>
              <p>
                <span className="text-gray-500">কোড: </span>
                {selectedBorrower.code}
              </p>
              <p>
                <span className="text-gray-500">মোবাইল: </span>
                {selectedBorrower.mobile1 || "—"}
              </p>
              <p>
                <span className="text-gray-500">পিতার নাম: </span>
                {selectedBorrower.fatherName || "—"}
              </p>
              <p className="col-span-2 sm:col-span-1">
                <span className="text-gray-500">ঠিকানা: </span>
                {formatAddress(selectedBorrower.presentAddress)}
              </p>
            </div>
          </InfoCard>

          {/* Borrower's Guarantors */}
          <div className="mt-4">
            <InfoCard title="ঋণগ্রহীতার জামিনদার">
              {selectedBorrower.guarantors &&
              selectedBorrower.guarantors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedBorrower.guarantors.map((g) => (
                    <GuarantorMiniCard key={g.id} g={g} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  কোনো জামিনদার যোগ করা হয়নি
                </p>
              )}
            </InfoCard>
          </div>

          {!activeLoan && (
            <div className="mt-6 text-center py-10 text-gray-400 text-sm">
              এই ঋণগ্রহীতার কোনো সক্রিয় লোন নেই।
            </div>
          )}

          {activeLoan && (
            <>
              {/* Loan Info */}
              <div className="mt-4">
                <InfoCard title="ঋণের তথ্য">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <p>
                      <span className="text-gray-500">আসল: </span>৳
                      {activeLoan.principalAmount}
                    </p>
                    <p>
                      <span className="text-gray-500">মুনাফা হার: </span>
                      {activeLoan.profitRate}%
                    </p>
                    <p>
                      <span className="text-gray-500">মোট পরিশোধযোগ্য: </span>৳
                      {activeLoan.totalPayableAmount}
                    </p>
                    <p>
                      <span className="text-gray-500">মাসিক কিস্তি: </span>৳
                      {activeLoan.monthlyInstallment}
                    </p>
                    <p>
                      <span className="text-gray-500">মোট কিস্তি: </span>
                      {activeLoan.totalInstallments}
                    </p>
                    {activeLoan.products?.[0] && (
                      <p>
                        <span className="text-gray-500">পণ্য: </span>
                        {activeLoan.products[0].name}
                      </p>
                    )}
                  </div>
                </InfoCard>
              </div>

              {/* Loan's Guarantors */}
              <div className="mt-4">
                <InfoCard title="এই ঋণের জামিনদার">
                  {activeLoan.guarantors && activeLoan.guarantors.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeLoan.guarantors.map((g) => (
                        <GuarantorMiniCard key={g.id} g={g} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      কোনো জামিনদার যোগ করা হয়নি
                    </p>
                  )}
                </InfoCard>
              </div>

              {/* Installment Cards — বকেয়া */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-700 mb-3">
                  বকেয়া কিস্তি ({unpaidInstallments.length}টি)
                </h3>

                {unpaidInstallments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">
                    সব কিস্তি পরিশোধিত — কোনো বকেয়া নেই।
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {unpaidInstallments.map((inst, index) => {
                      const isSelected = selectedInstallmentIds.includes(
                        inst.id,
                      );
                      return (
                        <button
                          key={inst.id}
                          onClick={() => handleCardClick(index)}
                          className={`text-left border rounded-xl p-3 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 ring-2 ring-primary"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <p className="text-xs text-gray-500 mb-1">
                            {selectedBorrower.name}
                          </p>
                          <p className="font-semibold">
                            {BANGLA_MONTHS[inst.month - 1]} {inst.year}
                          </p>
                          <p className="text-sm mt-1">৳{inst.amount}</p>
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              inst.status === "PARTIAL"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {inst.status === "PARTIAL" ? "আংশিক" : "বাকি"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ✅ Installment Cards — পরিশোধিত (Delete/Undo option সহ) */}
              {paidInstallments.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    পরিশোধিত কিস্তি ({paidInstallments.length}টি)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {paidInstallments.map((inst) => (
                      <div
                        key={inst.id}
                        className="text-left border border-green-200 bg-green-50 rounded-xl p-3 relative"
                      >
                        <p className="text-xs text-gray-500 mb-1">
                          কিস্তি #{inst.installmentNo}
                        </p>
                        <p className="font-semibold">
                          {BANGLA_MONTHS[inst.month - 1]} {inst.year}
                        </p>
                        <p className="text-sm mt-1">৳{inst.paidAmount}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">
                          পরিশোধিত
                        </span>

                        <button
                          onClick={() => setDeleteTarget(inst)}
                          title="পেমেন্ট বাতিল করুন"
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md p-1 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method + Submit */}
              {unpaidInstallments.length > 0 && (
                <div className="mt-6 bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row items-center gap-4 sticky bottom-4">
                  <select
                    className="border rounded px-3 py-2 text-sm w-full sm:w-auto"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="BANK">Bank</option>
                  </select>

                  <div className="flex-1 text-sm text-center sm:text-left">
                    <span className="text-gray-500">নির্বাচিত: </span>
                    {selectedInstallmentIds.length}টি কিস্তি —{" "}
                    <span className="font-semibold">
                      ৳{totalSelectedAmount}
                    </span>
                  </div>

                  <Button
                    className="w-full sm:w-auto bg-primary text-white"
                    onClick={handleReceivePayment}
                    disabled={submitting || selectedInstallmentIds.length === 0}
                  >
                    {submitting ? "পরিশোধ হচ্ছে..." : "পেমেন্ট গ্রহণ করুন"}
                  </Button>
                </div>
              )}
            </>
          )}
        </Fragment>
      )}

      {/* ================= DELETE PAYMENT CONFIRM MODAL ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">পেমেন্ট বাতিল করবেন?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              কিস্তি #{deleteTarget.installmentNo} (
              {BANGLA_MONTHS[deleteTarget.month - 1]} {deleteTarget.year}) — ৳
              {deleteTarget.paidAmount} পরিশোধ বাতিল হবে এবং কিস্তিটি আবার{" "}
              <b>বাকি</b> অবস্থায় ফিরে যাবে। এই কাজ ফিরিয়ে নেওয়া যাবে না।
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                বাতিল
              </Button>
              <Button
                onClick={handleDeletePayment}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? "মুছে ফেলা হচ্ছে..." : "নিশ্চিত করুন"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
