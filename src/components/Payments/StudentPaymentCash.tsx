"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import { numberToBanglaWords } from "@/types/numberToBanglaWords ";
import { formatBanglaDateTime } from "@/utils/dateBn";
import axios from "axios";
import { Printer } from "lucide-react";
import type { Content } from "pdfmake/interfaces";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
interface FeeItem {
  id: string;
  feeCategoryId: string;
  amount: number;
  status: string;
  feeCategory: { name: string };
  payment: {
    month: string;
    year: string;
  };
}

interface StudentPayment {
  id: string;
  month: string;
  year: number;
  paidAmount: number;
  status: string;
  items: FeeItem[];
  paymentMethod: string;
  transactionId: string;
  RoshidNo: string;
  previousDue: number;
  PaymentGatewayData: {
    role: string;
    type: string;
    receivedAt: string;
    receivedBy: string;
  };
}

interface Student {
  id: string;
  name: string;
  code?: string;
  profilePicture: string;
  fatherName: string;
}

export default function StudentPaymentCash() {
  const token = useSelector((state: any) => state.auth.token);
  const [searchCode, setSearchCode] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [selectedFees, setSelectedFees] = useState<{ [key: string]: string[] }>(
    {},
  );
  const [loading, setLoading] = useState(false);
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
        toBase64FromUrl("https://i.ibb.co.com/VcXys31m/sign2.png"),
        toBase64FromUrl("https://i.ibb.co.com/PvmzSSFL/sign1.png"),
      ]);

      setImages({ logo, sign1, sign2 });
    };

    loadImages();
  }, []);

  // Fetch student by code
  const handleSearchByCode = async () => {
    if (!searchCode.trim()) return toast.error("অনুগ্রহ করে কোড লিখুন");

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/student?code=${encodeURIComponent(
          searchCode.trim(),
        )}`,
      );
      const data = await res.json();
      const student: Student | null =
        Array.isArray(data.data) && data.data.length > 0
          ? data.data[0]
          : data.data && !Array.isArray(data.data)
            ? data.data
            : null;

      if (!student) {
        toast.error("কোন শিক্ষার্থী পাওয়া যায়নি");
        setSelectedStudent(null);
        setPayments([]);
        return;
      }

      setSelectedStudent(student);
      fetchStudentPayments(student.id);
    } catch (err) {
      console.error(err);
      toast.error("সার্ভারে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  // Fetch payments for student
  const fetchStudentPayments = async (studentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/paymentreport/single/${studentId}`,
      );
      const data = await res.json();
      setPayments(data.data || []);
      setSelectedFees({});
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch student payments");
    } finally {
      setLoading(false);
    }
  };

  const getAllUnpaidItems = () => {
    return payments.flatMap((p) =>
      p.items
        .filter((i) => i.status !== "PAID")
        .map((i) => ({
          month: p.month,
          year: p.year,
          name: i.feeCategory.name,
          amount: i.amount,
        })),
    );
  };

  const toBanglaNumber = (num: number | string) => {
    const en = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num)
      .split("")
      .map((c) => (en.includes(c) ? bn[en.indexOf(c)] : c))
      .join("");
  };
  const makeGlobalDueTable = (items: any[]) => {
    const total = items.reduce((sum, i) => sum + i.amount, 0);

    return {
      table: {
        headerRows: 1,
        widths: ["*", "*", "auto"],
        body: [
          [
            { text: "মাস / বছর", bold: true },
            { text: "ফি ধরন", bold: true },
            { text: "পরিমাণ", bold: true },
          ],
          ...items.map((i) => [
            `${i.month} ${i.year}`,
            i.name,
            `${toBanglaNumber(i.amount)} টাকা`,
          ]),
          [
            { text: "মোট বকেয়া", colSpan: 2, bold: true },
            {},
            { text: `${toBanglaNumber(total)} টাকা`, bold: true },
          ],
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 10, 0, 0],
    };
  };
  const allUnpaidItems = getAllUnpaidItems();

  // Toggle fee checkbox
  const toggleFee = (paymentId: string, feeId: string) => {
    setSelectedFees((prev) => {
      const current = prev[paymentId] || [];
      const updated = current.includes(feeId)
        ? current.filter((f) => f !== feeId)
        : [...current, feeId];
      return { ...prev, [paymentId]: updated };
    });
  };

  // Pay cash for selected fees
  const handlePayCash = async (paymentId: string) => {
    const fees = selectedFees[paymentId] || [];
    if (!fees.length) return toast.error("অনুগ্রহ করে কোন ফি নির্বাচন করুন");

    setLoading(true);
    try {
      const postres = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/paymentreport/handcash/${paymentId}`,
        { paidItemIds: fees },
        { headers: { Authorization: `${token}` } },
      );
      toast.success(postres.data.message);

      setSelectedFees({});

      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                items: p.items.map((i) =>
                  fees.includes(i.feeCategoryId) ? { ...i, status: "PAID" } : i,
                ),
                paidAmount:
                  p.paidAmount +
                  p.items
                    .filter((i) => fees.includes(i.feeCategoryId))
                    .reduce((sum, i) => sum + i.amount, 0),
                status: p.items.every((i) => i.status === "PAID")
                  ? "PAID"
                  : "PARTIAL",
              }
            : p,
        ),
      );

      setSelectedFees((prev) => ({ ...prev, [paymentId]: [] }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= PDF HELPERS ================= */

  const signatureRow = (): Content => ({
    columns: [
      {
        stack: [
          { text: "_________", margin: [0, 0, 0, 2] },
          { text: "মোহতামীম", fontSize: 9 },
        ],
      },
      {
        alignment: "right",
        stack: [
          { text: "______________", margin: [0, 0, 0, 2] },
          { text: `আদয়কারীর স্বাক্ষর: আব্দুল্লাহ আল মামুন`, fontSize: 9 },
        ],
      },
    ],
  });
  const cutLine = (): Content => ({
    canvas: [
      {
        type: "line",
        x1: 0,
        y1: 0,
        x2: 515,
        y2: 0,
        dash: { length: 5 },
      },
    ],
    margin: [0, 10, 0, 10],
  });

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

  const generateMonthlyInvoiceWithDue = async (payment: StudentPayment) => {
    if (!selectedStudent) return;

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

    // Split Paid / Due
    const paidItems = payment.items.filter((i) => i.status === "PAID");
    const dueItems = payment.items.filter((i) => i.status !== "PAID");

    const totalPaid = paidItems.reduce((sum, i) => sum + i.amount, 0);
    const totalDue = dueItems.reduce((sum, i) => sum + i.amount, 0);

    const amountInWordsPaid = numberToBanglaWords(totalPaid) + " টাকা মাত্র";
    const amountInWordsDue = numberToBanglaWords(totalDue) + " টাকা মাত্র";

    const makeTableBody = (items: FeeItem[], total: number) => [
      ["ফি এর ধরন", "পরিমাণ"],
      ...items.map((i) => [
        i.feeCategory.name,
        `${toBanglaNumber(i.amount)} টাকা`,
      ]),
      [{ text: "মোট", bold: true }, `${toBanglaNumber(total)} টাকা`],
    ];

    let studentPhoto = "";
    if (selectedStudent.profilePicture) {
      try {
        studentPhoto = await toBase64FromUrl(selectedStudent.profilePicture);
      } catch {
        studentPhoto = "";
      }
    }

    const docDefinition: any = {
      watermark: {
        text: "https://islamidawahinstitute.com",
        color: "gray",
        opacity: 0.1,
        bold: true,
        italics: false,
      },
      content: [
        // ---------------- Student Copy ----------------
        {
          columns: [
            { image: images.logo, width: 60, alignment: "left" },
            {
              stack: [
                {
                  text: ` ${instituteName}`,
                  style: "title",
                  alignment: "center",
                },
                {
                  text: `${address}`,
                  style: "subtitle",
                  alignment: "center",
                  margin: [0, 0, 0, 0],
                },
                {
                  text: `মোবাইল নং ${phone}, ${secondaryPhone}`,
                  style: "subtitle",
                  alignment: "center",
                  margin: [0, 0, 0, 0],
                },
              ],
              width: "*", // take remaining space
              alignment: "center",
            },
          ],
          margin: [0, 0, 0, 0],
        },
        cutLine(),
        {
          columns: [
            {
              text: "",
              style: "title",
              alignment: "left",
            },
            {
              width: 70,
              table: {
                widths: [70],
                body: [
                  [
                    studentPhoto
                      ? {
                          image: studentPhoto,
                          width: 70,
                          height: 70,
                          fit: [70, 70],
                          alignment: "center",
                        }
                      : {
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
                        },
                  ],
                ],
              },
              layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => "#888",
                vLineColor: () => "#888",
                paddingLeft: () => 0,
                paddingRight: () => 0,
                paddingTop: () => 0,
                paddingBottom: () => 0,
              },
            },

            {
              text: "",
              style: "title",
              alignment: "right",
            },
          ],
        },
        {
          text: "পেমেন্ট চালান (Student Copy)",
          style: "header",
          alignment: "center",
          margin: [0, 2, 0, 8],
        },

        // Student Info
        {
          table: {
            widths: ["*", "*", "*"],
            body: [
              [
                { text: `আইডি: ${selectedStudent.code}`, style: "info" },
                {
                  text: `শিক্ষার্থীর নাম: ${selectedStudent.name}`,
                  style: "info",
                },
                {
                  text: `পিতার নাম: ${selectedStudent.fatherName}`,
                  style: "info",
                },
              ],
              [
                {
                  text: `ট্রানজেকশন: ${payment.id.slice(0, 8)}`,
                  style: "info",
                },
                {
                  text: `রশিদ নং: ${payment.RoshidNo.slice(0, 6)}`,
                  style: "info",
                },
                {
                  text: `পরিশোধিত মাস: ${payment.year} / ${payment.month}`,
                  style: "info",
                },
              ],
            ],
          },
          layout: {
            hLineWidth: (i: any, node: any) =>
              i === 0 || i === node.table.body.length ? 1 : 0,

            vLineWidth: (i: any, node: any) =>
              i === 0 || i === node.table.widths.length ? 1 : 0,

            hLineColor: () => "#888",
            vLineColor: () => "#888",

            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
          margin: [0, 5, 0, 10],
        },

        // ---------------- Paid Fees ----------------
        {
          text: "পরিশোধিত ফি",
          style: "subheader",
          margin: [0, 10, 0, 5],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto"],
            body: makeTableBody(paidItems, totalPaid),
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => "#888",
            vLineColor: () => "#888",
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
        },
        {
          text: `কথায়: ${amountInWordsPaid}`,
          style: "info",
          margin: [0, 5, 0, 5],
        },

        // Signature
        signatureRow(),

        {
          columns: [
            {
              text: `প্যামেন্ট মাধ্যম:${payment.PaymentGatewayData?.type}`,
              fontSize: 9,
              width: "*",
            },
            {
              text: `গ্রহণকারী: ${payment.PaymentGatewayData?.receivedBy}`,
              fontSize: 9,
              width: "*",
            },
            {
              text: `গ্রহণ তারিখ: ${formatBanglaDateTime(payment.PaymentGatewayData?.receivedAt)}`,
              fontSize: 9,
              width: "*",
            },
          ],
          columnGap: 10,
        },

        {
          text: "STUDENT COPY",
          style: "copy",
          alignment: "right",
          margin: [0, 20, 0, 0],
        },

        // -------- Due Statement --------
        ...(allUnpaidItems.length
          ? [
              {
                text: "সকল বকেয়া বিবরণ",
                style: "header",
                margin: [0, 10, 0, 5],
              },
              {
                table: makeGlobalDueTable(allUnpaidItems).table,
                layout: {
                  hLineWidth: () => 1,
                  vLineWidth: () => 1,
                  hLineColor: () => "#888",
                  vLineColor: () => "#888",
                  paddingLeft: () => 6,
                  paddingRight: () => 6,
                  paddingTop: () => 4,
                  paddingBottom: () => 4,
                },
              },
            ]
          : []),

        // {
        //   text: "https://islamidawahinstitute.com",
        //   style: "copy",
        //   alignment: "right",
        //   margin: [0, 20, 0, 0],
        // },
      ].filter(Boolean),

      // filter Boolean to skip null for dueItems if none

      defaultStyle: { font: "SolaimanLipi", fontSize: 12 },
      styles: {
        title: { fontSize: 20, bold: true },
        header: { fontSize: 16, bold: true },
        subheader: { fontSize: 13, bold: true },
        info: { fontSize: 13, margin: [0, 2, 0, 2] },
        copy: { fontSize: 12, bold: true },
      },
    };

    pdfMake.createPdf(docDefinition).open();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Student Payments (Cash)</h1>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter Student Code or ID"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearchByCode()}
          className="border p-2 rounded flex-1"
        />
        <Button onClick={handleSearchByCode} disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </Button>
      </div>

      {/* Selected Student */}
      {selectedStudent && (
        <div className="p-3 bg-gray-100 rounded mb-4">
          <strong>{selectedStudent.name}</strong> (ID: {selectedStudent.code})
        </div>
      )}

      {/* Payments */}
      {payments.length === 0 ? (
        selectedStudent ? (
          <p>এই শিক্ষার্থীর জন্য কোন পেমেন্ট পাওয়া যায়নি।</p>
        ) : (
          <p>শিক্ষার্থী খুঁজুন পেমেন্ট দেখতে।</p>
        )
      ) : (
        <div className="grid lg:grid-cols-3 md:grid-cols-1 grid-cols-1 gap-5">
          {payments.map((payment) => (
            <Card
              key={payment.id}
              className="rounded-xl shadow hover:shadow-lg"
            >
              <CardContent className="p-4">
                <div className="flex justify-between mb-2">
                  <strong>
                    {payment.month} / {payment.year}
                  </strong>
                  <span
                    className={`font-bold ${
                      payment.status === "PAID"
                        ? "text-green-600"
                        : payment.status === "PARTIAL"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>

                <div className="space-y-1 mb-2 flex justify-between items-center flex-wrap gap-5">
                  {payment.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center flex-wrap p-2 border rounded gap-5"
                    >
                      <div className="">
                        {item.feeCategory.name} - ৳:{item.amount.toFixed(0)}
                        {item.status === "PAID" && (
                          <span className="text-green-600 ml-2">PAID</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status !== "PAID" && (
                          <input
                            type="checkbox"
                            checked={
                              selectedFees[payment.id]?.includes(
                                item.feeCategoryId,
                              ) || false
                            }
                            onChange={() =>
                              toggleFee(payment.id, item.feeCategoryId)
                            }
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center gap-5">
                  <Button
                    onClick={() => handlePayCash(payment.id)}
                    className="cursor-pointer"
                    disabled={loading}
                  >
                    Pay Cash
                  </Button>

                  <Button
                    onClick={() => generateMonthlyInvoiceWithDue(payment)}
                    disabled={payment.items.every((i) => i.status !== "PAID")}
                    className="bg-gray-300 text-black hover:text-white cursor-pointer"
                  >
                    <Printer className="w-4 h-4 mr-1" /> Full Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
