"use client";

import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import api from "@/lib/axios";
import toBase64FromUrl from "@/lib/base4url";
import { numberToBanglaWords } from "@/types/numberToBanglaWords ";
import { formatBanglaDateTime, formatDateBn } from "@/utils/dateBn";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const months = [
  { value: 1, label: "জানুয়ারি" },
  { value: 2, label: "ফেব্রুয়ারি" },
  { value: 3, label: "মার্চ" },
  { value: 4, label: "এপ্রিল" },
  { value: 5, label: "মে" },
  { value: 6, label: "জুন" },
  { value: 7, label: "জুলাই" },
  { value: 8, label: "আগস্ট" },
  { value: 9, label: "সেপ্টেম্বর" },
  { value: 10, label: "অক্টোবর" },
  { value: 11, label: "নভেম্বর" },
  { value: 12, label: "ডিসেম্বর" },
];

export default function MonthlyDonationPage() {
  const [searchCode, setSearchCode] = useState("");
  const [donor, setDonor] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [startMonth, setStartMonth] = useState("");

  const [month, setMonth] = useState<number | "">("");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const donorTypeLabel: Record<string, string> = {
    ASHARAYE: "আশারায়ে মুবোশশারা সদস্য",
    BODORI: "বদরি ৩১৩ সদস্য",
    LIFETIME: "আজীবন দাতা সদস্য(অর্থ)",
    LIFETIME2: "আজীবন দাতা সদস্য(সামগ্রী)",
    MOSQUE: "দাওয়াহ্ মাদরাসা মসজিদ নির্মান",
  };
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
        toBase64FromUrl("/dbanner.jpg"),
        toBase64FromUrl("/web.jpg"),
        toBase64FromUrl("/facebook.jpg"),
        toBase64FromUrl("/qrcode.jpg"),
      ]);

      setImages({ logo, sign1, sign2, webicon, fbicon, qrcode });
    };

    loadImages();
  }, []);
  // ================= SEARCH =================
  const searchDonor = async () => {
    if (!searchCode.trim()) return toast.error("ডোনার কোড লিখুন");

    setLoading(true);
    try {
      const res = await api.get(`/api/v1/monthlydonations`, {
        params: { code: searchCode }, // ✅ Axios style
      });

      const d = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
      if (!d) throw new Error("ডোনার পাওয়া যায়নি");

      setDonor(d);
      setSelectedInvoices([]);
    } catch (err: any) {
      console.error("Search Donor Error:", err); // ✅ Console log for debugging
      toast.error(err.message || "ডোনার পাওয়া যায়নি");
      setDonor(null);
    } finally {
      setLoading(false);
    }
  };

  // ================= CREATE MONTHLY =================
  const createMonthlyDonor = async () => {
    if (!monthlyAmount || !startMonth) return toast.error("সব তথ্য পূরণ করুন");

    try {
      const res = await api.post(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/monthlydonations/monthly-donor`,
        {
          donorId: donor.id,
          monthlyAmount: Number(monthlyAmount),
          startMonth,
        },
      );

      if (!res) throw new Error("Something Went Wrong");

      toast.success("Monthly Donor তৈরি হয়েছে");
      searchDonor();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ================= RECEIVE MULTI PAYMENT =================
  const receiveMultiPayment = async () => {
    if (!selectedInvoices.length)
      return toast.error("কমপক্ষে ১টি invoice select করুন");

    try {
      const res = await api.post(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/monthlydonations/monthly-payment`,
        {
          invoiceIds: selectedInvoices,
          method: "CASH",
        },
      );

      toast.success("Payment সফল হয়েছে");

      searchDonor();
      setSelectedInvoices([]);

      // ✅ Ensure res.data.data exists
      generateTransactionPDF(res.data.data);
    } catch (err: any) {
      console.error("Multi-payment error:", err);
      toast.error(err.message || "Payment Failed");
    }
  };

  const generateTransactionPDF = async (trx: any) => {
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

    const shortMonthYear = (
      month?: string | number,
      year?: number | string,
    ) => {
      if (!month || !year) return "";
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let m = "";

      if (typeof month === "number") {
        m = monthNames[month - 1] ?? "N/A"; // 1 → Jan, 2 → Feb
      } else {
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
        m = map[month] ?? month.slice(0, 3);
      }

      const y = String(year).slice(-2);
      return `${m}/${y}`;
    };
    // All months
    const allMonths = Array.from(
      new Set([
        ...(trx.paidInvoices ?? []).map((p: any) =>
          shortMonthYear(p.month, p.year),
        ),
        ...(trx.duePayments ?? []).map((p: any) =>
          shortMonthYear(p.month, p.year),
        ),
      ]),
    ).sort((a, b) => {
      const [ma, ya] = a.split("/");
      const [mb, yb] = b.split("/");
      const yearDiff = Number(ya) - Number(yb);
      if (yearDiff !== 0) return yearDiff;
      return (MONTH_INDEX[ma] ?? 0) - (MONTH_INDEX[mb] ?? 0);
    });

    const ledgerMap: Record<
      string,
      { feeName: string; values: Record<string, number | "বকেয়া"> }
    > = {};

    // Paid
    (trx.paidInvoices ?? []).forEach((p: any) => {
      const monthKey = shortMonthYear(p.month, p.year);
      const feeName = "মাসিক অনুদান";

      if (!ledgerMap[feeName]) ledgerMap[feeName] = { feeName, values: {} };
      ledgerMap[feeName].values[monthKey] = p.amount ?? 0;
    });

    // Due
    (trx.duePayments ?? []).forEach((p: any) => {
      const monthKey = shortMonthYear(p.month, p.year);
      const feeName = "মাসিক অনুদান";

      if (!ledgerMap[feeName]) ledgerMap[feeName] = { feeName, values: {} };
      if (ledgerMap[feeName].values[monthKey] === undefined) {
        ledgerMap[feeName].values[monthKey] = "বকেয়া";
      }
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
          text: toBn(trx.totalPaid),
          alignment: "right",
          bold: true,
          fillColor: COLORS.zebra2,
          style: "info",
        },
      ];
    });

    // Header
    const header = [
      {
        text: "ক্রমিক",
        style: "info",
        alignment: "center",
        margin: [0, 7, 0, 0],
      },
      {
        text: "ফি এর বিবরণ",
        style: "info",
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
    const studentPhoto = donor.profilePicture
      ? await toBase64FromUrl(donor.profilePicture).catch(() => "")
      : "";

    const sutotalAmount = trx.totalPaid + trx.totalDue;

    const messageText =
      trx.totalDue > 0
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
                        { text: `: ${donor.code}`, style: "info" },
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
                        { text: "মোবাইল নং", style: "info" },
                        { text: `: ${donor.mobile1}`, style: "info" },
                      ],
                      [
                        { text: "মোবাইল নং", style: "info" },
                        { text: `: ${donor.mobile2}`, style: "info" },
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
                        { text: "দানকারীর নাম", style: "info" },
                        { text: `: ${donor.name}`, style: "info" },
                      ],
                      [
                        { text: "পিতার নাম", style: "info" },
                        { text: `: ${donor.fatherName}`, style: "info" },
                      ],

                      [
                        { text: "ঠিকানা", style: "info" },
                        {
                          text: `: ${donor.presentAddress.village}, ${donor.presentAddress.postOffice}`,
                          style: "info",
                        },
                      ],
                      [
                        { text: "দাতার ধরণ", style: "info" },
                        {
                          text: `: ${donorTypeLabel[donor.donorType] || ""}`,
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
            { text: "", width: "*" },
            {
              width: "auto",
              table: {
                widths: ["*", 92], // ডান কলাম একটু বড় করলাম
                body: [
                  [
                    // 🔹 কথায় (আগের মতোই থাকবে)
                    {
                      text: `কথায় : ${numberToBanglaWords(trx.totalPaid)} টাকা মাত্র`,
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
                              text: toBn(trx.totalPaid),
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
                      text: `কথায় : ${numberToBanglaWords(trx.totalDue)} টাকা মাত্র`,
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
                              text: toBn(trx.totalDue),
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

  // ================= DELETE INVOICE =================
  const deleteInvoice = async (invoiceId: string, invoiceStatus: string) => {
    if (invoiceStatus === "PAID" || invoiceStatus === "PARTIAL") {
      return toast.error("Paid invoice মুছে ফেলা যাবে না");
    }

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
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/monthlydonations/monthly-invoice/${invoiceId}`,
      );

      Swal.fire("Deleted!", "Invoice সফলভাবে মুছে ফেলা হয়েছে।", "success");
      searchDonor();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      toast.error(message);
    }
  };

  // ================= SUMMARY =================
  const invoices = donor?.monthlyProfiles?.[0]?.invoices || [];

  const total = invoices.reduce((a: number, b: any) => a + b.amount, 0);
  const paid = invoices.reduce((a: number, b: any) => a + b.paidAmount, 0);
  const due = total - paid;

  const statusColor = (status: string) => {
    if (status === "PAID") return "bg-primary";
    if (status === "PARTIAL") return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-center">
        📊 Monthly Donation Dashboard
      </h1>

      {/* SEARCH */}
      <div className="bg-white p-6 rounded shadow flex gap-4">
        <input
          type="text"
          placeholder="Donor Code"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchDonor()}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={searchDonor}
          className="bg-blue-600 text-white px-6 rounded"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {donor && (
        <>
          {/* DONOR INFO */}
          <div className=" w-full flex justify-between items-center gap-20">
            <div className=" w-full bg-gray-50 p-6 rounded shadow">
              <h2 className="font-semibold text-lg mb-2">
                {" "}
                দাতা সদস্য নাম: {donor.name}
              </h2>
              <p>আইডি নং: {donor.code}</p>
              <p>দাতার ধরণ: {donorTypeLabel[donor.donorType] || ""}</p>
              <p>
                মাসিক দানের পরিমাণ: {donor.monthlyProfiles[0].monthlyAmount}
              </p>
              <p>
                <strong>শুরুর তারিখ:</strong>{" "}
                {formatDateBn(donor.monthlyProfiles[0].startMonth)}
              </p>
            </div>

            {/* SUMMARY */}
            <div className=" w-full space-y-6 grid grid-cols-3 gap-5">
              <div className="bg-blue-100 p-6 rounded shadow text-center">
                <h3>Total</h3>
                <p className="text-xl font-bold">{total} ৳</p>
              </div>
              <div className="bg-secondary p-6 rounded shadow text-center">
                <h3>Paid</h3>
                <p className="text-xl font-bold">{paid} ৳</p>
              </div>
              <div className="bg-red-100 p-6 rounded shadow text-center">
                <h3>Due</h3>
                <p className="text-xl font-bold">{due} ৳</p>
              </div>
            </div>
          </div>

          {/* CREATE MONTHLY */}
          {!donor.monthlyProfiles?.length && (
            <div className="bg-white p-6 rounded shadow space-y-3">
              <h2 className="font-semibold">💰 Create Monthly Donor</h2>
              <input
                type="number"
                placeholder="Monthly Amount"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <input
                type="date"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <button
                onClick={createMonthlyDonor}
                className="bg-primary text-white px-4 py-2 rounded w-full"
              >
                Save
              </button>
            </div>
          )}

          {/* INVOICE TABLE */}
          {invoices.length > 0 && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="font-semibold mb-4">🧾 Invoice List</h2>

              <table className="w-full border text-center">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">Select</th>
                    <th className="p-2 border">Month</th>
                    <th className="p-2 border">Amount</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => {
                    const isPaid = inv.status.toLowerCase() === "paid";
                    return (
                      <tr
                        key={inv.id}
                        className={isPaid ? "bg-gray-100 text-gray-500" : ""}
                      >
                        <td className="border p-2">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(inv.id)}
                            disabled={isPaid} // ✅ paid হলে disabled
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedInvoices((prev) =>
                                checked
                                  ? [...prev, inv.id]
                                  : prev.filter((id) => id !== inv.id),
                              );
                            }}
                            className={isPaid ? "cursor-not-allowed" : ""}
                          />
                        </td>
                        <td className="border p-2">
                          {months.find((m) => m.value === inv.month)?.label}{" "}
                          {inv.year}
                        </td>
                        <td className="border p-2">{inv.amount}</td>
                        <td className="border p-2">
                          <span
                            className={`text-white px-2 py-1 rounded ${statusColor(
                              inv.status,
                            )}`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="border p-2">
                          <button
                            onClick={() => deleteInvoice(inv.id, inv.status)}
                            className="bg-gray-700 text-white px-2 py-1 rounded hover:bg-black"
                            disabled={isPaid} // paid হলে delete না করা যায়
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* MULTI-PAYMENT BUTTON */}
              <button
                onClick={() => receiveMultiPayment()}
                className="mt-4 bg-primary text-white px-4 py-2 rounded"
                disabled={selectedInvoices.length === 0} // যদি কিছু select না থাকে, button disable
              >
                Receive Payment for Selected
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
