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
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/* ---------------- Types ---------------- */
type SessionType = { id: string; name: string };
type ClassType = { id: string; name: string };
type AdmissionType = { id: string; student: { name: string; code: string } };
type FeeCategoryType = { id: string; name: string };

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
  return Array.from({ length: 3 }, (_, i) => current - 1 + i);
};

/* ---------------- Component ---------------- */
export default function ExtraFeeGenerate() {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionType[]>([]);
  const [feeCategories, setFeeCategories] = useState<FeeCategoryType[]>([]);

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [feeCategoryId, setFeeCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedAdmissions, setSelectedAdmissions] = useState<string[]>([]);

  const [search, setSearch] = useState("");

  /* ---------------- Fetch Sessions ---------------- */
  useEffect(() => {
    const fetchSessions = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session`,
      );
      const json = await res.json();
      setSessions(json.data || []);
      if (json.data?.length) setSelectedSession(json.data[0].id);
    };
    fetchSessions();
  }, []);

  /* ---------------- Fetch Classes ---------------- */
  useEffect(() => {
    if (!selectedSession) return;
    const fetchClasses = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session/${selectedSession}/classes`,
      );
      const json = await res.json();
      setClasses(json.data || []);
      if (json.data?.length) setSelectedClass(json.data[0].id);
    };
    fetchClasses();
  }, [selectedSession]);

  /* ---------------- Fetch Students ---------------- */
  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/admission?sessionId=${selectedSession}&classId=${selectedClass}`,
      );
      const json = await res.json();
      setAdmissions(json.data || []);
      setSelectedAdmissions([]); // reset selection on class change
    };
    fetchStudents();
  }, [selectedClass]);

  /* ---------------- Fetch Fee Categories ---------------- */
  useEffect(() => {
    const fetchFeeCategory = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/feecategory`,
      );
      const json = await res.json();
      setFeeCategories(json.data || []);
    };
    fetchFeeCategory();
  }, []);

  /* ---------------- Toggle Student ---------------- */
  const toggleAdmission = (id: string) => {
    setSelectedAdmissions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const filteredAdmissions = admissions.filter((a) => {
    const term = search.toLowerCase();
    return (
      a.student.name.toLowerCase().includes(term) ||
      a.student.code.toLowerCase().includes(term)
    );
  });

  /* ---------------- Add Extra Fee ---------------- */
  const handleAddExtraFee = async () => {
    if (!selectedSession || !selectedClass || !selectedMonth || !selectedYear)
      return toast.error("Session / Class / Month / Year নির্বাচন করুন");

    if (!feeCategoryId || !amount)
      return toast.error("Fee Category এবং Amount দিন");

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/generate/add-extra`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: selectedSession,
            classId: selectedClass,
            month: selectedMonth,
            year: Number(selectedYear),
            feeCategoryId,
            amount: Number(amount),
            admissionIds: selectedAdmissions,
          }),
        },
      );
      toast.success("Extra fee added!");
      setSelectedAdmissions([]);
    } catch {
      toast.error("Failed to add extra fee");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 max-w-7xl">
      <div className="flex justify-center flex-col mb-6">
        <h2 className="text-2xl font-bold text-center mb-2">
          Extra Fee Generate
        </h2>
        <p className="text-sm text-center text-red-500">
          Extra Fee যোগ করার আগে ক্লাস ওয়ারী খাত দেখুন
        </p>
      </div>

      <div className="grid grid-cols-2 gap-10">
        {/* Left Column: Filters */}
        <div className="">
          <Select value={selectedSession} onValueChange={setSelectedSession}>
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

          <Select value={selectedClass} onValueChange={setSelectedClass}>
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

          <Select value={feeCategoryId} onValueChange={setFeeCategoryId}>
            <SelectTrigger className="w-full mt-4">
              <SelectValue placeholder="Fee Category নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {feeCategories.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Amount"
            type="number"
            value={amount}
            className="mt-4"
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Right Column: Students */}
        <div className="flex flex-col">
          {admissions.length === 0 && (
            <p className="text-sm text-center text-red-400 py-4">
              কোন শিক্ষার্থী পাওয়া যায়নি
            </p>
          )}

          {admissions.length > 0 && (
            <div className="border p-3 rounded max-h-96 overflow-y-auto flex flex-col gap-2">
              <Input
                placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="flex justify-end gap-2">
                {selectedAdmissions.length === admissions.length ? (
                  <Button size="sm" onClick={() => setSelectedAdmissions([])}>
                    Deselect All
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setSelectedAdmissions(admissions.map((a) => a.id))
                    }
                  >
                    Select All
                  </Button>
                )}
              </div>

              {filteredAdmissions.map((a) => (
                <label
                  key={a.id}
                  className="flex gap-2 items-center p-2 bg-gray-100 rounded cursor-pointer"
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
            className="mt-4 w-full bg-primary text-white"
            onClick={handleAddExtraFee}
          >
            Add Extra Fee
          </Button>
        </div>
      </div>
    </div>
  );
}
