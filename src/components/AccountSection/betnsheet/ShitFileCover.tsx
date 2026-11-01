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
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";

/* ================= TYPES ================= */
type Session = { id: string; name: string };

type Student = {
  id: string;
  name: string;
  fatherName: string;
  address: string;
  code: string;
  currentClass: string;
  mobile1: string;
  mobile2: string;
  presentAddress: { village: string; postOffice: string; thana: string };
};

type Admission = { id: string; student: Student; session: Session };

/* ================= COMPONENT ================= */
export default function ShitFileCover() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<Admission[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filter, setFilter] = useState({
    session: "",
    className: "",
    studentCode: "",
  });
  const [images, setImages] = useState({ logo: "" });

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

  /* ================= FILTER ================= */
  useEffect(() => {
    if (!filter.session) return setClasses([]);

    const cls = [
      ...new Set(
        admissions
          .filter((a) => a.session.name === filter.session)
          .map((a) => a.student.currentClass)
      ),
    ];
    setClasses(cls);
    setFilter((f) => ({ ...f, className: "" }));
  }, [filter.session, admissions]);

  useEffect(() => {
    if (!filter.session || !filter.className) return setFiltered([]);
    setFiltered(
      admissions.filter(
        (a) =>
          a.session.name === filter.session &&
          a.student.currentClass === filter.className
      )
    );
  }, [filter, admissions]);

  /* ================= LOAD LOGO ================= */
  useEffect(() => {
    const load = async () => {
      const res = await fetch("https://i.ibb.co.com/84fWbw7p/logo.jpg");
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => setImages({ logo: reader.result as string });
      reader.readAsDataURL(blob);
    };
    load();
  }, []);

  /* ================= PDF ================= */
  const createStudentTable = (
    data: Admission[],
    images: { logo: string }
  ): any => {
    return {
      table: {
        widths: ["*"],
        body: data.flatMap((a) => {
          // create exactly 2 rows per student
          return [0, 1].map(() => [
            {
              columns: [
                { image: images.logo, width: 30, alignment: "center" },
                {
                  text: `আইডি: ${a.student.code}`,
                  width: 200,
                  alignment: "center",
                  bold: true,
                  fontSize: 18,
                  margin: [0, 5, 0, 0],
                },
                {
                  text: `শিক্ষার্থীর নামঃ ${a.student.name}`,
                  width: 400,
                  alignment: "center",
                  bold: true,
                  fontSize: 18,
                  margin: [0, 5, 0, 0],
                },
                {
                  text: `${a.student.currentClass}`,
                  width: 150,
                  alignment: "center",
                  fontSize: 18,
                  margin: [0, 5, 0, 0],
                },
              ],
              margin: [0, 0, 0, 0],
            },
          ]);
        }),
      },
      layout: {
        hLineWidth: () => 0.8,
        vLineWidth: () => 0.8,
        hLineColor: () => "#000",
        vLineColor: () => "#000",
      },
    };
  };

  // Example: Print all filtered students
  const handlePrintAll = async () => {
    if (!filtered.length || !images.logo) return;

    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
    pdfMake.fonts = {
      SolaimanLipi: { normal: "SolaimanLipi.ttf", bold: "SolaimanLipi.ttf" },
    };

    pdfMake
      .createPdf({
        pageSize: "A4",
        pageOrientation: "landscape",
        defaultStyle: { font: "SolaimanLipi" },
        content: [createStudentTable(filtered, images)],
      })
      .open();
  };

  // Print students by selected codes (single or multiple)
  const handlePrintSelectedCodes = async () => {
    if (!filter.studentCode || !images.logo) {
      alert("কমপক্ষে একটি শিক্ষার্থীর কোড লিখুন!");
      return;
    }

    // Split by comma or space, trim spaces
    const codes = filter.studentCode
      .split(/[,\s]+/)
      .map((c) => c.trim())
      .filter((c) => c);

    if (!codes.length) {
      alert("শুধু বৈধ কোড লিখুন!");
      return;
    }

    // Filter admissions matching the codes
    let matchedAdmissions = admissions.filter((a) =>
      codes.includes(a.student.code)
    );
    // Remove duplicates by student code
    matchedAdmissions = matchedAdmissions.filter(
      (a, index, self) =>
        index === self.findIndex((t) => t.student.code === a.student.code)
    );

    if (!matchedAdmissions.length) {
      alert("কোনো শিক্ষার্থী পাওয়া যায়নি!");
      return;
    }

    // PDFMake setup
    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
    pdfMake.fonts = {
      SolaimanLipi: { normal: "SolaimanLipi.ttf", bold: "SolaimanLipi.ttf" },
    };

    // Generate PDF
    pdfMake
      .createPdf({
        pageSize: "A4",
        pageOrientation: "landscape",
        defaultStyle: { font: "SolaimanLipi" },
        content: [createStudentTable(matchedAdmissions, images)],
      })
      .open();
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">শিট ফাইল কভার প্রিন্ট</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="grid gap-3">
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
            <Printer className="w-4 h-4 mr-2" /> Print All
          </Button>
        </div>

        <div className="grid gap-2">
          <input
            className="border p-2 rounded"
            placeholder="এক বা একাধিক, comma বা space দিয়ে)"
            value={filter.studentCode}
            onChange={(e) =>
              setFilter({ ...filter, studentCode: e.target.value })
            }
          />
          <Button
            onClick={handlePrintSelectedCodes}
            disabled={!filter.studentCode}
          >
            Print Selected
          </Button>
        </div>
      </div>
    </div>
  );
}
