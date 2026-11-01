"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/* ================= TYPES ================= */
type SessionType = { id: string; name: string };
type ClassType = { id: string; name: string };
type AdmissionType = {
  id: string;
  student: { id: string; name: string; code: string };
};
type TeacherType = {
  id: string;
  name: string;
  code: string;
  profilePicture: string;
  designation: string;
};

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
type Tab = "STUDENT" | "TEACHER";

const STATUS_OPTIONS: { label: string; value: AttendanceStatus }[] = [
  { label: "উপস্থিত", value: "PRESENT" },
  { label: "অনুপস্থিত", value: "ABSENT" },
  { label: "দেরিতে উপস্থিত", value: "LATE" },
  { label: "ছুটি", value: "LEAVE" },
];

/* ================= MAIN COMPONENT ================= */
export default function AdminManualAttendance() {
  const [tab, setTab] = useState<Tab>("STUDENT");

  /* shared */
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [status, setStatus] = useState<AttendanceStatus>("PRESENT");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  /* ---------------- Student states ---------------- */
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [admissions, setAdmissions] = useState<AdmissionType[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  /* ---------------- Teacher states ---------------- */
  const [teachers, setTeachers] = useState<TeacherType[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  /* ================= LOAD SESSIONS ================= */
  useEffect(() => {
    if (tab !== "STUDENT") return;

    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session`,
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSessions(json.data);
          if (json.data.length > 0) setSelectedSession(json.data[0].id);
        }
      } catch (err) {
        toast.error("Session fetch failed");
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [tab]);

  /* ================= LOAD CLASSES ================= */
  useEffect(() => {
    if (tab !== "STUDENT" || !selectedSession) {
      setClasses([]);
      setSelectedClass("");
      return;
    }

    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session/${selectedSession}/classes`,
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setClasses(json.data);
          if (json.data.length > 0) setSelectedClass(json.data[0].id);
        } else {
          setClasses([]);
          setSelectedClass("");
        }
      } catch (err) {
        toast.error("Class fetch failed");
        setClasses([]);
        setSelectedClass("");
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
    setAdmissions([]);
    setSelectedStudents([]);
  }, [selectedSession, tab]);

  /* ================= LOAD ADMISSIONS (students) ================= */
  useEffect(() => {
    if (tab !== "STUDENT" || !selectedSession || !selectedClass) {
      setAdmissions([]);
      return;
    }

    const fetchAdmissions = async () => {
      setLoadingStudents(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/admission?sessionId=${selectedSession}&classId=${selectedClass}`,
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAdmissions(json.data);
        } else {
          setAdmissions([]);
        }
      } catch (err) {
        toast.error("Student fetch failed");
        setAdmissions([]);
      } finally {
        setLoadingStudents(false);
        setSelectedStudents([]);
      }
    };

    fetchAdmissions();
  }, [selectedClass, selectedSession, tab]);

  /* ================= LOAD TEACHERS ================= */
  useEffect(() => {
    if (tab !== "TEACHER") return;

    const fetchTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacher`,
        );
        const data = await res.json();
        setTeachers(data.data || []);
      } catch (err) {
        toast.error("Teacher fetch failed");
        setTeachers([]);
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, [tab]);

  /* ================= TOGGLE SELECT ================= */
  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((x) => x !== studentId)
        : [...prev, studentId],
    );
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(teacherId)
        ? prev.filter((x) => x !== teacherId)
        : [...prev, teacherId],
    );
  };

  /* ================= SUBMIT (bulk) ================= */
  const handleSubmitAttendance = async () => {
    const ids = tab === "STUDENT" ? selectedStudents : selectedTeachers;

    if (!date || ids.length === 0) {
      return toast.error(
        `তারিখ এবং কমপক্ষে একজন ${tab === "STUDENT" ? "Student" : "Teacher"} নির্বাচন করুন!`,
      );
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/attendence/manual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(tab === "STUDENT" ? { studentIds: ids } : { teacherIds: ids }),
            status,
            remarks: remarks || "",
            date,
          }),
        },
      );

      const result = await res.json();
      if (!res.ok)
        throw new Error(result?.message || "Attendance submit failed");

      const { succeeded, failedCount, total } = result.data;
      if (failedCount > 0) {
        toast.error(`${succeeded}/${total} জন সফল, ${failedCount} জন ব্যর্থ`);
      } else {
        toast.success(`${succeeded} জনের হাজিরা সফলভাবে যুক্ত হয়েছে!`);
      }

      setSelectedStudents([]);
      setSelectedTeachers([]);
    } catch (err: any) {
      console.error("Attendance submit error:", err);
      toast.error(err?.message || "Something went wrong!");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= FILTERED LISTS ================= */
  const filteredAdmissions = admissions.filter((a) => {
    const term = search.toLowerCase();
    return (
      a.student.name.toLowerCase().includes(term) ||
      a.student.code.toLowerCase().includes(term)
    );
  });

  const filteredTeachers = teachers.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) || t.code.toLowerCase().includes(term)
    );
  });

  const selectedCount =
    tab === "STUDENT" ? selectedStudents.length : selectedTeachers.length;
  const totalCount = tab === "STUDENT" ? admissions.length : teachers.length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-center items-center flex-col">
        <h2 className="text-2xl mb-4 bangla">ম্যানুয়াল হাজিরা</h2>
        <p className="text-lg mb-4 text-red-500 bangla">
          হাজিরা তৈরী করার পূর্বে সঠিক তথ্য দেখে নিন।
        </p>
      </div>

      {/* TAB SWITCH */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => {
            setTab("STUDENT");
            setSearch("");
          }}
          className={`px-6 py-2 rounded-full text-sm font-medium cursor-pointer transition-all bangla ${
            tab === "STUDENT"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          শিক্ষার্থী হাজিরা
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("TEACHER");
            setSearch("");
          }}
          className={`px-6 py-2 rounded-full text-sm font-medium cursor-pointer transition-all bangla ${
            tab === "TEACHER"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          শিক্ষক হাজিরা
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ================= LEFT: FILTERS ================= */}
        <div>
          {tab === "STUDENT" && (
            <>
              {/* Session */}
              <Select
                value={selectedSession}
                onValueChange={setSelectedSession}
                disabled={loadingSessions}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Session নির্বাচন করুন" />
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
              {classes.length > 0 && (
                <Select
                  value={selectedClass}
                  onValueChange={setSelectedClass}
                  disabled={loadingClasses}
                >
                  <SelectTrigger className="w-full mt-4">
                    <SelectValue placeholder="Class নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}

          {/* Date */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mt-4 px-3 py-2 border rounded text-sm"
          />

          {/* Status */}
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as AttendanceStatus)}
          >
            <SelectTrigger className="w-full mt-4">
              <SelectValue placeholder="অবস্থা নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Remarks */}
          <input
            type="text"
            placeholder="মন্তব্য (ঐচ্ছিক)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full mt-4 px-3 py-2 border rounded text-sm"
          />
        </div>

        {/* ================= RIGHT: LIST ================= */}
        <div>
          {tab === "STUDENT" ? (
            <>
              {filteredAdmissions.length === 0 && !loadingStudents && (
                <p className="text-sm text-red-400 text-center py-4">
                  কোন শিক্ষার্থী পাওয়া যায়নি
                </p>
              )}
              {admissions.length > 0 && (
                <div className="border p-3 rounded max-h-96 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full mb-3 px-2 p-2 border rounded text-sm"
                  />

                  <div className="flex justify-end mb-2">
                    {selectedStudents.length === admissions.length ? (
                      <button
                        type="button"
                        className="text-sm bg-blue-200 p-2 rounded-3xl cursor-pointer"
                        onClick={() => setSelectedStudents([])}
                      >
                        Deselect All
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-sm bg-blue-500 p-2 rounded-3xl text-white cursor-pointer"
                        onClick={() =>
                          setSelectedStudents(
                            admissions.map((a) => a.student.id),
                          )
                        }
                      >
                        Select All
                      </button>
                    )}
                  </div>

                  {filteredAdmissions.map((a) => (
                    <label
                      key={a.id}
                      className="flex gap-2 mb-2 bg-gray-100 p-4 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(a.student.id)}
                        onChange={() => toggleStudent(a.student.id)}
                      />
                      {a.student.name} ({a.student.code})
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {filteredTeachers.length === 0 && !loadingTeachers && (
                <p className="text-sm text-red-400 text-center py-4">
                  কোন শিক্ষক পাওয়া যায়নি
                </p>
              )}
              {teachers.length > 0 && (
                <div className="border p-3 rounded max-h-96 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full mb-3 px-2 p-2 border rounded text-sm"
                  />

                  <div className="flex justify-end mb-2">
                    {selectedTeachers.length === teachers.length ? (
                      <button
                        type="button"
                        className="text-sm bg-blue-200 p-2 rounded-3xl cursor-pointer"
                        onClick={() => setSelectedTeachers([])}
                      >
                        Deselect All
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-sm bg-blue-500 p-2 rounded-3xl text-white cursor-pointer"
                        onClick={() =>
                          setSelectedTeachers(teachers.map((t) => t.id))
                        }
                      >
                        Select All
                      </button>
                    )}
                  </div>

                  {filteredTeachers.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-3 mb-2 bg-gray-100 p-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(t.id)}
                        onChange={() => toggleTeacher(t.id)}
                      />

                      <span>
                        {t.name} ({t.code})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {totalCount > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {selectedCount} / {totalCount} জন নির্বাচিত
            </p>
          )}

          <Button
            className="mt-4 bg-primary text-white w-full"
            onClick={handleSubmitAttendance}
            disabled={submitting}
          >
            {submitting ? "সাবমিট হচ্ছে..." : "হাজিরা সাবমিট করুন"}
          </Button>
        </div>
      </div>
    </div>
  );
}
