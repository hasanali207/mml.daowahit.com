"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// =======================
// TYPES
// =======================
type Subject = {
  id: string;
  name: string;
  fullMarks: number;
  passMarks: number;
  marksObt: number;
  isPassed: boolean;
  subjectName: string;
};
type Exam = { id: string; examName: string };
type Student = {
  studentId: string;
  rollNumber: number | null;
  profilePicture?: string;
  student: {
    id: string;
    name: string;
    profilePicture?: string;
    fatherName?: string;
    motherName?: string;
    code?: string;
  };
};

type Marksheet = {
  student: {
    id: string;
    name: string;
    roll: string | number;
    code: string;
    profilePicture?: string;
    village?: string;
    postOffice?: string;
    upazila?: string;
    mobile1?: string;
    mobile2?: string;
  };
  exam: { id: string; name: string; className: string; session: string };
  subjectResults: Subject[];
  summary: {
    totalObt: number;
    maxTotal: number;
    percentage: number;
    gpa: number;
    grade: string;
    position: number | null;
    resultSystem: string;
    isPassed: boolean;
  };
};

const makeCircularImage = (imageBase64: string, size = 70): Promise<string> =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const HI_RES = size * 4;
      const canvas = document.createElement("canvas");
      canvas.width = HI_RES;
      canvas.height = HI_RES;
      const ctx = canvas.getContext("2d")!;
      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      ctx.beginPath();
      ctx.arc(HI_RES / 2, HI_RES / 2, HI_RES / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, HI_RES, HI_RES);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = imageBase64;
  });

export default function SingleStudentResult() {
  const BASE = process.env.NEXT_PUBLIC_BASE_API;

  // ── Dropdown state ───────────────────────────────────
  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentCode, setStudentCode] = useState("");

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  // ── Result state ─────────────────────────────────────
  const [marksheet, setMarksheet] = useState<Marksheet | null>(null);
  const [loading, setLoading] = useState(false);

  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  // ── Images for PDF ───────────────────────────────────
  const [images, setImages] = useState({
    logo: "",
    gpa: "",
    sign1: "",
    sign2: "",
  });

  useEffect(() => {
    const toBase64 = async (url: string): Promise<string> => {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    };
    Promise.all([
      toBase64("https://i.ibb.co.com/84fWbw7p/logo.jpg"),
      toBase64("https://i.ibb.co.com/Gf2GwwHS/gpa.jpg"),
      toBase64("/rsign.png"),
      toBase64("https://i.ibb.co.com/N2xLG0Kk/sign2.png"),
    ]).then(([logo, gpa, sign1, sign2]) =>
      setImages({ logo, gpa, sign1, sign2 }),
    );
  }, []);

  // ── Fetch Sessions ───────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/api/v1/session`)
      .then((r) => r.json())
      .then((d) => setSessions(d.data || []))
      .catch(() => toast.error("Session লোড হয়নি"));
  }, [BASE]);

  // ── Fetch Classes ────────────────────────────────────
  useEffect(() => {
    if (!selectedSession) {
      setClasses([]);
      setSelectedClass("");
      return;
    }
    fetch(`${BASE}/api/v1/session/${selectedSession}/classes`)
      .then((r) => r.json())
      .then((d) => {
        setClasses(d.data || []);
        setSelectedClass("");
        setSelectedExam("");
        setSelectedStudent("");
      })
      .catch(() => toast.error("ক্লাস লোড হয়নি"));
  }, [selectedSession]);

  // ── Fetch Exams ──────────────────────────────────────
  useEffect(() => {
    if (!selectedClass) {
      setExams([]);
      setSelectedExam("");
      return;
    }
    fetch(`${BASE}/api/v1/exam/class/${selectedClass}`)
      .then((r) => r.json())
      .then((d) => {
        setExams(d.data || []);
        setSelectedExam("");
      })
      .catch(() => toast.error("পরীক্ষা লোড হয়নি"));
  }, [selectedClass]);

  // ── Fetch Students (via admission route) ─────────────
  useEffect(() => {
    if (!selectedSession || !selectedClass) {
      setStudents([]);
      setSelectedStudent("");
      return;
    }
    fetch(`${BASE}/api/v1/admission/${selectedSession}/${selectedClass}`)
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.data || []);
        setSelectedStudent("");
      })
      .catch(() => toast.error("শিক্ষার্থী লোড হয়নি"));
  }, [selectedSession, selectedClass]);

  // ── Fetch Marksheet ──────────────────────────────────
  const fetchResult = async () => {
    if (!selectedExam) {
      toast.error("পরীক্ষা সিলেক্ট করুন");
      return;
    }

    if (!studentCode) {
      toast.error("শিক্ষার্থী আইডি লিখুন");
      return;
    }

    // 🔥 code → student খুঁজে বের করা
    const found = students.find(
      (s) => s.student?.code?.toLowerCase() === studentCode.toLowerCase(),
    );

    if (!found) {
      toast.error("এই আইডির কোনো শিক্ষার্থী পাওয়া যায়নি ❌");
      return;
    }

    setLoading(true);
    setMarksheet(null);

    try {
      const res = await fetch(`${BASE}/api/v1/result/student-marksheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExam,
          studentId: found.studentId, // ✅ এখানেই key
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.message || "ফলাফল পাওয়া যায়নি");
        return;
      }

      setMarksheet(json.data);
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা");
    } finally {
      setLoading(false);
    }
  };

  // ── Download PDF ─────────────────────────────────────
  const downloadPDF = async () => {
    if (!marksheet) return;

    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfMake = pdfMakeModule.default;

    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
    pdfMake.fonts = {
      SolaimanLipi: { normal: "SolaimanLipi.ttf", bold: "SolaimanLipi.ttf" },
    };

    const { student, exam, subjectResults, summary } = marksheet;

    const toBase64FromUrl = async (url: string): Promise<string> => {
      const res = await fetch(url);
      const blob = await res.blob();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const mime = blob.type || "image/jpeg";
          resolve(`data:${mime};base64,${base64.split(",")[1]}`);
        };
        reader.readAsDataURL(blob);
      });
    };

    let studentPhoto = "";
    if (student.profilePicture && student.profilePicture !== "N/A") {
      try {
        const raw = await toBase64FromUrl(student.profilePicture);
        studentPhoto = await makeCircularImage(raw, 70);
      } catch {
        studentPhoto = "";
      }
    }

    // ================= SUBJECT ROWS =================
    const subjectRows = subjectResults.map((s) => [
      { text: s.subjectName, alignment: "left" },
      { text: String(s.marksObt), alignment: "center" },
      { text: String(s.fullMarks), alignment: "center" },
      {
        text: s.isPassed ? "পাস" : "ফেল",
        alignment: "center",
        color: s.isPassed ? "green" : "red",
      },
    ]);

    // ================= PDF DOC =================
    const doc: any = {
      pageSize: "A4",
      pageMargins: [30, 25, 30, 25],

      defaultStyle: {
        font: "SolaimanLipi",
        fontSize: 11,
      },

      content: [
        // ================= HEADER =================
        {
          columns: [
            { image: images.logo, width: 65, height: 65 },

            {
              width: "*",
              stack: [
                {
                  text: instituteName,
                  alignment: "center",
                  fontSize: 20,
                  bold: true,
                },
                {
                  text: address,
                  alignment: "center",
                  fontSize: 13,
                  margin: [0, 4, 0, 0],
                },
                {
                  text: `মোবাইল নং ${phone}, ${secondaryPhone}`,
                  alignment: "center",
                  margin: [0, 0, 0, 0],
                },
              ],
            },

            { image: images.gpa, width: 65, height: 65 },
          ],
          margin: [0, 0, 0, 10],
        },

        // ================= LINE =================
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 },
          ],
          margin: [0, 5, 0, 10],
        },

        // ================= TITLE =================
        {
          text: "মার্ক শীট",
          alignment: "center",
          fontSize: 16,
          bold: true,
          decoration: "underline",
          margin: [0, 0, 0, 10],
        },

        // ================= STUDENT IMAGE =================
        {
          columns: [
            { width: "*", text: "" },

            studentPhoto
              ? {
                  image: studentPhoto,
                  width: 70,
                  height: 70,
                }
              : {
                  canvas: [
                    {
                      type: "rect",
                      x: 0,
                      y: 0,
                      w: 70,
                      h: 70,
                      lineWidth: 1,
                    },
                  ],
                },

            { width: "*", text: "" },
          ],
          margin: [0, 0, 0, 10],
          alignment: "center",
        },

        // ================= STUDENT INFO =================
        {
          table: {
            widths: ["50%", "50%"],
            body: [
              [`নাম: ${student.name}`, `শ্রেণী: ${exam.className}`],
              [`রোল: ${student.roll}`, `সেশন: ${exam.session}`],
              [
                {
                  text: `পরীক্ষা: ${exam.name}`,
                  colSpan: 2,
                },
                {},
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 0, 0, 10],
        },

        // ================= SUBJECT TABLE =================
        {
          table: {
            headerRows: 1,
            widths: ["40%", "20%", "20%", "20%"],
            body: [
              [
                {
                  text: "বিষয়",
                  bold: true,
                  fillColor: "#166534",
                  color: "#fff",
                  alignment: "center",
                },
                {
                  text: "প্রাপ্ত",
                  bold: true,
                  fillColor: "#166534",
                  color: "#fff",
                  alignment: "center",
                },
                {
                  text: "পূর্ণমান",
                  bold: true,
                  fillColor: "#166534",
                  color: "#fff",
                  alignment: "center",
                },
                {
                  text: "ফলাফল",
                  bold: true,
                  fillColor: "#166534",
                  color: "#fff",
                  alignment: "center",
                },
              ],

              ...subjectRows,

              [
                { text: "মোট", bold: true },
                { text: summary.totalObt, alignment: "center", bold: true },
                { text: summary.maxTotal, alignment: "center", bold: true },
                {
                  text: `${summary.percentage}%`,
                  alignment: "center",
                  bold: true,
                },
              ],
            ],
          },
          margin: [0, 0, 0, 10],
        },

        // ================= SUMMARY =================
        {
          table: {
            widths: ["25%", "25%", "25%", "25%"],
            body: [
              [
                `GPA: ${summary.gpa}`,
                `গ্রেড: ${summary.grade}`,
                `স্থান: ${summary.position ?? "-"}`,
                {
                  text: summary.isPassed ? "উত্তীর্ণ" : "অনুত্তীর্ণ",
                  color: summary.isPassed ? "green" : "red",
                },
              ],
            ],
          },
          margin: [0, 10, 0, 20],
        },

        // ================= SIGN =================
        {
          columns: [
            {
              stack: [
                {
                  image: images.sign2,
                  width: 55,
                  height: 28,
                  alignment: "left",
                },
                {
                  text: "____________________",
                  alignment: "left",
                  fontSize: 9,
                  color: "#888",
                },
                { text: "মোহতামীমের স্বাক্ষর", alignment: "left", fontSize: 9 },
              ],
              width: "*",
            },
            {
              stack: [
                {
                  image: images.sign1,
                  width: 55,
                  height: 28,
                  alignment: "right",
                },
                {
                  text: "____________________",
                  alignment: "right",
                  fontSize: 9,
                  color: "#888",
                },
                {
                  text: "নূরানী প্রধান শিক্ষকের স্বাক্ষর",
                  alignment: "right",
                  fontSize: 9,
                },
              ],
              width: "*",
            },
          ],
          margin: [0, 0, 0, 4],
        },
      ],
    };

    pdfMake.createPdf(doc).open();
    toast.success("PDF তৈরি হয়েছে");
  };

  const selectedStudentObj = students.find(
    (s) => s.studentId === selectedStudent,
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen bangla max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">শিক্ষার্থীর ফলাফল</h1>
        <p className="text-slate-500 text-sm mt-1">
          শিক্ষার্থী নির্বাচন করে ফলাফল দেখুন
        </p>
      </div>

      {/* ── Selects ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Session */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">সেশন</label>
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">শ্রেণী</label>
            <Select
              value={selectedClass}
              onValueChange={setSelectedClass}
              disabled={!selectedSession}
            >
              <SelectTrigger>
                <SelectValue placeholder="শ্রেণী বেছে নিন" />
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              পরীক্ষা
            </label>
            <Select
              value={selectedExam}
              onValueChange={setSelectedExam}
              disabled={!selectedClass}
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

          {/* Student */}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              শিক্ষার্থী আইডি (ইংরেজীতে লিখুন)
            </label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="যেমন: 20..."
              className="w-full border rounded-md px-3 py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchResult();
              }}
            />
          </div>
        </div>

        <Button
          className="mt-5 bg-primary hover:bg-primary"
          onClick={fetchResult}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              লোড হচ্ছে...
            </span>
          ) : (
            "ফলাফল দেখুন"
          )}
        </Button>
      </div>

      {/* ── Marksheet ── */}
      {marksheet && (
        <div className="mt-6 max-w-3xl bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {/* Student Info */}

          <div className="flex items-center justify-center gap-4 mb-4">
            <Image
              src={marksheet.student?.profilePicture || "/avatar.png"}
              alt={marksheet.student.name}
              width={100}
              height={100}
              className="rounded-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {marksheet.student.name}
              </h2>
              <p className="text-sm text-slate-500">
                রোল: {marksheet.student.roll} • আইডি:{marksheet.student.code}{" "}
                •{" "}
              </p>
              <p className="text-sm text-slate-500">
                সেশন: {marksheet.exam.session}
              </p>
              <p className="text-sm text-slate-500">
                শ্রেণি: {marksheet.exam.className}
              </p>
              <p className="text-sm text-slate-500">
                পরীক্ষা: {marksheet.exam.name}
              </p>
            </div>
            <span
              className={`text-lg font-bold px-4 py-2 rounded-full ${
                marksheet.summary.isPassed
                  ? "bg-secondary text-green-800"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {marksheet.summary.isPassed ? "উত্তীর্ণ" : "অনুত্তীর্ণ"}
            </span>
          </div>

          {/* Subject Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-300 ">
                  <th className="p-2.5 text-left">বিষয়</th>
                  <th className="p-2.5 text-center">পূর্ণমান</th>
                  <th className="p-2.5 text-center">পাস মার্ক</th>
                  <th className="p-2.5 text-center">প্রাপ্ত মার্ক</th>
                  <th className="p-2.5 text-center">অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {marksheet.subjectResults.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-t border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                  >
                    <td className="p-2.5">{s.subjectName}</td>
                    <td className="p-2.5 text-center">{s.fullMarks}</td>
                    <td className="p-2.5 text-center">{s.passMarks}</td>
                    <td className="p-2.5 text-center font-medium">
                      {s.marksObt}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.isPassed
                            ? "bg-secondary text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.isPassed ? "পাস" : "ফেল"}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                  <td className="p-2.5">সর্বমোট</td>
                  <td className="p-2.5 text-center">
                    {marksheet.summary.maxTotal}
                  </td>
                  <td className="p-2.5 text-center">—</td>
                  <td className="p-2.5 text-center">
                    {marksheet.summary.totalObt}
                  </td>
                  <td className="p-2.5 text-center">
                    {marksheet.summary.percentage}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "GPA", value: marksheet.summary.gpa },
              { label: "গ্রেড", value: marksheet.summary.grade },
              { label: "শতকরা", value: `${marksheet.summary.percentage}%` },
              { label: "স্থান", value: marksheet.summary.position ?? "—" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center"
              >
                <p className="text-xl font-bold text-slate-800">{item.value}</p>
                <p className="text-xs text-slate-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <Button
            className="mt-5 bg-primary hover:bg-primary"
            onClick={downloadPDF}
          >
            ↓ PDF ডাউনলোড
          </Button>
        </div>
      )}
    </div>
  );
}
