"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import api from "@/lib/axios";
import { selectCurrentUser } from "@/Redux/Features/Auth/authSlice";
import { useAppSelector } from "@/Redux/hook";
import { numberToBanglaWords } from "@/types/numberToBanglaWords ";
import { formatBanglaDateTime, formatDateBn } from "@/utils/dateBn";
import { Printer } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";

interface FeeItem {
  id: string;
  feeCategoryId: string;
  amount: number;
  status: "PAID" | "UNPAID";
  feeCategory: { name: string };
}
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
interface StudentPayment {
  id: string;
  month: string;
  year: number;
  status: string;
  items: FeeItem[];
  RoshidNo: string;
  paymentMethod: string;
  session: {
    name: string;
  };
  admission: {
    currentClass: string;
  };
}

interface Student {
  id: string;
  name: string;
  code: string;
  profilePicture: string;
  fatherName: string;
  mobile1: string;
  currentClass: string;
  createdAt: string;
  presentAddress: {
    village: string;
    postOffice: string;
    thana: string;
  };
  admissions: [
    {
      createdAt: string;
      id: string;
      residence: string;
      admissionDate: string;
      mashikBetn: number;
      boardingFee: number;
      admissionFee: number;
      currentClass: string;
      session: {
        name: string;
      };
    },
  ];
}

interface TransactionResponse {
  transactionId: string;
  totalPaid: number;
  payments: StudentPayment[];
  duePayments?: StudentPayment[];
  createdAt: string;
  receivedBy: string;
  method: string;
  shortfallAmount: number;
  roshidNo: string;
}

export default function MultiMonthStudentPaymentCash() {
  const token = useSelector((state: any) => state.auth.token);
  const currentUser = useAppSelector(selectCurrentUser);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [editAmounts, setEditAmounts] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const [images, setImages] = useState({
    logo: "",
    sign1: "",
    sign2: "",
    webicon: "",
    fbicon: "",
    qrcode: "",
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

      const [logo, sign1, sign2, webicon, fbicon, qrcode] = await Promise.all([
        toBase64FromUrl("/logo1.jpg"),
        toBase64FromUrl("/sign1.png"),
        toBase64FromUrl("/sbanner.jpg"),
        toBase64FromUrl("/web.jpg"),
        toBase64FromUrl("/facebook.jpg"),
        toBase64FromUrl("/qrcode.jpg"),
      ]);

      setImages({ logo, sign1, sign2, webicon, fbicon, qrcode });
    };

    loadImages();
  }, []);

  useEffect(() => {
    if (student?.id) fetchPayments(student.id);
  }, [student?.id, page]);

  // ================= SEARCH STUDENT =================
  const searchStudent = async () => {
    if (!searchCode.trim()) return toast.error("শিক্ষার্থী কোড লিখুন");

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/student?code=${searchCode}`,
      );
      const json = await res.json();
      const s = Array.isArray(json.data) ? json.data[0] : json.data;
      if (!s) throw new Error();
      setStudent(s);
      fetchPayments(s.id);
    } catch {
      toast.error("শিক্ষার্থী পাওয়া যায়নি");
      setStudent(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAmount = async (itemId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "success",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Updated it!",
    });

    if (!result.isConfirmed) return;

    try {
      const amount = editAmounts[itemId];

      if (!amount) {
        return toast.error("Amount পাওয়া যায়নি");
      }

      setSavingId(itemId);

      await api.patch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/item/${itemId}`,
        { amount },
      );
      toast.success("Amount updated successfully");

      if (student) fetchPayments(student.id);

      setSavingId(null);
    } catch (err: any) {
      setSavingId(null);
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const deleteFeeItem = async (itemId: string, studentId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    try {
      // 🔹 Delete API call
      await api.delete(`/api/v1/paymenttransaction/deleteFeeItem/${itemId}`);

      toast.success("FeeItem deleted successfully");

      // 🔹 Frontend state থেকে instant remove
      setPayments((prev) =>
        prev.map((p) => ({
          ...p,
          items: p.items.filter((i) => i.id !== itemId),
        })),
      );

      // 🔹 Optional: যদি চাইলে আবার full fetch করতে
      // await fetchPayments(studentId);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };
  const deleteStudentPayment = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/delete/studentpayments/${id}`,
      );

      if (student) {
        fetchPayments(student.id);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  const fetchPayments = async (studentId: string) => {
    const res = await api.get(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/paymentreport/single/${studentId}?page=${page}&limit=${limit}`,
    );

    const { data, meta } = res.data;

    const paymentsData: StudentPayment[] = data || [];
    setTotalPages(meta ? Math.ceil(meta.total / limit) : 1);
    const initialSelected: Record<string, string[]> = {};
    paymentsData.forEach((p) => {
      initialSelected[p.id] = [];
    });

    setPayments(paymentsData);
    setSelected(initialSelected);
  };

  // ================= TOGGLE SELECTION =================
  const toggle = (paymentId: string, feeId: string) => {
    setSelected((prev) => {
      const list = Array.isArray(prev[paymentId]) ? prev[paymentId] : [];
      const updatedList = list.includes(feeId)
        ? list.filter((id) => id !== feeId)
        : [...list, feeId];
      return { ...prev, [paymentId]: updatedList };
    });
  };

  // ================= PAY MULTI MONTH CASH =================
  const payMultiCash = async () => {
    const items = Object.entries(selected)
      .filter(([, itemIds]) => itemIds.length > 0)
      .map(([paymentId, paymentItemIds]) => ({ paymentId, paymentItemIds }));

    if (!items.length) return toast.error("কোন ফি নির্বাচন করা হয়নি");

    setLoading(true);
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "রশিদ কর্তন করা হলে তা অফেরতযোগ্য।",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Payment Recieved!",
    });

    if (!result.isConfirmed) return;
    try {
      const res = await api.post<ApiResponse<TransactionResponse>>(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/paymentreport/payment/transaction/cash`,
        { items },
      );

      toast.success("Cash payment successful");
      generateTransactionPDF(res.data.data);
      if (student) fetchPayments(student.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedTotalAmount = payments
    .flatMap(
      (p) =>
        p.items
          .filter((i) => selected[p.id]?.includes(i.id)) // selected items
          .map((i) => editAmounts[i.id] ?? i.amount), // edited amount থাকলে সেটাও নাও
    )
    .reduce((sum, amt) => sum + amt, 0);

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

  // ================= PDF GENERATION =================
  const generateTransactionPDF = async (trx: TransactionResponse) => {
    if (!student) return;
    console.log({ trx });
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

    const COLORS = {
      header: "#d9d9d9",
      zebra1: "#d9d9d9",
      zebra2: "#FFFFFF",
      totalPaid: "#d9d9d9",
      totalDue: "#d9d9d9",
    };

    const toBn = (num: number) => num.toLocaleString("bn-BD");
    const MONTH_INDEX: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const shortMonthYear = (month?: string, year?: number | string) => {
      if (!month || !year) return "";
      const map: Record<string, string> = {
        January: "Jan",
        February: "Feb",
        March: "Mar",
        April: "Apr",
        May: "May",
        June: "Jun",
        July: "Jul",
        August: "Aug",
        September: "Sep",
        October: "Oct",
        November: "Nov",
        December: "Dec",
      };
      const m = map[month] ?? month.slice(0, 3);
      const y = String(year).slice(-2);
      return `${m}/${y}`;
    };

    // All months
    const allMonths = Array.from(
      new Set([
        ...(trx.payments ?? []).map((p) => shortMonthYear(p.month, p.year)),
        ...(trx.duePayments ?? []).map((p) => shortMonthYear(p.month, p.year)),
      ]),
    ).sort((a, b) => {
      const [ma, ya] = a.split("/"); // "Jan/26"
      const [mb, yb] = b.split("/");

      const yearDiff = Number(ya) - Number(yb);
      if (yearDiff !== 0) return yearDiff;

      return MONTH_INDEX[ma] - MONTH_INDEX[mb];
    });

    type LedgerRow = {
      feeName: string;
      values: Record<string, number | "বকেয়া">;
    };
    const ledgerMap: Record<string, LedgerRow> = {};

    // Paid amounts
    (trx.payments ?? []).forEach((p) => {
      const monthKey = shortMonthYear(p.month, p.year);
      (p.items ?? []).forEach((i) => {
        const feeName = i.feeCategory?.name ?? "Unknown Fee";
        if (!ledgerMap[feeName]) ledgerMap[feeName] = { feeName, values: {} };

        ledgerMap[feeName].values[monthKey] =
          String(i.status).toUpperCase() === "PAID" ? (i.amount ?? 0) : "বকেয়া";
      });
    });

    // Due amounts fill only if not paid
    (trx.duePayments ?? []).forEach((p) => {
      const monthKey = shortMonthYear(p.month, p.year);
      (p.items ?? []).forEach((i) => {
        const feeName = i.feeCategory?.name ?? "Unknown Fee";
        if (!ledgerMap[feeName]) ledgerMap[feeName] = { feeName, values: {} };
        if (ledgerMap[feeName].values[monthKey] === undefined) {
          ledgerMap[feeName].values[monthKey] = "বকেয়া";
        }
      });
    });

    // Ledger rows
    const ledgerRows = Object.values(ledgerMap).map((row, index) => {
      const monthCells = allMonths.map((m) => {
        const val = row.values[m];

        if (val === "বকেয়া") {
          return {
            text: "বকেয়া",
            alignment: "center",
            italics: true,
            fillColor: COLORS.zebra1,
            style: "info",
          };
        } else if (val) {
          return {
            text: toBn(val as number),
            alignment: "right",
            fillColor: COLORS.zebra2,
            style: "info",
          };
        } else {
          return {
            text: "",
            style: "info",
            alignment: "center",
            fillColor: COLORS.zebra2,
          };
        }
      });

      const totalPaid = Object.values(row.values)
        .filter((v) => typeof v === "number")
        .reduce((s, v) => s + (v as number), 0);

      return [
        {
          text: toBn(index + 1),
          alignment: "center",
          fillColor: COLORS.zebra1,
          style: "info",
        },
        {
          text: row.feeName,
          alignment: "left",
          style: "info",
          fillColor: COLORS.zebra2,
        },
        ...monthCells,
        {
          text: toBn(totalPaid),
          alignment: "right",
          bold: true,
          fillColor: COLORS.zebra2,
          style: "info",
        },
      ];
    });

    const totalPaidAmount = Object.values(ledgerMap)
      .flatMap((r) =>
        Object.values(r.values).filter((v) => typeof v === "number"),
      )
      .reduce((s, v) => s + (v as number), 0);

    const totalDueAmount = (trx.duePayments ?? [])
      .flatMap((p) => p.items ?? [])
      .reduce((s, i) => s + (i.amount ?? 0), 0);
    // Grand totals
    // Total Paid

    // Header
    const header = [
      {
        text: "ক্রমিক",
        style: "tableHeader",
        alignment: "center",
        margin: [0, 7, 0, 0],
      },
      {
        text: "ফি এর বিবরণ",
        style: "tableHeader",
        alignment: "center",
        margin: [0, 5, 0, 5], // optional (vertical center feel)
      },
      ...allMonths.map((m) => {
        const [mo, yr] = m.split("/");
        return {
          stack: [
            { text: mo, alignment: "center" },
            { text: yr, alignment: "center" },
          ],
          style: "tableHeader",
          margin: 0,
          alignment: "center",
        };
      }),
      { text: "মোট", style: "tableHeader", alignment: "center" },
    ];

    // Student photo
    const studentPhoto = student.profilePicture
      ? await toBase64FromUrl(student.profilePicture).catch(() => "")
      : "";

    const sutotalAmount = totalDueAmount + totalPaidAmount;

    const messageText =
      totalDueAmount > 0
        ? "সম্পূর্ণ বকেয়া টাকা পরিশোধ করার জন্য অফিস কর্তৃক বিশেষভাবে বলা হলো জাযাকাল্লাহ"
        : "সম্পূর্ণ পাওনা পরিশোধ করায় আপনাকে আন্তরিক মোবারকবাদ জাযাকাল্লাহ";

    const doc: any = {
      pageSize: "A4",
      pageMargins: [10, 0, 10, 0],
      content: [
        {
          stack: [
            {
              columns: [
                // 🔹 Logo (Left)
                {
                  width: 50,
                  alignment: "left",
                  image: images.logo,
                  fit: [50, 50],
                  margin: [0, 2, 0, 2],
                },

                // 🔹 Sign2 (Center - Flexible)
                {
                  width: "*",
                  alignment: "center",
                  image: images.sign2,
                  fit: [350, 60],
                },

                // 🔹 Student Photo (Right)
                {
                  width: 50,
                  alignment: "right",
                  stack: [
                    {
                      image: images.qrcode,
                      fit: [50, 50],
                      margin: [0, 2, 0, 2],
                    },
                  ],
                },
              ],
            },

            // 🔻 Bottom Border
            {
              canvas: [
                {
                  type: "line",
                  x1: 0,
                  y1: 0,
                  x2: 575,
                  y2: 0,
                  lineWidth: 2,
                  lineColor: "#444",
                },
              ],
              margin: [0, 5, 0, 5],
            },
          ],
        },
        {
          table: {
            widths: [145, "*", "*"],
            body: [
              [
                // ---------------- LEFT INFO ----------------
                {
                  table: {
                    widths: [40, "*"], // first column fixed width
                    body: [
                      [
                        { text: "আইডি", style: "info" },
                        { text: `: ${student.code}`, style: "info" },
                      ],
                      [
                        { text: "দাখেলা", style: "info" },
                        { text: ": 0", style: "info" },
                      ],
                      [
                        { text: "রশিদ নং", style: "info" },
                        { text: `: ${trx.roshidNo}`, style: "info" },
                      ],
                      [
                        { text: "ট্রানজেকশন", style: "info" },
                        {
                          text: `: ${trx.transactionId?.slice(0, 8) || "N/A"}`,
                          style: "info",
                        },
                      ],
                      [
                        { text: "শিক্ষাবর্ষ", style: "info" },
                        {
                          text: `: ${student.admissions?.[0]?.session?.name}`,
                          style: "info",
                        },
                      ],
                      [
                        { text: "মোবাইল নং", style: "info" },
                        { text: `: ${student.mobile1}`, style: "info" },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    paddingTop: () => 0, // কমাও
                    paddingBottom: () => 0, // কমাও
                  },
                  margin: [0, 0, 0, 0],
                },
                {
                  table: {
                    widths: [50, "*"], // label | value
                    body: [
                      [
                        { text: "শিক্ষার্থীর নাম", style: "info" },
                        { text: `: ${student.name}`, style: "info" },
                      ],
                      [
                        { text: "পিতার নাম", style: "info" },
                        { text: `: ${student.fatherName}`, style: "info" },
                      ],
                      [
                        { text: "বিভাগ", style: "info" },
                        {
                          text: `: ${student.admissions?.[0]?.residence}`,
                          style: "info",
                        },
                      ],
                      [
                        { text: "শ্রেণি", style: "info" },
                        { text: `: ${student.currentClass}`, style: "info" },
                      ],
                      [
                        { text: "ঠিকানা", style: "info" },
                        {
                          text: `: ${student.presentAddress.village}, ${student.presentAddress.postOffice}`,
                          style: "info",
                        },
                      ],
                      [
                        { text: "তারিখ", style: "info" },
                        {
                          text: `: ${
                            trx.createdAt ? formatDateBn(trx.createdAt) : "N/A"
                          } ইং`,
                          style: "info",
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    paddingTop: () => 0,
                    paddingBottom: () => 0,
                  },
                  margin: [0, 0, 0, 0],
                },
                // ---------------- PHOTO ----------------
                {
                  margin: [0, 10, 0, 10],
                  stack: [
                    {
                      canvas: [
                        {
                          type: "rect",
                          x: 0,
                          y: 0,
                          w: 190,
                          h: 50,
                          r: 12,
                          lineWidth: 1,
                          lineColor: "#444444",
                        },
                      ],
                    },
                    {
                      margin: [0, -50, 0, 0], // 🔥 উপরে তুলে আনা
                      stack: [
                        {
                          text: "বার্তা",
                          alignment: "center",
                          bold: true,
                          style: "info",
                          margin: [0, 5, 0, 5],
                        },
                        {
                          text: messageText,
                          alignment: "center",
                          bold: true,
                          style: "info",
                        },
                      ],
                    },
                  ],
                },
                // ---------------- RIGHT INFO ----------------
              ],
            ],
          },

          // ✅ OUTER BORDER + ALTERNATING ROW COLOR
          layout: {
            hLineWidth: (i: any, node: any) =>
              i === 0 || i === node.table.body.length ? 1 : 0, // top & bottom only
            vLineWidth: (i: any, node: any) =>
              i === 0 || i === node.table.widths.length ? 1 : 0, // left & right only
            hLineColor: () => "#444444",
            vLineColor: () => "#444444",
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 0,
            paddingBottom: () => 0,
            fillColor: (rowIndex: number, node: any, columnIndex: number) => {
              // শুধুমাত্র outer row-এ alternating color
              if (rowIndex % 2 === 0) return "#F7F9FA"; // হালকা grayish blue
              return "#FFFFFF"; // white
            },
          },

          margin: 0,
        },

        {
          table: {
            headerRows: 1,
            widths: [23, "*", ...allMonths.map(() => "auto"), "auto"],
            body: [header, ...ledgerRows],
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
          margin: [0, 2, 0, 0],
        },

        {
          columns: [
            {
              width: "*",
              table: {
                widths: ["*", 61, 35],
                body: [
                  [
                    {
                      text: "",
                      fillColor: COLORS.totalPaid,
                      margin: [6, 4, 2, 4],
                    },
                    {
                      text: "সর্বমোট",
                      alignment: "left",
                      fillColor: COLORS.totalPaid,
                      bold: true,
                      margin: [2, 4, 2, 4],
                      style: "info",
                    },
                    {
                      text: toBn(sutotalAmount),
                      alignment: "right",
                      fillColor: COLORS.totalPaid,
                      bold: true,
                      margin: [2, 4, 2, 4],
                      style: "info",
                    },
                  ],
                ],
              },

              layout: {
                hLineWidth: () => 1,

                // 👇 এখানে magic
                vLineWidth: (i: any, node: any) => {
                  // i = line index
                  // 0 = left border
                  // 1 = between col 1 & 2
                  // 2 = between col 2 & 3
                  // 3 = right border

                  if (i === 2) return 0; // 👈 এইটা remove করলাম
                  return 1;
                },

                hLineColor: () => "#888",
                vLineColor: () => "#888",
                paddingLeft: () => 0,
                paddingRight: () => 0,
                paddingTop: () => 0,
                paddingBottom: () => 0,
              },
            },
          ],
          margin: [0, 2, 0, 0],
        },

        {
          columns: [
            ...(trx.shortfallAmount > 0
              ? [
                  {
                    width: "*",
                    table: {
                      width: ["*"],
                      body: [
                        [
                          {
                            text: `গোরাবা তহবিল হতে আর্থিক সহায়তা প্রদান  ${toBn(trx.shortfallAmount)} টাকা`,
                            style: "info",
                            fillColor: COLORS.zebra2,
                            bold: true,
                            margin: [2, 2, 2, 2],
                          },
                        ],
                      ],
                    },
                    layout: {
                      hLineWidth: () => 1,
                      vLineWidth: () => 1,
                      hLineColor: () => "#888",
                      vLineColor: () => "#888",
                      paddingLeft: () => 2,
                      paddingRight: () => 2,
                      paddingTop: () => 2,
                      paddingBottom: () => 2,
                    },
                    margin: [0, 2, 0, 0],
                  },
                ]
              : [
                  {
                    width: "*",
                    text: "", // completely blank column
                  },
                ]),
            {
              width: "auto",
              table: {
                widths: ["*", 92], // ডান কলাম একটু বড় করলাম
                body: [
                  [
                    // 🔹 কথায় (আগের মতোই থাকবে)
                    {
                      text: `কথায় : ${numberToBanglaWords(totalPaidAmount)} টাকা মাত্র`,
                      fillColor: COLORS.zebra2,
                      bold: true,
                      margin: [2, 2, 2, 2],
                      style: "info",
                      alignment: "left",
                    },

                    // 🔹 মোট পরিশোধ → এখন ২ কলাম
                    {
                      table: {
                        widths: ["*", 30],
                        body: [
                          [
                            {
                              text: "মোট পরিশোধ ",
                              bold: true,
                              alignment: "left",
                              margin: [0, 0, 0, 0],
                              style: "info",
                            },
                            {
                              text: toBn(totalPaidAmount),
                              bold: true,
                              alignment: "right",
                              margin: [0, 0, 0, 0],
                              style: "info",
                            },
                          ],
                        ],
                      },
                      layout: "noBorders",
                      fillColor: COLORS.zebra2,
                      margin: 0,
                    },
                  ],

                  [
                    // 🔹 কথায় (আগের মতোই থাকবে)
                    {
                      text: `কথায় : ${numberToBanglaWords(totalDueAmount)} টাকা মাত্র`,
                      fillColor: COLORS.zebra2,
                      bold: true,
                      margin: [2, 2, 2, 2],
                      style: "info",
                      alignment: "left",
                    },

                    // 🔹 মোট বকেয়া → এখন ২ কলাম
                    {
                      table: {
                        widths: ["*", 30],
                        body: [
                          [
                            {
                              text: "মোট বকেয়া ",
                              bold: true,
                              alignment: "left",
                              margin: [0, 0, 0, 0],
                              style: "info",
                            },
                            {
                              text: toBn(totalDueAmount),
                              bold: true,
                              alignment: "right",
                              margin: [0, 0, 0, 0],
                              style: "info",
                            },
                          ],
                        ],
                      },
                      layout: "noBorders",
                      fillColor: COLORS.zebra2,
                      margin: 0,
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => "#888",
                vLineColor: () => "#888",
                paddingLeft: () => 2,
                paddingRight: () => 2,
                paddingTop: () => 2,
                paddingBottom: () => 2,
              },
              margin: [0, 2, 0, 0],
            },
          ],
        },

        {
          columns: [
            // Left Signature
            {
              stack: [
                { image: images.sign1, width: 60 },
                { text: "--------------------" },
                { text: "মুহতামীম সাহেবের স্বাক্ষর", style: "info" },
              ],
              width: "*",
              alignment: "left",
            },

            // Middle Links
            {
              width: 320,
              columns: [
                {
                  columns: [
                    // Web icon + link
                    { image: images.webicon, width: 12, alignment: "center" },
                    {
                      text: "https://islamidawahinstitute.com",
                      style: "info",
                      margin: [2, 0, 10, 0], // icon ar pashe halka gap
                      alignment: "left",
                    },

                    // FB icon + link
                    {
                      image: images.fbicon,
                      width: 12,
                      alignment: "center",
                      margin: [10, 0, 2, 0],
                    },
                    {
                      text: "Islamidawahinstitutetushbhander",
                      style: "info",
                      margin: [2, 0, 0, 0],
                      alignment: "left",
                    },
                  ],
                  columnGap: 0,
                  alignment: "center",
                  // verticalAlign add kora jabe
                },
              ],
              margin: [0, 30, 0, 0],
            },
            // Right Signature
            {
              stack: [
                { text: "", width: 60 },
                { text: "-----------------", margin: [0, 5, 2, 0] },
                {
                  text: "আদায়কারীর স্বাক্ষর",
                  style: "info",
                  margin: [0, 0, 5, 0],
                },
              ],
              width: "*",
              alignment: "right",
            },
          ],
          layout: "noBorders",
        },

        {
          table: {
            widths: ["*", "*", "*"], // column width adjust করা যায়
            body: [
              [
                {
                  text: `পেমেন্ট মাধ্যম: HAND ${trx.method}`,
                  alignment: "left",
                  fillColor: COLORS.totalPaid,
                  bold: true,
                  style: "info",
                  margin: [2, 0, 0, 0],
                },

                {
                  text: `এন্ট্রি তারিখ: ${formatBanglaDateTime(trx.createdAt)}`,
                  alignment: "center",
                  fillColor: COLORS.totalPaid,
                  bold: true,
                  margin: 0,
                  style: "info",
                },
                {
                  text: `গ্রহণকারী: ${trx.receivedBy}`,
                  alignment: "right",
                  fillColor: COLORS.totalPaid,
                  bold: true,
                  margin: [0, 0, 10, 0],
                  style: "info",
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: 0,
        },
      ],
      defaultStyle: { font: "SolaimanLipi", fontSize: 12 },
      styles: {
        title: { fontSize: 11, bold: true, margin: 0 },
        header: { fontSize: 10, bold: true, margin: 0 },
        subheader: { fontSize: 10, bold: true, margin: 0 },
        subtitle: { fontSize: 9, margin: 0 },
        info: { fontSize: 9, margin: 0 },
        tableHeader: { fontSize: 10, bold: true, fillColor: COLORS.zebra1 },
      },
    };

    const pdf = pdfMake.createPdf(doc);
    pdf.open();
  };

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex gap-2 max-w-xl mx-auto mt-5">
        <input
          className="border p-2 rounded flex-1"
          placeholder="শিক্ষার্থীর আইডি লিখে এন্টার প্রেস করুন"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchStudent()}
        />
        <Button onClick={searchStudent} disabled={loading}>
          Search
        </Button>
      </div>

      {student && (
        <div className="bg-white rounded-xl shadow-md mx-auto p-4 flex flex-col md:flex-row gap-6">
          {/* Left: Profile */}
          <div className="flex flex-col items-center md:items-start gap-2 min-w-[160px]">
            <div className="flex justify-center h-24">
              {student?.profilePicture ? (
                <div className="w-24 h-24 rounded-full border-4 border-blue-100 shadow overflow-hidden relative">
                  <Image
                    src={student.profilePicture}
                    alt="profile"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl">
                  👤
                </div>
              )}
            </div>

            <div className="bangla text-center md:text-left space-y-1 mt-2">
              <p className="text-lg font-semibold text-gray-800">
                {student.name}
              </p>
              <p className="text-sm text-gray-600">
                শ্রেণি: {student.currentClass}
              </p>
              <p className="text-sm text-gray-600">
                পিতার নাম: {student.fatherName}
              </p>
              <p className="text-xs text-gray-400">
                আইডি: ({student.code}) | ডাটা এন্ট্রি:{" "}
                {formatDateBn(student.createdAt)}
              </p>
              {payments.length > 0 && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-red-500 font-semibold">
                    মোট নির্বাচিত: {selectedTotalAmount} ৳
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-gray-200" />

          {/* Right: Admissions Table */}
          <div className="flex-1 overflow-x-auto">
            {student.admissions && student.admissions.length > 0 ? (
              <>
                <h3 className="bangla text-sm font-semibold text-gray-500 mb-2">
                  ভর্তির তথ্য
                </h3>
                <table className="w-full text-sm border-collapse bangla">
                  <thead>
                    <tr className="bg-blue-50 text-blue-700">
                      <th className="border border-blue-100 px-3 py-2 text-left">
                        শিক্ষাবর্ষ
                      </th>
                      <th className="border border-blue-100 px-3 py-2 text-left">
                        শ্রেনি
                      </th>
                      <th className="border border-blue-100 px-3 py-2 text-left">
                        ভর্তি ফি
                      </th>
                      <th className="border border-blue-100 px-3 py-2 text-left">
                        বোডিং ফি
                      </th>
                      <th className="border border-blue-100 px-3 py-2 text-left">
                        মাসিক বেতন
                      </th>
                      <th className="border border-blue-100 px-3 py-2 text-left">
                        ভর্তির তারিখ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.admissions.map((admission, index) => (
                      <tr
                        key={admission.id ?? index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {admission.session?.name ?? "—"}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {admission?.currentClass ?? "—"}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {admission?.admissionFee ?? "—"}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {admission?.boardingFee ?? "—"}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {admission?.mashikBetn ?? "—"}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-gray-600">
                          {admission.admissionDate
                            ? new Date(
                                admission.admissionDate,
                              ).toLocaleDateString("bn-BD")
                            : new Date(admission.createdAt).toLocaleDateString(
                                "bn-BD",
                              )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="bangla text-sm text-gray-400">
                কোনো ভর্তির তথ্য নেই।
              </p>
            )}
          </div>
        </div>
      )}
      {payments.length > 0 && (
        <Button onClick={payMultiCash} disabled={loading} className="">
          Pay Selected (Cash) <Printer className="ml-2 w-4 h-4" />
        </Button>
      )}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
        {payments.map((p) => (
          <Card key={p.id}>
            <CardContent className="space-y-2">
              <strong>
                {p.month} / {p.year}
              </strong>
              {p.items.map((i) => {
                const isSelected = selected[p.id]?.includes(i.id);

                return (
                  <div
                    key={i.id}
                    onClick={() => {
                      if (i.status !== "PAID") toggle(p.id, i.id);
                    }}
                    className={`flex justify-between items-center border p-2 cursor-pointer rounded
      ${isSelected ? "bg-green-50 border-green-500" : ""}
      ${i.status === "PAID" ? "opacity-60 cursor-not-allowed" : ""}
    `}
                  >
                    <div className="flex flex-col gap-1">
                      <h6 className="text-sm font-medium">
                        {i.feeCategory.name}
                      </h6>

                      <div className="flex items-center gap-1">
                        {i.status === "PAID" ? (
                          <span className="">{i.amount}৳</span>
                        ) : editingId === i.id ? (
                          // ✅ Edit mode
                          <>
                            <input
                              type="number"
                              className="w-20 border rounded px-1 py-0.5 text-sm"
                              value={editAmounts[i.id] ?? i.amount}
                              onChange={(e) =>
                                setEditAmounts((prev) => ({
                                  ...prev,
                                  [i.id]: Number(e.target.value),
                                }))
                              }
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="text-xs cursor-pointer ml-3"
                              variant="secondary"
                              disabled={savingId === i.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAmount(i.id);
                                setEditingId(null); // save এর পর edit mode বন্ধ
                              }}
                            >
                              {savingId === i.id ? "..." : "Save"}
                            </Button>
                            <button
                              className="text-xs text-red-600 cursor-pointer ml-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(null); // cancel
                              }}
                            >
                              close
                            </button>
                          </>
                        ) : (
                          // ✅ View mode — amount + edit button
                          <>
                            <span className="">
                              {editAmounts[i.id] ?? i.amount}৳
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="flex items-center gap-2 shrink-0">
                      {i.status === "PAID" ? (
                        <span className="text-green-600 font-semibold">
                          PAID
                        </span>
                      ) : (
                        <>
                          <button
                            className="text-blue-500 text-xs ml-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(i.id);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="text-red-600 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFeeItem(i.id, p.id);
                            }}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
              {p.status === "PENDING" && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2 flex"
                  onClick={() => deleteStudentPayment(p.id)}
                >
                  Delete
                </Button>
              )}
              <p className="text-sm mt- text-muted-foreground">
                {p?.session?.name} / {p.admission?.currentClass}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            ← Prev
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  page === p
                    ? "bg-primary text-white shadow-sm"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}

      <p className="text-lg bangla text-red-600 mt-15">
        সতর্কতা: রশিদ একবার কাটা হয়ে গেলে তা ডিলিট করা সম্ভব নয়। ভুল রশিদ কর্তন
        করিলে এর দায়ভার আপনার নিজের।
      </p>
    </div>
  );
}
