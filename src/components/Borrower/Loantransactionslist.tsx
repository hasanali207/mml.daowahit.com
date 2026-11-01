"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPagination } from "@/lib/getPageNumber";
import { AlertTriangle, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

/* ================= TYPES ================= */
interface ITransactionInstallment {
  installmentNo: number;
  month: number;
  year: number;
  amount: number;
}

interface ITransactionItem {
  id: string;
  transactionId: string;
  installmentId: string;
  amount: number;
  feeName: string;
  installment: ITransactionInstallment;
}

interface ITransaction {
  id: string;
  loanId: string;
  totalAmount: number;
  method: string;
  receivedBy: string;
  roshidNo: string;
  transactionId: string;
  receivedAt: string;
  loan: {
    id: string;
    principalAmount: number;
    totalPayableAmount: number;
    borrower: {
      name: string;
      code?: string;
      mobile1?: string;
    };
  };
  items: ITransactionItem[];
}

type ActionType = "reverse" | "delete";

/* ================= CONSTANTS ================= */
const BN_MONTHS = [
  "",
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

/* ================= MAIN COMPONENT ================= */
const LoanTransactionsList = () => {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    ITransaction[]
  >([]);
  const [loading, setLoading] = useState(false);

  /* filter */
  const [searchTerm, setSearchTerm] = useState("");
  const [method, setMethod] = useState("ALL");

  /* pagination */
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const pages = getPagination(page, totalPages);

  /* expanded row (installment breakdown) */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ✅ একই confirm modal reverse এবং delete দুটোর জন্যই ব্যবহার হবে —
     actionType দিয়ে বোঝা যাবে কোনটা চলছে */
  const [confirmTarget, setConfirmTarget] = useState<ITransaction | null>(null);
  const [actionType, setActionType] = useState<ActionType>("reverse");
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* ================= FETCH TRANSACTIONS ================= */
  const fetchAllTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/loan/transactions?page=1&limit=2000`,
      );
      const data = await res.json();
      setTransactions(data.data || []);
      setFilteredTransactions(data.data || []);
      setTotalPages(Math.ceil((data.data?.length || 0) / limit));
      setPage(1);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  /* FILTER */
  useEffect(() => {
    const filtered = transactions.filter((t) => {
      if (method !== "ALL" && t.method !== method) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        t.roshidNo.toLowerCase().includes(q) ||
        t.transactionId.toLowerCase().includes(q) ||
        t.loan.borrower?.name?.toLowerCase().includes(q) ||
        t.loan.borrower?.code?.toLowerCase().includes(q) ||
        t.loan.borrower?.mobile1?.includes(q)
      );
    });
    setFilteredTransactions(filtered);
    setTotalPages(Math.ceil(filtered.length / limit));
    setPage(1);
  }, [searchTerm, method, transactions]);

  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * limit,
    page * limit,
  );

  /* ✅ কোন transaction তার loan-এর জন্য সর্বশেষ — শুধু সেটাই reverse করা যাবে
     (backend sequential-payment rule-এর সাথে সামঞ্জস্য রাখতে)।
     ⚠️ Delete-এ এই lock নেই — যেকোনো transaction যেকোনো সময় delete করা যাবে। */
  const latestIdByLoan = useMemo(() => {
    const map: Record<string, ITransaction> = {};
    transactions.forEach((t) => {
      const cur = map[t.loanId];
      if (!cur || new Date(t.receivedAt) > new Date(cur.receivedAt)) {
        map[t.loanId] = t;
      }
    });
    const out: Record<string, string> = {};
    Object.values(map).forEach((t) => (out[t.loanId] = t.id));
    return out;
  }, [transactions]);

  /* ================= OPEN CONFIRM MODAL ================= */
  const openConfirm = (t: ITransaction, type: ActionType) => {
    setActionType(type);
    setConfirmTarget(t);
  };

  /* ================= REVERSE / DELETE — CONFIRM HANDLER ================= */
  const handleConfirm = async () => {
    if (!confirmTarget) return;

    setProcessingId(confirmTarget.id);
    try {
      const url =
        actionType === "reverse"
          ? `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/loan/transactions/${confirmTarget.id}/reverse`
          : `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/loan/transactions/${confirmTarget.id}`;

      const res = await fetch(url, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok)
        throw new Error(
          result?.message ||
            (actionType === "reverse" ? "Reverse failed" : "Delete failed"),
        );

      toast.success(
        actionType === "reverse"
          ? `Roshid #${confirmTarget.roshidNo} রিভার্স করা হয়েছে`
          : `Roshid #${confirmTarget.roshidNo} ডিলিট করা হয়েছে`,
      );
      setConfirmTarget(null);
      fetchAllTransactions();
    } catch (err: any) {
      console.error(`${actionType} error:`, err);
      toast.error(
        err?.message ||
          (actionType === "reverse"
            ? "রিভার্স করতে সমস্যা হয়েছে"
            : "ডিলিট করতে সমস্যা হয়েছে"),
      );
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Loan Payment Transactions
      </h2>

      {/* SEARCH + FILTER */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search Roshid / Borrower Name / Code / Mobile"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />

        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            <SelectItem value="ALL">সব মেথড</SelectItem>
            <SelectItem value="CASH">CASH</SelectItem>
            <SelectItem value="BKASH">BKASH</SelectItem>
            <SelectItem value="BANK">BANK</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm min-w-[1150px]">
          <thead className="bg-secondary text-white">
            <tr>
              {[
                "Roshid No",
                "Borrower",
                "Installment",
                "Amount",
                "Method",
                "Received By",
                "Date",
                "Action",
              ].map((h) => (
                <th key={h} className="border p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              paginatedTransactions.map((t) => {
                const isExpanded = expandedId === t.id;
                const isLatest = latestIdByLoan[t.loanId] === t.id;
                const isProcessing = processingId === t.id;

                return (
                  <Fragment key={t.id}>
                    <tr
                      className="odd:bg-gray-50 hover:bg-blue-50 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    >
                      <td className="border p-2 font-medium">#{t.roshidNo}</td>
                      <td className="border p-2">
                        {t.loan.borrower?.name}{" "}
                        {t.loan.borrower?.code
                          ? `(${t.loan.borrower.code})`
                          : ""}
                      </td>
                      <td className="border p-2">
                        {t.items.length === 1 ? (
                          <>
                            কিস্তি #{t.items[0].installment.installmentNo} —{" "}
                            {BN_MONTHS[t.items[0].installment.month]}{" "}
                            {t.items[0].installment.year}
                          </>
                        ) : (
                          `${t.items.length}টি কিস্তি`
                        )}
                      </td>
                      <td className="border p-2">৳{t.totalAmount}</td>
                      <td className="border p-2">{t.method}</td>
                      <td className="border p-2">{t.receivedBy}</td>
                      <td className="border p-2">
                        {new Date(t.receivedAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="border p-2">
                        <div className="flex items-center gap-2">
                          {isLatest ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              disabled={isProcessing}
                              onClick={(e) => {
                                e.stopPropagation();
                                openConfirm(t, "reverse");
                              }}
                              title="Reverse this transaction"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">লক</span>
                          )}

                          {/* ✅ Delete — lock ছাড়া, যেকোনো transaction */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            disabled={isProcessing}
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirm(t, "delete");
                            }}
                            title="Delete this transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* ================= EXPANDED ROW — Installment breakdown ================= */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="border p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">
                                লেনদেন বিস্তারিত
                              </h4>
                              <div className="text-sm space-y-1">
                                <p>
                                  <span className="text-gray-500">
                                    Transaction ID:{" "}
                                  </span>
                                  {t.transactionId}
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    মোট লোন (Principal):{" "}
                                  </span>
                                  ৳{t.loan.principalAmount}
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    পরিশোধ্য মোট:{" "}
                                  </span>
                                  ৳{t.loan.totalPayableAmount}
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    মোবাইল:{" "}
                                  </span>
                                  {t.loan.borrower?.mobile1}
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-2">
                                পরিশোধিত কিস্তি সমূহ
                              </h4>
                              <ul className="text-sm space-y-2">
                                {t.items.map((it) => (
                                  <li
                                    key={it.id}
                                    className="border rounded-lg p-2 bg-white flex items-center justify-between"
                                  >
                                    <span>
                                      কিস্তি #{it.installment.installmentNo} —{" "}
                                      {BN_MONTHS[it.installment.month]}{" "}
                                      {it.installment.year}
                                    </span>
                                    <span className="font-medium">
                                      ৳{it.amount}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            {!loading && paginatedTransactions.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Prev
          </button>

          <div className="flex items-center gap-1">
            {pages.map((item, index) =>
              item === "..." ? (
                <span
                  key={`dots-${index}`}
                  className="w-9 h-9 flex items-center justify-center text-gray-500"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    page === item
                      ? "bg-green-600 text-white shadow-sm"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* ================= CONFIRM MODAL — Reverse / Delete দুটোর জন্যই ================= */}
      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full">
            <div
              className={`flex items-center gap-2 mb-3 ${
                actionType === "reverse" ? "text-orange-600" : "text-red-600"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">
                {actionType === "reverse"
                  ? "লেনদেন রিভার্স করবেন?"
                  : "লেনদেন ডিলিট করবেন?"}
              </h3>
            </div>

            {actionType === "reverse" ? (
              <p className="text-sm text-gray-600 mb-4">
                Roshid{" "}
                <span className="font-medium">#{confirmTarget.roshidNo}</span>{" "}
                (৳{confirmTarget.totalAmount}) বাতিল হবে এবং সংশ্লিষ্ট কিস্তি
                আবার Unpaid হয়ে যাবে। এই কাজ ফিরিয়ে নেওয়া যাবে না।
              </p>
            ) : (
              <p className="text-sm text-gray-600 mb-4">
                Roshid{" "}
                <span className="font-medium">#{confirmTarget.roshidNo}</span>{" "}
                (৳{confirmTarget.totalAmount}) সম্পূর্ণভাবে <b>ডিলিট</b> হয়ে
                যাবে (transaction + সব item)। সংশ্লিষ্ট কিস্তি আবার Unpaid
                অবস্থায় ফিরে যাবে। এই কাজ ফিরিয়ে নেওয়া যাবে না।
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmTarget(null)}
                disabled={processingId === confirmTarget.id}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={processingId === confirmTarget.id}
                className={
                  actionType === "reverse"
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
              >
                {processingId === confirmTarget.id ? (
                  actionType === "reverse" ? (
                    "Reversing..."
                  ) : (
                    "Deleting..."
                  )
                ) : (
                  <span className="flex items-center gap-1">
                    {actionType === "reverse" ? (
                      <>
                        <Undo2 className="w-4 h-4" />
                        নিশ্চিত করুন
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        নিশ্চিত করুন
                      </>
                    )}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanTransactionsList;
