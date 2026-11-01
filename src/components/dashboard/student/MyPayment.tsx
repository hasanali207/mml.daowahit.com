"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

type PaymentItem = {
  id: string;
  studentId: string;
  admissionId: string;
  sessionId: string;
  month: number;
  year: number;
  status: string;
  paidAmount: number;
  transactionId: string;
  items: {
    id: string;
    feeCategoryId: string;
    amount: number;
    status: string;
    feeCategory: { name: string };
  }[];
  session: { id: string; name: string };
};

const statusStyle: Record<string, { badge: string; label: string }> = {
  PAID: { badge: "bg-emerald-100 text-emerald-700", label: "পরিশোধ" },
  PARTIAL: { badge: "bg-amber-100 text-amber-700", label: "আংশিক" },
  PENDING: { badge: "bg-red-100 text-red-600", label: "বাকি" },
  UNPAID: { badge: "bg-red-100 text-red-600", label: "বাকি" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusStyle[status] ?? {
    badge: "bg-slate-100 text-slate-600",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badge}`}
    >
      {status === "PAID" ? "✓" : status === "PARTIAL" ? "~" : "✗"} {cfg.label}
    </span>
  );
}

// ── Mobile card ────────────────────────────────────────────────────────────
function PaymentCard({
  p,
  idx,
  onPay,
}: {
  p: PaymentItem;
  idx: number;
  onPay: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const total = p.items.reduce((s, i) => s + i.amount, 0);
  const isPaid = p.status === "PAID";

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${isPaid ? "border-emerald-100" : "border-red-100"}`}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${isPaid ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
          >
            {idx + 1}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {p.month} {p.year}
            </p>
            <p className="text-xs text-slate-400">{p.session?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-sm font-black text-slate-800 tabular-nums">
              ৳{total.toLocaleString()}
            </p>
            <p
              className={`text-xs font-bold ${isPaid ? "text-emerald-600" : "text-red-500"}`}
            >
              {isPaid ? "পরিশোধ হয়েছে" : "বাকি আছে"}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Fee Breakdown
          </p>
          {p.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-slate-600">
                {item.feeCategory?.name || "Unknown Fee"}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  ৳{item.amount}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.status === "PAID"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.status === "PARTIAL"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-600"
                  }`}
                >
                  {item.status === "PAID"
                    ? "পরিশোধ"
                    : item.status === "PARTIAL"
                      ? "আংশিক"
                      : "বাকি"}
                </span>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
            <span className="text-sm font-black text-slate-700">মোট</span>
            <span className="text-sm font-black text-slate-800">
              ৳{total.toLocaleString()}
            </span>
          </div>
          {p.status === "PENDING" && (
            <button
              onClick={() => onPay(p.id)}
              className="mt-1 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
            >
              এখনই পরিশোধ করুন
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function StudentPaymentPage() {
  const token = useSelector((state: any) => state.auth.token);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/payment/student/me`);
        setPayments(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        toast.error("Failed to fetch payments");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [token]);

  const handlePay = async (id: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify({ id }),
        },
      );
      const json = await res.json();
      if (json.success && json.data?.paymentUrl) {
        window.location.href = json.data.paymentUrl;
      } else {
        toast.error(
          "অনলাইন পেমেন্ট নিয়ে কাজ চলমান অপেক্ষা করুন। বর্তমানে অফিসে এসে পেমেন্ট করতে হবে।",
        );
      }
    } catch {
      toast.error(
        "অনলাইন পেমেন্ট নিয়ে কাজ চলমান অপেক্ষা করুন। বর্তমানে অফিসে এসে পেমেন্ট করতে হবে",
      );
    }
  };

  if (!mounted) return null;

  // ── Stats ──
  const unpaidAmount = payments
    .filter((p) => p.status !== "PAID")
    .reduce((s, p) => s + p.items.reduce((a, i) => a + i.amount, 0), 0);
  const unpaidMonths = payments.filter((p) => p.status !== "PAID").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800">
                💳 My Academic Payments List
              </h1>

              <p className="text-slate-500 mt-1">
                Academic Year {new Date().getFullYear()}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold">
                Total Records: {payments.length}
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bangla">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-400 to-rose-400 text-white p-6 shadow-lg">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

            <p className="text-sm opacity-80">মোট বাকি</p>

            <h2 className="text-4xl font-black mt-2">
              ৳{unpaidAmount.toLocaleString()}
            </h2>

            <p className="mt-3 text-white/80">{unpaidMonths} মাস বাকি</p>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 text-white p-6 shadow-lg">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

            <p className="text-sm opacity-80">পরিশোধিত</p>

            <h2 className="text-4xl font-black mt-2">
              {payments.filter((p) => p.status === "PAID").length}
            </h2>

            <p className="mt-3 text-white/80">Successful Payments</p>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 shadow-lg">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

            <p className="text-sm opacity-80">মোট রেকর্ড</p>

            <h2 className="text-4xl font-black mt-2">{payments.length}</h2>

            <p className="mt-3 text-white/80">Available Records</p>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />

            <p className="mt-4 text-slate-500">Payment data loading...</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && payments.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="text-6xl mb-4">📭</div>

            <h3 className="text-xl font-bold text-slate-700">
              কোন পেমেন্ট পাওয়া যায়নি
            </h3>

            <p className="text-slate-400 mt-2">
              বর্তমানে আপনার কোন পেমেন্ট রেকর্ড নেই
            </p>
          </div>
        )}
        {/* ── Desktop Table ── */}
        {!loading && payments.length > 0 && (
          <div className="hidden md:block overflow-hidden border border-slate-200 bg-white">
            <div className="px-6 py-5 border-b bg-gradient-to-r from-slate-50 to-blue-50">
              <h2 className="font-black text-slate-700">
                📋 সকল পেমেন্ট তালিকা
              </h2>
            </div>
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50 border-b">
                  {[
                    "#",
                    "Session",
                    "Month / Year",
                    "Fee Breakdown",
                    "Total",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="border border-slate-300 bg-slate-100 p-3 text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p, idx) => {
                  const total = p.items.reduce((s, i) => s + i.amount, 0);
                  const isPaid = p.status === "PAID";
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/50  transition-all  duration-300"
                    >
                      <td className="border border-slate-300 p-3">
                        <span className="**:w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="border border-slate-300 p-3">
                        <span className="line-clamp-2 text-sm leading-snug">
                          {p.session?.name ?? "—"}
                        </span>
                      </td>
                      <td className="border border-slate-300 p-3">
                        <p className="font-bold text-slate-800 text-sm">
                          {p.month}
                        </p>
                        <p className="text-xs text-slate-400">{p.year}</p>
                      </td>
                      <td className="border border-slate-300 p-3">
                        <div className="space-y-1.5">
                          {p.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 text-xs"
                            >
                              <span className="text-sm">
                                {item.feeCategory?.name || "Unknown"}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className=" tabular-nums">
                                  ৳{item.amount}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    item.status === "PAID"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : item.status === "PARTIAL"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-red-100 text-red-600"
                                  }`}
                                >
                                  {item.status === "PAID"
                                    ? "পরিশোধ"
                                    : item.status === "PARTIAL"
                                      ? "আংশিক"
                                      : "বাকি"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-3">
                        <div className="font-bold text-lg text-slate-800">
                          ৳{total.toLocaleString()}
                        </div>

                        <p
                          className={`text-xs mt-1 ${
                            isPaid ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {isPaid ? "পরিশোধিত" : "অপরিশোধিত"}
                        </p>
                      </td>
                      <td className="border border-slate-300 p-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="border border-slate-300 p-3">
                        {p.status === "PENDING" || p.status === "PARTIAL" ? (
                          <Button
                            onClick={() => handlePay(p.id)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs  rounded-lg transition-colors shadow-sm shadow-emerald-200 cursor-pointer"
                          >
                            Pay Now
                          </Button>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                            ✓ Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Mobile Cards ── */}
        {!loading && payments.length > 0 && (
          <div className="md:hidden space-y-4">
            {payments.map((p, i) => (
              <PaymentCard key={p.id} p={p} idx={i} onPay={handlePay} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
