"use client";

import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/getErrorMessage ";
import { getPagination } from "@/lib/getPageNumber";
import { formatDateBn } from "@/utils/dateBn";
import { ArrowLeft, ArrowRight, FileSpreadsheet, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

/* ---------------- Types ---------------- */
type Donation = {
  id: string;
  donorName: string;
  receiptNo: string;
  totalAmount: number;
  createdAt: string;
  items: { title: string; amount: number }[];
};

/* ---------------- Component ---------------- */
export default function DonationReportAdvanced() {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<Donation[]>([]);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  /* ---------------- Fetch ---------------- */

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/api/v1/donations?page=${page}&limit=${limit}`,
      );

      console.log(res.data);

      const { data, meta } = res.data;

      setRawData(data || []);
      setTotalPages(Math.ceil(meta.total / limit));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  /* ---------------- Process + Filter ---------------- */
  const processed = useMemo(() => {
    let matched: any[] = [];
    let unmatched: any[] = [];

    let matchedSum = 0;
    let unmatchedSum = 0;

    let fundMap: Record<string, number> = {};

    const filtered = rawData.filter((d) => {
      const matchSearch =
        d.donorName?.toLowerCase().includes(search.toLowerCase()) ||
        d.receiptNo.includes(search);

      const date = new Date(d.createdAt).getTime();
      const from = fromDate ? new Date(fromDate).getTime() : null;
      const to = toDate ? new Date(toDate).getTime() : null;

      const matchDate = (!from || date >= from) && (!to || date <= to);

      return matchSearch && matchDate;
    });

    filtered.forEach((d) => {
      const itemSum = d.items.reduce((s, i) => s + i.amount, 0);
      const isMatched = itemSum === d.totalAmount;

      /* Fund breakdown */
      d.items.forEach((i) => {
        fundMap[i.title] = (fundMap[i.title] || 0) + i.amount;
      });

      const titles = d.items.map((i) => i.title).join(", ");

      const row = { ...d, itemSum, status: isMatched, titles };

      if (isMatched) {
        matched.push(row);
        matchedSum += d.totalAmount;
      } else {
        unmatched.push(row);
        unmatchedSum += d.totalAmount;
      }
    });

    return {
      matched,
      unmatched,
      matchedSum,
      unmatchedSum,
      fundMap,
      all: [...matched, ...unmatched],
    };
  }, [rawData, search, fromDate, toDate]);

  /* ---------------- Export Excel ---------------- */
  const exportExcel = () => {
    const rows = processed.all.map((d) => ({
      Receipt: d.receiptNo,
      Donor: d.donorName,
      Total: d.totalAmount,
      ItemSum: d.itemSum,
      Status: d.status ? "Matched" : "Unmatched",
    }));

    const csv =
      "Receipt,Donor,Total,ItemSum,Status\n" +
      rows
        .map((r) =>
          Object.values(r)
            .map((v) => `"${v}"`)
            .join(","),
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "donation_report.csv";
    a.click();
  };

  /* ---------------- Print ---------------- */
  const handlePrint = () => {
    window.print();
  };
  const pages = getPagination(page, totalPages);

  if (loading) return <p className="text-center p-10">Loading...</p>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto print:p-0">
      <h1 className="text-2xl font-bold mb-4 text-center">Donation Report</h1>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            type="text"
            placeholder="Search donor / receipt"
            className="border p-2 rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Input
            type="date"
            className="border p-4 rounded"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <Input
            type="date"
            className="border p-2 rounded"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end items-end">
        <TooltipProvider>
          <div className="flex items-center gap-1 rounded-xl border bg-background p-1 shadow-sm mb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrint}
                  className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <FileText className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download PDF</p>
              </TooltipContent>
            </Tooltip>

            <div className="h-5 w-px bg-border" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={exportExcel}
                  className="h-9 w-9 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download Excel</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm min-w-[800px]">
          <thead className="bg-secondary text-white">
            <tr>
              <th className="p-2 border">SL</th>
              <th className="p-2 border">Invoice No.</th>
              <th className="p-2 border">Donor</th>
              <th className="p-2 border">Mobile</th>
              <th className="p-2 border">Fund</th>
              <th className="p-2 border">Total</th>
              <th className="p-2 border">Date</th>
            </tr>
          </thead>

          <tbody>
            {processed.all.map((d, i) => (
              <tr key={d.id} className="border-t">
                <td className="p-2 border">{(page - 1) * limit + i + 1}</td>
                <td className="p-2 border">{d.receiptNo}</td>
                <td className="p-2 border">{d.donorName}</td>
                <td className="p-2 border">{d.mobile}</td>

                {/* 👇 Fund Titles */}
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {d.items.map((i: any, index: number) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                      >
                        {i.title}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="p-2 border">{d.totalAmount}</td>
                <td className="p-2 border"> {formatDateBn(d.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ArrowLeft /> Prev
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
            Next <ArrowRight />
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <div className="bg-blue-100 p-4 rounded">
          Matched: {processed.matchedSum}
        </div>
        <div className="bg-red-100 p-4 rounded">
          Unmatched: {processed.unmatchedSum}
        </div>
      </div>

      {/* Fund Breakdown */}
      <div className="mt-6">
        <h2 className="font-bold mb-2">Fund Breakdown</h2>
        <table className="w-full border">
          <tbody>
            {Object.entries(processed.fundMap).map(([k, v]) => (
              <tr key={k} className="border-t">
                <td className="p-2">{k}</td>
                <td className="p-2 text-right">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PDF Note */}
      <p className="text-xs text-gray-500 mt-4">
        👉 PDF export: use Print → Save as PDF
      </p>
    </div>
  );
}
