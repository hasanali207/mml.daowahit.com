"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/* ---------------- TYPES ---------------- */
interface Session {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

interface Exam {
  id: string;
  examName: string;
  classId: string;
}

interface Student {
  id: string;
  code: string;
  name: string;
}

interface Admission {
  student: Student;
  currentClass: string;
  examRegistrations?: { examId: string; status: string }[];
}

/* ---------------- COMPONENT ---------------- */
export default function ExamRegistrationPermitUI() {
  const API = process.env.NEXT_PUBLIC_BASE_API!;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);

  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");

  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  /* ---------------- FETCH SESSIONS ---------------- */
  useEffect(() => {
    fetch(`${API}/api/v1/session`)
      .then((res) => res.json())
      .then((d) => d.success && setSessions(d.data))
      .catch(() => toast.error("সেশন লোড করতে সমস্যা হয়েছে"));
  }, []);

  /* ---------------- FETCH CLASSES ---------------- */
  useEffect(() => {
    if (!selectedSession) return;
    fetch(`${API}/api/v1/session/${selectedSession}/classes`)
      .then((res) => res.json())
      .then((d) => {
        setClasses(d.success ? d.data : []);
        setSelectedClass("");
        setExams([]);
        setSelectedExam("");
        setAdmissions([]);
        setSelectedStudents(new Set());
      })
      .catch(() => toast.error("ক্লাস লোড করতে সমস্যা হয়েছে"));
  }, [selectedSession]);

  /* ---------------- FETCH EXAMS ---------------- */
  useEffect(() => {
    if (!selectedClass) return;
    fetch(`${API}/api/v1/exam/class/${selectedClass}`)
      .then((res) => res.json())
      .then((d) => {
        setExams(d.success ? d.data : []);
        setSelectedExam("");
      })
      .catch(() => toast.error("পরীক্ষা লোড করতে সমস্যা হয়েছে"));
  }, [selectedClass]);

  /* ---------------- FETCH ADMISSIONS ---------------- */
  useEffect(() => {
    if (!selectedClass) {
      setAdmissions([]);
      return;
    }
    fetch(`${API}/api/v1/admission/${selectedClass}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setAdmissions(d.data);
        else setAdmissions([]);
        setSelectedStudents(new Set());
      })
      .catch(() => setAdmissions([]));
  }, [selectedClass]);

  /* ---------------- DERIVE DISPLAYED STUDENTS ---------------- */
  const displayedStudents = admissions.map((a) => {
    const alreadyRegistered = a.examRegistrations?.some(
      (r) => r.examId === selectedExam
    );
    return { ...a, alreadyRegistered };
  });

  /* ---------------- HANDLE SINGLE/BULK PERMIT ---------------- */
  const handlePermit = async (admissionsToPermit: Admission[]) => {
    if (!selectedExam) return toast.error("অনুগ্রহ করে পরীক্ষা নির্বাচন করুন!");

    const newLoadingIds = new Set(loadingIds);
    admissionsToPermit.forEach((a) => newLoadingIds.add(a.student.id));
    setLoadingIds(newLoadingIds);

    for (let i = 0; i < admissionsToPermit.length; i++) {
      const a = admissionsToPermit[i];
      try {
        const payload = {
          studentId: a.student.id,
          examId: selectedExam,
          sessionId: selectedSession,
          rollNo: i + 1,
          admitPdf: `https://yourdomain.com/uploads/admit/${a.student.id}.pdf`,
          status: "REGISTERED",
        };

        const res = await fetch(`${API}/api/v1/examregistration`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.success) {
          // mark as registered locally
          setAdmissions((prev) =>
            prev.map((p) =>
              p.student.id === a.student.id
                ? {
                    ...p,
                    examRegistrations: [
                      ...(p.examRegistrations || []),
                      { examId: selectedExam, status: "REGISTERED" },
                    ],
                  }
                : p
            )
          );
        } else {
          
        }
      } catch (error: any) {
        console.error(error);
        
      } finally {
        const newSet = new Set(loadingIds);
        newSet.delete(a.student.id);
        setLoadingIds(newSet);
      }
    }

    setSelectedStudents(new Set()); // clear selection after bulk permit
  };

  /* ---------------- SELECT HANDLERS ---------------- */
  const toggleSelect = (studentId: string) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(studentId)) newSet.delete(studentId);
    else newSet.add(studentId);
    setSelectedStudents(newSet);
  };

  const selectAll = () => {
    const allIds = displayedStudents
      .filter((s) => !s.alreadyRegistered)
      .map((s) => s.student.id);
    setSelectedStudents(new Set(allIds));
  };

  const deselectAll = () => setSelectedStudents(new Set());

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 space-y-6 bangla">
      {/* Selection Card */}
      <Card className="shadow-md">
        <CardContent className="space-y-4">
          <h2 className="text-xl font-bold text-green-700 text-center">
            📋 শিক্ষার্থী রেজিস্ট্রেশন (Permit System)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Session */}
            <div>
              <label className="text-sm font-medium">সেশন</label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="সেশন বেছে নিন" />
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
              <label className="text-sm font-medium">ক্লাস</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="ক্লাস বেছে নিন" />
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

            {/* Exam */}
            <div>
              <label className="text-sm font-medium">পরীক্ষা</label>
              <Select
                value={selectedExam}
                onValueChange={setSelectedExam}
                disabled={!exams.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="পরীক্ষা বেছে নিন" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.examName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="shadow-md mt-6">
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-blue-700">
              🧑‍🎓 শিক্ষার্থী তালিকা ({displayedStudents.length})
            </h2>
            <div className="space-x-2">
              <Button size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handlePermit(
                    displayedStudents.filter((s) => selectedStudents.has(s.student.id))
                  )
                }
                disabled={!selectedExam || selectedStudents.size === 0}
              >
                All Permit
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border border-gray-300 text-center">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Select</th>
                  <th className="border px-2 py-1">Code / ID</th>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Class</th>
                  <th className="border px-2 py-1">Permit</th>
                </tr>
              </thead>
              <tbody>
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-3 text-gray-500">
                      শিক্ষার্থী পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((a, i) => {
                    const { alreadyRegistered } = a;
                    const isSelected = selectedStudents.has(a.student.id);

                    return (
                      <tr
                        key={a.student.id}
                        className={`even:bg-gray-50 hover:bg-gray-100 ${
                          alreadyRegistered ? "bg-gray-200" : ""
                        }`}
                      >
                        <td className="border px-2 py-1">
                          <input
                            type="checkbox"
                            disabled={alreadyRegistered}
                            checked={isSelected}
                            onChange={() => toggleSelect(a.student.id)}
                          />
                        </td>
                        <td className="border px-2 py-1">{a.student.code}</td>
                        <td className="border px-2 py-1">{a.student.name}</td>
                        <td className="border px-2 py-1">
                          {classes.find((c) => c.id === selectedClass)?.name || ""}
                        </td>
                        <td className="border px-2 py-1">
                          <Button
                            size="sm"
                            onClick={() => handlePermit([a])}
                            disabled={alreadyRegistered || loadingIds.has(a.student.id)}
                          >
                            {alreadyRegistered
                              ? "Already Registered"
                              : loadingIds.has(a.student.id)
                                ? "Processing..."
                                : "Permit"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
