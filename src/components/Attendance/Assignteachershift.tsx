"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import api from "@/lib/axios";
import { fmtTime } from "@/utils/dateBn";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

/* =========================================================
   TYPES
========================================================= */

interface IShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  lateAfterMinutes: number;
  isActive: boolean;
}

interface ITeacher {
  id: string;
  code: string;
  name: string;
  designation?: string | null;
  shiftId?: string | null;
  shift?: IShift | null;
}

/* =========================================================
   HELPERS
========================================================= */

const shiftLabel = (s: IShift) =>
  `${s.name} (${fmtTime(s.startTime)} - ${fmtTime(s.endTime)})`;

/* =========================================================
   COMPONENT
========================================================= */

const AssignTeacherShift = () => {
  /* =======================================================
     DATA
  ======================================================= */

  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [shifts, setShifts] = useState<IShift[]>([]);
  const [loading, setLoading] = useState(true);

  /* =======================================================
     ASSIGN FORM
  ======================================================= */

  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<ITeacher | null>(null);
  const [shiftId, setShiftId] = useState("");
  const [saving, setSaving] = useState(false);

  /* =======================================================
     TABLE SEARCH
  ======================================================= */

  const [tableSearch, setTableSearch] = useState("");

  /* =======================================================
     TABLE PAGINATION
  ======================================================= */

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [teacherRes, shiftRes] = await Promise.all([
        api.get("/api/v1/teacher?page=1&limit=2000"),
        api.get("/api/v1/shift?page=1&limit=2000"),
      ]);

      const teacherList: ITeacher[] = teacherRes.data?.data || [];

      const shiftList: IShift[] = shiftRes.data?.data || [];

      setTeachers(teacherList);

      setShifts(shiftList.filter((s: IShift) => s.isActive));

      // Selected teacher-er data refresh kore rakho
      setSelectedTeacher((prev) =>
        prev ? (teacherList.find((t) => t.id === prev.id) ?? null) : null,
      );
    } catch (err) {
      console.error(err);
      toast.error("ডেটা লোড হয়নি");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================================================
     TEACHER SEARCH - CODE / NAME
  ======================================================= */

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return [];

    return teachers
      .filter(
        (t) =>
          t.code?.toLowerCase().includes(q) ||
          t.name?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, teachers]);

  /* =======================================================
     PICK TEACHER
  ======================================================= */

  const pickTeacher = (t: ITeacher) => {
    setSelectedTeacher(t);

    setQuery(`${t.code} - ${t.name}`);

    setShiftId(t.shiftId ?? "");

    setShowSuggestions(false);
  };

  /* =======================================================
     CLEAR TEACHER
  ======================================================= */

  const clearTeacher = () => {
    setSelectedTeacher(null);
    setQuery("");
    setShiftId("");
    setShowSuggestions(false);
  };

  /* =======================================================
     ENTER SEARCH
  ======================================================= */

  const handleEnter = () => {
    const q = query.trim().toLowerCase();

    const exact = teachers.find((t) => t.code?.toLowerCase() === q);

    if (exact) {
      pickTeacher(exact);
      return;
    }

    if (suggestions[0]) {
      pickTeacher(suggestions[0]);
      return;
    }

    toast.error("এই কোডে কোনো শিক্ষক পাওয়া যায়নি");
  };

  /* =======================================================
     ASSIGN / REMOVE SHIFT
  ======================================================= */

  const assign = async (teacherId: string, newShiftId: string | null) => {
    setSaving(true);

    try {
      const res = await api.post("/api/v1/shift/assign", {
        type: "teacher",
        ids: [teacherId],
        shiftId: newShiftId,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Shift assign failed");
      }

      toast.success(
        newShiftId
          ? "Shift assigned successfully"
          : "Shift removed successfully",
      );

      await loadData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     HANDLE ASSIGN
  ======================================================= */

  const handleAssign = () => {
    if (!selectedTeacher) {
      toast.error("আগে শিক্ষক নির্বাচন করুন");
      return;
    }

    if (!shiftId) {
      toast.error("Shift নির্বাচন করুন");
      return;
    }

    assign(selectedTeacher.id, shiftId);
  };

  /* =======================================================
     TABLE FILTER
  ======================================================= */

  const tableRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();

    if (!q) return teachers;

    return teachers.filter(
      (t) =>
        t.code?.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q),
    );
  }, [tableSearch, teachers]);

  /* =======================================================
     TOTAL PAGES
  ======================================================= */

  const totalPages = Math.max(1, Math.ceil(tableRows.length / limit));

  /* =======================================================
     SAFETY: CURRENT PAGE
  ======================================================= */

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /* =======================================================
     PAGINATED ROWS
  ======================================================= */

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * limit;

    return tableRows.slice(startIndex, startIndex + limit);
  }, [tableRows, page, limit]);

  /* =======================================================
     PAGINATION PAGES
  ======================================================= */

  const paginationPages = useMemo(() => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (page > 4) {
      pages.push("...");
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 3) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  }, [page, totalPages]);

  /* =======================================================
     PAGINATION INFO
  ======================================================= */

  const startItem = tableRows.length === 0 ? 0 : (page - 1) * limit + 1;

  const endItem = Math.min(page * limit, tableRows.length);

  /* =======================================================
     TABLE SEARCH HANDLER
  ======================================================= */

  const handleTableSearch = (value: string) => {
    setTableSearch(value);
    setPage(1);
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Assign Teacher Shift
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Select a teacher and assign their working shift.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm">
            <UserRound className="h-4 w-4 text-slate-500" />

            <span className="text-sm text-slate-600">Total Teachers:</span>

            <span className="font-semibold text-slate-900">
              {teachers.length}
            </span>
          </div>
        </div>

        {/* =================================================
            ASSIGN FORM CARD
        ================================================= */}

        <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Teacher Shift Assignment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search a teacher by code or name and select a shift.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* =================================================
                TEACHER SEARCH
            ================================================= */}

            <div className="relative flex flex-col">
              <label className="mb-2 text-sm font-medium text-slate-700">
                Teacher (Code / Name)
                <span className="ml-1 text-red-500">*</span>
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  placeholder="কোড বা নাম লিখুন"
                  value={query}
                  disabled={loading}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedTeacher(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (query.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleEnter();
                    }
                  }}
                  className="h-10 pl-9 pr-9"
                />

                {query && (
                  <button
                    type="button"
                    onClick={clearTeacher}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Suggestions */}

              {showSuggestions &&
                !selectedTeacher &&
                suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[72px] z-30 overflow-hidden rounded-xl border bg-white shadow-xl">
                    <div className="border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                      Matching Teachers
                    </div>

                    <ul className="max-h-64 overflow-y-auto">
                      {suggestions.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => pickTeacher(t)}
                            className="flex w-full items-center justify-between px-3 py-3 text-left transition hover:bg-slate-50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-800">
                                {t.name}
                              </p>

                              {t.designation && (
                                <p className="truncate text-xs text-slate-400">
                                  {t.designation}
                                </p>
                              )}
                            </div>

                            <span className="ml-3 shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                              {t.code}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* No suggestion */}

              {showSuggestions &&
                query.trim() &&
                !selectedTeacher &&
                suggestions.length === 0 &&
                !loading && (
                  <div className="absolute left-0 right-0 top-[72px] z-30 rounded-xl border bg-white p-4 text-center text-sm text-slate-500 shadow-xl">
                    No teacher found
                  </div>
                )}
            </div>

            {/* =================================================
                SHIFT SELECT
            ================================================= */}

            <div className="flex flex-col">
              <label className="mb-2 text-sm font-medium text-slate-700">
                Shift
                <span className="ml-1 text-red-500">*</span>
              </label>

              <Select
                value={shiftId}
                onValueChange={setShiftId}
                disabled={!selectedTeacher || loading}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Shift নির্বাচন করুন" />
                </SelectTrigger>

                <SelectContent>
                  {shifts.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      No active shift found
                    </div>
                  ) : (
                    shifts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {shiftLabel(s)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* =================================================
                ACTION
            ================================================= */}

            <div className="flex items-end">
              <Button
                onClick={handleAssign}
                disabled={saving || !selectedTeacher || !shiftId}
                className="h-10 w-full md:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Assign Shift"
                )}
              </Button>
            </div>
          </div>

          {/* =================================================
              SELECTED TEACHER INFO
          ================================================= */}

          {selectedTeacher && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                    Selected Teacher
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {selectedTeacher.name}
                    </span>

                    <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-500">
                      {selectedTeacher.code}
                    </span>

                    {selectedTeacher.designation && (
                      <span className="text-sm text-slate-500">
                        {selectedTeacher.designation}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-slate-500">Current Shift:</span>{" "}
                  {selectedTeacher.shift ? (
                    <span className="font-medium text-slate-800">
                      {shiftLabel(selectedTeacher.shift)}
                    </span>
                  ) : (
                    <span className="font-medium text-slate-400">
                      No shift assigned
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            TEACHER LIST
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {/* =================================================
              TABLE HEADER
          ================================================= */}

          <div className="flex flex-col gap-4 border-b p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Teacher List
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage current teacher shift assignments.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                placeholder="Search by code / name"
                value={tableSearch}
                onChange={(e) => handleTableSearch(e.target.value)}
                className="h-10 pl-9"
              />
            </div>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="border border-slate-700 px-4 py-3 text-center font-semibold">
                    SL
                  </th>

                  <th className="border border-slate-700 px-4 py-3 text-left font-semibold">
                    Code
                  </th>

                  <th className="border border-slate-700 px-4 py-3 text-left font-semibold">
                    Name
                  </th>

                  <th className="border border-slate-700 px-4 py-3 text-left font-semibold">
                    Designation
                  </th>

                  <th className="border border-slate-700 px-4 py-3 text-left font-semibold">
                    Shift
                  </th>

                  <th className="border border-slate-700 px-4 py-3 text-center font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* Loading */}

                {loading && (
                  <tr>
                    <td colSpan={6} className="border px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />

                        <span className="text-sm text-slate-500">
                          Loading teachers...
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data */}

                {!loading &&
                  paginatedRows.map((t, index) => {
                    const serial = 10001 + (page - 1) * limit + index;

                    return (
                      <tr
                        key={t.id}
                        className="transition hover:bg-blue-50/60 odd:bg-slate-50/60"
                      >
                        {/* SL */}

                        <td className="border px-4 py-3 text-center font-medium text-slate-600">
                          {serial}
                        </td>

                        {/* Code */}

                        <td className="border px-4 py-3">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            {t.code}
                          </span>
                        </td>

                        {/* Name */}

                        <td className="border px-4 py-3 font-medium text-slate-800">
                          {t.name}
                        </td>

                        {/* Designation */}

                        <td className="border px-4 py-3 text-slate-600">
                          {t.designation || "-"}
                        </td>

                        {/* Shift */}

                        <td className="border px-4 py-3">
                          {t.shift ? (
                            <div>
                              <p className="font-medium text-slate-800">
                                {t.shift.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {fmtTime(t.shift.startTime)} -{" "}
                                {fmtTime(t.shift.endTime)}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600">
                              Not assigned
                            </span>
                          )}
                        </td>

                        {/* Action */}

                        <td className="border px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={saving}
                              onClick={() => {
                                pickTeacher(t);

                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                            >
                              {t.shift ? "Change" : "Assign"}
                            </Button>

                            {t.shift && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={saving}
                                onClick={() => assign(t.id, null)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {/* Empty */}

                {!loading && paginatedRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="border px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                          <UserRound className="h-5 w-5 text-slate-400" />
                        </div>

                        <p className="font-medium text-slate-700">
                          No teachers found
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Try changing your search.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!loading && tableRows.length > 0 && (
            <div className="flex flex-col gap-4 border-t bg-slate-50/70 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              {/* Result Info */}

              <div className="text-center text-sm text-slate-500 lg:text-left">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {startItem}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">{endItem}</span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {tableRows.length}
                </span>{" "}
                teachers
              </div>

              {/* Pagination Controls */}

              <div className="flex flex-wrap items-center justify-center gap-1">
                {/* First */}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(1)}
                  className="hidden h-9 w-9 p-0 sm:inline-flex"
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Previous */}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="h-9 gap-1 px-3"
                >
                  <ChevronLeft className="h-4 w-4" />

                  <span className="hidden sm:inline">Previous</span>
                </Button>

                {/* Page Numbers */}

                <div className="flex items-center gap-1">
                  {paginationPages.map((item, index) =>
                    item === "..." ? (
                      <span
                        key={`dots-${index}`}
                        className="px-2 text-sm text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant={page === item ? "default" : "outline"}
                        onClick={() => setPage(item)}
                        className="h-9 min-w-9 px-2"
                      >
                        {item}
                      </Button>
                    ),
                  )}
                </div>

                {/* Next */}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className="h-9 gap-1 px-3"
                >
                  <span className="hidden sm:inline">Next</span>

                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last */}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(totalPages)}
                  className="hidden h-9 w-9 p-0 sm:inline-flex"
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignTeacherShift;
