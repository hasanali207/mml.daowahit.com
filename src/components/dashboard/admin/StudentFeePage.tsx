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
type StudentType = { id: string; code: string; name: string };
type AdmissionType = { id: string; student: StudentType };
type FeeCategoryType = { id: string; name: string };
type StudentFeeType = {
  id: string;
  amount: number;
  feeCategory: FeeCategoryType;
  image: string;
};

/* ---------------- Component ---------------- */
export default function StudentFeePage() {
  const [fileName, setFileName] = useState<string>("আবেদন যুক্ত করুন");

  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);

  const [students, setStudents] = useState<AdmissionType[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<AdmissionType[]>([]);
  const [selectedAdmission, setSelectedAdmission] =
    useState<AdmissionType | null>(null);

  const [feeCategories, setFeeCategories] = useState<FeeCategoryType[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFeeType[]>([]);

  const [form, setForm] = useState({
    feeCategoryId: "",
    amount: "",
    imageFile: null as File | null,
  });

  const [studentSearch, setStudentSearch] = useState("");

  /* ---------------- Fetch Sessions & Fee Categories ---------------- */
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [sesRes, feeRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session`),
          fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/v1/feecategory`),
        ]);
        const sesJson = await sesRes.json();
        const feeJson = await feeRes.json();

        if (sesJson.success) {
          setSessions(sesJson.data || []);
          if (sesJson.data?.length) setSelectedSessionId(sesJson.data[0].id);
        }
        if (feeJson.success) setFeeCategories(feeJson.data || []);
      } catch {
        toast.error("Failed to load initial data");
      }
    };
    fetchInitial();
  }, []);

  /* ---------------- Fetch Classes ---------------- */
  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchClasses = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session/${selectedSessionId}/classes`,
        );
        const json = await res.json();
        setClasses(json.data || []);
        setSelectedClass(null);
        setStudents([]);
        setFilteredStudents([]);
        setSelectedAdmission(null);
        setStudentFees([]);
      } catch {
        toast.error("Failed to fetch classes");
      }
    };
    fetchClasses();
  }, [selectedSessionId]);

  /* ---------------- Fetch Students by Class ---------------- */
  useEffect(() => {
    if (!selectedClass || !selectedSessionId) return;

    const fetchStudents = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/admission?classId=${selectedClass.id}&sessionId=${selectedSessionId}`,
        );
        const json = await res.json();

        if (json.success) {
          setStudents(json.data || []);
          setFilteredStudents(json.data || []);
        } else {
          setStudents([]);
          setFilteredStudents([]);
        }
        setSelectedAdmission(null);
        setStudentFees([]);
      } catch {
        toast.error("Failed to fetch students");
      }
    };
    fetchStudents();
  }, [selectedClass, selectedSessionId]);

  /* ---------------- Search Students ---------------- */
  useEffect(() => {
    const q = studentSearch.toLowerCase();
    setFilteredStudents(
      students.filter(
        (a) =>
          a.student.name.toLowerCase().includes(q) ||
          a.student.code.toLowerCase().includes(q),
      ),
    );
  }, [studentSearch, students]);

  /* ---------------- Fetch Student Fees ---------------- */
  useEffect(() => {
    if (!selectedAdmission) {
      setStudentFees([]);
      return;
    }

    const fetchFees = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/studentFee/${selectedAdmission.id}`,
        );
        const json = await res.json();
        setStudentFees(json.success ? json.data || [] : []);
      } catch {
        toast.error("Failed to fetch student fees");
      }
    };

    fetchFees();
  }, [selectedAdmission]);

  /* ---------------- Add Fee ---------------- */
  const handleAddFee = async () => {
    if (!selectedAdmission) return toast.error("Select a student");
    if (!form.feeCategoryId || !form.amount)
      return toast.error("Fill all fields");

    try {
      const formData = new FormData();
      if (form.imageFile) formData.append("file", form.imageFile);
      formData.append(
        "data",
        JSON.stringify({
          admissionId: selectedAdmission.id,
          feeCategoryId: form.feeCategoryId,
          amount: Number(form.amount),
        }),
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/studentFee`,
        {
          method: "POST",
          body: formData,
        },
      );

      const json = await res.json();
      if (!json.success) throw new Error();

      toast.success("Fee saved");
      setForm({ feeCategoryId: "", amount: "", imageFile: null });
      setFileName("আবেদন যুক্ত করুন");

      // Refresh student fees
      const f = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/studentFee/${selectedAdmission.id}`,
      );
      const j = await f.json();
      setStudentFees(j.success ? j.data || [] : []);
    } catch {
      toast.error("Failed to save fee");
    }
  };

  /* ---------------- Delete Fee ---------------- */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/studentFee/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error();

      toast.success("Deleted");
      setStudentFees((p) => p.filter((f) => f.id !== id));
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ---------------- Edit Fee ---------------- */
  const handleEdit = (fee: StudentFeeType) => {
    setForm({
      feeCategoryId: fee.feeCategory.id,
      amount: String(fee.amount),
      imageFile: null,
    });
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        ছাড়কৃত শিক্ষার্থীর জন্য নির্ধারিত ফি
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Session */}
          <Select
            value={selectedSessionId}
            onValueChange={setSelectedSessionId}
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
          {classes.length > 0 && (
            <Select
              value={selectedClass?.id || ""}
              onValueChange={(id) =>
                setSelectedClass(classes.find((c) => c.id === id) || null)
              }
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
          )}

          {/* Student Search */}

          <div>
            <Input
              placeholder="Search student..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="mb-2"
            />
            <div className="border rounded-lg bg-white dark:bg-zinc-700 max-h-60 overflow-y-auto">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((a) => (
                  <div
                    key={a.id}
                    className={`px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-zinc-600 ${
                      selectedAdmission?.id === a.id
                        ? "bg-blue-200 dark:bg-zinc-500 font-semibold"
                        : ""
                    }`}
                    onClick={() => setSelectedAdmission(a)}
                  >
                    {a.student.name} ({a.student.code})
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 dark:text-gray-300">
                  No student found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Panel */}

        <div className="space-y-4">
          <Select
            value={form.feeCategoryId}
            onValueChange={(v) => setForm({ ...form, feeCategoryId: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Fee Category" />
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
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          {/* Image Upload */}
          <div className="flex flex-col">
            <div className="relative w-full md:w-64">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setForm({ ...form, imageFile: e.target.files[0] });
                    setFileName(e.target.files[0].name);
                  } else {
                    setForm({ ...form, imageFile: null });
                    setFileName("No file selected");
                  }
                }}
              />
              <div className="flex items-center justify-between px-4 py-2 border rounded-lg bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 hover:border-blue-500 transition-colors cursor-pointer">
                <span className="truncate text-gray-500 dark:text-gray-300">
                  {fileName}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleAddFee}
            className="bg-primary text-white w-full md:w-auto"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Right Panel */}

      <div className="overflow-x-auto col-span-1 md:col-span-3 mt-10">
        <table className="min-w-full border text-center divide-y divide-gray-200 dark:divide-zinc-600">
          <thead className="bg-gray-100 dark:bg-zinc-700">
            <tr>
              <th className="p-2 border">#</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Application</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-600">
            {studentFees.map((f, i) => (
              <tr key={f.id}>
                <td className="p-2 border">{i + 1}</td>
                <td className="p-2 border">{f.feeCategory.name}</td>
                <td className="p-2 border">{f.amount}</td>
                <td className="p-2 border">
                  {f.image ? (
                    <a
                      href={f.image}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-2 border flex justify-center gap-2">
                  <Button size="sm" onClick={() => handleEdit(f)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(f.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
