"use client";

import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import api from "@/lib/axios";
import { getPagination } from "@/lib/getPageNumber";
import socket from "@/lib/socket";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import { fmtTime, formatDateBn } from "@/utils/dateBn";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Download,
  Filter,
  Fingerprint,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export const attendanceFilterableFields = [
  "type",
  "searchTerm",
  "classId",
  "sessionId",
  "status",
  "source",
  "fromDate",
  "toDate",
] as const;

type FilterableField = (typeof attendanceFilterableFields)[number];

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "LEAVE";
export type AttendanceSource = "BIOMETRIC" | "MANUAL";

export interface ClassOption {
  id: string;
  name: string;
}

export interface SessionOption {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  deviceUserId: string;
  attendanceDate: string;
  source: "BIOMETRIC" | "MANUAL";
  status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE";
  remarks: string | null;
  inTime: string | null;
  outTime: string | null;
  student: {
    id: string;
    code: string;
    name: string;
    currentClass: string;
  } | null;
  teacher: {
    id: string;
    code: string;
    name: string;
    designation: string;
  } | null;
  class: { id: string; name: string } | null;
  session: { id: string; name: string } | null;
}

interface AttendanceFilters {
  searchTerm?: string;
  type?: string;
  classId?: string;
  sessionId?: string;
  status?: string;
  source?: string;
  fromDate?: string;
  toDate?: string;
}

interface AttendanceMeta {
  page: number;
  limit: number;
  total: number;
}

interface AttendanceResponse {
  success: boolean;
  message: string;
  meta: AttendanceMeta;
  data: AttendanceRecord[];
}

type Session = {
  id: string;
  name: string;
};

type Class = {
  id: string;
  name: string;
};

type FilterState = Record<FilterableField, string>;

const PAGE_LIMIT = 10;

const EMPTY_FILTERS: FilterState = {
  type: "ALL",
  searchTerm: "",
  classId: "ALL",
  sessionId: "ALL",
  status: "ALL",
  source: "ALL",
  fromDate: "",
  toDate: "",
};

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LATE: "bg-amber-50 text-amber-700 border-amber-200",
  ABSENT: "bg-rose-50 text-rose-700 border-rose-200",
  LEAVE: "bg-slate-100 text-slate-600 border-slate-200",
};

interface AttendanceDashboardProps {
  classOptions?: ClassOption[];
  sessionOptions?: SessionOption[];
}

export default function AttendanceDashboard({
  classOptions = [],
  sessionOptions = [],
}: AttendanceDashboardProps) {
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(20);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pages = getPagination(page, totalPages);

  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  // ===== Filter helpers (every filter change resets to page 1) =====
  const updateFilters = (updater: (prev: FilterState) => FilterState) => {
    setFilters(updater);
    setPage(1);
  };

  const setFilter = (key: FilterableField, value: string) =>
    updateFilters((f) => ({ ...f, [key]: value }));

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  // ===== Sessions =====
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get("/api/v1/session");
        setSessions(res.data.data ?? []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSessions();
  }, []);

  // ===== Classes (depends on session) =====
  useEffect(() => {
    if (!filters.sessionId || filters.sessionId === "ALL") {
      setClasses([]);
      return;
    }

    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const res = await api.get(
          `/api/v1/session/${filters.sessionId}/classes`,
        );
        setClasses(res.data.data ?? []);
      } catch (err) {
        console.error(err);
        setClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [filters.sessionId]);

  const activeCount = Object.values(filters).filter(
    (v) => v && v !== "ALL",
  ).length;

  // Filters only (no page) — used for both the table and the PDF export
  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    attendanceFilterableFields.forEach((key) => {
      const value = filters[key];
      if (value && value !== "ALL") params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  // ===== Load current page from the server =====
  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(filterQuery);
      params.set("page", String(page));
      params.set("limit", String(PAGE_LIMIT));

      const res = await api.get(`/api/v1/attendence?${params.toString()}`);

      if (!res.data.success) {
        throw new Error("Failed to load attendance");
      }

      const { data, meta }: AttendanceResponse = res.data;
      const pagesCount = Math.max(
        1,
        Math.ceil((meta?.total ?? 0) / (meta?.limit || PAGE_LIMIT)),
      );

      setRows(data || []);
      setTotal(meta?.total ?? 0);
      setTotalPages(pagesCount);

      // If current page no longer exists (e.g. records removed), go to last page
      if (page > pagesCount) setPage(pagesCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load attendance",
      );
    } finally {
      setLoading(false);
    }
  }, [filterQuery, page]);

  // Always-latest ref so the socket handler never uses a stale page/filter
  const loadRef = useRef(loadAttendance);
  useEffect(() => {
    loadRef.current = loadAttendance;
  }, [loadAttendance]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // ===== Realtime =====
  useEffect(() => {
    const onConnect = () => console.log("🟢 Socket:", socket.id);
    const onNew = () => loadRef.current();

    socket.connect();
    socket.on("connect", onConnect);
    socket.on("attendance:new", onNew);

    return () => {
      socket.off("connect", onConnect);
      socket.off("attendance:new", onNew);
    };
  }, []);

  // ===== Sync device =====
  const handleSync = async () => {
    try {
      setSyncing(true);

      const res = await api.post("/api/v1/zkteco/run", {
        timeout: 1000,
      });

      toast.success(res.data.message || "Attendance synced successfully");
      await loadAttendance();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to sync attendance",
      );
    } finally {
      setSyncing(false);
    }
  };

  // Summary of the rows on the current page
  const summary = useMemo(() => {
    const s: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      LATE: 0,
      ABSENT: 0,
      LEAVE: 0,
    };
    rows.forEach((r) => {
      s[r.status] = (s[r.status] ?? 0) + 1;
    });
    return s;
  }, [rows]);

  const activeSessionName =
    sessions.find((s) => s.id === filters.sessionId)?.name ??
    sessionOptions.find((s) => s.id === filters.sessionId)?.name ??
    "All sessions";

  // ===== Convert FilterState (UI, with "ALL"/"") -> clean AttendanceFilters =====
  const toAttendanceFilters = (f: FilterState): AttendanceFilters => {
    const clean: AttendanceFilters = {};
    attendanceFilterableFields.forEach((key) => {
      const value = f[key];
      if (value && value !== "ALL") {
        (clean as any)[key] = value;
      }
    });
    return clean;
  };

  // ===== Fetch every page that matches current filters (ignores UI pagination) =====
  const fetchAllFilteredAttendance = async (
    attendanceFilters: AttendanceFilters,
  ): Promise<AttendanceRecord[]> => {
    let all: AttendanceRecord[] = [];
    let exportPage = 1;
    const exportLimit = 100; // large page size so fewer round trips

    while (true) {
      const params = new URLSearchParams();
      Object.entries(attendanceFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
      params.append("page", String(exportPage));
      params.append("limit", String(exportLimit));

      const res = await api.get(`/api/v1/attendence?${params.toString()}`);

      if (!res.data.success) {
        throw new Error("Failed to fetch attendance for export");
      }

      const json: AttendanceResponse = res.data;
      all = [...all, ...json.data];

      if (all.length >= json.meta.total || json.data.length === 0) break;
      exportPage++;
    }

    return all;
  };

  // ===== Build & open the PDF =====
  const downloadAttendancePdf = async (
    records: AttendanceRecord[],
    attendanceFilters: AttendanceFilters,
  ) => {
    if (!records || records.length === 0) {
      toast.error("No records match the current filters");
      return;
    }

    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfMake = pdfMakeModule.default;

    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
    pdfMake.fonts = {
      SolaimanLipi: { normal: "SolaimanLipi.ttf", bold: "SolaimanLipi.ttf" },
    };

    // ===== HELPERS =====
    const statusBn = (s: string) =>
      s === "PRESENT"
        ? "উপস্থিত"
        : s === "LATE"
          ? "বিলম্বে"
          : s === "ABSENT"
            ? "অনুপস্থিত"
            : "ছুটি";

    const getName = (r: AttendanceRecord) =>
      r.student?.name ?? r.teacher?.name ?? "-";
    const getCode = (r: AttendanceRecord) =>
      r.student?.code ?? r.teacher?.code ?? "-";
    const getType = (r: AttendanceRecord) =>
      r.student ? "শিক্ষার্থী" : "শিক্ষক";

    // ===== HEADER TEXT (filter summary) =====
    let headerText = "সকল উপস্থিতির তথ্য";
    if (attendanceFilters.fromDate && attendanceFilters.toDate) {
      let start = attendanceFilters.fromDate;
      let end = attendanceFilters.toDate;
      if (new Date(start) > new Date(end)) [start, end] = [end, start];
      headerText = `তারিখ: ${formatDateBn(start)} থেকে ${formatDateBn(end)}`;
    } else if (attendanceFilters.fromDate) {
      headerText = `তারিখ: ${formatDateBn(attendanceFilters.fromDate)} থেকে বর্তমান`;
    }
    if (attendanceFilters.status)
      headerText += `  |  অবস্থা: ${statusBn(attendanceFilters.status)}`;
    if (attendanceFilters.type)
      headerText += `  |  ধরন: ${attendanceFilters.type === "student" ? "শিক্ষার্থী" : "শিক্ষক"}`;

    // ===== SUMMARY =====
    const totalPresent = records.filter((r) => r.status === "PRESENT").length;
    const totalLate = records.filter((r) => r.status === "LATE").length;
    const totalAbsent = records.filter((r) => r.status === "ABSENT").length;

    const docDefinition: any = {
      content: [
        {
          text: instituteName,
          style: "orgName",
          alignment: "center",
        },
        {
          text: address,
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

        { text: headerText, margin: [0, 0, 0, 5], alignment: "center" },
        {
          text: `মোট রেকর্ড: ${records.length}`,
          margin: [0, 0, 0, 10],
          alignment: "center",
          fontSize: 10,
        },

        {
          columns: [
            { text: `মোট উপস্থিত: ${totalPresent}`, width: "*", bold: true },
            { text: `মোট বিলম্বে: ${totalLate}`, width: "*", bold: true },
            { text: `মোট অনুপস্থিত: ${totalAbsent}`, width: "*", bold: true },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 15],
        },

        { text: "উপস্থিতির বিবরণ", style: "subHeader" },
        {
          table: {
            headerRows: 1,
            widths: [
              "auto",
              "auto",
              "*",
              "auto",
              "auto",
              "auto",
              "auto",
              "auto",
            ],
            body: [
              [
                "ক্রমিক",
                "কোড",
                "নাম",
                "ধরন",
                "তারিখ",
                "ইন টাইম",
                "আউট টাইম",
                "অবস্থা",
              ],
              ...records.map((r, i) => [
                (i + 1).toString(),
                getCode(r),
                getName(r),
                getType(r),
                formatDateBn(r.attendanceDate),
                fmtTime(r.inTime),
                fmtTime(r.outTime),
                statusBn(r.status),
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
        subHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      },
    };

    pdfMake.createPdf(docDefinition).open();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const cleanFilters = toAttendanceFilters(filters);
      const allRecords = await fetchAllFilteredAttendance(cleanFilters);
      await downloadAttendancePdf(allRecords, cleanFilters);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const rowOffset = (page - 1) * PAGE_LIMIT;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            Attendance register
          </h1>
          <p className="text-sm text-slate-500">
            {activeSessionName} · biometric device log
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync Device"}
          </Button>

          <Button
            onClick={handleDownload}
            disabled={downloading}
            variant="outline"
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading attendance…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Present (this page)"
            value={summary.PRESENT}
            tone="emerald"
          />
          <SummaryCard
            label="Late (this page)"
            value={summary.LATE}
            tone="amber"
          />
          <SummaryCard
            label="Absent (this page)"
            value={summary.ABSENT}
            tone="rose"
          />
          <SummaryCard label="Total records" value={total} tone="slate" />
        </div>

        {/* Filter bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Filter className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                  {activeCount}
                </span>
              )}
            </div>
            {activeCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <TextField
              label="Search"
              value={filters.searchTerm}
              onChange={(v) => setFilter("searchTerm", v)}
              placeholder="Student / Teacher Code"
            />
            <Select
              value={filters.type}
              onValueChange={(value) => setFilter("type", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Attendance Type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilter("status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LEAVE">Leave</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.source}
              onValueChange={(value) => setFilter("source", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Source" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Source</SelectItem>
                <SelectItem value="BIOMETRIC">Biometric</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sessionId}
              onValueChange={(value) =>
                updateFilters((prev) => ({
                  ...prev,
                  sessionId: value,
                  classId: "ALL",
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Sessions</SelectItem>

                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              disabled={filters.sessionId === "ALL" || loadingClasses}
              value={filters.classId}
              onValueChange={(value) => setFilter("classId", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={loadingClasses ? "Loading..." : "Select Class"}
                />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Classes</SelectItem>

                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* From Date */}
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                aria-label="From Date"
                value={filters.fromDate}
                max={filters.toDate || undefined}
                onChange={(e) => setFilter("fromDate", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* To Date */}
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                aria-label="To Date"
                value={filters.toDate}
                min={filters.fromDate || undefined}
                onChange={(e) => setFilter("toDate", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border text-sm min-w-[800px]">
            <thead className="bg-secondary text-white">
              <tr className="border-b text-white">
                <th className="border p-2">#</th>
                <th className="border p-2">Name/ID</th>
                <th className="border p-2">Class</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">In / out</th>
                <th className="border p-2">Source</th>
                <th className="border p-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="border p-2 text-center">
                    {rowOffset + i + 1}
                  </td>
                  <td className="border p-2">
                    <div className="font-medium text-slate-800">
                      {r.student?.name ?? r.teacher?.name ?? "—"}
                    </div>
                    <div className="text-xs text-slate-400">
                      Code{" "}
                      {r.student?.code ?? r.teacher?.code ?? r.deviceUserId}
                    </div>
                  </td>
                  <td className="border p-2">{r.class?.name ?? "—"}</td>
                  <td className="border p-2">
                    {formatDateBn(r.attendanceDate)}
                  </td>
                  <td className="border p-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {fmtTime(r.inTime)} – {fmtTime(r.outTime)}
                    </div>
                  </td>
                  <td className="border p-2">
                    <div className="flex items-center gap-1.5">
                      <Fingerprint className="h-3.5 w-3.5 text-slate-400" />
                      {r.source === "BIOMETRIC" ? "Biometric" : "Manual"}
                    </div>
                  </td>
                  <td className="border p-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                        STATUS_STYLES[r.status] ??
                        "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-slate-400"
                  >
                    No attendance records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-2 mt-10">
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
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
                      disabled={loading}
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
                disabled={page === totalPages || loading}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next <ArrowRight />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} · {total} records
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "rose" | "slate";
}

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  const tones: Record<SummaryCardProps["tone"], string> = {
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
    slate: "text-slate-800",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${tones[tone]}`}>
        {value}
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <input
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
    />
  );
}
