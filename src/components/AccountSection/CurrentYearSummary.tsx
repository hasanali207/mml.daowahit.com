"use client";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

const monthNames = [
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

interface MonthlySummaryRow {
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function CurrentYearSummary() {
  const currentYear = new Date().getFullYear();

  const [currentYearSummary, setCurrentYearSummary] = useState<{
    year: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
  } | null>(null);

  const [allYearsSummary, setAllYearsSummary] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryRow[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCurrentYearSummary = async () => {
    try {
      setLoadingCurrent(true);
      const res = await api.get("/api/v1/accounts/summary/total/current-year");
      setCurrentYearSummary(res.data.data);
    } finally {
      setLoadingCurrent(false);
    }
  };

  const fetchAllYearsSummary = async () => {
    try {
      setLoadingAll(true);
      const res = await api.get("/api/v1/accounts/summary/yearly");
      setAllYearsSummary(res.data.data);
    } finally {
      setLoadingAll(false);
    }
  };

  const fetchMonthlySummary = async (year: number) => {
    try {
      setLoadingMonthly(true);
      const res = await api.get(
        `/api/v1/accounts/summary/monthly?year=${year}`,
      );
      setMonthlySummary(res.data.data);
    } catch (err) {
      console.error(err);
      setMonthlySummary([]);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const saveCurrentYear = async () => {
    try {
      if (!currentYearSummary) return;
      setSaving(true);
      const res = await api.post("/api/v1/accounts/summary/year/save");
      setCurrentYearSummary(res.data.data.currentYear);
      setAllYearsSummary(res.data.data.allYears);
      alert("Current year summary saved successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchCurrentYearSummary();
    fetchAllYearsSummary();
  }, []);

  useEffect(() => {
    fetchMonthlySummary(selectedYear);
  }, [selectedYear]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📊 Yearly Account Summary</h1>

      {/* ── Current Year ── */}
      <div className="bg-gray-50 p-4 rounded shadow space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Current Year ({currentYear})
          </h2>
          <button
            onClick={saveCurrentYear}
            className={`bg-blue-600 text-white px-4 py-2 rounded ${
              saving ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Current Year"}
          </button>
        </div>

        {loadingCurrent ? (
          <p className="text-blue-600">Loading current year...</p>
        ) : currentYearSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded text-center">
              <p className="font-medium">সর্বমোট আয়</p>
              <p className="text-2xl font-bold text-green-700">
                ৳ {currentYearSummary.totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded text-center">
              <p className="font-medium">সর্বমোট ব্যয়</p>
              <p className="text-2xl font-bold text-red-700">
                ৳ {currentYearSummary.totalExpense.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded text-center">
              <p className="font-medium">Balance</p>
              <p className="text-2xl font-bold text-gray-800">
                ৳ {currentYearSummary.balance.toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <p>No data available.</p>
        )}
      </div>

      {/* ── Monthly Summary (middle section) ── */}
      <div className="bg-gray-50 p-4 rounded shadow space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Monthly Summary</h2>

          {/* Year selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Year:</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border p-1.5 rounded w-24 text-sm"
              min={2000}
              max={currentYear + 5}
            />
          </div>
        </div>

        {loadingMonthly ? (
          <p className="text-blue-600">Loading monthly data...</p>
        ) : monthlySummary.length > 0 ? (
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2 text-left">মাস</th>
                <th className="border px-4 py-2">মোট মাসিক আয়</th>
                <th className="border px-4 py-2">মোট মাসিক ব্যয়</th>
                <th className="border px-4 py-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {monthlySummary.map((m) => (
                <tr key={m.month} className="hover:bg-gray-50">
                  <td className="border px-4 py-2 font-medium">
                    {monthNames[m.month]}
                  </td>
                  <td className="border px-4 py-2 text-green-700 text-right">
                    ৳ {m.totalIncome.toLocaleString()}
                  </td>
                  <td className="border px-4 py-2 text-red-700 text-right">
                    ৳ {m.totalExpense.toLocaleString()}
                  </td>
                  <td
                    className={`border px-4 py-2 text-right font-semibold ${
                      m.balance >= 0 ? "text-gray-800" : "text-red-600"
                    }`}
                  >
                    ৳ {m.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold">
              <tr>
                <td className="border px-4 py-2">Sub Total</td>
                <td className="border px-4 py-2 text-right">
                  ৳{" "}
                  {monthlySummary
                    .reduce((acc, m) => acc + m.totalIncome, 0)
                    .toLocaleString()}
                </td>
                <td className="border px-4 py-2 text-right">
                  ৳{" "}
                  {monthlySummary
                    .reduce((acc, m) => acc + m.totalExpense, 0)
                    .toLocaleString()}
                </td>
                <td className="border px-4 py-2 text-right">
                  ৳{" "}
                  {monthlySummary
                    .reduce((acc, m) => acc + m.balance, 0)
                    .toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p>No monthly data available for {selectedYear}.</p>
        )}
      </div>

      {/* ── All Years ── */}
      <div className="bg-gray-50 p-4 rounded shadow space-y-4">
        <h2 className="text-xl font-semibold">All Years Summary</h2>

        {loadingAll ? (
          <p className="text-blue-600">Loading all years...</p>
        ) : allYearsSummary.length > 0 ? (
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">বছর</th>
                <th className="border px-4 py-2">মোট আয়</th>
                <th className="border px-4 py-2">মোট ব্যয়</th>
                <th className="border px-4 py-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {allYearsSummary.map((y) => (
                <tr
                  key={y.year}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedYear(y.year)}
                  title={`Click to view ${y.year} monthly breakdown`}
                >
                  <td className="border px-4 py-2 text-blue-600 font-medium">
                    {y.year}
                  </td>
                  <td className="border px-4 py-2">
                    ৳ {y.totalIncome.toLocaleString()}
                  </td>
                  <td className="border px-4 py-2">
                    ৳ {y.totalExpense.toLocaleString()}
                  </td>
                  <td className="border px-4 py-2">
                    ৳ {y.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold">
              <tr>
                <td className="border px-4 py-2 text-center">Sub Total</td>
                <td className="border px-4 py-2">
                  ৳{" "}
                  {allYearsSummary
                    .reduce((acc, y) => acc + y.totalIncome, 0)
                    .toLocaleString()}
                </td>
                <td className="border px-4 py-2">
                  ৳{" "}
                  {allYearsSummary
                    .reduce((acc, y) => acc + y.totalExpense, 0)
                    .toLocaleString()}
                </td>
                <td className="border px-4 py-2">
                  ৳{" "}
                  {allYearsSummary
                    .reduce((acc, y) => acc + y.balance, 0)
                    .toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p>No yearly data available.</p>
        )}
      </div>
    </div>
  );
}
