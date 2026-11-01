"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/getErrorMessage ";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import {
  FileSpreadsheet,
  FileText,
  MessageCircleReply,
  Search,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const months = [
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
const getMonthNumber = (range: "first" | "second", idx: number) => {
  return range === "first" ? idx + 1 : idx + 7;
};

export default function MonthlyDonorReport() {
  const [donors, setDonors] = useState<any[]>([]);
  const [year, setYear] = useState("2026");
  const [loading, setLoading] = useState(false);
  const [monthRange, setMonthRange] = useState<"first" | "second">("first");
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(12);
  const visibleMonths =
    monthRange === "first" ? months.slice(0, 6) : months.slice(6, 12);

  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsText, setSmsText] = useState(
    "আসসালামু আলাইকুম- {name}, আপনার মোট বকেয়া অনুদান: ৳{due} Visit: https://islamidawahinstitute.com/",
  );

  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  const groupByDonor = (data: any[]) => {
    const map: any = {};

    data.forEach((inv) => {
      const donorId = inv.monthlyDonorId;

      if (!map[donorId]) {
        map[donorId] = {
          donorId,
          name: inv.donor.donor.name,
          code: inv.donor.donor.code,
          mobile: inv.donor.donor.mobile1,
          monthlyAmount: inv.donor.monthlyAmount,
          invoices: [],
        };
      }

      map[donorId].invoices.push(inv);
    });

    return Object.values(map);
  };

  const fetchReport = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        fromMonth: String(fromMonth),
        fromYear: year,
        toMonth: String(toMonth),
        toYear: year,
        page: "1",
        limit: "100",
      });

      const [paidRes, unpaidRes] = await Promise.all([
        api.get(`/api/v1/monthlydonations/paid?${params}`),
        api.get(`/api/v1/monthlydonations/unpaid?${params}`),
      ]);

      const invoices = [
        ...(paidRes.data.data || []),
        ...(unpaidRes.data.data || []),
      ];

      const grouped = groupByDonor(invoices);

      setDonors(grouped);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- PDF Export ----------------
  const downloadPDF = async () => {
    if (!donors.length) return alert("No data to export");

    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfMake = pdfMakeModule.default;

    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
    pdfMake.fonts = {
      SolaimanLipi: {
        normal: "SolaimanLipi.ttf",
        bold: "SolaimanLipi.ttf",
        italics: "SolaimanLipi.ttf",
        bolditalics: "SolaimanLipi.ttf",
      },
    };

    const toBn = (num: number) => Number(num || 0).toLocaleString("bn-BD");

    const buildTable = (halfMonths: string[], label: string) => {
      const headerRow = [
        { text: "#", style: "tableHeader", alignment: "center" },
        { text: "নাম", style: "tableHeader" },
        { text: "মোবা:", style: "tableHeader", alignment: "center" },
        ...halfMonths.map((m) => ({
          text: m.slice(0, 3),
          style: "tableHeader",
          alignment: "center",
        })),
        { text: "মোট পরিশোধ", style: "tableHeader", alignment: "center" },
        { text: "মোট বাকি", style: "tableHeader", alignment: "center" },
      ];

      const bodyRows = donors.map((donor, index) => {
        const map: any = {};
        donor.invoices.forEach((p: any) => (map[p.month] = p));

        const totalPaid = donor.invoices.reduce(
          (sum: any, p: any) => sum + p.amount,
          0,
        );
        const totalDue = donor.invoices.reduce(
          (sum: any, p: any) => sum + (p.due || 0),
          0,
        );

        const monthCells = halfMonths.map((m) => {
          const pay = map[m];
          if (!pay)
            return {
              text: "—",
              alignment: "center",
              color: "#aaa",
              fontSize: 8,
            };

          if (pay.status === "PAID") {
            return {
              stack: [
                {
                  text: `✓ ${toBn(pay.amount)}`,
                  fontSize: 9,
                  bold: true,
                },
                ...(pay.paidItems || []).map((d: any) => ({
                  text: `${d.category}: ${toBn(d.amount)}`,
                  color: "#1a6e2e",
                  fontSize: 7,
                })),
              ],
            };
          }

          if (pay.status === "PARTIAL") {
            return {
              stack: [
                ...(pay.paidItems || []).map((d: any) => ({
                  text: `✓ ${d.category}: ${toBn(d.amount)}`,
                  fontSize: 7,
                })),
                { text: "————", color: "#ccc", fontSize: 6 },
                ...(pay.dueItems || []).map((d: any) => ({
                  text: `বাকি ${d.category}: ${toBn(d.due)}`,
                  color: "#c0392b",
                  fontSize: 7,
                })),
              ],
            };
          }

          return {
            stack: [
              { text: "বাকি", color: "#c0392b", fontSize: 9, bold: true },
              ...(pay.dueItems || []).map((d: any) => ({
                text: `${d.category}: ${toBn(d.due)}`,
                color: "#c0392b",
                fontSize: 7,
              })),
            ],
          };
        });

        return [
          { text: String(index + 1), alignment: "center", fontSize: 9 },
          { text: donor.name, fontSize: 9, bold: true },
          { text: donor.mobile, alignment: "center", fontSize: 8 },
          ...monthCells,
          {
            text: toBn(totalPaid),
            alignment: "center",
            color: "#1a6e2e",
            bold: true,
            fontSize: 9,
          },
          {
            text: totalDue > 0 ? toBn(totalDue) : "০",
            alignment: "center",
            color: totalDue > 0 ? "#c0392b" : "#aaa",
            bold: true,
            fontSize: 9,
          },
        ];
      });

      return [
        {
          text: `${instituteName}`,
          style: "title",
          alignment: "center",
          margin: [0, 0, 0, 2],
        },
        {
          text: `সাল: ${year} | ${label}`,
          style: "subTitle",
          alignment: "center",
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths: [
              "auto",
              "*",
              "auto",
              ...Array(6).fill("*"),
              "auto",
              "auto",
            ],
            body: [headerRow, ...bodyRows],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#aaa",
            vLineColor: () => "#aaa",
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
        },
      ];
    };

    const doc: any = {
      pageSize: "A4",
      pageMargins: [12, 12, 12, 12],
      pageOrientation: "landscape",
      content: [
        ...buildTable(
          visibleMonths,
          monthRange === "first" ? "জানুয়ারি — জুন" : "জুলাই — ডিসেম্বর",
        ),
      ],
      defaultStyle: { font: "SolaimanLipi", fontSize: 9 },
      styles: {
        title: { fontSize: 18, bold: true },
        subTitle: { fontSize: 10 },
        tableHeader: {
          fontSize: 9,
          bold: true,
          fillColor: "#d9d9d9",
          alignment: "center",
        },
      },
    };

    pdfMake.createPdf(doc).open();
  };

  // ---------------- Excel Export ----------------
  const downloadExcel = () => {
    if (!donors.length) return alert("No data to export");

    const data = donors.map((donor) => {
      const row: any = { Student: donor.name, Code: donor.code };
      const map: any = {};
      donor.invoices.forEach((p: any) => (map[p.month] = p));
      visibleMonths.forEach((m) => {
        row[m.slice(0, 3)] = map[m]?.amount || "-";
      });
      const totalPaid = donor.invoices.reduce(
        (sum: any, p: any) => sum + p.amount,
        0,
      );
      const totalDue = donor.invoices.reduce(
        (sum: any, p: any) => sum + (p.due || 0),
        0,
      );
      row["Total Paid"] = totalPaid;
      row["Total Due"] = totalDue;
      return row;
    });

    const label = monthRange === "first" ? "Jan-Jun" : "Jul-Dec";
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `Due_${year}_${label}.xlsx`);
  };

  // ---------------- Month Cell ----------------

  const handleSelectAll = () => {
    if (selectedDonors.length === donors.length) {
      setSelectedDonors([]);
    } else {
      setSelectedDonors(donors.map((d) => d.donorId));
    }
  };
  const handleSelectDonor = (donorId: string) => {
    setSelectedDonors((prev) =>
      prev.includes(donorId)
        ? prev.filter((id) => id !== donorId)
        : [...prev, donorId],
    );
  };
  const sendSelectedSms = async () => {
    try {
      setSmsLoading(true);

      const selected = donors.filter((d) => selectedDonors.includes(d.donorId));

      const messages = selectedDonors
        .map((id) => donors.find((d) => d.donorId === id))
        .filter(Boolean)
        .flatMap((d: any) => {
          const totalDue = d.invoices
            .filter((x: any) => x.status === "UNPAID")
            .reduce((sum: number, x: any) => sum + x.amount, 0);

          return totalDue > 0
            ? [
                {
                  to: d.mobile,
                  message: smsText
                    .replace("{name}", d.name)
                    .replace("{due}", String(totalDue)),
                  recipientType: "DONOR",
                  recipientId: d.donorId,
                },
              ]
            : [];
        });
      await api.post("/api/v1/sms/bulk", {
        messages,
      });

      toast.success("SMS Sent Successfully");
    } catch (error) {
      console.log(error);
      toast.error(getErrorMessage(error));
    } finally {
      setSmsLoading(false);
    }
  };

  const sendSingleSms = async (donor: any) => {
    try {
      const totalDue = donor.invoices
        .filter((x: any) => x.status === "UNPAID")
        .reduce((sum: number, x: any) => sum + x.amount, 0);
      if (totalDue <= 0) {
        toast.error("এই দাতার কোনো বকেয়া নেই");
        return;
      }
      await api.post("/api/v1/sms/bulk", {
        messages: [
          {
            to: donor.mobile,
            message: smsText
              .replace("{name}", donor.name)
              .replace("{due}", String(totalDue)),
            recipientType: "DONOR",
            recipientId: donor.donorId,
          },
        ],
      });

      toast.success("SMS Sent");
    } catch (error: any) {
      console.log(error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Donors Payment Ledger</h1>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Year */}
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 4 }).map((_, i) => {
                const y = (2025 + i).toString();
                return (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Button
            onClick={fetchReport}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Report
          </Button>
        </div>
      </div>

      <div className="mb-4 border rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">
            SMS Panel ({selectedDonors.length} Selected)
          </h3>

          <button
            onClick={sendSelectedSms}
            disabled={!selectedDonors.length || smsLoading}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {smsLoading ? "Sending..." : "Send Selected SMS"}
          </button>
        </div>

        <textarea
          value={smsText}
          onChange={(e) => setSmsText(e.target.value)}
          rows={3}
          className="w-full border rounded p-2"
          placeholder="SMS Template"
        />

        <p className="text-xs text-gray-500 mt-2">
          Available variables: {"{name}"} , {"{due}"}
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : donors.length === 0 ? (
        <p className="text-gray-400 text-sm mt-4">
          No Data Availabel for this Year.....
        </p>
      ) : (
        <>
          {/* Month Range Toggle */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setMonthRange("first")}
                className={`px-4 py-1.5 rounded text-sm border ${
                  monthRange === "first"
                    ? "bg-primary text-white border-primary"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                জানুয়ারি — জুন
              </button>
              <button
                onClick={() => setMonthRange("second")}
                className={`px-4 py-1.5 rounded text-sm border ${
                  monthRange === "second"
                    ? "bg-primary text-white border-primary"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                জুলাই — ডিসেম্বর
              </button>
            </div>

            {/* Export Buttons */}
            <TooltipProvider>
              <div className="flex items-center gap-1 rounded-xl border bg-background p-1 shadow-sm mb-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={downloadPDF}
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
                      onClick={downloadExcel}
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
          <div className="overflow-x-auto">
            <table className="w-full border text-sm min-w-[800px]">
              <thead className="bg-secondary text-white">
                <tr>
                  <th className="border p-2">
                    <input
                      type="checkbox"
                      checked={
                        donors.length > 0 &&
                        selectedDonors.length === donors.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="border p-2">#</th>
                  <th className="border p-2">Donor</th>
                  <th className="border p-2">Code</th>
                  <th className="border p-2">Mobile</th>
                  {visibleMonths.map((m) => (
                    <th key={m} className="border p-2">
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="border p-2">Paid</th>
                  <th className="border p-2">Unpaid</th>
                  <th className="border p-2">Send SMS</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d, i) => {
                  const map: any = {};
                  d.invoices.forEach((p: any) => (map[p.month] = p));
                  const totalPaid = d.invoices
                    .filter((x: any) => x.status === "PAID")
                    .reduce((sum: number, x: any) => sum + x.amount, 0);
                  const totalDue = d.invoices
                    .filter((x: any) => x.status === "UNPAID")
                    .reduce((sum: number, x: any) => sum + x.amount, 0);
                  return (
                    <tr key={d.donorId} className="hover:bg-gray-50">
                      <td className="border p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedDonors.includes(d.donorId)}
                          onChange={() => handleSelectDonor(d.donorId)}
                        />
                      </td>
                      <td className="border p-2 text-center text-gray-500">
                        {i + 1}
                      </td>
                      <td className="border p-2 font-medium">{d.name}</td>
                      <td className="border p-2">{d.code}</td>
                      <td className="border p-2">{d.mobile}</td>
                      {visibleMonths.map((_, idx) => {
                        const inv = map[getMonthNumber(monthRange, idx)];

                        return (
                          <td
                            key={`${d.donorId}-${idx}`}
                            className="border p-1 text-center"
                          >
                            {!inv ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <div
                                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                  inv.status === "PAID"
                                    ? "bg-green-100 text-secondary"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                ৳{inv.amount}
                                <br />
                                {inv.status === "PAID" ? "Paid" : "Unpaid"}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="border p-2 font-semibold text-center">
                        {totalPaid}
                      </td>
                      <td
                        className={`border p-2 font-semibold text-center ${totalDue > 0 ? "text-red-500" : "text-gray-400"}`}
                      >
                        {totalDue > 0 ? totalDue : "০"}
                      </td>
                      <td className="border p-2 text-center">
                        <button
                          onClick={() => sendSingleSms(d)}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                        >
                          <MessageCircleReply />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
