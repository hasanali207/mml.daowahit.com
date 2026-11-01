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
import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import { formatDateBn } from "@/utils/dateBn";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";

/* ================= TYPES ================= */
type SessionType = { id: string; name: string };
type ClassType = { id: string; name: string };
type ExamType = {
  id: string;
  examName: string;
  startDate?: string;
  endDate?: string;
  session?: SessionType;
};
type StudentType = {
  id: string;
  name: string;
  code: string;
  currentClass: string;
  fatherName?: string;
  motherName?: string;
  profilePicture?: string;
};
type RegistrationType = {
  id: string;
  student: StudentType;
  exam: ExamType;
  session: SessionType;
};

export default function ExamAdmitCard() {
  const API = process.env.NEXT_PUBLIC_BASE_API;

  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [exams, setExams] = useState<ExamType[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationType[]>([]);
  const [loading, setLoading] = useState(false);
  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  const [filters, setFilters] = useState({
    sessionId: "",
    classId: "",
    examId: "",
    searchTerm: "",
  });

  const [images, setImages] = useState({
    logo: "",
    sign1: "",
    sign2: "",
  });

  /* ================= LOAD SESSIONS ================= */
  useEffect(() => {
    fetch(`${API}/api/v1/session`)
      .then((r) => r.json())
      .then((d) => setSessions(d.data || []));
  }, [API]);
  /* ================= SESSION → CLASS ================= */
  useEffect(() => {
    if (!filters.sessionId) return;

    setClasses([]);
    setExams([]);
    setRegistrations([]);

    fetch(`${API}/api/v1/session/${filters.sessionId}/classes`)
      .then((r) => r.json())
      .then((d) => setClasses(d.data || []));
  }, [filters.sessionId, API]);

  /* ================= CLASS → EXAM ================= */
  useEffect(() => {
    if (!filters.classId) return;

    setExams([]);
    setRegistrations([]);

    fetch(`${API}/api/v1/exam/class/${filters.classId}`)
      .then((r) => r.json())
      .then((d) => setExams(d.data || []));
  }, [filters.classId, API]);

  /* ================= EXAM → REGISTRATION ================= */
  useEffect(() => {
    if (!filters.examId) return;

    setLoading(true);
    fetch(`${API}/api/v1/examregistration/exam/${filters.examId}`)
      .then((r) => r.json())
      .then((d) => setRegistrations(d.data || []))
      .finally(() => setLoading(false));
  }, [filters.examId, API]);

  /* ================= SEARCH ================= */
  const filteredRegistrations = registrations.filter((r) => {
    if (!filters.searchTerm) return true;
    const t = filters.searchTerm.toLowerCase();
    return (
      r.student.name.toLowerCase().includes(t) ||
      r.student.code.toLowerCase().includes(t)
    );
  });

  useEffect(() => {
    const loadImages = async () => {
      const toBase64FromUrl = async (url: string): Promise<string> => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      };

      const [logo, sign1, sign2] = await Promise.all([
        toBase64FromUrl("https://i.ibb.co.com/84fWbw7p/logo.jpg"),
        toBase64FromUrl("https://i.ibb.co.com/RTpPR6RQ/sign1.png"),
        toBase64FromUrl("https://i.ibb.co.com/N2xLG0Kk/sign2.png"),
      ]);

      setImages({ logo, sign1, sign2 });
    };

    loadImages();
  }, []);

  // -------------------
  // PDF Card Generator
  // -------------------
  const createCard = async (reg: RegistrationType): Promise<any> => {
    const student = reg.student;

    const exam = reg.exam;
    const sessionName = reg.session?.name || "-";

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

    const makeCircularImage = (
      imageBase64: string,
      size = 70,
    ): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const HI_RES = size * 4; // 280px
          const canvas = document.createElement("canvas");
          canvas.width = HI_RES;
          canvas.height = HI_RES;
          const ctx = canvas.getContext("2d")!;

          // ✅ Center crop: ছোট দিকটা base ধরে center থেকে square নেবে
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2; // x offset
          const sy = (img.height - minSide) / 2; // y offset

          // Circle clip
          ctx.beginPath();
          ctx.arc(HI_RES / 2, HI_RES / 2, HI_RES / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          // Crop করে draw করো
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, HI_RES, HI_RES);

          resolve(canvas.toDataURL("image/png"));
        };
        img.src = imageBase64;
      });
    };

    let studentPhoto = "";
    if (student.profilePicture) {
      try {
        const raw = await toBase64FromUrl(student.profilePicture);
        studentPhoto = await makeCircularImage(raw, 70);
      } catch {
        studentPhoto = "";
      }
    }

    return {
      table: {
        widths: ["*"],
        body: [
          [
            {
              stack: [
                // Card Header
                {
                  columns: [
                    { image: images.logo, width: 60, alignment: "left" },
                    {
                      stack: [
                        {
                          text: instituteName,
                          style: "title",
                          alignment: "center",
                        },
                        {
                          text: address,
                          style: "subtitle",
                          alignment: "center",
                          margin: [0, 0, 0, 0],
                        },
                        {
                          text: `মোবাইল নং ${phone}, ${secondaryPhone}`,
                          alignment: "center",
                          margin: [0, 0, 0, 0],
                        },
                      ],
                      width: "*", // take remaining space
                      alignment: "center",
                    },
                    {
                      width: 70, // fix width same as image
                      stack: studentPhoto
                        ? [
                            {
                              image: studentPhoto,
                              width: 70,
                              height: 70,
                              fit: [70, 70],
                              border: [true, true, true, true],
                              alignment: "right",
                            },
                          ]
                        : [
                            {
                              canvas: [
                                {
                                  type: "rect",
                                  x: 0,
                                  y: 0,
                                  w: 70,
                                  h: 70,
                                  r: 10,
                                  lineWidth: 1,
                                  lineColor: "#888",
                                },
                              ],
                              alignment: "right",
                            },
                          ],
                      alignment: "right",
                    },
                  ],
                  margin: [0, 0, 0, 0],
                },

                // Main Title
                {
                  text: "প্রবেশপত্র",
                  style: "header",
                  alignment: "center",
                  margin: [0, 6, 0, 12],
                  decoration: "underline",
                },

                // Student Info Section
                {
                  columns: [
                    { text: `শিক্ষার্থী: ${student.name}`, style: "info" },
                    {
                      text: `শ্রেণি: ${student.currentClass}`,
                      style: "info",
                      alignment: "right",
                    },
                  ],
                  margin: [0, 4, 0, 2],
                },
                {
                  columns: [
                    { text: `আইডি: ${student.code}`, style: "info" },
                    {
                      text: `পরীক্ষা: ${exam.examName}`,
                      style: "info",
                      alignment: "right",
                    },
                  ],
                  margin: [0, 2, 0, 2],
                },
                {
                  columns: [
                    {
                      text: `পিতার নাম: ${student.fatherName || "-"}`,
                      style: "info",
                    },
                    {
                      text: `মাতার নাম: ${student.motherName || "-"}`,
                      style: "info",
                      alignment: "right",
                    },
                  ],
                  margin: [0, 2, 0, 2],
                },
                {
                  columns: [
                    { text: `সেশন: ${sessionName}`, style: "info" },
                    {
                      text: `তারিখ: ${
                        exam.startDate ? formatDateBn(exam.startDate) : "-"
                      } হইতে ${exam.endDate ? formatDateBn(exam.endDate) : "-"}`,
                      style: "info",
                      alignment: "right",
                    },
                  ],
                  margin: [0, 2, 0, 10],
                },

                // Signature Section
                {
                  columns: [
                    {
                      stack: [
                        { image: images.sign1, width: 60, alignment: "center" },
                        { text: "---------------------", alignment: "center" },
                        {
                          text: "নাযীমে তালীমাতের স্বাক্ষর",
                          alignment: "center",
                        },
                      ],
                      width: "*",
                      alignment: "center",
                    },
                    {
                      stack: [
                        { image: images.sign2, width: 60, alignment: "center" },
                        { text: "---------------------", alignment: "center" },
                        { text: "মুহতামিমের স্বাক্ষর", alignment: "center" },
                      ],
                      width: "*",
                      alignment: "center",
                    },
                  ],
                  margin: [0, 20, 0, 0],
                },
              ],
              margin: [10, 10, 10, 20],
            },
          ],
        ],
      },

      layout: {
        // Outer card border
        hLineWidth: (i: any, node: any) =>
          i === 0 || i === node.table.body.length ? 2 : 1,
        vLineWidth: (i: any, node: any) =>
          i === 0 || i === node.table.widths.length ? 2 : 0,
        hLineColor: () => "#444",
        vLineColor: () => "#444",
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 15,
        paddingBottom: () => 15,
      },

      margin: [10, 20, 10, 25],
    };
  };

  // Print single
  const handlePrintSingle = async (reg: RegistrationType) => {
    setLoading(true);
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

    const card = await createCard(reg);

    const docDefinition: any = {
      content: [card],
      defaultStyle: { font: "SolaimanLipi", fontSize: 12 },
      styles: {
        title: { fontSize: 20, bold: true },
        subtitle: { fontSize: 16, italics: true },
        header: { fontSize: 15, bold: true },
        info: { fontSize: 13, margin: [0, 2, 0, 2] },
      },
    };

    pdfMake.createPdf(docDefinition).open();
    setLoading(false);
  };

  // Print all
  const handlePrintAll = async () => {
    if (!filteredRegistrations.length) return;

    setLoading(true);
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

    const content: any[] = [];

    for (let i = 0; i < filteredRegistrations.length; i++) {
      const card = await createCard(filteredRegistrations[i]);

      // 🔑 spacing between two cards
      card.margin = [0, 10, 0, 10];

      // 🔑 page break ONLY after every 2nd card
      if (i % 2 === 1 && i < filteredRegistrations.length - 1) {
        card.pageBreak = "after";
      }

      content.push(card);
    }

    const docDefinition: any = {
      content,
      defaultStyle: { font: "SolaimanLipi", fontSize: 12 },
      styles: {
        title: { fontSize: 18, bold: true },
        subtitle: { fontSize: 15, italics: true, color: "#555" },
        header: { fontSize: 15, bold: true },
        info: { fontSize: 14, margin: [0, 2, 0, 2] },
      },
    };

    pdfMake.createPdf(docDefinition).open();
    setLoading(false);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen bangla space-y-6">
      <h1 className="text-xl font-bold">📘 পরীক্ষার প্রবেশপত্র</h1>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded-2xl shadow">
        <Select
          value={filters.sessionId}
          onValueChange={(v) =>
            setFilters({
              sessionId: v,
              classId: "",
              examId: "",
              searchTerm: "",
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="সেশন নির্বাচন করুণ." />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.classId}
          disabled={!classes.length}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, classId: v, examId: "" }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="শ্রেণি নির্বাচন করুণ." />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.examId}
          disabled={!exams.length}
          onValueChange={(v) => setFilters((f) => ({ ...f, examId: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="পরীক্ষা নির্বাচন করুণ." />
          </SelectTrigger>
          <SelectContent>
            {exams.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.examName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="text"
          placeholder="নাম বা আইডি দিয়ে খুঁজুন"
          value={filters.searchTerm}
          onChange={(e) =>
            setFilters((f) => ({ ...f, searchTerm: e.target.value }))
          }
          className="p-2 border rounded col-span-3"
        />
      </div>

      <div className="flex gap-2 items-center">
        <Button onClick={handlePrintAll} disabled={loading}>
          <Printer className="w-4 h-4 mr-2" />
          {loading ? "লোড হচ্ছে..." : "Print All"}
        </Button>
        <span className="text-sm text-gray-600">
          ({filteredRegistrations.length} registrations shown)
        </span>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {filteredRegistrations.length ? (
          filteredRegistrations.map((reg) => (
            <Card key={reg.id} className="rounded-2xl shadow hover:shadow-lg">
              <CardContent className="p-4">
                <h2 className="font-semibold text-lg">
                  {reg.student?.name || "-"}
                </h2>
                <p className="text-sm text-gray-500">ID: {reg.student?.code}</p>
                <p className="text-sm text-gray-500">
                  Class: {reg.student?.currentClass}
                </p>
                <p className="text-sm text-gray-500">
                  Exam: {reg.exam?.examName || "-"}
                </p>
                <p className="text-sm text-gray-500">
                  Session: {reg.session?.name || "-"}
                </p>
                <div className="flex justify-end mt-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handlePrintSingle(reg)}
                    disabled={loading}
                  >
                    <Printer className="w-4 h-4 mr-1" /> Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 mt-4">
            কোনো শিক্ষার্থী পাওয়া যায়নি।
          </p>
        )}
      </div>
    </div>
  );
}
