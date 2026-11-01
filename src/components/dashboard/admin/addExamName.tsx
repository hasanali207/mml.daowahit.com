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
import {
  BookOpen,
  CalendarIcon,
  CalendarRange,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  School,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_BASE_API!;

const emptyForm = {
  id: "",
  examName: "",
  sessionId: "",
  classId: "",
  examType: "",
  startDate: "",
  endDate: "",
  publishDate: "",
  status: "DRAFT",
};

// ✅ tomar actual prisma enum onujayi
const STATUS_OPTIONS = [
  { value: "DRAFT", label: "খসড়া" },
  { value: "SCHEDULED", label: "নির্ধারিত" },
  { value: "ONGOING", label: "চলমান" },
  { value: "COMPLETED", label: "সম্পন্ন" },
  { value: "PUBLISHED", label: "প্রকাশিত" },
];

const statusLabel: Record<string, string> = {
  DRAFT: "খসড়া",
  SCHEDULED: "নির্ধারিত",
  ONGOING: "চলমান",
  COMPLETED: "সম্পন্ন",
  PUBLISHED: "প্রকাশিত",
};

const statusStyle: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600 ring-1 ring-gray-300",
  SCHEDULED: "bg-blue-50 text-blue-700 ring-1 ring-blue-300",
  ONGOING: "bg-amber-50 text-amber-700 ring-1 ring-amber-300",
  COMPLETED: "bg-slate-100 text-slate-500 ring-1 ring-slate-300",
  PUBLISHED: "bg-green-50 text-green-700 ring-1 ring-green-300",
};

const examTypeLabel: Record<string, string> = {
  NURANI: "নূরানি",
  ABASHIK: "আবাসিক",
};

export default function ExamNamePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingExams, setFetchingExams] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState<any>(emptyForm);

  // --------------------
  // Fetch Sessions
  // --------------------
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/session`);
        const data = await res.json();
        if (data.success) setSessions(data.data);
      } catch (err) {
        console.error("Session fetch error:", err);
      }
    }
    fetchSessions();
  }, []);

  // --------------------
  // Fetch Classes by Session
  // --------------------
  useEffect(() => {
    if (!selectedSession?.id) return;

    async function fetchClasses() {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/session/${selectedSession.id}/classes`,
        );
        const data = await res.json();
        if (data.success) {
          setClasses(data.data);
          setForm((prev: any) => ({
            ...prev,
            sessionId: selectedSession.id,
          }));
        } else {
          setClasses([]);
        }
      } catch (err) {
        console.error("Class fetch error:", err);
        setClasses([]);
      }
    }
    fetchClasses();
  }, [selectedSession]);

  // --------------------
  // Fetch Exam List
  // --------------------
  const fetchExams = async () => {
    setFetchingExams(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/exam`);
      const data = await res.json();
      if (data.success) setExams(data.data);
    } catch (err) {
      console.error("Exam fetch error:", err);
    } finally {
      setFetchingExams(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // --------------------
  // Reset form
  // --------------------
  const resetForm = () => {
    setForm(emptyForm);
    setSelectedSession(null);
    setClasses([]);
    setIsEditing(false);
  };

  // --------------------
  // Load exam into form for editing
  // --------------------
  const handleEdit = (exam: any) => {
    setForm({
      id: exam.id,
      examName: exam.examName,
      sessionId: exam.sessionId || "",
      classId: exam.classId,
      examType: exam.examType,
      startDate: exam.startDate?.slice(0, 10) || "",
      endDate: exam.endDate?.slice(0, 10) || "",
      publishDate: exam.publishDate?.slice(0, 10) || "",
      status: exam.status,
    });
    setSelectedSession(sessions.find((s) => s.id === exam.sessionId) || null);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --------------------
  // Delete
  // --------------------
  const handleDelete = async (id: string) => {
    if (!confirm("তুমি কি নিশ্চিত এই পরীক্ষাটি মুছে ফেলতে চাও?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/exam/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("পরীক্ষাটি মুছে ফেলা হয়েছে!");
        fetchExams();
        if (form.id === id) resetForm();
      } else {
        toast.error(data.message || "মুছে ফেলা ব্যর্থ হয়েছে!");
      }
    } catch (err) {
      console.error("Exam delete error:", err);
      toast.error("মুছে ফেলা ব্যর্থ হয়েছে!");
    }
  };

  // --------------------
  // Submit (create or update)
  // --------------------
  const handleSubmit = async () => {
    if (!form.examName || !form.sessionId || !form.classId) {
      return toast.error("সব তথ্য পূরণ করুন!");
    }

    setLoading(true);

    try {
      const url = isEditing
        ? `${API_BASE}/api/v1/exam/${form.id}`
        : `${API_BASE}/api/v1/exam`;
      const method = isEditing ? "PUT" : "POST";

      const { id, ...payload } = form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          isEditing
            ? "পরীক্ষাটি সফলভাবে আপডেট হয়েছে!"
            : "পরীক্ষাটি সফলভাবে তৈরি হয়েছে!",
        );
        resetForm();
        fetchExams();
      } else {
        toast.error(data.message || "সংরক্ষণ ব্যর্থ হয়েছে!");
      }
    } catch (err) {
      console.error("Exam save error:", err);
      toast.error("সংরক্ষণ ব্যর্থ হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 text-bangla bangla">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-100 mb-2">
          <ClipboardList className="text-green-700" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? "পরীক্ষা সম্পাদনা করুন" : "নতুন পরীক্ষা তৈরি করুন"}
        </h1>
        <p className="text-sm text-gray-500">
          সেশন, ক্লাস ও তারিখ নির্বাচন করে একটি পরীক্ষা যুক্ত করুন
        </p>
      </div>

      {/* Form Card */}
      <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-5">
        {isEditing && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="text-sm text-amber-700 font-medium">
              ✏️ &quot;{form.examName}&quot; সম্পাদনা করা হচ্ছে
            </span>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 text-sm text-red-600 hover:underline shrink-0"
            >
              <X size={14} /> বাতিল
            </button>
          </div>
        )}

        {/* Exam Name */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            পরীক্ষার নাম
          </label>
          <Input
            placeholder="যেমন: ১ম সাময়িক পরীক্ষা"
            value={form.examName}
            onChange={(e) => setForm({ ...form, examName: e.target.value })}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Session */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              সেশন
            </label>
            <Select
              value={selectedSession?.id || ""}
              onValueChange={(id) =>
                setSelectedSession(sessions.find((s) => s.id === id) || null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="সেশন নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              ক্লাস
            </label>
            <Select
              value={form.classId}
              onValueChange={(v) => setForm({ ...form, classId: v })}
              disabled={classes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Exam Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              পরীক্ষার ধরন
            </label>
            <Select
              value={form.examType}
              onValueChange={(v) => setForm({ ...form, examType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ধরন নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NURANI">নূরানি</SelectItem>
                <SelectItem value="ABASHIK">আবাসিক</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              স্ট্যাটাস
            </label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-gray-500 -mt-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          💡 স্ট্যাটাস <strong>&quot;সম্পন্ন&quot;</strong> করলে এই পরীক্ষাটি
          মার্কস এন্ট্রি ও অন্যান্য ড্রপডাউনে আর দেখানো হবে না।
        </p>

        {/* Dates */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            ["startDate", "শুরুর তারিখ"],
            ["endDate", "শেষ তারিখ"],
            ["publishDate", "প্রকাশের তারিখ"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {label}
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="pl-3 pr-9"
                />
                <CalendarIcon
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end gap-2">
          {isEditing && (
            <Button variant="outline" onClick={resetForm}>
              বাতিল করুন
            </Button>
          )}
          <Button
            className="bg-green-700 hover:bg-green-800 gap-2 px-6"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> সংরক্ষণ হচ্ছে...
              </>
            ) : isEditing ? (
              "আপডেট করুন"
            ) : (
              <>
                <Plus size={16} /> পরীক্ষা তৈরি করুন
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Exam List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            সব পরীক্ষার তালিকা
          </h2>
          <span className="text-xs text-gray-400">
            মোট {exams.length}টি পরীক্ষা
          </span>
        </div>

        {fetchingExams ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="animate-spin" size={18} /> লোড হচ্ছে...
          </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-300 rounded-2xl text-gray-400 gap-2">
            <ClipboardList size={32} />
            <p className="text-sm">কোনো পরীক্ষা পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="group border border-gray-200 rounded-xl p-4 bg-white hover:border-green-300 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {exam.examName}
                      </h3>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          statusStyle[exam.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {statusLabel[exam.status] || exam.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen size={13} />
                        {examTypeLabel[exam.examType] || exam.examType || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <School size={13} />
                        {exam.class?.name || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarRange size={13} />
                        {exam.startDate?.slice(0, 10)} —{" "}
                        {exam.endDate?.slice(0, 10)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleEdit(exam)}
                      className="p-2 rounded-lg hover:bg-green-50 text-green-700 transition-colors"
                      title="সম্পাদনা"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title="মুছুন"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
