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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { FileSpreadsheet, FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";
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

export default function ClassLedgerPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [className, setClassName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [year, setYear] = useState("2026");
  const [loading, setLoading] = useState(false);
  const [monthRange, setMonthRange] = useState<"first" | "second">("first");

  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  const visibleMonths =
    monthRange === "first" ? months.slice(0, 6) : months.slice(6, 12);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session`)
      .then((res) => res.json())
      .then((data) => setSessions(data.data));
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setClassId("");
    setClassName("");
    setStudents([]);
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session/${sessionId}/classes`,
    )
      .then((res) => res.json())
      .then((data) => setClasses(data.data));
  }, [sessionId]);

  useEffect(() => {
    setStudents([]);
  }, [classId, year]);

  const fetchReport = async () => {
    if (!classId || !sessionId) return;
    setLoading(true);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/studentreport/class-warry?classId=${classId}&sessionId=${sessionId}&year=${year}`,
    );
    const data = await res.json();
    setStudents(data.data || []);
    setLoading(false);
  };

  // ---------------- PDF Export ----------------
  const downloadPDF = async () => {
    if (!students.length) return alert("No data to export");

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
        { text: "ছাত্র", style: "tableHeader" },
        { text: "মোবা:", style: "tableHeader", alignment: "center" },
        ...halfMonths.map((m) => ({
          text: m.slice(0, 3),
          style: "tableHeader",
          alignment: "center",
        })),
        { text: "মোট পরিশোধ", style: "tableHeader", alignment: "center" },
        { text: "মোট বাকি", style: "tableHeader", alignment: "center" },
      ];

      const bodyRows = students.map((student, index) => {
        const map: any = {};
        student.payments.forEach((p: any) => (map[p.month] = p));

        const totalPaid = student.payments.reduce(
          (sum: any, p: any) => sum + p.amount,
          0,
        );
        const totalDue = student.payments.reduce(
          (sum: any, p: any) => sum + (p.due || 0),
          0,
        );

        const monthCells = halfMonths.map((m) => {
          const pay = map[m];
          if (!pay)
            return {
              text: "--",
              alignment: "center",
              color: "#aaa",
              fontSize: 8,
            };

          if (pay.status === "PAID") {
            return {
              stack: [
                {
                  text: `All Paid`,
                  fontSize: 9,
                  bold: true,
                },
                ...(pay.paidItems || []).map((d: any) => ({
                  text: `P- ${d.category}: ${toBn(d.amount)}`,
                  color: "",
                  fontSize: 7,
                })),
              ],
            };
          }

          if (pay.status === "PARTIAL") {
            return {
              stack: [
                ...(pay.paidItems || []).map((d: any) => ({
                  text: `P- ${d.category}: ${toBn(d.amount)}`,
                  fontSize: 7,
                })),
                { text: "Due List", color: "", fontSize: 6 },
                ...(pay.dueItems || []).map((d: any) => ({
                  text: `D- ${d.category}: ${toBn(d.due)}`,
                  color: "#c0392b",
                  fontSize: 7,
                })),
              ],
            };
          }

          return {
            stack: [
              { text: "All Due", color: "#c0392b", fontSize: 9, bold: true },
              ...(pay.dueItems || []).map((d: any) => ({
                text: `D- ${d.category}: ${toBn(d.due)}`,
                color: "#c0392b",
                fontSize: 7,
              })),
            ],
          };
        });

        return [
          { text: String(index + 1), alignment: "center", fontSize: 9 },
          { text: student.name, fontSize: 9, bold: true },
          { text: student.mobile, alignment: "center", fontSize: 8 },
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
          text: `সেশন: ${sessionName} | শ্রেণি: ${className} | সাল: ${year} | ${label}`,
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
    if (!students.length) return alert("No data to export");

    const data = students.map((student) => {
      const row: any = { Student: student.name, Code: student.code };
      const map: any = {};
      student.payments.forEach((p: any) => (map[p.month] = p));
      visibleMonths.forEach((m) => {
        row[m.slice(0, 3)] = map[m]?.amount || "-";
      });
      const totalPaid = student.payments.reduce(
        (sum: any, p: any) => sum + p.amount,
        0,
      );
      const totalDue = student.payments.reduce(
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
    XLSX.writeFile(wb, `Class_Ledger_${className}_${year}_${label}.xlsx`);
  };

  // ---------------- Month Cell ----------------
  const renderMonthCell = (pay: any, m: string) => {
    if (!pay)
      return (
        <td key={m} className="border p-2 text-gray-300 text-center">
          -
        </td>
      );

    if (pay.status === "PAID")
      return (
        <td key={m} className="border p-1 text-center align-top">
          <span className="text-xs text-green-800 px-1.5 py-0.5 rounded font-semibold">
            All Paid
          </span>
          {pay.paidItems?.length > 0 && (
            <div className="text-xs text-green-600 text-left space-y-0.5 mt-1">
              {pay.paidItems.map((d: any) => (
                <div key={d.category}>
                  P-{d.category}: {d.amount}
                </div>
              ))}
            </div>
          )}
        </td>
      );

    if (pay.status === "PARTIAL")
      return (
        <td key={m} className="border p-1 text-center align-top">
          {pay.paidItems?.length > 0 && (
            <div className="text-xs text-green-600 text-left space-y-0.5">
              {pay.paidItems.map((d: any) => (
                <div key={d.category}>
                  P- {d.category}: {d.amount}
                </div>
              ))}
            </div>
          )}
          {pay.dueItems?.length > 0 && (
            <>
              <hr className="my-1 border-gray-200" />
              <div className="text-xs text-red-500 text-left space-y-0.5">
                {pay.dueItems.map((d: any) => (
                  <div key={d.category}>
                    D- {d.category}: {d.due}
                  </div>
                ))}
              </div>
            </>
          )}
        </td>
      );

    return (
      <td key={m} className="border p-1 text-center align-top">
        <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
          ALL DUE
        </span>
        {pay.dueItems?.length > 0 && (
          <div className="text-xs text-red-500 mt-1 text-left space-y-0.5">
            {pay.dueItems.map((d: any) => (
              <div key={d.category}>
                D-{d.category}: {d.due}
              </div>
            ))}
          </div>
        )}
      </td>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Class Payment Ledger</h1>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Session */}
          <Select
            value={sessionId}
            onValueChange={(value) => {
              const selected = sessions.find((s) => s.id === value);
              setSessionId(value);
              setSessionName(selected?.name || "");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Class */}
          <Select
            value={classId}
            onValueChange={(value) => {
              const selected = classes.find((c) => c.id === value);
              setClassId(value);
              setClassName(selected?.name || "");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          {/* Search Button */}
          <Button
            onClick={fetchReport}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Report
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-gray-400 text-sm mt-4">
          কোনো ডেটা নেই। Session, Class ও Year সিলেক্ট করে "দেখুন" চাপুন।
        </p>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row justify-between items-center">
            {/* Month Range Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setMonthRange("first")}
                className={`px-4 py-1.5 rounded text-sm border ${
                  monthRange === "first"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                জানুয়ারি — জুন
              </button>
              <button
                onClick={() => setMonthRange("second")}
                className={`px-4 py-1.5 rounded text-sm border ${
                  monthRange === "second"
                    ? "bg-blue-600 text-white border-blue-600"
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
            <table className="w-full border text-sm min-w-[1200px]">
              <thead className="bg-secondary text-white">
                <tr>
                  <th className="border p-2">#</th>
                  <th className="border p-2">Student</th>
                  <th className="border p-2">Code</th>
                  <th className="border p-2">Mobile</th>
                  {visibleMonths.map((m) => (
                    <th key={m} className="border p-2">
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="border p-2">Total Paid</th>
                  <th className="border p-2">Total Due</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const map: any = {};
                  student.payments.forEach((p: any) => (map[p.month] = p));
                  const totalPaid = student.payments.reduce(
                    (sum: any, p: any) => sum + p.amount,
                    0,
                  );
                  const totalDue = student.payments.reduce(
                    (sum: any, p: any) => sum + (p.due || 0),
                    0,
                  );
                  return (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="border p-2 text-center text-gray-500">
                        {index + 1}
                      </td>
                      <td className="border p-2 font-medium">{student.name}</td>
                      <td className="border p-2">{student.code}</td>
                      <td className="border p-2">{student.mobile}</td>
                      {visibleMonths.map((m) => renderMonthCell(map[m], m))}
                      <td className="border p-2 font-semibold text-center">
                        {totalPaid}
                      </td>
                      <td
                        className={`border p-2 font-semibold text-center ${totalDue > 0 ? "text-red-500" : "text-gray-400"}`}
                      >
                        {totalDue > 0 ? totalDue : "০"}
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
