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
import { useEffect, useMemo, useState } from "react";

interface IStudent {
  id: string;
  code: string;
  name: string;
}

interface ISubject {
  id: string;
  name: string;
  fullMarks: number;
}

interface IExam {
  id: string;
  examName: string;
}

interface IClass {
  id: string;
  name: string;
}

interface ISession {
  id: string;
  name: string;
}

interface IMark {
  studentId: string;
  examSubjectId: string;
  marksObt: number;
}

type TExamRegistration = {
  id: string;
  examId: string;
  studentId: string;
  sessionId: string;
  rollNo: number;
  admitPdf: string | null;
  status: string;
  createdAt: string;
  session: {
    name: string;
  };
  exam: {
    id: string;
    examName: string;
    startDate: string;
    endDate: string;
  };
  student: IStudent & { currentClass: string };
};

export default function ExamMarksEntry() {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [classes, setClasses] = useState<IClass[]>([]);
  const [exams, setExams] = useState<IExam[]>([]);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [students, setStudents] = useState<IStudent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mark, setMark] = useState("");
  const [savedMarks, setSavedMarks] = useState<IMark[]>([]);
  const [examRegistrations, setExamRegistrations] = useState<
    TExamRegistration[]
  >([]);

  // Fetch sessions
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session`)
      .then((res) => res.json())
      .then((data) => setSessions(data.data || []))
      .catch(console.error);
  }, []);

  // Load classes by session
  useEffect(() => {
    if (!selectedSession) {
      setClasses([]);
      setSelectedClass("");
      return;
    }
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session/${selectedSession}/classes`,
    )
      .then((res) => res.json())
      .then((data) => {
        setClasses(data.data || []);
        setSelectedClass("");
        setSelectedExam("");
        setSelectedSubject("");
        setExams([]);
        setSubjects([]);
        setStudents([]);
        setSavedMarks([]);
        setMark("");
        setCurrentIndex(0);
      })
      .catch(console.error);
  }, [selectedSession]);

  // Load exams by class
  useEffect(() => {
    if (!selectedClass) {
      setExams([]);
      setSelectedExam("");
      return;
    }
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/exam/class/${selectedClass}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setExams(data.data || []);
        setSelectedExam("");
        setSelectedSubject("");
        setSubjects([]);
        setStudents([]);
        setSavedMarks([]);
        setMark("");
        setCurrentIndex(0);
      })
      .catch(console.error);
  }, [selectedClass]);

  // Load students by exam registration
  useEffect(() => {
    if (!selectedExam) {
      setStudents([]);
      setExamRegistrations([]);
      return;
    }
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/examregistration/exam/${selectedExam}`,
    )
      .then((res) => res.json())
      .then((data) => {
        const regs: TExamRegistration[] = data.data || [];
        setExamRegistrations(regs);
        const registeredStudents = regs.map((r) => r.student);
        setStudents(registeredStudents);
        setSelectedSubject("");
        setSubjects([]);
        setSavedMarks([]);
        setMark("");
        setCurrentIndex(0);
      })
      .catch(console.error);
  }, [selectedExam]);

  const currentClassName = useMemo(() => {
    return examRegistrations?.[0]?.student?.currentClass || "";
  }, [examRegistrations]);

  // Load subjects by exam
  useEffect(() => {
    if (!selectedExam) return;
    const url = `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/examsubject/exam/${selectedClass}/${selectedExam}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const list = (data.data || []).map((x: any) => ({
          id: x.id,
          name: x.subject?.name || x.name,
          fullMarks: x.subject?.fullMarks || x.maxMarks || 100,
        }));
        setSubjects(list || []);
        setSelectedSubject("");
        setSavedMarks([]);
        setMark("");
        setCurrentIndex(0);
      })
      .catch(console.error);
  }, [selectedExam, currentClassName]);

  // Load saved marks for subject
  useEffect(() => {
    if (!selectedExam || !selectedSubject) return;
    console.log("MARK FETCH:", {
      examId: selectedExam,
      examSubjectId: selectedSubject,
    });
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/entrymark?examId=${selectedExam}&examSubjectId=${selectedSubject}`,
    )
      .then((res) => res.json())
      .then((data) => setSavedMarks(data.data || []))
      .catch(console.error);
    setCurrentIndex(0);
    setMark("");
  }, [selectedExam, selectedSubject, students.length]);

  // Autofill mark when student changes
  useEffect(() => {
    const currentStudent = students[currentIndex];
    if (!currentStudent || !selectedSubject) return;
    const exist = savedMarks.find(
      (m) =>
        m.studentId === currentStudent.id &&
        m.examSubjectId === selectedSubject,
    );
    setMark(exist ? String(exist.marksObt) : "");
  }, [currentIndex, students, savedMarks, selectedSubject]);

  const currentStudent = students[currentIndex];

  const saveMark = async (studentId: string, value: number) => {
    if (!selectedExam || !selectedSubject) return;
    const subject = subjects.find((s) => s.id === selectedSubject);
    if (!subject || value < 0 || value > subject.fullMarks) {
      alert(`Marks must be between 0 and ${subject?.fullMarks}`);
      return;
    }
    const payload = {
      examId: selectedExam,
      studentId,
      examSubjectId: selectedSubject,
      marksObt: value,
    };
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/entrymark`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (res.ok) {
      setSavedMarks((prev) => {
        const exist = prev.find(
          (m) =>
            m.studentId === studentId && m.examSubjectId === selectedSubject,
        );
        if (exist) {
          return prev.map((m) =>
            m.studentId === studentId ? { ...m, marksObt: value } : m,
          );
        } else {
          return [
            ...prev,
            { studentId, examSubjectId: selectedSubject, marksObt: value },
          ];
        }
      });
    }
  };

  const getNextStudentIndex = (current: number) => {
    for (let i = current + 1; i < students.length; i++) {
      const stu = students[i];
      const exist = savedMarks.find(
        (m) => m.studentId === stu.id && m.examSubjectId === selectedSubject,
      );
      if (!exist || exist.marksObt === 0) return i;
    }
    return -1;
  };

  const handleSaveMark = () => {
    const value = parseFloat(mark);
    if (isNaN(value)) return;
    saveMark(currentStudent.id, value).then(() => {
      const nextIndex = getNextStudentIndex(currentIndex);
      if (nextIndex !== -1) {
        setCurrentIndex(nextIndex);
      } else {
        alert("সব ছাত্রের নাম্বার এন্ট্রি সম্পন্ন ✅");
      }
    });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-200 text-gray-900">
      {/* Left Panel */}
      <div className="w-full md:w-[340px] bg-[#bcd8f3] md:border-r border-gray-400 p-4">
        <h2 className="text-xl font-semibold text-[#062e60] mb-4 text-center">
          ফলাফল প্রাপ্ত নাম্বার এন্ট্রি
        </h2>

        {/* Session */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">সেশন</label>
          <Select onValueChange={(v) => setSelectedSession(v)}>
            <SelectTrigger className="bg-white w-full">
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
        </div>

        {/* Class */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">শ্রেণী</label>
          <Select onValueChange={setSelectedClass}>
            <SelectTrigger className="bg-white w-full">
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
        </div>

        {/* Exam */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">পরীক্ষা</label>
          <Select onValueChange={setSelectedExam}>
            <SelectTrigger className="bg-white w-full">
              <SelectValue placeholder="Select Exam" />
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

        {/* Subject */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">বিষয়</label>
          <Select
            onValueChange={(v) => {
              setSelectedSubject(v);
              setSavedMarks([]);
              setMark("");
              setCurrentIndex(0);
            }}
          >
            <SelectTrigger className="bg-white w-full">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Student entry */}
        {currentStudent && selectedSubject && (
          <div className="mt-4">
            <h3 className="text-center mb-2 font-semibold">
              {currentStudent.name} ({currentStudent.code})
            </h3>
            <Input
              type="number"
              value={mark}
              onChange={(e) => setMark(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveMark()}
              className="w-full text-center mb-2 text-lg"
              placeholder="Enter marks"
            />
            <Button
              onClick={handleSaveMark}
              className="w-full bg-blue-600 text-white"
              disabled={mark === ""}
            >
              Save & Next
            </Button>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-gray-100 p-4 md:p-8 overflow-x-auto">
        {students.length > 0 && selectedSubject && (
          <table className="min-w-[600px] w-full mt-6 md:mt-10 border border-gray-400 bg-white">
            <thead className="bg-[#0b305c] text-white">
              <tr>
                <th className="p-2 border">Student</th>
                <th className="p-2 border hidden md:table-cell">Class</th>
                <th className="p-2 border hidden md:table-cell">Subject</th>
                <th className="p-2 border">Marks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((stu) => {
                const markEntry = savedMarks.find(
                  (m) =>
                    m.studentId === stu.id &&
                    m.examSubjectId === selectedSubject,
                ) || { marksObt: "" };
                const subjectName =
                  subjects.find((s) => s.id === selectedSubject)?.name || "-";
                const className =
                  currentClassName ||
                  examRegistrations?.[0]?.student?.currentClass ||
                  "-";
                return (
                  <tr key={stu.id} className="even:bg-gray-100">
                    <td className="p-2 border">{stu.name}</td>
                    <td className="p-2 hidden md:table-cell border">
                      {className}
                    </td>
                    <td className="p-2 border hidden md:table-cell">
                      {subjectName}
                    </td>
                    <td className="p-2 border text-center">
                      <Input
                        type="number"
                        value={markEntry.marksObt}
                        className="text-center w-[70px] md:w-[80px] mx-auto"
                        min={0}
                        max={
                          subjects.find((s) => s.id === selectedSubject)
                            ?.fullMarks
                        }
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setSavedMarks((prev) => {
                            const exist = prev.find(
                              (m) =>
                                m.studentId === stu.id &&
                                m.examSubjectId === selectedSubject,
                            );
                            if (exist) {
                              return prev.map((m) =>
                                m.studentId === stu.id &&
                                m.examSubjectId === selectedSubject
                                  ? { ...m, marksObt: value }
                                  : m,
                              );
                            } else {
                              return [
                                ...prev,
                                {
                                  studentId: stu.id,
                                  examSubjectId: selectedSubject,
                                  marksObt: value,
                                },
                              ];
                            }
                          });
                        }}
                        onBlur={(e) =>
                          saveMark(stu.id, parseFloat(e.target.value) || 0)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            saveMark(
                              stu.id,
                              parseFloat(
                                (e.target as HTMLInputElement).value,
                              ) || 0,
                            );
                          }
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
