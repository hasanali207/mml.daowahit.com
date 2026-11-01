"use client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { SquarePen, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

interface ClassItem {
  id: string;
  name: string;
}
interface SessionItem {
  id: string;
  name: string;
}
interface Student {
  id?: string;
  code: string;
  name: string;
  fatherName?: string;
  mobile1?: string;
  currentClass?: string;
}
interface AdmissionEditForm {
  classId: string;
  currentClass: string;
  type: string;
  residence: string;
  admissionDate: string;
  admissionFee: string;
  boardingFee: string;
  mashikBetn: string;
  rollNumber: string;
}

export default function AdmissionPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchCode, setSearchCode] = useState<string>("");
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(
    null,
  );
  const [sessionClasses, setSessionClasses] = useState<ClassItem[]>([]);
  const [currentClass, setCurrentClass] = useState<ClassItem | null>(null);
  const [type, setType] = useState<string>("নতুন");
  const [residence, setResidence] = useState<string>("আবাসিক");
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [rollNumber, setRollNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [admissionDate, setAdmissionDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [admissionFee, setAdmissionFee] = useState<string>("0");
  const [boardingFee, setBoardingFee] = useState<string>("0");
  const [mashikBetn, setMashikBetn] = useState<string>("0");

  // ✅ Edit states
  const [editingAdmission, setEditingAdmission] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<AdmissionEditForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session`,
        );
        const data = await res.json();
        const allSessions: SessionItem[] = data.data || [];
        setSessions(allSessions);
        if (allSessions.length > 0) {
          const firstSession = allSessions[0];
          setSelectedSession(firstSession);
          fetchClasses(firstSession.id);
        }
      } catch (err) {
        console.error(err);
        toast.error("Session fetch failed");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
    fetchAdmissions();
  }, []);

  const fetchClasses = async (sessionId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session/${sessionId}/classes`,
      );
      const data = await res.json();
      const classes: ClassItem[] = data.data || [];
      setSessionClasses(classes);
      setCurrentClass(classes[0] || null);
    } catch (err) {
      console.error(err);
      toast.error("Class fetch failed");
    }
  };

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/admission`,
      );
      const data = await res.json();
      setAdmissions(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch admissions");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByCode = async () => {
    if (!searchCode.trim()) return toast.error("অনুগ্রহ করে কোড লিখুন");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/student?code=${encodeURIComponent(searchCode.trim())}`,
      );
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        setSelectedStudent(data.data[0] as Student);
      } else if (data.data && !Array.isArray(data.data)) {
        setSelectedStudent(data.data as Student);
      } else {
        setSelectedStudent(null);
        toast.error("কোন শিক্ষার্থী পাওয়া যায়নি");
      }
    } catch (err) {
      console.error(err);
      toast.error("সার্ভারে সমস্যা হয়েছে");
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent) return toast.error("শিক্ষার্থী নির্বাচন করুন!");
    if (!selectedSession) return toast.error("শিক্ষাবর্ষ নির্বাচন করুন!");
    if (!currentClass) return toast.error("শ্রেণি নির্বাচন করুন!");
    try {
      const payload = {
        studentId: selectedStudent.code,
        sessionId: selectedSession.id,
        classId: currentClass.id,
        currentClass: currentClass.name,
        type,
        residence,
        admissionDate,
        admissionFee: parseFloat(admissionFee) || 0,
        boardingFee: parseFloat(boardingFee) || 0,
        mashikBetn: parseFloat(mashikBetn) || 0,
        rollNumber: rollNumber ? parseInt(rollNumber) : null,
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/admission`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Admission created");
        setSelectedStudent(null);
        setSearchCode("");
        setAdmissionDate(new Date().toISOString().split("T")[0]);
        setAdmissionFee("0");
        setBoardingFee("0");
        setMashikBetn("0");
        setRollNumber("");
        setAdmissions((prev) => [data.data, ...prev]);
      } else {
        toast.error(data.message || "ভর্তি সফল হয়নি");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "সার্ভার নেয়ার সমস্যা");
    }
  };

  // ✅ Edit handlers
  const openEdit = (a: any) => {
    setEditingAdmission(a);
    setEditForm({
      classId: a.classId,
      currentClass: a.currentClass ?? "",
      type: a.type ?? "নতুন",
      residence: a.residence ?? "আবাসিক",
      admissionDate: a.admissionDate
        ? new Date(a.admissionDate).toISOString().split("T")[0]
        : new Date(a.createdAt).toISOString().split("T")[0],
      admissionFee: String(a.admissionFee ?? 0),
      boardingFee: String(a.boardingFee ?? 0),
      mashikBetn: String(a.mashikBetn ?? 0),
      rollNumber: String(a.rollNumber ?? ""),
    });
  };

  const handleEditSubmit = async () => {
    if (!editingAdmission || !editForm) return;
    setEditLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/admission/${editingAdmission.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editForm,
            admissionFee: parseFloat(editForm.admissionFee) || 0,
            boardingFee: parseFloat(editForm.boardingFee) || 0,
            mashikBetn: parseFloat(editForm.mashikBetn) || 0,
            rollNumber: editForm.rollNumber
              ? parseInt(editForm.rollNumber)
              : null,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("আপডেট সফল হয়েছে");
        setAdmissions((prev) =>
          prev.map((a) => (a.id === editingAdmission.id ? data.data : a)),
        );
        setEditingAdmission(null);
        setEditForm(null);
      } else {
        toast.error(data.message || "আপডেট ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("সার্ভারে সমস্যা হয়েছে");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-10">লোড হচ্ছে...</p>;

  const filteredAdmissions = admissions
    .filter(
      (a) =>
        a.currentClass === (currentClass?.name || a.currentClass) &&
        a.session?.name?.trim() === selectedSession?.name?.trim(),
    )
    .sort((a, b) => {
      if (a.rollNumber === null || a.rollNumber === undefined) return 1;
      if (b.rollNumber === null || b.rollNumber === undefined) return -1;
      return a.rollNumber - b.rollNumber;
    });

  const handleSoftDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await api.delete(`/api/v1/admission/soft/${id}`);
      toast.success("Admission Canceled");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-slate-100 bangla">
      <h2 className="text-center text-3xl mt-10 mb-10">
        শিক্ষার্থী শ্রেণি ভর্তি
      </h2>

      {/* Search */}
      <div className="max-w-3xl mx-auto mb-4 flex space-x-2">
        <input
          type="text"
          placeholder="শিক্ষার্থীর আইডি/কোড লিখুন"
          className="border rounded-md border-blue-600 px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearchByCode()}
        />
        <Button
          onClick={handleSearchByCode}
          className="bg-primary hover:opacity-90"
        >
          খুঁজুন
        </Button>
      </div>

      {/* Selected Student */}
      {selectedStudent && (
        <div className="bg-white rounded-xl shadow p-4 max-w-3xl mx-auto mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            শিক্ষার্থীর তথ্য
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p className="text-lg">
              <b>দাখেলা:</b> {selectedStudent.code}
            </p>
            <p></p>
            <p>
              <b>নাম:</b> {selectedStudent.name}
            </p>
            <p>
              <b>পিতার নাম:</b> {selectedStudent.fatherName}
            </p>
            <p>
              <b>মোবাইল:</b> {selectedStudent.mobile1}
            </p>
            <p>
              <b>বর্তমান শ্রেণি:</b> {selectedStudent?.currentClass || "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* Admission Form */}
      <div className="bg-white rounded-xl shadow p-4 max-w-6xl mx-auto space-y-4 bangla">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label>শিক্ষাবর্ষ</label>
            <Select
              value={selectedSession?.id || ""}
              onValueChange={(val) => {
                const session = sessions.find((s) => s.id === val) || null;
                setSelectedSession(session);
                if (session) fetchClasses(session.id);
              }}
            >
              <SelectTrigger className="w-full bg-gray-50">
                <SelectValue />
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

          <div>
            <label>ভর্তি ইচ্ছুক শ্রেণি</label>
            <Select
              value={currentClass?.id || ""}
              onValueChange={(val) => {
                const cls = sessionClasses.find((c) => c.id === val) || null;
                setCurrentClass(cls);
              }}
            >
              <SelectTrigger className="w-full bg-gray-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sessionClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label>ভর্তির ধরন</label>
            <Select value={type} onValueChange={(v) => setType(v)}>
              <SelectTrigger className="w-full bg-gray-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="নতুন">নতুন</SelectItem>
                <SelectItem value="পুরাতন">পুরাতন</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label>আবাসিক অবস্থা</label>
            <Select value={residence} onValueChange={(v) => setResidence(v)}>
              <SelectTrigger className="w-full bg-gray-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="আবাসিক">আবাসিক</SelectItem>
                <SelectItem value="অনাবাসিক">অনাবাসিক</SelectItem>
                <SelectItem value="ডে-কেয়ার">ডে-কেয়ার</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label>রোল নম্বর</label>
            <input
              type="number"
              className="border rounded-md px-3 py-2 w-full bg-gray-50 focus:ring-2 focus:ring-blue-400"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="রোল নম্বর লিখুন"
              min="1"
            />
          </div>

          <div>
            <label>ভর্তির তারিখ</label>
            <input
              type="date"
              className="border rounded-md px-3 py-2 w-full bg-gray-50 focus:ring-2 focus:ring-blue-400"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
            />
          </div>

          <div>
            <label>ভর্তি ফি</label>
            <input
              type="number"
              className="border rounded-md px-3 py-2 w-full bg-gray-50 focus:ring-2 focus:ring-blue-400"
              value={admissionFee}
              onChange={(e) => setAdmissionFee(e.target.value)}
              min="0"
            />
          </div>

          <div>
            <label>বোর্ডিং ফি</label>
            <input
              type="number"
              className="border rounded-md px-3 py-2 w-full bg-gray-50 focus:ring-2 focus:ring-blue-400"
              value={boardingFee}
              onChange={(e) => setBoardingFee(e.target.value)}
              min="0"
            />
          </div>

          <div>
            <label>মাসিক বেতন</label>
            <input
              type="number"
              className="border rounded-md px-3 py-2 w-full bg-gray-50 focus:ring-2 focus:ring-blue-400"
              value={mashikBetn}
              onChange={(e) => setMashikBetn(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="bg-primary hover:opacity-90">
          ভর্তি সম্পন্ন করুন
        </Button>
      </div>

      {/* Admissions Table */}
      <div className="mt-8 bg-white rounded-xl shadow p-4 max-w-6xl mx-auto">
        <h3 className="text-lg font-bold mb-3">ভর্তি তালিকা</h3>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-secondary text-white">
              <tr>
                <th className="border px-2 py-2">রোল</th>
                <th className="border px-2 py-2">আইডি</th>
                <th className="border px-2 py-2">শিক্ষার্থীর নাম</th>
                <th className="border px-2 py-2">শ্রেণি</th>
                <th className="border px-2 py-2">শিক্ষাবর্ষ</th>
                <th className="border px-2 py-2">ভর্তির ধরন</th>
                <th className="border px-2 py-2">আবাসিক অবস্থা</th>
                <th className="border px-2 py-2">ভর্তি ফি</th>
                <th className="border px-2 py-2">বোর্ডিং ফি</th>
                <th className="border px-2 py-2">মাসিক বেতন</th>
                <th className="border px-2 py-2">ভর্তির তারিখ</th>
                <th className="border px-2 py-2">একশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmissions.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-3 text-gray-500">
                    এই শ্রেণিতে এখনও কোনো ভর্তি হয়নি।
                  </td>
                </tr>
              ) : (
                filteredAdmissions.map((a) => (
                  <tr
                    key={a.id}
                    className="even:bg-gray-50 hover:bg-blue-50 bangla"
                  >
                    <td className="border px-2 py-1 text-center">
                      {a.rollNumber ?? "—"}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {a.student?.code}
                    </td>
                    <td className="border px-2 py-1">{a.student?.name}</td>
                    <td className="border px-2 py-1 text-center">
                      {a.currentClass}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {a.session?.name}
                    </td>
                    <td className="border px-2 py-1 text-center">{a.type}</td>
                    <td className="border px-2 py-1 text-center">
                      {a.residence}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {a.admissionFee ?? "—"}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {a.boardingFee ?? "—"}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {a.mashikBetn ?? "—"}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {a.admissionDate
                        ? new Date(a.admissionDate).toLocaleDateString("bn-BD")
                        : new Date(a.createdAt).toLocaleDateString("bn-BD")}
                    </td>

                    <td className="px-4 py-3 border flex gap-2">
                      <Button
                        size="sm"
                        disabled={a.isDeleted}
                        variant="outline"
                        onClick={() => handleSoftDelete(a.id)}
                      >
                        <Trash2 />
                      </Button>
                      <Button size="sm" onClick={() => openEdit(a)}>
                        <SquarePen />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Edit Modal */}
      {editingAdmission && editForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 bangla space-y-4">
            <h3 className="text-lg font-bold">ভর্তি তথ্য সম্পাদনা</h3>
            <p className="text-sm text-gray-500">
              {editingAdmission.student?.name} —{" "}
              {editingAdmission.session?.name}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">ভর্তির ধরন</label>
                <Select
                  value={editForm.type}
                  onValueChange={(v) => setEditForm({ ...editForm, type: v })}
                >
                  <SelectTrigger className="w-full bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="নতুন">নতুন</SelectItem>
                    <SelectItem value="পুরাতন">পুরাতন</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm">আবাসিক অবস্থা</label>
                <Select
                  value={editForm.residence}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, residence: v })
                  }
                >
                  <SelectTrigger className="w-full bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="আবাসিক">আবাসিক</SelectItem>
                    <SelectItem value="অনাবাসিক">অনাবাসিক</SelectItem>
                    <SelectItem value="ডে-কেয়ার">ডে-কেয়ার</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm">ভর্তির তারিখ</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1.5 w-full bg-gray-50"
                  value={editForm.admissionDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, admissionDate: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm">রোল নম্বর</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1.5 w-full bg-gray-50"
                  value={editForm.rollNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, rollNumber: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm">ভর্তি ফি</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1.5 w-full bg-gray-50"
                  value={editForm.admissionFee}
                  onChange={(e) =>
                    setEditForm({ ...editForm, admissionFee: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm">বোর্ডিং ফি</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1.5 w-full bg-gray-50"
                  value={editForm.boardingFee}
                  onChange={(e) =>
                    setEditForm({ ...editForm, boardingFee: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm">মাসিক বেতন</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1.5 w-full bg-gray-50"
                  value={editForm.mashikBetn}
                  onChange={(e) =>
                    setEditForm({ ...editForm, mashikBetn: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-primary hover:bg-primary"
                onClick={handleEditSubmit}
                disabled={editLoading}
              >
                {editLoading ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditingAdmission(null);
                  setEditForm(null);
                }}
              >
                বাতিল
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
