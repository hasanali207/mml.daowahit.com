"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import axios from "axios";
import { useEffect, useState } from "react";

type PaymentItem = {
  id: string;
  RoshidNo: string;
  month: string;
  year: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    amount: number;
    feeCategory: { name: string } | null;
  }[];
};

type ApiResponse = {
  data: PaymentItem[];
  meta: { total: number };
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function AllStudentPayments() {
  const [data, setData] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get<ApiResponse>(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/pay/getallpayments`,
        {
          params: {
            page,
            limit,
            month: month || undefined,
            year: year || undefined,
          },
        },
      );
      setData(res.data.data || []);
      setTotalPages(res.data.meta ? Math.ceil(res.data.meta.total / limit) : 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, month, year]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("এই পেমেন্টটি মুছে ফেলবেন?")) return;
    try {
      await api.delete(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/delete/paidwrongpayments/${id}`,
      );
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setMonth("");
    setYear("");
    setPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">পেমেন্ট তালিকা</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            সকল শিক্ষার্থীর পেমেন্ট রেকর্ড
          </p>
        </div>
        <span className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full border border-blue-100">
          পৃষ্ঠা {page} / {totalPages}
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">মাস</label>
          <Select
            value={month}
            onValueChange={(val) => {
              setMonth(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] bg-gray-50">
              <SelectValue placeholder="মাস বেছে নিন" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">বছর</label>
          <Select
            value={year}
            onValueChange={(val) => {
              setYear(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[120px] bg-gray-50">
              <SelectValue placeholder="বছর" />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(month || year) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="self-end"
          >
            ✕ রিসেট
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-800 text-left">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">রশিদ নং</th>
                <th className="px-4 py-3 font-semibold">মাস / বছর</th>
                <th className="px-4 py-3 font-semibold">মোট পরিমাণ</th>
                <th className="px-4 py-3 font-semibold">ফি বিবরণ</th>
                <th className="px-4 py-3 font-semibold">স্ট্যাটাস</th>
                <th className="px-4 py-3 font-semibold">তারিখ</th>
                <th className="px-4 py-3 font-semibold text-right">একশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span>লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-3xl">📭</span>
                      <span>কোনো পেমেন্ট পাওয়া যায়নি</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {(page - 1) * limit + index + 1}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-700">
                      {item.RoshidNo}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.month} / {item.year}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-700">
                      ৳ {item.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {item.items?.map((i) => (
                          <span key={i.id} className="text-xs text-gray-500">
                            <span className="font-medium text-gray-700">
                              {i.feeCategory?.name || "অজানা ফি"}
                            </span>
                            {" — "}৳ {i.amount}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.status === "PAID"
                            ? "bg-secondary text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.status === "PAID" ? "✓ পরিশোধিত" : "⏳ বাকি"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(item.createdAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleDelete(item.id)}
                      >
                        🗑️ মুছুন
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
        >
          «
        </button>
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
        >
          ‹ আগে
        </button>

        <div className="flex gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-lg text-sm border transition ${
                  page === pageNum
                    ? "bg-blue-600 text-white border-blue-600 font-semibold"
                    : "hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
        >
          পরে ›
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
        >
          »
        </button>
      </div>
    </div>
  );
}
