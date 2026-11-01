"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SolaimanLipiBase64 } from "@/fonts/solaiman"
import { formatDateBn } from "@/utils/dateBn"
import { Printer } from "lucide-react"
import { useEffect, useState } from "react"

/* ================= TYPES ================= */
type SessionType = { id: string; name: string }
type ClassType = { id: string; name: string }
type ExamType = {
  id: string
  examName: string
  startDate?: string
  endDate?: string
  session?: SessionType
}
type StudentType = {
  id: string
  name: string
  code: string
  currentClass: string
  fatherName?: string
  motherName?: string
  profilePicture?: string
}
type RegistrationType = {
  id: string
  student: StudentType
  exam: ExamType
  session: SessionType
}

export default function ExamSitSerial() {
  const API = process.env.NEXT_PUBLIC_BASE_API

  const [sessions, setSessions] = useState<SessionType[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [exams, setExams] = useState<ExamType[]>([])
  const [registrations, setRegistrations] = useState<RegistrationType[]>([])
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    sessionId: "",
    classId: "",
    examId: "",
    searchTerm: "",
  })

  const [images, setImages] = useState({
    logo: "",
    sign1: "",
    sign2: "",
  })

  /* ================= LOAD SESSIONS ================= */
  useEffect(() => {
    fetch(`${API}/api/v1/session`)
      .then((r) => r.json())
      .then((d) => setSessions(d.data || []))
  }, [API])
  /* ================= SESSION → CLASS ================= */
  useEffect(() => {
    if (!filters.sessionId) return

    setClasses([])
    setExams([])
    setRegistrations([])

    fetch(`${API}/api/v1/session/${filters.sessionId}/classes`)
      .then((r) => r.json())
      .then((d) => setClasses(d.data || []))
  }, [filters.sessionId, API])

  /* ================= CLASS → EXAM ================= */
  useEffect(() => {
    if (!filters.classId) return

    setExams([])
    setRegistrations([])

    fetch(`${API}/api/v1/exam/class/${filters.classId}`)
      .then((r) => r.json())
      .then((d) => setExams(d.data || []))
  }, [filters.classId, API])

  /* ================= EXAM → REGISTRATION ================= */
  useEffect(() => {
    if (!filters.examId) return

    setLoading(true)
    fetch(`${API}/api/v1/examregistration/exam/${filters.examId}`)
      .then((r) => r.json())
      .then((d) => setRegistrations(d.data || []))
      .finally(() => setLoading(false))
  }, [filters.examId, API])

  /* ================= SEARCH ================= */
  const filteredRegistrations = registrations.filter((r) => {
    if (!filters.searchTerm) return true
    const t = filters.searchTerm.toLowerCase()
    return (
      r.student.name.toLowerCase().includes(t) ||
      r.student.code.toLowerCase().includes(t)
    )
  })

  useEffect(() => {
    const loadImages = async () => {
      const toBase64FromUrl = async (url: string): Promise<string> => {
        const res = await fetch(url)
        const blob = await res.blob()
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
      }

      const [logo, sign1, sign2] = await Promise.all([
        toBase64FromUrl("https://i.ibb.co.com/84fWbw7p/logo.jpg"),
        toBase64FromUrl("https://i.ibb.co.com/RTpPR6RQ/sign1.png"),
        toBase64FromUrl("https://i.ibb.co.com/N2xLG0Kk/sign2.png"),
      ])

      setImages({ logo, sign1, sign2 })
    }

    loadImages()
  }, [])

  // -------------------
  // PDF Card Generator
  // -------------------
  const createCard = async (reg: RegistrationType): Promise<any> => {
    const student = reg.student
    const exam = reg.exam

    const toBase64FromUrl = async (url: string): Promise<string> => {
      const res = await fetch(url)
      const blob = await res.blob()

      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          const mime = blob.type || "image/jpeg"
          resolve(`data:${mime};base64,${base64.split(",")[1]}`)
        }
        reader.readAsDataURL(blob)
      })
    }

    const makeCircularImage = async (imageBase64: string, size = 50) => {
      return new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const HI_RES = size * 3
          canvas.width = HI_RES
          canvas.height = HI_RES
          const ctx = canvas.getContext("2d")!

          const minSide = Math.min(img.width, img.height)
          const sx = (img.width - minSide) / 2
          const sy = (img.height - minSide) / 2

          ctx.beginPath()
          ctx.arc(HI_RES / 2, HI_RES / 2, HI_RES / 2, 0, Math.PI * 2)
          ctx.clip()

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, HI_RES, HI_RES)

          resolve(canvas.toDataURL("image/png"))
        }
        img.src = imageBase64
      })
    }

    let studentPhoto = ""
    if (student.profilePicture) {
      try {
        const raw = await toBase64FromUrl(student.profilePicture)
        studentPhoto = await makeCircularImage(raw, 45)
      } catch {
        studentPhoto = ""
      }
    }

    return {
      table: {
        widths: ["*"],
        body: [
          [
            {
              stack: [
                {
                  text: exam.examName,
                  style: "header",
                  alignment: "center",
                  margin: [0, 0, 0, 4],
                },

                studentPhoto
                  ? {
                      image: studentPhoto,
                      width: 45,
                      alignment: "center",
                      margin: [0, 2, 0, 4],
                    }
                  : [
                      {
                        canvas: [
                          {
                            type: "rect",
                            x: 0,
                            y: 0,
                            w: 45,
                            h: 45,
                            r: 0,
                            lineWidth: 1,
                            lineColor: "#888",
                          },
                        ],
                        alignment: "center",
                        margin: [0, 2, 0, 4],
                      },
                    ],

                {
                  text: `${student.name}`,
                  style: "name",
                  alignment: "center",
                  margin: [0, 2, 0, 0],
                },

                {
                  text: `আইডি: ${student.code}`,
                  style: "id",
                  alignment: "center",
                  margin: [0, 2, 0, 0],
                },

                {
                  text: `শ্রেণি: ${student.currentClass}`,
                  style: "info",
                  alignment: "center",
                  margin: [0, 2, 0, 0],
                },
              ],
              margin: [5, 5, 5, 5],
            },
          ],
        ],
      },

      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineStyle: () => ({ dash: { length: 3, space: 2 } }),
        vLineStyle: () => ({ dash: { length: 3, space: 2 } }),
        hLineColor: () => "#999",
        vLineColor: () => "#999",
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },

      margin: [5, 5, 5, 5],
    }
  }

  // Print single
  const handlePrintSingle = async (reg: RegistrationType) => {
    setLoading(true)

    const pdfMakeModule = await import("pdfmake/build/pdfmake")
    const pdfMake = pdfMakeModule.default

    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 }
    pdfMake.fonts = {
      SolaimanLipi: {
        normal: "SolaimanLipi.ttf",
        bold: "SolaimanLipi.ttf",
        italics: "SolaimanLipi.ttf",
        bolditalics: "SolaimanLipi.ttf",
      },
    }

    const card = await createCard(reg)

    const docDefinition: any = {
      pageSize: "A4",
      pageMargins: [5, 5, 5, 5],

      content: [
        {
          columns: [
            { width: "*", text: "" }, // left space
            {
              width: 190, // 👈 card width control
              stack: [card],
            },
            { width: "*", text: "" }, // right space
          ],
          margin: [0, 0, 0, 0], // top spacing
        },
      ],

      defaultStyle: { font: "SolaimanLipi" },
      styles: {
        header: { fontSize: 14, bold: true },
        name: { fontSize: 14, bold: true },
        id: { fontSize: 12, bold: true },
        info: { fontSize: 12 },
      },
    }

    pdfMake.createPdf(docDefinition).open()
    setLoading(false)
  }
  // Print all
  const handlePrintAll = async () => {
    if (!filteredRegistrations.length) return

    setLoading(true)

    const pdfMakeModule = await import("pdfmake/build/pdfmake")
    const pdfMake = pdfMakeModule.default

    pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 }
    pdfMake.fonts = {
      SolaimanLipi: {
        normal: "SolaimanLipi.ttf",
        bold: "SolaimanLipi.ttf",
        italics: "SolaimanLipi.ttf",
        bolditalics: "SolaimanLipi.ttf",
      },
    }

    const cards: any[] = []

    for (const reg of filteredRegistrations) {
      const card = await createCard(reg)
      cards.push(card)
    }

    const rows: any[] = []

    // 👉 3 cards per row
    for (let i = 0; i < cards.length; i += 3) {
      rows.push({
        columns: [cards[i], cards[i + 1], cards[i + 2]],
        columnGap: 10,
        margin: [0, 0, 0, 10],
      })
    }

    const content: any[] = []

    // 👉 4 rows per page = 12 cards
    for (let i = 0; i < rows.length; i += 4) {
      content.push(...rows.slice(i, i + 4))

      if (i + 4 < rows.length) {
        content.push({ text: "", pageBreak: "after" })
      }
    }

    const docDefinition: any = {
      pageSize: "A4",
      pageMargins: [5, 5, 5, 5],
      content,
      defaultStyle: { font: "SolaimanLipi" },
      styles: {
        header: { fontSize: 14, bold: true },
        name: { fontSize: 14, bold: true },
        id: { fontSize: 12, bold: true },
        info: { fontSize: 12 },
      },
    }

    pdfMake.createPdf(docDefinition).open()
    setLoading(false)
  }
  return (
    <div className="p-6 bg-slate-50 min-h-screen bangla space-y-6">
      <h1 className="text-xl font-bold">📘 পরীক্ষার সিট টোকেন</h1>

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
  )
}
