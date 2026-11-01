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
type Exam = { id: string; examName: string };

type SubjectResult = {
  subjectId: string;
  subjectName: string;
  fullMarks: number;
  passMarks: number;
  marksObt: number;
  isPassed: boolean;
};

type Marksheet = {
  student: {
    id: string;
    name: string;
    roll: string | number;
    code: string;
    profilePicture?: string;
    fatherName?: string;
    motherName?: string;
  };
  exam: {
    id: string;
    name: string;
    className: string;
    session: string;
  };
  subjectResults: SubjectResult[];
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

// =======================
// HELPERS
// =======================
const toBase64FromUrl = (url: string): Promise<string> =>
  fetch(url)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const mime = blob.type || "image/jpeg";
            resolve(`data:${mime};base64,${base64.split(",")[1]}`);
          };
          reader.readAsDataURL(blob);
        }),
    );

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

// =======================
// PDF CARD BUILDER
// =======================
async function buildMarksheetCard(
  marksheet: Marksheet,
  images: { logo: string; sign1: string; sign2: string },
  opts: { pageBreak?: boolean } = {},
): Promise<any> {
  const { student, exam, subjectResults, summary } = marksheet;
  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  // Student circular photo
  let studentPhoto = "";
  if (student.profilePicture && student.profilePicture !== "N/A") {
    try {
      const raw = await toBase64FromUrl(student.profilePicture);
      studentPhoto = await makeCircularImage(raw, 70);
    } catch {
      studentPhoto = "";
    }
  }

  // Alternating rows
  const subjectRows = subjectResults.map((s, i) => {
    const bg = i % 2 === 0 ? "#f8faf8" : "#ffffff";
    return [
      { text: s.subjectName, fontSize: 10, fillColor: bg },
      {
        text: String(s.fullMarks),
        alignment: "center" as const,
        fontSize: 10,
        fillColor: bg,
      },
      {
        text: String(s.passMarks),
        alignment: "center" as const,
        fontSize: 10,
        fillColor: bg,
      },
      {
        text: String(s.marksObt),
        alignment: "center" as const,
        bold: true,
        fontSize: 10,
        fillColor: bg,
      },
    ];
  });

  const card: any = {
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              // ── HEADER ──
              {
                columns: [
                  { image: images.logo, width: 60, height: 60 },
                  {
                    width: "*",
                    stack: [
                      {
                        text: instituteName,
                        alignment: "center",
                        fontSize: 17,
                        bold: true,
                      },
                      {
                        text: address,
                        alignment: "center",
                        fontSize: 11,
                        margin: [0, 3, 0, 0],
                      },
                      {
                        text: `মোবাইল নং ${phone}, ${secondaryPhone}`,
                        alignment: "center",
                        fontSize: 10,
                        color: "#555",
                      },
                    ],
                  },
                  studentPhoto
                    ? {
                        image: studentPhoto,
                        width: 60,
                        height: 60,
                        alignment: "right",
                      }
                    : {
                        canvas: [
                          {
                            type: "rect",
                            x: 0,
                            y: 0,
                            w: 60,
                            h: 60,
                            r: 30,
                            lineWidth: 1,
                            lineColor: "#ccc",
                          },
                        ],
                        width: 60,
                      },
                ],
                margin: [0, 0, 0, 6],
              },

              // ── DIVIDER ──
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 0,
                    x2: 490,
                    y2: 0,
                    lineWidth: 1.5,
                    lineColor: "#166534",
                  },
                ],
                margin: [0, 4, 0, 8],
              },

              // ── TITLE ──
              {
                text: "মার্ক শীট",
                alignment: "center",
                fontSize: 14,
                bold: true,
                decoration: "underline",
                color: "#166534",
                margin: [0, 0, 0, 10],
              },

              // ── STUDENT INFO ──
              {
                table: {
                  widths: ["50%", "50%"],
                  body: [
                    [
                      { text: `নাম: ${student.name}`, fontSize: 11 },
                      { text: `শ্রেণী: ${exam.className}`, fontSize: 11 },
                    ],
                    [
                      { text: `রোল: ${student.roll}`, fontSize: 11 },
                      { text: `পরীক্ষা: ${exam.name}`, fontSize: 11 },
                    ],
                    [
                      { text: `আইডি: ${student.code}`, fontSize: 11 },
                      { text: `সেশন: ${exam.session}`, fontSize: 11 },
                    ],
                    ...(student.fatherName
                      ? [
                          [
                            {
                              text: `পিতা: ${student.fatherName}`,
                              fontSize: 11,
                            },
                            {
                              text: `মাতা: ${student.motherName || "-"}`,
                              fontSize: 11,
                            },
                          ],
                        ]
                      : []),
                  ],
                },
                layout: "noBorders",
                margin: [0, 0, 0, 10],
              },

              // ── SUBJECT TABLE ──
              {
                table: {
                  headerRows: 1,
                  widths: ["49%", "17%", "17%", "17%"],
                  body: [
                    [
                      {
                        text: "বিষয়",
                        bold: true,
                        fillColor: "#d9d9d9",
                        alignment: "center",
                        fontSize: 10,
                      },
                      {
                        text: "পূর্ণমান",
                        bold: true,
                        fillColor: "#d9d9d9",
                        alignment: "center",
                        fontSize: 10,
                      },
                      {
                        text: "পাস মার্ক",
                        bold: true,
                        fillColor: "#d9d9d9",
                        alignment: "center",
                        fontSize: 10,
                      },
                      {
                        text: "প্রাপ্ত",
                        bold: true,
                        fillColor: "#d9d9d9",
                        alignment: "center",
                        fontSize: 10,
                      },
                    ],
                    ...subjectRows,
                    [
                      { text: "সর্বমোট", bold: true, fontSize: 10 },
                      {
                        text: String(summary.maxTotal),
                        alignment: "center",
                        bold: true,
                        fontSize: 10,
                      },
                      { text: "—", alignment: "center", fontSize: 10 },
                      {
                        text: String(summary.totalObt),
                        alignment: "center",
                        bold: true,
                        fontSize: 10,
                      },
                    ],
                  ],
                },
                layout: {
                  hLineColor: () => "#d1fae5",
                  vLineColor: () => "#d1fae5",
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                },
                margin: [0, 0, 0, 10],
              },

              // ── SUMMARY ──
              {
                table: {
                  widths: ["20%", "20%", "20%", "20%", "20%"],
                  body: [
                    [
                      {
                        text: `GPA: ${summary.gpa}`,
                        alignment: "center",
                        bold: true,
                        fillColor: "#d9d9d9",
                        fontSize: 11,
                      },
                      {
                        text: `গ্রেড: ${summary.grade}`,
                        alignment: "center",
                        bold: true,
                        fillColor: "#d9d9d9",
                        fontSize: 11,
                      },
                      {
                        text: `স্থান: ${summary.position ?? "—"}`,
                        alignment: "center",
                        bold: true,
                        fillColor: "#d9d9d9",
                        fontSize: 11,
                      },
                      {
                        text: `${summary.percentage}%`,
                        alignment: "center",
                        bold: true,
                        fillColor: "#d9d9d9",
                        fontSize: 10,
                      },
                      {
                        text: summary.isPassed ? "উত্তীর্ণ" : "অনুত্তীর্ণ",
                        alignment: "center",
                        bold: true,
                        fillColor: summary.isPassed ? "#d9d9d9" : "#d9d9d9",
                        fontSize: 11,
                      },
                    ],
                  ],
                },
                layout: {
                  hLineColor: () => "#bbf7d0",
                  vLineColor: () => "#bbf7d0",
                  hLineWidth: () => 1,
                  vLineWidth: () => 1,
                },
                margin: [0, 0, 0, 14],
              },

              // ── SIGNATURES ──
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
                      {
                        text: "মোহতামীমের স্বাক্ষর",
                        alignment: "left",
                        fontSize: 9,
                      },
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
            margin: [12, 12, 12, 12],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: (i: number, node: any) =>
        i === 0 || i === node.table.body.length ? 2 : 0,
      vLineWidth: (i: number, node: any) =>
        i === 0 || i === node.table.widths.length ? 2 : 0,
      hLineColor: () => "#166534",
      vLineColor: () => "#166534",
    },
    margin: [0, 0, 0, 0],
  };

  if (opts.pageBreak) card.pageBreak = "before";

  return card;
}

// =======================
// MAIN COMPONENT
// =======================
export default function ClasswiseResult() {
  const BASE = process.env.NEXT_PUBLIC_BASE_API;

  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");

  const [marksheets, setMarksheets] = useState<Marksheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [images, setImages] = useState({ logo: "", sign1: "", sign2: "" });

  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  // Load PDF images on mount
  useEffect(() => {
    const loadImg = (url: string) =>
      fetch(url)
        .then((r) => r.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            }),
        );
    Promise.all([
      loadImg("https://i.ibb.co.com/84fWbw7p/logo.jpg"),
      loadImg("/rsign.png"),
      loadImg("https://i.ibb.co.com/N2xLG0Kk/sign2.png"),
    ]).then(([logo, sign1, sign2]) => setImages({ logo, sign1, sign2 }));
  }, []);

  // Sessions
  useEffect(() => {
    fetch(`${BASE}/api/v1/session`)
      .then((r) => r.json())
      .then((d) => setSessions(d.data || []))
      .catch(() => toast.error("Session লোড হয়নি"));
  }, [BASE]);

  // Classes
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
      })
      .catch(() => toast.error("ক্লাস লোড হয়নি"));
  }, [selectedSession]);

  // Exams
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

  // ── Fetch ALL marksheets — SINGLE API CALL ────────────
  const fetchAllResults = async () => {
    if (!selectedExam || !selectedClass) {
      toast.error("ক্লাস ও পরীক্ষা সিলেক্ট করুন");
      return;
    }
    setLoading(true);
    setMarksheets([]);
    try {
      const res = await fetch(
        `${BASE}/api/v1/result/marksheet/${selectedClass}/${selectedExam}`,
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.message || "ফলাফল পাওয়া যায়নি");
        return;
      }
      const data: Marksheet[] = json.data || [];
      data.sort(
        (a, b) => (a.summary.position ?? 9999) - (b.summary.position ?? 9999),
      );
      setMarksheets(data);
      toast.success(`${data.length} জন শিক্ষার্থীর ফলাফল লোড হয়েছে ✅`);
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা");
    } finally {
      setLoading(false);
    }
  };

  const filtered = marksheets.filter(
    (m) =>
      m.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.student.roll).includes(searchQuery) ||
      String(m.student.code).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const passed = marksheets.filter((m) => m.summary.isPassed).length;
  const failed = marksheets.length - passed;

  // ── pdfmake loader ────────────────────────────────────
  const loadPdfMake = async () => {
    const mod = await import("pdfmake/build/pdfmake");
    const pdfMake = mod.default;
    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
    pdfMake.fonts = {
      SolaimanLipi: {
        normal: "SolaimanLipi.ttf",
        bold: "SolaimanLipi.ttf",
        italics: "SolaimanLipi.ttf",
        bolditalics: "SolaimanLipi.ttf",
      },
    };
    return pdfMake;
  };

  const docBase = {
    pageSize: "A4" as const,
    pageMargins: [25, 20, 25, 20] as [number, number, number, number],
    defaultStyle: { font: "SolaimanLipi", fontSize: 11 },
    styles: {
      title: { fontSize: 18, bold: true },
      subtitle: { fontSize: 15, italics: true },
      header: { fontSize: 15, bold: true },
      info: {
        fontSize: 13,
        margin: [0, 2, 0, 2] as [number, number, number, number],
      },
    },
  };

  // ── Single PDF ────────────────────────────────────────
  const downloadSinglePDF = async (marksheet: Marksheet) => {
    const pdfMake = await loadPdfMake();
    const card = await buildMarksheetCard(marksheet, images);
    pdfMake.createPdf({ ...docBase, content: [card] }).open();
  };

  // ── All PDF — 2 per page ──────────────────────────────
  const downloadAllPDF = async () => {
    if (!marksheets.length) return;
    setPdfLoading(true);
    try {
      const pdfMake = await loadPdfMake();
      const content: any[] = [];

      for (let i = 0; i < marksheets.length; i++) {
        const card = await buildMarksheetCard(marksheets[i], images, {
          pageBreak: i > 0,
        });
        card.margin = [0, 0, 0, 0];
        content.push(card);
      }

      const examName =
        exams.find((e) => e.id === selectedExam)?.examName || "exam";
      const className =
        classes.find((c) => c.id === selectedClass)?.name || "class";

      pdfMake.createPdf({ ...docBase, content }).open();

      toast.success("সকল ফলাফলের PDF তৈরি হয়েছে ✅");
    } catch {
      toast.error("PDF তৈরিতে সমস্যা");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen bangla max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">ক্লাসওয়ারি ফলাফল</h1>
        <p className="text-slate-500 text-sm mt-1">
          ক্লাস ও পরীক্ষা সিলেক্ট করে সকল শিক্ষার্থীর ফলাফল একসাথে দেখুন ও PDF
          ডাউনলোড করুন
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 max-w-3xl mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <Button
            className="bg-primary hover:bg-primary"
            onClick={fetchAllResults}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                লোড হচ্ছে...
              </span>
            ) : (
              "সকলের ফলাফল দেখুন"
            )}
          </Button>

          {marksheets.length > 0 && (
            <Button
              className="bg-blue-700 hover:bg-blue-800"
              onClick={downloadAllPDF}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  PDF তৈরি হচ্ছে...
                </span>
              ) : (
                `↓ সকলের PDF (${marksheets.length} জন)`
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Summary + Table */}
      {marksheets.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 max-w-3xl">
            {[
              {
                label: "মোট শিক্ষার্থী",
                value: marksheets.length,
                color: "bg-slate-100 text-slate-800",
              },
              {
                label: "উত্তীর্ণ",
                value: passed,
                color: "bg-secondary text-green-800",
              },
              {
                label: "অনুত্তীর্ণ",
                value: failed,
                color: "bg-red-100 text-red-700",
              },
              {
                label: "পাসের হার",
                value: `${Math.round((passed / marksheets.length) * 100)}%`,
                color: "bg-blue-100 text-blue-800",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-4 text-center ${item.color} border border-slate-200`}
              >
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs mt-1 opacity-70">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম, রোল বা আইডি দিয়ে খুঁজুন..."
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-white shadow-sm"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="p-3 text-center">স্থান</th>
                    <th className="p-3 text-left">শিক্ষার্থী</th>
                    <th className="p-3 text-center">রোল</th>
                    <th className="p-3 text-center">মোট</th>
                    <th className="p-3 text-center">%</th>
                    <th className="p-3 text-center">GPA</th>
                    <th className="p-3 text-center">গ্রেড</th>
                    <th className="p-3 text-center">অবস্থা</th>
                    <th className="p-3 text-center">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr
                      key={m.student.id}
                      className={`border-t border-slate-100 ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50"
                      } hover:bg-green-50 transition-colors`}
                    >
                      <td className="p-3 text-center font-bold text-slate-600">
                        {m.summary.position ?? "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Image
                            src={
                              m.student.profilePicture &&
                              m.student.profilePicture !== "N/A"
                                ? m.student.profilePicture
                                : "/avatar.png"
                            }
                            alt={m.student.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover w-8 h-8"
                          />
                          <div>
                            <p className="font-medium text-slate-800">
                              {m.student.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              ID: {m.student.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center text-slate-600">
                        {m.student.roll}
                      </td>
                      <td className="p-3 text-center font-medium">
                        {m.summary.totalObt}/{m.summary.maxTotal}
                      </td>
                      <td className="p-3 text-center">
                        {m.summary.percentage}%
                      </td>
                      <td className="p-3 text-center font-bold">
                        {m.summary.gpa}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                          {m.summary.grade}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            m.summary.isPassed
                              ? "bg-secondary text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {m.summary.isPassed ? "পাস" : "ফেল"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => downloadSinglePDF(m)}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 transition-colors"
                        >
                          ↓ PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                কোনো শিক্ষার্থী পাওয়া যায়নি
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
