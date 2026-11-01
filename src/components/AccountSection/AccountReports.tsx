"use client";

import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import api from "@/lib/axios";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import { formatDateBn } from "@/utils/dateBn";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

export default function AccountReports() {
  /* ================= STATE ================= */
  const [date, setDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { info } = useAcademicInfo();

  const anyInfo = (info ?? {}) as Record<string, any>;

  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";
  /* ================= FETCH REPORT ================= */
  const fetchReport = async () => {
    try {
      setLoading(true);
      setReport(null);

      let url = "/api/v1/accounts/report/category-wise";
      const params: any = {};

      if (fromDate && toDate) {
        url = "/api/v1/accounts/category-wise/date-range";
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else if (date) {
        params.date = date;
      } else {
        params.month = month;
        params.year = year;
      }

      const res = await api.get(url, { params });
      setReport(res.data.data);
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= PDF DOWNLOAD ================= */
  const downloadPdf = async () => {
    if (!report) return;

    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfMake = pdfMakeModule.default;

    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
    pdfMake.fonts = {
      SolaimanLipi: {
        normal: "SolaimanLipi.ttf",
        bold: "SolaimanLipi.ttf",
      },
    };

    // ===== FORMAT & SWAP DATES =====

    let start = fromDate;
    let end = toDate;

    if (fromDate && toDate) {
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);
      if (startDate > endDate) [start, end] = [toDate, fromDate];
      start = formatDateBn(start);
      end = formatDateBn(end);
    }

    const singleDate = date ? formatDateBn(date) : null;

    const docDefinition: any = {
      content: [
        // ===== HEADER =====
        {
          text: instituteName, // Change to your org name
          style: "orgName",
          alignment: "center",
        },
        {
          text: address, // Address
          style: "orgAddress",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 },
          ],
          margin: [0, 0, 0, 10],
        },

        // ===== REPORT DATE INFO =====
        {
          text:
            start && end
              ? `তারিখ: ${start} থেকে ${end}`
              : singleDate
                ? `তারিখ: ${singleDate}`
                : `মাস: ${month}, বছর: ${year}`,
          margin: [0, 0, 0, 10],
          alignment: "center",
        },

        // ===== BALANCE ROW =====
        {
          columns: [
            {
              text: `মোট আয়: ৳ ${report.income.total}`,
              width: "*",
              bold: true,
            },
            {
              text: `মোট ব্যয়: ৳ ${report.expense.total}`,
              width: "*",
              bold: true,
            },
            {
              text: `জমার পরিমাণ: ৳ ${report.balance}`,
              width: "*",
              bold: true,
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 15],
        },

        // ===== INCOME TABLE =====
        { text: "আয় (খাত অনুযায়ী)", style: "subHeader" },
        {
          table: {
            widths: ["*", "auto"],
            body: [
              ["খাতসমূহ", "পরিমাণ"],
              ...report.income.categories.map((c: any) => [
                c.categoryName,
                `৳ ${c.amount}`,
              ]),
            ],
          },
          margin: [0, 5, 0, 15],
        },

        // ===== EXPENSE TABLE =====
        { text: "ব্যয় (খাত অনুযায়ী)", style: "subHeader" },
        {
          table: {
            widths: ["*", "auto"],
            body: [
              ["খাতসমূহ", "পরিমাণ"],
              ...report.expense.categories.map((c: any) => [
                c.categoryName,
                `৳ ${c.amount}`,
              ]),
            ],
          },
          margin: [0, 5, 0, 15],
        },
      ],

      defaultStyle: { font: "SolaimanLipi" },
      styles: {
        orgName: { fontSize: 20, bold: true },
        orgAddress: { fontSize: 12 },
        header: { fontSize: 18, bold: true },
        subHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      },
    };

    pdfMake.createPdf(docDefinition).open();
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl bangla">📊 আয় ব্যয়ের হিসাব রিপোর্ট</h1>

      {/* ===== FILTER PANEL ===== */}
      <div className="bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4 ">
        <div className="flex flex-col space-y-3">
          <label className="text-sm font-medium">Single Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setFromDate("");
              setToDate("");
            }}
            className="border p-2 rounded w-40"
          />
        </div>
        <div className="flex flex-wrap gap-5">
          <div className="flex flex-col space-y-3">
            <label className="text-sm font-medium flex-col">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDate("");
              }}
              className="border p-2 rounded w-40"
            />
          </div>

          <div className="flex flex-col space-y-3">
            <label className="text-sm font-medium">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDate("");
              }}
              className="border p-2 rounded w-40"
            />
          </div>
        </div>
        <div className="flex gap-5">
          {!date && !(fromDate && toDate) && (
            <>
              <div className="flex flex-col space-y-3">
                <label className="text-sm font-medium">Month</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="border p-2 rounded w-28"
                />
              </div>

              <div className="flex flex-col space-y-3">
                <label className="text-sm font-medium">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="border p-2 rounded w-32"
                />
              </div>
            </>
          )}
        </div>
      </div>
      <Button
        onClick={fetchReport}
        className="text-white px-6 py-3 rounded max-w-64"
      >
        Generate
      </Button>
      {loading && <p className="text-blue-600 font-medium">Loading...</p>}

      {/* ===== REPORT VIEW ===== */}
      {report && (
        <>
          <button
            onClick={downloadPdf}
            className="bg-primary text-white px-4 py-2 rounded flex gap-5"
          >
            Download Report
            <DownloadIcon />
          </button>

          {/* Balance */}
          <div className="bg-gray-100 p-4 rounded shadow w-64">
            <p className="text-sm">ব্যালেন্স</p>
            <p className="text-2xl font-bold">
              ৳ {report.balance.toLocaleString()}
            </p>
          </div>

          {/* Income Table */}
          <div className="bg-gray-100 p-4 rounded shadow">
            <p className="text-lg font-medium mb-2">আয়ের বিবরণঃ</p>
            <p className="font-bold mb-2">
              সর্বমোট: ৳ {report.income.total.toLocaleString()}
            </p>
            <table className="w-full border">
              <thead className="bg-secondary text-white">
                <tr>
                  <th className="border p-2">খাতসমূহ</th>
                  <th className="border p-2">টাকা</th>
                </tr>
              </thead>
              <tbody>
                {report.income.categories.map((c: any) => (
                  <tr key={c.categoryName}>
                    <td className="border p-2">{c.categoryName}</td>
                    <td className="border p-2">
                      ৳ {c.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expense Table */}
          <div className="bg-slate-100 p-4 rounded shadow">
            <p className="text-lg font-medium mb-2">ব্যয়ের বিবরণঃ</p>
            <p className="font-bold mb-2">
              সর্বমোট ব্যয়: ৳ {report.expense.total.toLocaleString()}
            </p>
            <table className="w-full border">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="border p-2">খাতসমূহ</th>
                  <th className="border p-2">টাকা</th>
                </tr>
              </thead>
              <tbody>
                {report.expense.categories.map((c: any) => (
                  <tr key={c.categoryName}>
                    <td className="border p-2">{c.categoryName}</td>
                    <td className="border p-2">
                      ৳ {c.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
