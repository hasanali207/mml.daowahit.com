"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { useEffect, useState } from "react";

interface IStudent {
  id?: string;
  code?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  mobile1?: string;
  mobile2?: string;
  gender?: string;
  dob?: string;
  nid?: string;
  email?: string;
  session?: string;
  currentClass?: string;
  presentAddress?: {
    division?: string;
    district?: string;
    thana?: string;
    postOffice?: string;
    village?: string;
  };
}

interface ISession {
  id: string;
  name: string;
  classes: { name: string; id: string }[];
}

export default function DownloadStudent() {
  const [students, setStudents] = useState<IStudent[]>([]);
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [classes, setClasses] = useState<{ name: string; id: string }[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 60, total: 0 });
  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  const [filters, setFilters] = useState<Record<string, any>>({
    searchTerm: "",
    code: "",
    mobile1: "",
    name: "",
    session: "all",
    currentClass: "all",
    currentClassId: "all",
    type: "all",
    admissionStatus: "all",
    page: 1,
    limit: 55,
    sortBy: "code",
    sortOrder: "desc",
  });

  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "code",
    "name",
    "fatherName",
    "mobile1",
    "mobile2",
  ]);
  const [exportType, setExportType] = useState<"pdf" | "excel">("pdf");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_BASE_API;

  // Fetch sessions
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/session`);
        const data = await res.json();
        setSessions(data.data || []);
      } catch (err) {
        console.error("Fetch sessions error", err);
      }
    }
    fetchSessions();
  }, [API_BASE]);

  // Fetch classes when session changes
  useEffect(() => {
    async function fetchClasses(sessionId: string) {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/session/${sessionId}/classes`,
        );
        const data = await res.json();
        const cls = data.data || [];
        setClasses(cls);
        setFilters((prev) => ({
          ...prev,
          currentClass: cls[0]?.name || "all",
          currentClassId: cls[0]?.id || "all",
        }));
      } catch (err) {
        console.error("Fetch classes error", err);
        setClasses([]);
        setFilters((prev) => ({
          ...prev,
          currentClass: "all",
          currentClassId: "all",
        }));
      }
    }

    if (!filters.session || filters.session === "all") {
      setClasses([]);
      setFilters((prev) => ({
        ...prev,
        currentClass: "all",
        currentClassId: "all",
      }));
      return;
    }

    fetchClasses(filters.session);
  }, [filters.session, API_BASE]);

  // Fetch students
  useEffect(() => {
    async function fetchStudents() {
      try {
        let url: string;

        if (filters.session !== "all" && filters.currentClassId !== "all") {
          url = `${API_BASE}/api/v1/admission/${filters.session}/${filters.currentClassId}`;
        } else {
          const qs = new URLSearchParams(
            Object.fromEntries(
              Object.entries(filters).filter(
                ([k, v]) =>
                  v !== "" && v !== "all" && v !== 0 && k !== "currentClassId",
              ),
            ),
          ).toString();
          url = `${API_BASE}/api/v1/student?${qs}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (filters.session !== "all" && filters.currentClassId !== "all") {
          setStudents(
            (data.data || []).map((admission: any) => admission.student),
          );
        } else {
          setStudents(data.data || []);
        }

        setMeta(data.meta || { page: 1, limit: 20, total: 0 });
      } catch (err) {
        console.error("Fetch students error", err);
      }
    }

    fetchStudents();
  }, [filters, API_BASE]);

  const totalPages = Math.ceil(meta.total / meta.limit);

  const toggleColumn = (col: string) =>
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );

  const prepareRows = () =>
    students.map((s) =>
      selectedColumns.reduce((acc: any, col) => {
        if (
          ["village", "postOffice", "thana", "district", "division"].includes(
            col,
          )
        ) {
          acc[col] =
            s.presentAddress?.[col as keyof typeof s.presentAddress] ?? "-";
        } else {
          acc[col] = s[col as keyof IStudent] ?? "-";
        }
        return acc;
      }, {}),
    );

  const columnLabels: Record<string, string> = {
    code: "দাখেলা",
    name: "নাম",
    fatherName: "পিতার নাম",
    motherName: "মাতার নাম",
    mobile1: "মোবাইল ১",
    mobile2: "মোবাইল ২",
    gender: "লিঙ্গ",
    dob: "জন্ম তারিখ",
    nid: "এনআইডি",
    email: "ইমেইল",
    session: "সেশন",
    currentClass: "ক্লাস",
    village: "গ্রাম",
    postOffice: "ডাকঘর",
    thana: "উপজেলা",
    district: "জেলা",
    division: "বিভাগ",
    blank1: " ",
    blank2: " ",
    blank3: " ",
  };

  // PDF Export
  const handleDownloadPDF = async () => {
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

    const selectedSessionName =
      filters.session === "all"
        ? "সকল সেশন"
        : sessions.find((s) => s.id === filters.session)?.name || "";

    const selectedClassName =
      filters.currentClass === "all"
        ? "সকল শ্রেণি"
        : filters.currentClass || "";

    const tableHeader: any[] = [
      {
        text: "ক্র/নং",
        style: "tableHeader",
        alignment: "center",
        noWrap: true,
        fillColor: "#d9d9d9",
      },
      ...selectedColumns.map((col) => ({
        text: columnLabels[col] || col,
        style: "tableHeader",
        alignment: "center",
        noWrap: true,
        fillColor: "#d9d9d9",
      })),
    ];

    const tableBody: any[][] = students.map((s, rowIndex) => [
      { text: String(rowIndex + 1), alignment: "center", noWrap: true },
      ...selectedColumns.map((col) => {
        const value = [
          "village",
          "postOffice",
          "thana",
          "district",
          "division",
        ].includes(col)
          ? (s.presentAddress?.[col as keyof typeof s.presentAddress] ?? "-")
          : (s[col as keyof IStudent] ?? "-");

        return {
          text: String(value),
          alignment: "left",
          noWrap: true,
          ellipsis: true,
          fontSize: 11,
          fillColor: rowIndex % 2 === 0 ? "#f3f3f3" : null,
          margin: [2, 4, 2, 4],
        };
      }),
    ]);

    const baseWidths: Record<string, number> = {
      name: 130,
      fatherName: 110,
      motherName: 110,
      mobile1: 85,
      mobile2: 85,
      dob: 80,
    };

    const scale = orientation === "landscape" ? 1.1 : 1;
    const tableWidths = [
      30,
      ...selectedColumns.map((col) =>
        Math.floor((baseWidths[col] || 75) * scale),
      ),
    ];

    const docDefinition: TDocumentDefinitions = {
      pageOrientation: orientation,
      pageMargins: [20, 110, 20, 40],
      header: {
        stack: [
          {
            text: instituteName,
            style: "title",
            alignment: "center",
          },
          {
            text: address,
            style: "subtitle",
            alignment: "center",
          },
          {
            text: `সেশন: ${selectedSessionName}`,
            style: "sessionLine",
            alignment: "center",
            margin: [0, 0, 0, 5],
          },
          {
            text: `শ্রেণি: ${selectedClassName}`,
            style: "classLine",
            alignment: "center",
          },
        ],
        margin: [0, 10, 0, 10],
      },
      footer: (currentPage, pageCount) => ({
        columns: [
          {
            text: `পৃষ্ঠা ${currentPage} / ${pageCount}`,
            alignment: "left",
            margin: [20, 0, 0, 0],
          },
          {
            text: `প্রিন্ট: ${new Date().toLocaleDateString("bn-BD")}`,
            alignment: "right",
            margin: [0, 0, 20, 0],
          },
        ],
        fontSize: 9,
      }),
      content: [
        {
          table: {
            headerRows: 1,
            widths: tableWidths,
            dontBreakRows: true,
            body: [tableHeader, ...tableBody],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 3,
            paddingBottom: () => 3,
          },
        } as any,
      ],
      defaultStyle: { font: "SolaimanLipi", fontSize: 12 },
      styles: {
        title: { fontSize: 22, bold: true, margin: [0, 0, 0, 4] },
        subtitle: { fontSize: 14, margin: [0, 0, 0, 6] },
        sessionLine: { fontSize: 13, bold: true, margin: [0, 2, 0, 2] },
        classLine: { fontSize: 13, bold: true, margin: [0, 0, 0, 8] },
        tableHeader: { fontSize: 12, bold: true },
      },
    };

    pdfMake.createPdf(docDefinition).open();
  };

  // Excel Export
  const handleDownloadExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = prepareRows();

    const rowsWithBanglaHeader = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          columnLabels[key] || key,
          value,
        ]),
      ),
    );

    const worksheet = XLSX.utils.json_to_sheet(rowsWithBanglaHeader);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "students.xlsx");
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      if (exportType === "pdf") {
        await handleDownloadPDF();
      } else {
        await handleDownloadExcel();
      }
    } catch (err) {
      console.error("Export error:", err);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-200 text-white">
      {/* LEFT SIDE */}
      <div className="w-[250px] bg-gray-500 p-4">
        <h2 className="text-lg font-semibold text-center mb-4">
          Export Settings
        </h2>

        {/* COLUMN SELECT */}
        <div className="space-y-2 text-sm mb-3">
          {[
            "code",
            "name",
            "fatherName",
            "motherName",
            "mobile1",
            "mobile2",
            "gender",
            "dob",
            "nid",
            "email",
            "session",
            "currentClass",
            "village",
            "postOffice",
            "thana",
            "district",
            "division",
            "blank1",
            "blank2",
            "blank3",
          ].map((field) => (
            <label key={field} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes(field)}
                onChange={() => toggleColumn(field)}
              />
              <span>{field}</span>
            </label>
          ))}
        </div>

        {/* Export Type */}
        <Select
          value={exportType}
          onValueChange={(v) => setExportType(v as any)}
        >
          <SelectTrigger className="w-full bg-white text-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="excel">Excel</SelectItem>
          </SelectContent>
        </Select>

        {/* Orientation */}
        {exportType === "pdf" && (
          <div className="mt-3">
            <Select
              value={orientation}
              onValueChange={(v) => setOrientation(v as any)}
            >
              <SelectTrigger className="w-full bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          className="mt-4 w-full bg-primary hover:opacity-90"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? "Exporting..." : "Download"}
        </Button>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 p-6  overflow-auto text-black">
        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* SESSION */}
          <div>
            <label className="text-sm font-semibold">Session</label>
            <Select
              value={filters.session}
              onValueChange={(v) => setFilters({ ...filters, session: v })}
            >
              <SelectTrigger className="w-[150px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {sessions.map((s) => (
                  <SelectItem value={s.id} key={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CLASS */}
          <div>
            <label className="text-sm font-semibold">Class</label>
            <Select
              value={filters.currentClass}
              onValueChange={(v) => {
                const selected = classes.find((c) => c.name === v);
                setFilters({
                  ...filters,
                  currentClass: v,
                  currentClassId: selected?.id || "all",
                });
              }}
            >
              <SelectTrigger className="w-[150px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ADMISSION STATUS */}
          <div>
            <label className="text-sm font-semibold">ভর্তি অবস্থা</label>
            <Select
              value={filters.admissionStatus}
              onValueChange={(v) =>
                setFilters({ ...filters, admissionStatus: v })
              }
            >
              <SelectTrigger className="w-[120px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ADMITTED">সম্পূর্ণ</SelectItem>
                <SelectItem value="PENDING">পেন্ডিং</SelectItem>
                <SelectItem value="CANCELLED">বাতিল</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {totalPages > 1 && (
            <div className="flex lg:flex-row justify-center items-center space-x-3 space-y-3 mt-4">
              <Button
                disabled={meta.page === 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
              >
                Prev
              </Button>
              <span className="font-semibold">
                Page {meta.page} of {totalPages}
              </span>
              <Button
                disabled={meta.page === totalPages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full text-sm text-gray-800">
            <thead className="bg-secondary text-white">
              <tr>
                {selectedColumns.map((col) => (
                  <th key={col} className="px-4 py-2 font-semibold">
                    {col.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length ? (
                students.map((s) => (
                  <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                    {selectedColumns.map((col) => {
                      const addressFields = [
                        "village",
                        "postOffice",
                        "thana",
                        "district",
                        "division",
                      ] as const;

                      let value: string | number = "-";

                      if (addressFields.includes(col as any)) {
                        value =
                          s.presentAddress?.[
                            col as keyof NonNullable<IStudent["presentAddress"]>
                          ] ?? "-";
                      } else {
                        value =
                          (s[col as keyof IStudent] as string | number) ?? "-";
                      }

                      return (
                        <td key={col} className="px-4 py-2">
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={selectedColumns.length}
                    className="text-center py-4"
                  >
                    No Students Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
