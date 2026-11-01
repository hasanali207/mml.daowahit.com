"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { useState } from "react";

// ==================== TYPES ====================
type ExpenseAllocation = {
  expenseCategory: string;
  requested: number;
  allocated: number;
  unpaid: number;
};

type ReportItem = {
  incomeCategory: string;
  incomeTotal: number;
  allocatedExpense: number;
  balance: number;
  expenseAllocation: ExpenseAllocation[];
};

// ==================== COMPONENT ====================
export default function AllocationReport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportItem[]>([]);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      setError("Both From and To dates are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.get(
        `/api/v1/allocation/category-allocation?fromDate=${fromDate}&toDate=${toDate}`
      );

      if (res.data.success) {
        setReport(res.data.data);
      } else {
        setError(res.data.message || "Failed to fetch report");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ===== Title ===== */}
      <h1 className="text-2xl font-bold">Category Wise Allocation Report</h1>

      {/* ===== Date Range Picker ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex flex-col">
            <label htmlFor="fromDate">From</label>
            <Input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="toDate">To</label>
            <Input
              type="date"
              id="toDate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <Button
            className="mt-4 md:mt-0"
            onClick={fetchReport}
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch Report"}
          </Button>
        </CardContent>
      </Card>

      {/* ===== Error ===== */}
      {error && <p className="text-red-600 font-medium">{error}</p>}

      {/* ===== Report Table ===== */}
      {report.length > 0 && (
        <div className="overflow-x-auto bangla">
          <table className="min-w-full border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
              <tr>
                <th className="border px-4 py-3 text-left">আয়ের ধরন</th>
                <th className="border px-4 py-3 text-right">মোট আয়</th>
                <th className="border px-4 py-3 text-right">মোট ব্যয়</th>
                <th className="border px-4 py-3 text-right">ব্যালেন্স</th>
                <th className="border px-4 py-3 text-center">ব্যয়ের বণ্টন</th>
              </tr>
            </thead>

            <tbody>
              {report.map((r, idx) => (
                <tr
                  key={r.incomeCategory}
                  className={`hover:bg-gray-50 transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  }`}
                >
                  <td className="border px-4 py-3 text-xl text-gray-800">
                    {r.incomeCategory}
                  </td>

                  <td className="border px-4 py-3 text-right font-medium">
                    {r.incomeTotal}
                  </td>

                  <td className="border px-4 py-3 text-right text-red-600 font-medium">
                    {r.allocatedExpense}
                  </td>

                  <td
                    className={`border px-4 py-3 text-right font-semibold ${
                      r.balance >= 0 ? "text-blue-600" : "text-red-600"
                    }`}
                  >
                    {r.balance}
                  </td>

                  {/* ===== Nested Expense Table ===== */}
                  <td className="border px-3 py-3 bg-gray-50">
                    <table className="w-full border border-gray-200 rounded-md overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr className="text-sm text-gray-600">
                          <th className="px-2 py-2 text-left">ব্যয়ের খাত</th>
                          <th className="px-2 py-2 text-right">
                            ব্যয়ের পরিমাণ
                          </th>
                          <th className="px-2 py-2 text-right">আয় থেকে ব্যয়</th>
                          <th className="px-2 py-2 text-right">ঋণ</th>
                        </tr>
                      </thead>

                      <tbody>
                        {r.expenseAllocation.map((e) => (
                          <tr
                            key={e.expenseCategory}
                            className={`hover:bg-gray-50 transition ${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                            }`}
                          >
                            <td className="px-2 py-2 font-medium">
                              {e.expenseCategory}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {e.requested}
                            </td>
                            <td className="px-2 py-2 text-right text-green-600">
                              {e.allocated}
                            </td>
                            <td className="px-2 py-2 text-right text-red-600">
                              {e.unpaid}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
