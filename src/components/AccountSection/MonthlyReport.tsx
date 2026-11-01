"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import { toBanglaNumber } from "@/utils/toBanglaNumber";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// =========================
// TYPES
// =========================

interface CategoryRow {
  day: number;

  // income
  roshids?: string[];
  cuttingRoshids?: string[];

  // expense
  voucherNos?: string[];
  summaryNos?: string[];

  [key: string]: any;

  rowTotal: number;
}

interface ReportData {
  categories: string[];
  categoryLabels: Record<string, string>;
  rows: CategoryRow[];
  bottomTotals: Record<string, number>;
  monthGrandTotal: number;
  bottomGrandTotal: number;
  previousGrandTotal: number;
}

interface PendingItem {
  id: string;
  date: string;
  amount: number;
  categoryName?: string;
  category?: { name: string };
  description?: string;
}
// =========================
// MONTHS
// =========================

const monthNames = [
  "",
  "জানুয়ারি",
  "ফেব্রুয়ারি",
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

// =========================
// COMPONENT
// =========================
// =========================
// PENDING PANEL
// =========================

function PendingPanel({ type }: { type: "income" | "expense" }) {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const url =
        type === "income"
          ? "/api/v1/income/getincome/pending"
          : "/api/v1/expense/getexpense/pending";
      const res = await api.get(url);
      const data: PendingItem[] = res.data.data;
      setItems(data);
      setTotal(res.data.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [type]);

  const totalAmount = items.reduce((acc, i) => acc + i.amount, 0);
  const isIncome = type === "income";
  const colorClass = isIncome ? "text-green-700" : "text-red-700";
  const bgClass = isIncome
    ? "bg-green-50 border-green-200"
    : "bg-red-50 border-red-200";
  const badgeBg = isIncome
    ? "bg-accent text-white p"
    : "bg-red-100 text-red-800";

  return (
    /* relative here so the absolute dropdown is positioned against this box */
    <div className={`relative border rounded-lg p-3 ${bgClass} min-w-[180px]`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500 font-medium">
            {isIncome ? "Pending Income" : "Pending Expense"}
          </p>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <p className={`text-lg font-bold ${colorClass}`}>
              ৳ {totalAmount.toLocaleString()}
            </p>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeBg}`}
          >
            {total} টি pending
          </span>
        </div>
        <Link
          href={
            isIncome
              ? "/superadmin/accountant/accounts/pendingincome"
              : "/superadmin/accountant/accounts/pendingexpense"
          }
          className="text-xs underline text-gray-500 hover:text-gray-800 whitespace-nowrap self-start mt-1"
        >
          দেখো
        </Link>
      </div>
    </div>
  );
}

export default function MonthlyReportTabs() {
  const [type, setType] = useState<"income" | "expense">("income");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";
  // =========================
  // FETCH
  // =========================

  const fetchReport = async () => {
    setLoading(true);

    try {
      const res = await api.get(
        `/api/v1/accounts/dawah/system/monthlyreport?type=${type}&month=${month}&year=${year}`,
      );

      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // type change
  useEffect(() => {
    fetchReport();
  }, [type]);

  // month/year debounce
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchReport();
    }, 5000);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [month, year]);

  // =========================
  // UI
  // =========================

  return (
    <div className="p-4 space-y-4">
      {/* ========================= */}
      {/* TYPE SWITCH */}
      {/* ========================= */}

      <div className="flex gap-2">
        <button
          onClick={() => setType("income")}
          className={`px-4 py-2 rounded font-medium transition ${
            type === "income"
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Income
        </button>

        <button
          onClick={() => setType("expense")}
          className={`px-4 py-2 rounded font-medium transition ${
            type === "expense"
              ? "bg-accent text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Expense
        </button>
      </div>

      {/* ========================= */}
      {/* MONTH SELECT */}
      {/* ========================= */}

      <div className="flex gap-4 items-center">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border p-2 rounded"
        >
          {monthNames.map(
            (m, i) =>
              i > 0 && (
                <option key={i} value={i}>
                  {m}
                </option>
              ),
          )}
        </select>

        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2 rounded w-24"
        />
      </div>

      {/* ========================= */}
      {/* LOADING */}
      {/* ========================= */}

      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow animate-pulse">
            Loading...
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* EMPTY */}
      {/* ========================= */}

      {!loading && !data && <p className="text-center mt-10">No data found</p>}

      {/* ========================= */}
      {/* TABLE */}
      {/* ========================= */}

      {data && (
        <Card className="overflow-x-auto p-4">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              {monthNames[month]} {year} -{" "}
              {type === "income" ? "আয়ের" : "ব্যয়ের"} হিসাব
            </CardTitle>
          </CardHeader>

          {/* ========================= */}
          {/* INSTITUTE */}
          {/* ========================= */}
          {/* INSTITUTE + PENDING PANEL */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            {/* Institute name (left) */}
            <div className="flex-1 text-center">
              <h1 className="text-2xl bangla"> {instituteName}</h1>
              <p className="text-xl bangla">
                {address || "মাষ্টারপাড়া, তুষভান্ডার, কালিগঞ্জ, লালমনিরহাট।"}
              </p>
            </div>

            {/* Pending panel (right) — changes with type */}
            <PendingPanel key={type} type={type} />
          </div>

          <CardContent>
            <div className="relative overflow-auto">
              <table className="min-w-full table-auto border text-sm">
                {/* ========================= */}
                {/* HEADER */}
                {/* ========================= */}

                <thead className="bg-gray-100 sticky top-0 z-20">
                  <tr>
                    <th className="border p-2 sticky left-0 bg-gray-100 z-30">
                      তারিখ
                    </th>

                    {type === "income" ? (
                      <>
                        <th className="border p-2">রশিদ বই নং</th>

                        <th className="border p-2">রশিদ পাতা নং</th>
                      </>
                    ) : (
                      <>
                        <th className="border p-2">সামারী ভাউচার নং</th>

                        <th className="border p-2">সংযুক্ত ভাউচার সংখ্যা</th>
                      </>
                    )}

                    <th className="border p-2 bg-gray-100 font-bold">মোট</th>

                    {data.categories.map((cat) => (
                      <th key={cat} className="border p-2">
                        {data.categoryLabels?.[cat] || cat}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* ========================= */}
                {/* BODY */}
                {/* ========================= */}

                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.day} className="hover:bg-gray-50">
                      {/* DATE */}

                      <td className="border p-2 sticky left-0 bg-white z-10">
                        {toBanglaNumber(row.day)}
                      </td>

                      {/* ========================= */}
                      {/* INCOME */}
                      {/* ========================= */}

                      {type === "income" ? (
                        <>
                          <td className="border p-2 text-xs">
                            {row.roshids?.length ? row.roshids.join(", ") : "-"}
                          </td>

                          <td className="border p-2 text-xs">
                            {row.cuttingRoshids?.length
                              ? row.cuttingRoshids.join(", ")
                              : "-"}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* SUMMARY */}

                          <td className="border p-2 text-xs">
                            {row.summaryNos?.length
                              ? [...new Set(row.summaryNos)].join(", ")
                              : "-"}
                          </td>

                          {/* VOUCHER */}

                          <td className="border p-2 text-xs">
                            {row.voucherNos
                              ? Array.isArray(row.voucherNos)
                                ? row.voucherNos.length
                                : row.voucherNos
                              : "-"}
                          </td>
                        </>
                      )}

                      {/* ========================= */}
                      {/* TOTAL */}
                      {/* ========================= */}

                      <td className="border p-2 text-right font-bold bg-gray-100">
                        {toBanglaNumber(row.rowTotal)}
                      </td>

                      {/* ========================= */}
                      {/* CATEGORY */}
                      {/* ========================= */}

                      {data.categories.map((cat) => (
                        <td key={cat} className="border p-2 text-right">
                          {row[cat] ? toBanglaNumber(row[cat]) : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* ========================= */}
                  {/* TOTAL ROW */}
                  {/* ========================= */}

                  <tr className="bg-gray-100 font-bold">
                    <td className="border p-2 sticky left-0 bg-gray-100 z-10">
                      সর্বমোট
                    </td>

                    {type === "income" ? (
                      <>
                        <td className="border p-2"></td>
                        <td className="border p-2"></td>
                      </>
                    ) : (
                      <>
                        <td className="border p-2"></td>
                        <td className="border p-2"></td>
                      </>
                    )}

                    <td className="border p-2 text-right">
                      {toBanglaNumber(data.monthGrandTotal)}
                    </td>

                    {data.categories.map((cat) => (
                      <td key={cat} className="border p-2 text-right">
                        {toBanglaNumber(data.bottomTotals[cat] || 0)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================= */}
            {/* SUMMARY */}
            {/* ========================= */}

            <div className="mt-4 max-w-2xl font-medium">
              <div className="py-2 px-3 bg-gray-100 rounded">
                এই মাসের মোট: {toBanglaNumber(data.monthGrandTotal)}
              </div>

              <div className="py-2 px-3 mt-2 bg-gray-100 rounded">
                পূর্বের মোট:{" "}
                {toBanglaNumber(data.bottomGrandTotal - data.monthGrandTotal)}
              </div>

              <div className="py-2 px-3 mt-2 bg-gray-100 rounded">
                সর্বমোট:{" "}
                {toBanglaNumber(data.previousGrandTotal + data.monthGrandTotal)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
