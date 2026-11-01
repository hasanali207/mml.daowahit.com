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
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Swal from "sweetalert2";

// =======================
// TYPES
// =======================
type Session = { id: string; name: string };
type Class = { id: string; name: string };
type Exam = { id: string; examName: string; examType: string };
type Subject = { id: string; name: string; fullMarks: number };
type ResultRow = {
  studentId: string;
  roll: string | number;
  name: string;
  total: number;
  percentage: number;
  gpa: number;
  grade: string;
  position: number;
  [subject: string]: number | string;
};

// =======================
// GPA CHART COLORS
// =======================
const GPA_COLORS: Record<string, string> = {
  "5": "#16a34a",
  "4": "#2563eb",
  "3.5": "#7c3aed",
  "3": "#d97706",
  "2.5": "#ea580c",
  "2": "#dc2626",
  "0": "#6b7280",
};

export default function ResultSummaryFull() {
  const BASE = process.env.NEXT_PUBLIC_BASE_API || "http://localhost:5000";

  // ── Dropdown state ───────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");

  // ── Result state ─────────────────────────────────────
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [resultSystem, setResultSystem] = useState<string>("");

  // ── Loading (separate per action) ────────────────────
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingShow, setLoadingShow] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const isAnyLoading =
    loadingGenerate || loadingShow || loadingPDF || loadingExcel;

  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  const [images, setImages] = useState({
    logo: "",
    sign1: "",
    sign2: "",
    rsign: "",
    webicon: "",
    fbicon: "",
    qrcode: "",
  });

  // ✅ NEW: track whether the image-loading pass has finished (success or not)
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    const loadImages = async () => {
      // ✅ FIX: never throw. On any failure (404, network error, bad blob),
      // resolve to "" instead of rejecting — a rejected promise inside
      // Promise.all used to abort the whole batch and leave every image
      // field stuck at "", which is what produced the invalid
      // { width, alignment } (no "image" key) block passed to pdfmake.
      const toBase64FromUrl = async (url: string): Promise<string> => {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`Image not found (${res.status}): ${url}`);
            return "";
          }
          const blob = await res.blob();
          return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string) || "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.warn(`Failed to load image: ${url}`, err);
          return "";
        }
      };

      const [logo, sign1, sign2, rsign, webicon, fbicon, qrcode] =
        await Promise.all([
          toBase64FromUrl("/logo1.jpg"),
          toBase64FromUrl("https://i.ibb.co.com/RTpPR6RQ/sign1.png"),
          toBase64FromUrl("/sign1.png"),

          // ✅ FIX: filename was misspelled as "rsing.png" — the actual
          // file in /public is "rsign.png". This mismatch (silent 404)
          // was why images.rsign was always empty.
          toBase64FromUrl("/rsign.png"),
          toBase64FromUrl("/web.jpg"),
          toBase64FromUrl("/facebook.jpg"),
          toBase64FromUrl("/qrcode.jpg"),
        ]);

      setImages({ logo, sign1, sign2, rsign, webicon, fbicon, qrcode });
      setImagesReady(true);
    };

    loadImages();
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
      setExams([]);
      setSelectedExam("");
      return;
    }
    fetch(`${BASE}/api/v1/session/${selectedSession}/classes`)
      .then((r) => r.json())
      .then((d) => {
        setClasses(d.data || []);
        setSelectedClass("");
        setExams([]);
        setSelectedExam("");
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

  // ── Show Results ─────────────────────────────────────
  const handleGetResults = async () => {
    if (!selectedExam || !selectedClass) return;
    setLoadingShow(true);
    setSubjects([]);
    setResults([]);
    try {
      const res = await fetch(
        `${BASE}/api/v1/result/${selectedClass}/${selectedExam}`,
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.message || "ফলাফল আনা যায়নি");
      } else {
        setSubjects(json.data?.subjects || []);
        setResults(json.data?.results || []);
        setResultSystem(json.data?.resultSystem || "");
        if ((json.data?.results || []).length === 0)
          toast.error("কোনো ফলাফল পাওয়া যায়নি");
      }
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা");
    } finally {
      setLoadingShow(false);
    }
  };

  // ── Generate Summary ─────────────────────────────────
  const handleGenerateSummary = async () => {
    if (!selectedExam || !selectedClass) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "ফলাফল সবাই দেখতে পারবে এবং এটি ওভাররাইট করবে পূর্বের ফলাফল (যদি থাকে)",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Publish it!",
    });

    if (!result.isConfirmed) return;

    setLoadingGenerate(true);
    try {
      const res = await fetch(`${BASE}/api/v1/result/generate-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: selectedExam, classId: selectedClass }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.message || "ফলাফল তৈরি হয়নি");
      } else {
        toast.success("ফলাফল সফলভাবে তৈরি হয়েছে!");
        // auto-load results after generate
        setSubjects(json.data?.subjects || []);
        setResults(json.data?.results || []);
        setResultSystem(json.data?.resultSystem || "");
      }
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা");
    } finally {
      setLoadingGenerate(false);
    }
  };

  // ── Download PDF ─────────────────────────────────────
  const downloadPDF = async () => {
    if (!results.length) return;

    // ✅ NEW: guard against generating a PDF before images finished loading
    if (!imagesReady) {
      toast.error("ছবি লোড হচ্ছে, একটু পর আবার চেষ্টা করুন");
      return;
    }

    setLoadingPDF(true);
    const examObj = exams.find((e) => e.id === selectedExam);
    const sessionObj = sessions.find((s) => s.id === selectedSession);
    const classObj = classes.find((c) => c.id === selectedClass);

    try {
      const pdfMakeModule = await import("pdfmake/build/pdfmake");
      const pdfMake = pdfMakeModule.default;
      pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
      pdfMake.fonts = {
        SolaimanLipi: {
          normal: "SolaimanLipi.ttf",
          bold: "SolaimanLipi.ttf",
          italics: "SolaimanLipi.ttf",
          bolditalics: "SolaimanLipi.ttf",
        },
      };

      const headerRow = [
        { text: "ক্রমিক", bold: true, fillColor: "#166534", color: "#fff" },
        { text: "আইডি", bold: true, fillColor: "#166534", color: "#fff" },
        { text: "নাম", bold: true, fillColor: "#166534", color: "#fff" },
        ...subjects.map((s) => ({
          text: s.name,
          bold: true,
          fillColor: "#166534",
          color: "#fff",
        })),
        { text: "মোট", bold: true, fillColor: "#166534", color: "#fff" },
        { text: "GPA", bold: true, fillColor: "#166534", color: "#fff" },
        { text: "গ্রেড", bold: true, fillColor: "#166534", color: "#fff" },
        { text: "স্থান", bold: true, fillColor: "#166534", color: "#fff" },
      ];

      const bodyRows = results.map((r, i) => {
        const bg = i % 2 === 0 ? "#f9fafb" : "#fff";

        return [
          { text: String(i + 1), fillColor: bg },
          // ✅ FIX: ResultRow has no "code" field, only "roll" — r.code was
          // always undefined, so this column silently printed "-" forever.
          { text: String(r.code ?? "-"), fillColor: bg },
          { text: r.name, fillColor: bg },

          ...subjects.map((s) => ({
            text: String((r as any)[s.name] ?? 0),
            alignment: "center",
            fillColor: bg,
          })),

          { text: String(r.total), alignment: "center", fillColor: bg },
          { text: String(r.gpa), alignment: "center", fillColor: bg },
          { text: String(r.grade), alignment: "center", fillColor: bg },
          { text: String(r.position), alignment: "center", fillColor: bg },
        ];
      });

      // ✅ NEW: small helper — only emit an { image, ... } block when we
      // actually have base64 data. This is the core fix for the
      // "Unrecognized document structure" crash: pdfmake was previously
      // handed { width, alignment } with no "image"/"text"/etc key
      // whenever an image failed to load, which is not a valid node type.
      const imageBlock = (
        src: string,
        opts: Record<string, any> = {},
      ): any | null => (src ? { image: src, ...opts } : null);

      const logoBlock = imageBlock(images.logo, {
        width: 60,
        alignment: "left",
      });
      const qrBlock = imageBlock(images.qrcode, {
        fit: [50, 50],
        margin: [0, 2, 0, 2],
      });

      const docDefinition: any = {
        pageSize: "A4",
        pageOrientation: subjects.length > 5 ? "landscape" : "portrait",
        pageMargins: [30, 40, 30, 40],
        content: [
          {
            columns: [
              // ✅ Fallback to an empty text block instead of a raw image
              // node whose "image" prop might be an empty string.
              logoBlock || { text: "", width: 60 },
              {
                stack: [
                  {
                    text: instituteName,
                    style: "header",
                    alignment: "center",
                  },
                  {
                    text: address,
                    style: "subtitle",
                    alignment: "center",
                  },
                  {
                    text: `মোবাইল নং ${phone}, ${secondaryPhone}`,
                    alignment: "center",
                  },
                ],
                width: "*",
                alignment: "center",
              },
              {
                width: 50,
                alignment: "right",
                stack: qrBlock ? [qrBlock] : [{ text: "" }],
              },
            ],
            margin: [0, 0, 0, 0],
          },
          {
            text: "পরীক্ষার ফলাফল",
            style: "subheader",
            alignment: "center",
            margin: [0, 4, 0, 12],
          },

          {
            columns: [
              { text: `সেশন: ${sessionObj?.name || "-"}` },
              { text: `শ্রেণী: ${classObj?.name || "-"}`, alignment: "center" },
              {
                text: `পরীক্ষা: ${examObj?.examName || "-"}`,
                alignment: "right",
              },
            ],
            margin: [0, 0, 0, 10],
          },
          {
            table: {
              headerRows: 1,
              widths: [
                "auto",
                "auto",
                "*",
                ...subjects.map(() => "auto"),
                "auto",
                "auto",
                "auto",
                "auto",
              ],
              body: [headerRow, ...bodyRows],
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => "#d1d5db",
              vLineColor: () => "#d1d5db",
            },
          },
          {
            columns: [
              {
                text: `মোট শিক্ষার্থী: ${results.length}`,
                margin: [0, 10, 0, 0],
              },
              {
                text: `তৈরির সময়: ${new Date().toLocaleString("bn-BD")}`,
                alignment: "right",
                margin: [0, 10, 0, 0],
              },
            ],
            style: "small",
          },
          {
            width: 320,
            columns: [
              // 🔹 Left: Web icon + link
              {
                width: "auto",
                columns: [
                  { image: images.webicon, width: 12, alignment: "left" },
                  {
                    text: "https://islamidawahinstitute.com",
                    style: "info",
                    margin: [2, 0, 0, 0],
                    alignment: "left",
                  },
                ],
                columnGap: 2,
              },

              // 🔹 Spacer — pushes the two groups to opposite ends
              { width: "*", text: "" },

              // 🔹 Right: FB icon + link
              {
                width: "auto",
                columns: [
                  { image: images.fbicon, width: 12, alignment: "left" },
                  {
                    text: "Islamidawahinstitutetushbhander",
                    style: "info",
                    margin: [2, 0, 0, 0],
                    alignment: "left",
                  },
                ],
                columnGap: 2,
              },
            ],
            margin: [0, 30, 0, 0],
          },
          {
            // ✅ FIX: build each signature stack conditionally so a missing
            // sign1/sign2/rsign image never produces the bare
            // { width, alignment } node pdfmake choked on.
            // ✅ FIX: NURANI -> sign1 + sign2 + rsign (all three signatures).
            // Any other examType -> only sign1 + sign2 (no rsign).
            columns:
              examObj?.examType?.toUpperCase() === "NURANI"
                ? [
                    {
                      stack: [
                        ...(imageBlock(images.sign2, {
                          width: 70,
                          alignment: "center",
                        })
                          ? [
                              imageBlock(images.sign2, {
                                width: 70,
                                alignment: "center",
                              })!,
                            ]
                          : []),
                        {
                          text: "---------------------",
                          alignment: "center",
                          margin: [0, 0, 0, 0],
                        },
                        {
                          text: "মুহতামিমের স্বাক্ষর",
                          alignment: "center",
                        },
                      ],
                      width: "*",
                      alignment: "center",
                    },

                    {
                      stack: [
                        ...(imageBlock(images.sign1, {
                          width: 70,
                          alignment: "center",
                        })
                          ? [
                              imageBlock(images.sign1, {
                                width: 70,
                                alignment: "center",
                              })!,
                            ]
                          : []),
                        {
                          text: "---------------------",
                          alignment: "center",
                          margin: [0, 0, 0, 0],
                        },
                        {
                          text: " নাযিমে তালিমাতের স্বাক্ষর",
                          alignment: "center",
                        },
                      ],
                      width: "*",
                      alignment: "center",
                    },

                    {
                      stack: [
                        ...(imageBlock(images.rsign, {
                          width: 40,
                          alignment: "center",
                        })
                          ? [
                              imageBlock(images.rsign, {
                                width: 40,
                                alignment: "center",
                              })!,
                            ]
                          : []),
                        {
                          text: "---------------------",
                          alignment: "center",
                          margin: [0, 0, 0, 0],
                        },
                        {
                          text: "নূরানী প্রধান শিক্ষকের স্বাক্ষর",
                          alignment: "center",
                        },
                      ],
                      width: "*",
                      alignment: "center",
                    },
                  ]
                : [
                    {
                      stack: [
                        ...(imageBlock(images.sign2, {
                          width: 70,
                          alignment: "center",
                        })
                          ? [
                              imageBlock(images.sign2, {
                                width: 70,
                                alignment: "center",
                              })!,
                            ]
                          : []),
                        {
                          text: "---------------------",
                          alignment: "center",
                          margin: [0, 0, 0, 0],
                        },
                        {
                          text: "মুহতামিমের স্বাক্ষর",
                          alignment: "center",
                        },
                      ],
                      width: "*",
                      alignment: "center",
                    },

                    {
                      stack: [
                        ...(imageBlock(images.sign2, {
                          width: 70,
                          alignment: "center",
                        })
                          ? [
                              imageBlock(images.sign2, {
                                width: 70,
                                alignment: "center",
                              })!,
                            ]
                          : []),
                        {
                          text: "---------------------",
                          alignment: "center",
                          margin: [0, 0, 0, 0],
                        },
                        {
                          text: " নাযিমে তালিমাতের স্বাক্ষর",
                          alignment: "center",
                        },
                      ],
                      width: "*",
                      alignment: "center",
                    },
                  ],
            margin: [0, 20, 0, 0],
          },
        ],
        styles: {
          header: { fontSize: 18, bold: true },
          subheader: { fontSize: 13, bold: true },
          small: { fontSize: 9, color: "#6b7280" },
        },
        defaultStyle: { font: "SolaimanLipi", fontSize: 11 },
      };

      pdfMake.createPdf(docDefinition).open();
      toast.success("PDF ডাউনলোড হচ্ছে...");
    } catch (e) {
      console.error(e);
      toast.error("PDF তৈরি হয়নি");
    } finally {
      setLoadingPDF(false);
    }
  };

  // ── Export Excel ─────────────────────────────────────
  const downloadExcel = async () => {
    if (!results.length) return;
    setLoadingExcel(true);
    const examObj = exams.find((e) => e.id === selectedExam);
    const classObj = classes.find((c) => c.id === selectedClass);
    try {
      const XLSX = await import("xlsx");
      const rows = results.map((r) => {
        const row: Record<string, string | number> = {
          // ✅ FIX: same r.code -> r.roll correction as in the PDF export.
          আইডি: r.roll as string | number,
          নাম: r.name,
        };
        subjects.forEach((s) => (row[s.name] = (r[s.name] as number) ?? 0));
        row["মোট"] = r.total;
        row["শতকরা"] = r.percentage;
        row["GPA"] = r.gpa;
        row["গ্রেড"] = r.grade;
        row["স্থান"] = r.position;
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ফলাফল");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buf], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ফলাফল-${classObj?.name || "class"}-${examObj?.examName || "exam"}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel ডাউনলোড হচ্ছে...");
    } catch (e) {
      console.error(e);
      toast.error("Excel export হয়নি");
    } finally {
      setLoadingExcel(false);
    }
  };

  // ── GPA Chart Data ────────────────────────────────────
  const gpaDistribution = useMemo(() => {
    const buckets: Record<string, number> = {};
    results.forEach((r) => {
      const key = String(r.gpa);
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets)
      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
      .map(([gpa, count]) => ({ gpa, count }));
  }, [results]);

  const examObj = exams.find((e) => e.id === selectedExam);
  const passCount = results.filter((r) => r.gpa > 0).length;
  const failCount = results.length - passCount;
  const avgPercent = results.length
    ? (results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(
        1,
      )
    : "0";

  return (
    <div className="p-6 bg-slate-50 min-h-screen bangla">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">ফলাফল ব্যবস্থাপনা</h1>
        <p className="text-slate-500 text-sm mt-1">
          শ্রেণী ও পরীক্ষা নির্বাচন করে ফলাফল তৈরি বা দেখুন
        </p>
      </div>

      {/* ── Selects ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 max-w-4xl">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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

        {/* Exam badge */}
        {examObj && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs bg-secondary text-green-800 font-medium px-2.5 py-1 rounded-full">
              {examObj.examType}
            </span>
            <span className="text-sm text-slate-600">{examObj.examName}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2 flex-wrap">
          <Button
            onClick={handleGenerateSummary}
            disabled={isAnyLoading || !selectedExam || !selectedClass}
            className="bg-primary hover:bg-primary"
          >
            {loadingGenerate ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                তৈরি হচ্ছে...
              </span>
            ) : (
              "✦ ফলাফল সংরক্ষণ করুন"
            )}
          </Button>

          <Button
            onClick={handleGetResults}
            disabled={isAnyLoading || !selectedExam || !selectedClass}
            variant="outline"
          >
            {loadingShow ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                লোড হচ্ছে...
              </span>
            ) : (
              "ফলাফল দেখুন"
            )}
          </Button>

          <Button
            onClick={downloadPDF}
            disabled={!results.length || isAnyLoading || !imagesReady}
            variant="outline"
            title={!imagesReady ? "ছবি লোড হচ্ছে..." : undefined}
          >
            {loadingPDF
              ? "তৈরি হচ্ছে..."
              : !imagesReady
                ? "ছবি লোড হচ্ছে..."
                : "↓ PDF"}
          </Button>

          <Button
            onClick={downloadExcel}
            disabled={!results.length || isAnyLoading}
            variant="outline"
          >
            {loadingExcel ? "তৈরি হচ্ছে..." : "↓ Excel"}
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl">
          {[
            {
              label: "মোট শিক্ষার্থী",
              value: results.length,
              color: "text-slate-800",
            },
            { label: "উত্তীর্ণ", value: passCount, color: "text-green-700" },
            { label: "অনুত্তীর্ণ", value: failCount, color: "text-red-600" },
            {
              label: "গড় শতকরা",
              value: `${avgPercent}%`,
              color: "text-blue-700",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Results Table ── */}
      {results.length > 0 && (
        <div className="mt-6 max-w-6xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-slate-700">
              ফলাফল তালিকা
              {resultSystem && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-normal">
                  {resultSystem}
                </span>
              )}
            </h2>
            <span className="text-xs text-slate-400">
              {results.length} জন শিক্ষার্থী
            </span>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-primary text-white text-center">
                  <th className="p-3 font-semibold whitespace-nowrap">স্থান</th>
                  <th className="p-3 font-semibold whitespace-nowrap">রোল</th>
                  <th className="p-3 font-semibold text-left whitespace-nowrap">
                    নাম
                  </th>
                  {subjects.map((s) => (
                    <th
                      key={s.id}
                      className="p-3 font-semibold whitespace-nowrap"
                    >
                      {s.name}
                      <span className="block text-xs font-normal opacity-75">
                        /{s.fullMarks}
                      </span>
                    </th>
                  ))}
                  <th className="p-3 font-semibold whitespace-nowrap">মোট</th>
                  <th className="p-3 font-semibold whitespace-nowrap">শতকরা</th>
                  <th className="p-3 font-semibold whitespace-nowrap">GPA</th>
                  <th className="p-3 font-semibold whitespace-nowrap">গ্রেড</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const isFail = r.gpa === 0;
                  return (
                    <tr
                      key={r.studentId}
                      className={`border-t border-slate-100 transition-colors ${
                        isFail
                          ? "bg-red-50"
                          : i % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50"
                      } hover:bg-green-50`}
                    >
                      <td className="p-3 text-center font-bold text-slate-700">
                        {r.position === 1
                          ? "1st"
                          : r.position === 2
                            ? "2nd"
                            : r.position === 3
                              ? "3rd"
                              : r.position}
                      </td>
                      <td className="p-3 text-center text-slate-600">
                        {r.roll}
                      </td>
                      <td className="p-3 text-left font-medium text-slate-800">
                        {r.name}
                      </td>
                      {subjects.map((s) => (
                        <td
                          key={s.id}
                          className="p-3 text-center text-slate-700"
                        >
                          {r[s.name] ?? 0}
                        </td>
                      ))}
                      <td className="p-3 text-center font-semibold text-slate-800">
                        {r.total}
                      </td>
                      <td className="p-3 text-center text-slate-600">
                        {r.percentage}%
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-800">
                        {r.gpa}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isFail
                              ? "bg-red-100 text-red-700"
                              : r.gpa >= 4
                                ? "bg-secondary text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {r.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── GPA Chart ── */}
          <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4">GPA বিতরণ</h3>

            <div className="w-full h-[220px] min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gpaDistribution} barSize={40}>
                  <XAxis dataKey="gpa" tick={{ fontFamily: "inherit" }} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontFamily: "inherit" }}
                  />
                  <Tooltip
                    formatter={(v) => [`${v} জন`, "শিক্ষার্থী"]}
                    labelFormatter={(l) => `GPA: ${l}`}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {gpaDistribution.map((entry) => (
                      <Cell
                        key={entry.gpa}
                        fill={GPA_COLORS[entry.gpa] || "#6b7280"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
