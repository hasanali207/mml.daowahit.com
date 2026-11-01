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

/* ---------------- Types ---------------- */
type SessionType = { id: string; name: string };
type ClassType = { id: string; name: string };
type AdmissionType = { id: string; student: { name: string; code: string } };

/* ---------------- Month / Year ---------------- */
const months = [
  { label: "জানুয়ারি", value: "January" },
  { label: "ফেব্রুয়ারি", value: "February" },
  { label: "মার্চ", value: "March" },
  { label: "এপ্রিল", value: "April" },
  { label: "মে", value: "May" },
  { label: "জুন", value: "June" },
  { label: "জুলাই", value: "July" },
  { label: "আগস্ট", value: "August" },
  { label: "সেপ্টেম্বর", value: "September" },
  { label: "অক্টোবর", value: "October" },
  { label: "নভেম্বর", value: "November" },
  { label: "ডিসেম্বর", value: "December" },
];

const generateYears = () => {
  const current = new Date().getFullYear();

  // current এর আগের 2 বছর থেকে current + 5 বছর
  return Array.from({ length: 3 }, (_, i) => current - 1 + i);
};

/* ---------------- Component ---------------- */
export default function AdminPaymentGenerate() {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [selectedSession, setSelectedSession] = useState("");

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] = useState("");

  const [admissions, setAdmissions] = useState<AdmissionType[]>([]);
  const [selectedAdmissions, setSelectedAdmissions] = useState<string[]>([]);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState("");

  /* ---------------- Load Sessions ---------------- */
  useEffect(() => {
    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session`,
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSessions(json.data);
          if (json.data.length > 0) {
            setSelectedSession(json.data[0].id); // auto select first session
          }
        }
      } catch (err) {
        toast.error("Session fetch failed");
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, []);

  /* ---------------- Load Classes when session changes ---------------- */
  useEffect(() => {
    if (!selectedSession) {
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
          if (json.data.length > 0) setSelectedClass(json.data[0].id); // auto select first class
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
    setSelectedAdmissions([]);
  }, [selectedSession]);

  /* ---------------- Load Admissions when class changes ---------------- */
  useEffect(() => {
    if (!selectedSession || !selectedClass) {
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
        setSelectedAdmissions([]);
      }
    };

    fetchAdmissions();
  }, [selectedClass, selectedSession]);

  /* ---------------- Toggle Student ---------------- */
  const toggleAdmission = (id: string) => {
    setSelectedAdmissions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  /* ---------------- Generate Payment ---------------- */
  const handleGeneratePayment = async () => {
    if (
      !selectedSession ||
      !selectedClass ||
      !selectedMonth ||
      !selectedYear ||
      selectedAdmissions.length === 0
    ) {
      return toast.error(
        "Session, Class, Month, Year এবং কমপক্ষে একজন Student নির্বাচন করুন!",
      );
    }

    try {
      for (const admissionId of selectedAdmissions) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              admissionId,
              sessionId: selectedSession,
              month: selectedMonth,
              year: Number(selectedYear),
            }),
          },
        );

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to generate payment");
        }
      }

      toast.success("Payment generated successfully!");
      setSelectedAdmissions([]);
    } catch (error: any) {
      console.error("Payment generate error:", error);
      toast.error(error.message || "Something went wrong!");
    }
  };

  const filteredAdmissions = admissions.filter((a) => {
    const term = search.toLowerCase();

    return (
      a.student.name.toLowerCase().includes(term) ||
      a.student.code.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex justify-center items-center flex-col">
        <h2 className="text-2xl mb-4 bangla">পেমেন্ট তৈরি করুন</h2>
        <p className="text-lg mb-4 text-red-500 bangla">
          পেমেন্ট তৈরী করার পূর্বে ক্লাস ওয়ারী খাত দেখে নিন।
        </p>
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div className="">
          {/* Session */}
          <Select
            value={selectedSession}
            onValueChange={(val) => setSelectedSession(val)}
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
              onValueChange={(val) => setSelectedClass(val)}
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

          {/* Month */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full mt-4">
              <SelectValue placeholder="মাস নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full mt-4">
              <SelectValue placeholder="বছর নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {generateYears().map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          {/* Students */}
          {filteredAdmissions.length === 0 && (
            <p className="text-sm  text-red-400 text-center py-4">
              কোন শিক্ষার্থী পাওয়া যায়নি
            </p>
          )}
          {admissions.length > 0 && (
            <div className="border p-3 rounded max-h-96 overflow-y-auto">
              <input
                type="text"
                placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full mb-3 px-2 p-2 border rounded text-sm"
              />

              {/* Dynamic Select / Deselect All */}
              <div className="flex justify-end mb-2">
                {selectedAdmissions.length === admissions.length ? (
                  <button
                    type="button"
                    className="text-sm bg-blue-200 p-2 rounded-3xl cursor-pointer"
                    onClick={() => setSelectedAdmissions([])}
                  >
                    Deselect All
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-sm bg-blue-500 p-2 rounded-3xl text-white cursor-pointer"
                    onClick={() =>
                      setSelectedAdmissions(admissions.map((a) => a.id))
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
                    checked={selectedAdmissions.includes(a.id)}
                    onChange={() => toggleAdmission(a.id)}
                  />
                  {a.student.name} ({a.student.code})
                </label>
              ))}
            </div>
          )}

          <Button
            className="mt-4 bg-primary text-white w-full"
            onClick={handleGeneratePayment}
          >
            Generate Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
