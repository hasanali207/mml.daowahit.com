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
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";

/* ================= TYPES ================= */
type Session = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  fatherName: string;
  address: string;
  code: string;
  currentClass: string;
  mobile1: string;
  mobile2: string;
  presentAddress: {
    village: string;
    postOffice: string;
    thana: string;
  };
};

type Admission = {
  id: string;
  student: Student;
  session: Session;
};

/* ================= COMPONENT ================= */
export default function NuraniBetnSheet() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<Admission[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  const currentDate = new Date();

  const englishYear = currentDate.getFullYear();

  const hijriYear = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
    year: "numeric",
  }).format(currentDate);

  const [filter, setFilter] = useState({
    session: "",
    className: "",
    studentCode: "",
  });

  const [images, setImages] = useState({
    logo: "",
  });

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session`)
      .then((r) => r.json())
      .then((d) => setSessions(d.data || []));
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_API}/api/v1/admission`)
      .then((r) => r.json())
      .then((d) => setAdmissions(d.data || []));
  }, []);

  /* ================= FILTER CLASSES ================= */
  useEffect(() => {
    if (!filter.session) {
      setClasses([]);
      return;
    }

    const cls = Array.from(
      new Set(
        admissions
          .filter((a) => a.session.name === filter.session)
          .map((a) => a.student.currentClass),
      ),
    );

    setClasses(cls);
    setFilter((f) => ({ ...f, className: "" }));
  }, [filter.session, admissions]);

  /* ================= FILTER STUDENTS ================= */
  useEffect(() => {
    if (!filter.session || !filter.className) {
      setFiltered([]);
      return;
    }

    const data = admissions.filter(
      (a) =>
        a.session.name === filter.session &&
        a.student.currentClass === filter.className,
    );

    setFiltered(data);
  }, [filter, admissions]);

  /* ================= LOAD LOGO IMAGE ================= */
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

      const [logo] = await Promise.all([
        toBase64FromUrl("https://i.ibb.co.com/84fWbw7p/logo.jpg"),
      ]);

      setImages({ logo });
    };

    loadImages();
  }, []);

  /* ================= CREATE SINGLE BETON SHEET ================= */
  const createSheet = (a: Admission) => {
    const s = a.student;

    const months = [
      "জানুয়ারি",
      "ফেব্রুয়ারি",
      "মার্চ",
      "এপ্রিল",
      "মে",
      "জুন",
      "জুলাই",
      "আগস্ট",
      "সেপ্টেম্বর",
      "অক্টোবর",
      "নভেম্বর",
      "ডিসেম্বর",
    ];
    return {
      margin: [5, 0, 5, 0],
      table: {
        widths: ["*"],
        body: [
          [
            {
              stack: [
                /* -------- HEADER -------- */
                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          columns: [
                            {
                              image: images.logo,
                              width: 60,
                              alignment: "left",
                            },
                            {
                              width: "*",
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
                                  margin: [0, 3, 0, 3],
                                },
                                {
                                  text: `মোবাইল নং: ${phone} , ${secondaryPhone}`,
                                  style: "subtitle",
                                  alignment: "center",
                                  margin: [0, 3, 0, 3],
                                },
                              ],
                            },
                            {
                              width: 75,
                              sstack: [
                                {
                                  text: `${englishYear} ঈসায়ী`,
                                  bold: true,
                                  alignment: "right",
                                },
                                {
                                  text: "----------------",
                                  alignment: "right",
                                },
                                {
                                  text: `${hijriYear} হিজরী`,
                                  alignment: "right",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: (i: any, node: any) => {
                      if (i === node.table.body.length) return 4;
                      return 0;
                    },
                    vLineWidth: () => 0,
                    hLineColor: () => "#000",
                    vLineColor: () => "#000",
                  },
                  margin: [0, 0, 0, 4],
                },

                [
                  {
                    text: "২০২৬ ইং শিক্ষাবর্ষে শিক্ষার্থীর বেতন ও বোর্ডিং ফি রেজিস্টার",
                    style: "nametitle",
                    alignment: "center",
                    margin: [0, 6, 0, 2],
                  },
                  {
                    canvas: [
                      {
                        type: "line",
                        x1: 0,
                        y1: 0,
                        x2: 300,
                        y2: 0,
                        lineWidth: 1,
                        color: "#000",
                      },
                    ],
                    alignment: "center",
                    margin: [0, 0, 0, 8],
                  },
                ],

                /* -------- BASIC INFO -------- */
                {
                  table: {
                    widths: ["14%", "10%", "14%", "10%", "14%", "12%", "20%"],
                    body: [
                      [
                        {
                          text: "ক্রমিক নং:",
                          border: [false, false, false, false],
                        },
                        { text: "", alignment: "center" },
                        {
                          text: "দাখেলা নং:",
                          border: [false, false, false, false],
                        },
                        {
                          text: "",
                          alignment: "center",
                          border: [true, true, true, true],
                        },
                        {
                          text: "আইডি নং:",
                          border: [false, false, false, false],
                        },
                        {
                          text: s.code,
                          alignment: "center",
                          border: [true, true, true, true],
                        },
                        {
                          text: "ভর্তি তারিখ:",
                          border: [false, false, false, false],
                        },
                      ],
                    ],
                  },
                  margin: [0, 6, 0, 6],
                },

                {
                  table: {
                    widths: [
                      "10%",
                      "15%",
                      "10%",
                      "15%",
                      "10%",
                      "15%",
                      "10%",
                      "15%",
                    ],
                    body: [
                      [
                        {
                          text: "শ্রেণি:",
                          border: [false, false, false, false],
                        },
                        { text: s.currentClass, alignment: "center" },
                        { text: "বেতন:", border: [false, false, false, false] },
                        {
                          text: "",
                          alignment: "center",
                          border: [true, true, true, true],
                        },
                        {
                          text: "বোর্ডিং:",
                          border: [false, false, false, false],
                        },
                        {
                          text: "",
                          alignment: "center",
                          border: [true, true, true, true],
                        },
                        {
                          text: "শিট ফি:",
                          border: [false, false, false, false],
                        },
                        {
                          text: "",
                          alignment: "center",
                          border: [true, true, true, true],
                        },
                      ],
                    ],
                  },
                  margin: [0, 6, 0, 6],
                },

                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          text: `শিক্ষার্থীর নাম: ${s.name}`,
                          style: "nametitle",
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: () => 0.7,
                    vLineWidth: () => 0.7,
                    hLineColor: () => "#000",
                    vLineColor: () => "#000",
                  },
                  margin: [0, 4, 0, 4],
                },

                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          text: `পিতার নাম: ${s.fatherName}`,
                          style: "maintitle",
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: () => 0.7,
                    vLineWidth: () => 0.7,
                    hLineColor: () => "#000",
                    vLineColor: () => "#000",
                  },
                  margin: [0, 4, 0, 4],
                },

                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          text: `ঠিকানা: ${s.presentAddress.village}, ${s.presentAddress.postOffice}, ${s.presentAddress.thana}`,
                          style: "maintitle",
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: () => 0.7,
                    vLineWidth: () => 0.7,
                    hLineColor: () => "#000",
                    vLineColor: () => "#000",
                  },
                  margin: [0, 4, 0, 4],
                },

                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          text: `মোবাইল: ${s.mobile1} / ${s.mobile2}`,
                          style: "maintitle",
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: () => 0.7,
                    vLineWidth: () => 0.7,
                    hLineColor: () => "#000",
                    vLineColor: () => "#000",
                  },
                  margin: [0, 4, 0, 4],
                },

                {
                  columns: [
                    {
                      width: "*",
                      table: {
                        widths: [
                          "15%",
                          "12%",
                          "12%",
                          "15%",
                          "12%",
                          "15%",
                          "15%",
                        ],

                        heights: (rowIndex: any) => {
                          if (rowIndex === 0) return 9; // header
                          return 6; // ✅ tighter row height
                        },

                        body: [
                          [
                            {
                              text: "মাস",
                              bold: true,
                              alignment: "center",
                              fontSize: 13,
                            },
                            {
                              text: "বেতন",
                              bold: true,
                              alignment: "center",
                              fontSize: 13,
                            },
                            {
                              text: "বোর্ডিং",
                              bold: true,
                              alignment: "center",
                              fontSize: 13,
                            },
                            {
                              text: "পরীক্ষা ফি",
                              bold: true,
                              alignment: "center",
                              fontSize: 13,
                            },
                            {
                              text: "বিবিধ",
                              bold: true,
                              alignment: "center",
                              fontSize: 13,
                            },
                            {
                              text: "শিট ফি",
                              bold: true,
                              alignment: "center",
                              fontSize: 13,
                            },
                            {
                              text: "স্বাক্ষর",
                              bold: true,
                              alignment: "center",
                              fontSize: 13,
                            },
                          ],

                          ...months.flatMap((m) => [
                            [
                              {
                                text: m,
                                rowSpan: 2,
                                alignment: "center",
                                verticalAlignment: "middle",
                                fontSize: 13,
                                lineHeight: 0.95,
                                margin: [0, 5, 0, 0], // ✅ important
                              },
                              { text: "", fontSize: 12 },
                              { text: "", fontSize: 12 },
                              { text: "", fontSize: 12 },
                              { text: "", fontSize: 12 },
                              { text: "", fontSize: 12 },
                              { text: "", fontSize: 12 },
                            ],
                            [
                              { text: "" }, // rowSpan filler
                              { text: "", fontSize: 12 },
                              { text: "", fontSize: 12 },
                              { text: "", fontSize: 12 },
                              { text: "", fontSize: 12 },
                              { text: "", fontSize: 12 },
                              { text: "", fontSize: 12 },
                            ],
                          ]),
                        ],
                      },

                      layout: {
                        paddingLeft: () => 2,
                        paddingRight: () => 2,
                        paddingTop: () => 1,
                        paddingBottom: () => 1,
                        hLineWidth: () => 0.7,
                        vLineWidth: () => 0.7,
                        hLineColor: () => "#000",
                        vLineColor: () => "#000",
                      },
                    },

                    {
                      width: 130,
                      margin: [6, 0, 0, 0],
                      stack: [
                        {
                          text: "ভর্তি সংক্রান্ত তথ্য",
                          bold: true,
                          alignment: "center",
                          fontSize: 12,
                          margin: [0, 0, 0, 4],
                        },
                        {
                          table: {
                            widths: ["60%", "40%"],
                            body: [
                              ["ভর্তি ফি", ""],
                              ["রশিদ নং", ""],
                            ],
                          },
                          layout: {
                            paddingLeft: () => 2,
                            paddingRight: () => 2,
                            paddingTop: () => 2,
                            paddingBottom: () => 2,
                            hLineWidth: () => 0.7,
                            vLineWidth: () => 0.7,
                            hLineColor: () => "#000",
                            vLineColor: () => "#000",
                          },
                        },
                        {
                          text: "আদায় তারিখ:",
                          alignment: "left",
                          fontSize: 12,
                          margin: [0, 12, 0, 4],
                        },
                        {
                          text: "গোরাবা তথ্য",
                          alignment: "center",
                          fontSize: 12,
                          margin: [0, 12, 0, 4],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.7,
        vLineWidth: () => 0.7,
        hLineColor: () => "#000",
        vLineColor: () => "#000",
      },
    };
  };

  /* ================= PRINT FUNCTIONS ================= */
  const handlePrintAll = async () => {
    if (!filtered.length) return;

    const pdfMake = (await import("pdfmake/build/pdfmake")).default;

    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
    pdfMake.fonts = {
      SolaimanLipi: { normal: "SolaimanLipi.ttf", bold: "SolaimanLipi.ttf" },
    };

    const content: any[] = [];

    filtered.forEach((a, i) => {
      content.push(createSheet(a));
      if (i + 1 < filtered.length)
        content.push({ text: "", pageBreak: "after" });
    });

    pdfMake
      .createPdf({
        pageSize: "A4",
        defaultStyle: { font: "SolaimanLipi", fontSize: 13 },
        pageMargins: [40, 20, 40, 20],
        styles: {
          title: { fontSize: 18, bold: true },
          nametitle: { fontSize: 15, bold: true },
          subtitle: { fontSize: 12 },
          maintitle: { fontSize: 14, bold: true },
          info: { fontSize: 11, margin: [0, 2, 0, 2] },
        },
        content,
      })
      .open();
  };

  const handlePrintSingle = async () => {
    if (!selectedStudent) return;

    const admission = admissions.find(
      (a) => a.student.id === selectedStudent.id,
    );
    if (!admission) return;

    const pdfMake = (await import("pdfmake/build/pdfmake")).default;

    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
    pdfMake.fonts = {
      SolaimanLipi: { normal: "SolaimanLipi.ttf", bold: "SolaimanLipi.ttf" },
    };

    const content: any = [createSheet(admission)];
    pdfMake
      .createPdf({
        pageSize: "A4",
        defaultStyle: { font: "SolaimanLipi", fontSize: 13 },
        pageMargins: [40, 20, 40, 20],
        styles: {
          title: { fontSize: 18, bold: true },
          nametitle: { fontSize: 15, bold: true },
          subtitle: { fontSize: 12 },
          maintitle: { fontSize: 12, bold: true },
          info: { fontSize: 11, margin: [0, 2, 0, 2] },
        },
        content,
      })
      .open();
  };

  const handleSearchStudent = () => {
    if (!filter.studentCode) return;

    const admission = admissions.find(
      (a) => a.student.code === filter.studentCode,
    );
    if (!admission) {
      alert("শিক্ষার্থী পাওয়া যায়নি!");
      setSelectedStudent(null);
      return;
    }
    setSelectedStudent(admission.student);
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">📒 নূরানী বেতন শিট</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Session/Class Filter */}
        <div className="grid grid-cols-1 gap-3">
          <Select onValueChange={(v) => setFilter({ ...filter, session: v })}>
            <SelectTrigger>
              <SelectValue placeholder="সেশন নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => setFilter({ ...filter, className: v })}>
            <SelectTrigger>
              <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handlePrintAll} disabled={!filtered.length}>
            <Printer className="w-4 h-4 mr-2" /> Print All Students
          </Button>
        </div>

        {/* Single Student Search */}
        <div className="grid grid-cols-1 gap-2">
          <h1 className="text-xl font-bold">📒 একক শিক্ষার্থীর জন্য</h1>
          <input
            type="text"
            placeholder="শিক্ষার্থীর কোড লিখুন"
            className="border p-2 rounded w-full"
            value={filter.studentCode}
            onChange={(e) =>
              setFilter({ ...filter, studentCode: e.target.value })
            }
          />
          <Button onClick={handleSearchStudent} disabled={!filter.studentCode}>
            Search Student
          </Button>
        </div>
      </div>
      {/* Selected Student Info */}
      {selectedStudent && (
        <div className="mt-4 p-3 border rounded bg-gray-50 space-y-1">
          <div>
            <strong>নাম:</strong> {selectedStudent.name}
          </div>
          <div>
            <strong>আইডি নং:</strong> {selectedStudent.code}
          </div>
          <div>
            <strong>মোবাইল:</strong> {selectedStudent.mobile1} /{" "}
            {selectedStudent.mobile2}
          </div>
          <div>
            <strong>শ্রেণি:</strong> {selectedStudent.currentClass}
          </div>
          <Button onClick={handlePrintSingle} className="mt-2">
            <Printer className="w-4 h-4 mr-2" /> Print Selected Student
          </Button>
        </div>
      )}
    </div>
  );
}
