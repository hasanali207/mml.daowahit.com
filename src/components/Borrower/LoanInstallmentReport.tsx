"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPagination } from "@/lib/getPageNumber";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/* ================= TYPES ================= */
type ReportStatus = "PAID" | "UNPAID";

interface IInstallmentReport {
  id: string;
  installmentNo: number;
  month: number;
  year: number;
  amount: number;
  principalAmount: number;
  profitAmount: number;
  paidAmount: number;
  status: string;
  loan: {
    principalAmount: number;
    profitRate: number;
    profitAmount: number;
    totalPayableAmount: number;
    monthlyInstallment: number;
    totalInstallments: number;
    borrower: {
      name: string;
      code?: string;
      fatherName?: string;
      motherName?: string;
      mobile1?: string;
      mobile2?: string;
    };
  };
  items: {
    feeName: string;
    transaction: {
      totalAmount: number;
      method: string;
      receivedBy: string;
      receivedAt: string;
      roshidNo: string;
    };
  }[];
}

interface IOverviewStats {
  totalActiveLoans: number;
  totalPrincipal: number;
  totalProfit: number;
  totalPayable: number;
  totalCollected: number;
  totalUnpaidDue: number;
  totalUnpaidInstallments: number;
  totalPaidInstallments: number;
  currentMonth: number;
  currentYear: number;
  currentMonthDueAmount: number;
  currentMonthUnpaidCount: number;
}

const monthNames = [
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

/* ================= STAT CARD ================= */
function StatCard({
  label,
  value,
  color = "bg-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className={`${color} border rounded-xl p-4 shadow-sm`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
const LoanInstallmentReport = () => {
  const [reportType, setReportType] = useState<ReportStatus>("PAID");
  const [installments, setInstallments] = useState<IInstallmentReport[]>([]);
  const [loading, setLoading] = useState(false);

  /* stats */
  const [stats, setStats] = useState<IOverviewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  /* filter */
  const [searchTerm, setSearchTerm] = useState("");

  /* pagination */
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const pages = getPagination(page, totalPages);

  /* ================= FETCH STATS ================= */
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/loan/overview/stats`,
      );
      const data = await res.json();
      setStats(data.data || null);
    } catch (err) {
      console.error("Fetch stats error:", err);
      toast.error("Failed to load overview stats");
    } finally {
      setLoadingStats(false);
    }
  };

  /* ================= FETCH REPORT ================= */
  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint =
        reportType === "PAID"
          ? "/api/v1/loan/installment/paid"
          : "/api/v1/loan/installment/unpaid";

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}${endpoint}?page=1&limit=2000`,
      );
      const data = await res.json();
      setInstallments(data.data || []);
      setTotalPages(Math.ceil((data.data?.length || 0) / limit));
      setPage(1);
    } catch (err) {
      console.error("Fetch report error:", err);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const filtered = installments.filter((i) =>
    searchTerm
      ? i.loan.borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.loan.borrower.code?.toLowerCase().includes(searchTerm.toLowerCase())
      : true,
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Loan Installment Report
      </h2>

      {/* OVERVIEW STATS */}
      {loadingStats && (
        <p className="text-center py-4 text-gray-500">লোড হচ্ছে...</p>
      )}
      {!loadingStats && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="সক্রিয় লোন সংখ্যা"
            value={String(stats.totalActiveLoans)}
          />
          <StatCard
            label="মোট আসল বিতরণ"
            value={`৳${stats.totalPrincipal.toLocaleString()}`}
          />
          <StatCard
            label="মোট প্রত্যাশিত মুনাফা"
            value={`৳${stats.totalProfit.toLocaleString()}`}
            color="bg-emerald-50"
          />
          <StatCard
            label="মোট পরিশোধযোগ্য (আসল+মুনাফা)"
            value={`৳${stats.totalPayable.toLocaleString()}`}
          />
          <StatCard
            label="এ পর্যন্ত মোট আদায়"
            value={`৳${stats.totalCollected.toLocaleString()}`}
            color="bg-accent/10"
          />
          <StatCard
            label="মোট বকেয়া (টাকা)"
            value={`৳${stats.totalUnpaidDue.toLocaleString()}`}
            color="bg-red-50"
          />
          <StatCard
            label="পরিশোধিত কিস্তি সংখ্যা"
            value={String(stats.totalPaidInstallments)}
          />
          <StatCard
            label="বকেয়া কিস্তি সংখ্যা"
            value={String(stats.totalUnpaidInstallments)}
            color="bg-amber-50"
          />
          {/* ==== নতুন: চলতি মাসের বকেয়া ==== */}
          <StatCard
            label={`${monthNames[stats.currentMonth - 1]} ${stats.currentYear} এর বকেয়া কিস্তি`}
            value={String(stats.currentMonthUnpaidCount)}
            color="bg-orange-50"
          />
          <StatCard
            label={`${monthNames[stats.currentMonth - 1]} ${stats.currentYear} এর বকেয়া টাকা`}
            value={`৳${stats.currentMonthDueAmount.toLocaleString()}`}
            color="bg-orange-100"
          />
        </div>
      )}

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-white p-5 rounded-xl shadow">
        <Select
          value={reportType}
          onValueChange={(v) => setReportType(v as ReportStatus)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="text"
          placeholder="Search Borrower Name / Code"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm min-w-[1000px]">
          <thead className="bg-secondary text-white">
            <tr>
              {[
                "Borrower",
                "Installment No",
                "Month/Year",
                "Principal",
                "Profit",
                "Total Amount",
                "Paid Amount",
                "Roshid No",
                "Method",
                "Received At",
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
                <td colSpan={10} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              paginated.map((i) => (
                <tr key={i.id} className="odd:bg-gray-50 hover:bg-blue-50">
                  <td className="border p-2">
                    {i.loan.borrower.name} ({i.loan.borrower.code})
                  </td>
                  <td className="border p-2">{i.installmentNo}</td>
                  <td className="border p-2">
                    {monthNames[i.month - 1]} {i.year}
                  </td>
                  <td className="border p-2">
                    ৳{i.principalAmount?.toFixed(2)}
                  </td>
                  <td className="border p-2">৳{i.profitAmount?.toFixed(2)}</td>
                  <td className="border p-2">৳{i.amount?.toFixed(2)}</td>
                  <td className="border p-2">৳{i.paidAmount?.toFixed(2)}</td>
                  <td className="border p-2">
                    {i.items?.[0]?.transaction?.roshidNo || "-"}
                  </td>
                  <td className="border p-2">
                    {i.items?.[0]?.transaction?.method || "-"}
                  </td>
                  <td className="border p-2">
                    {i.items?.[0]?.transaction?.receivedAt
                      ? new Date(
                          i.items[0].transaction.receivedAt,
                        ).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                </tr>
              ))}
            {!loading && paginated.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-4">
                  No records found
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
    </div>
  );
};

export default LoanInstallmentReport;
