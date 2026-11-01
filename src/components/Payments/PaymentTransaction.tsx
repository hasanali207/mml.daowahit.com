"use client";

import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import api from "@/lib/axios";
import { getPagination } from "@/lib/getPageNumber";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import { numberToBanglaWords } from "@/types/numberToBanglaWords ";
import { formatBanglaDateTime, formatDateBn } from "@/utils/dateBn";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function TransactionPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { info, loading: academicLoading, error } = useAcademicInfo();
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const pages = getPagination(page, totalPages);
  const [images, setImages] = useState({
    logo: "",
    sign1: "",
    sbanner: "",
    dbanner: "",
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

      const [logo, sign1, sbanner, dbanner, webicon, fbicon, qrcode] =
        await Promise.all([
          toBase64FromUrl("/logo1.jpg"),
          toBase64FromUrl("/sign1.png"),
          toBase64FromUrl("/sbanner.jpg"),
          toBase64FromUrl("/dbanner.jpg"),
          toBase64FromUrl("/web.jpg"),
          toBase64FromUrl("/facebook.jpg"),
          toBase64FromUrl("/qrcode.jpg"),
        ]);

      setImages({ logo, sign1, sbanner, dbanner, webicon, fbicon, qrcode });
    };

    loadImages();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async () => {
    try {
      const res = await api.get(
        `/api/v1/paymentreport/transaction/all/trans?page=${page}&limit=${limit}`,
      );
      const { data, meta } = res.data;
      setTransactions(data || []);
      setTotalPages(meta ? Math.ceil(meta.total / limit) : 1);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toBn = (num: number) => Number(num || 0).toLocaleString("bn-BD");
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("bn-BD");

  const getName = (t: any) => {
    if (t.source === "STUDENT") return t.student?.name ?? "-";
    if (t.source === "DONATION")
      return t.items?.[0]?.donationItem?.donation?.donorName ?? "-";
    if (t.source === "MONTHLY_DONATION")
      return t.items?.[0]?.monthlyInvoice?.donor?.donor?.name ?? "-";
    return "-";
  };

  const getCode = (t: any) => {
    if (t.source === "STUDENT") return t.student?.code ?? "-";
    return "-";
  };

  const getBadge = (source: string) => {
    if (source === "STUDENT")
      return (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
          ছাত্র
        </span>
      );
    if (source === "DONATION")
      return (
        <span className="px-2 py-1 text-xs bg-red-100 text-cyan-700 rounded">
          ডোনেশন
        </span>
      );
    return (
      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
        মাসিক ডোনেশন
      </span>
    );
  };

  // ===================== PDF GENERATION =======================
  const generateTransactionPDF = async (trx: any) => {
    console.log("monthly Donation", trx);
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

    const toBn = (num: number) => Number(num || 0).toLocaleString("bn-BD");

    const COLORS = {
      zebra1: "#d9d9d9",
      zebra2: "#FFFFFF",
    };

    const student = trx.student ?? {};

    const subtotalsSection = (trx: any) => ({
      columns: [
        {
          width: "*",
          table: {
            widths: ["*", 61, 35],
            body: [
              [
                {
                  text: "",
                  fillColor: COLORS.zebra1,
                  margin: [6, 4, 2, 4],
                },
                {
                  text: "সর্বমোট",
                  alignment: "left",
                  fillColor: COLORS.zebra1,
                  bold: true,
                  margin: [2, 4, 2, 4],
                  style: "info",
                },
                {
                  text: toBn(trx.totalAmount),
                  alignment: "right",
                  fillColor: COLORS.zebra1,
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
    });
    const subtotalsSectionwithWord = (trx: any) => ({
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
                  text: `কথায় : ${numberToBanglaWords(trx.totalAmount)} টাকা মাত্র`,
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
                          text: toBn(trx.totalAmount),
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
    });

    const signartureRow = {
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
    };

    const lastRow = (trx: any) => ({
      table: {
        widths: ["*", "*", "*"], // column width adjust করা যায়
        body: [
          [
            {
              text: `পেমেন্ট মাধ্যম: HAND ${trx.method}`,
              alignment: "left",
              fillColor: COLORS.zebra1,
              bold: true,
              style: "info",
              margin: [2, 0, 0, 0],
            },

            {
              text: `এন্ট্রি তারিখ: ${formatBanglaDateTime(trx.createdAt)}`,
              alignment: "center",
              fillColor: COLORS.zebra1,
              bold: true,
              margin: 0,
              style: "info",
            },
            {
              text: `গ্রহণকারী: ${trx.receivedBy}`,
              alignment: "right",
              fillColor: COLORS.zebra1,
              bold: true,
              margin: [0, 0, 10, 0],
              style: "info",
            },
          ],
        ],
      },
      layout: "noBorders",
      margin: 0,
    });

    // ==================== STUDENT PDF ====================
    if (trx.source === "STUDENT") {
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

        const m = month.slice(0, 3);
        const y = String(year).slice(-2);

        return `${m}/${y}`;
      };

      // ---------- Collect Months ----------

      const allMonths = Array.from(
        new Set(
          (trx.items ?? []).map((i: any) =>
            shortMonthYear(i.payment?.month, i.payment?.year),
          ),
        ),
      ).sort((a: any, b: any) => {
        const [ma, ya] = a.split("/");
        const [mb, yb] = b.split("/");

        if (ya !== yb) return Number(ya) - Number(yb);
        return MONTH_INDEX[ma] - MONTH_INDEX[mb];
      });

      // ---------- Collect Fee Categories ----------

      const feeNames = Array.from(
        new Set(
          (trx.items ?? []).map(
            (i: any) => i.paymentItem?.feeCategory?.name ?? "Unknown Fee",
          ),
        ),
      );

      // ---------- Generate Ledger Rows ----------

      const ledgerRows = feeNames.map((feeName, index) => {
        let total = 0;

        const monthCells = allMonths.map((month) => {
          const item = (trx.items ?? []).find((i: any) => {
            const m = shortMonthYear(i.payment?.month, i.payment?.year);
            const f = i.paymentItem?.feeCategory?.name ?? "Unknown Fee";
            return m === month && f === feeName;
          });

          if (!item) {
            return { text: "—", alignment: "center" };
          }

          const amount = item.paymentItem?.amount ?? 0;
          total += amount;

          return { text: toBn(amount), alignment: "center", style: "info" };
        });

        return [
          { text: String(index + 1), alignment: "center", style: "info" },
          { text: feeName, style: "info" },
          ...monthCells,
          { text: toBn(total), alignment: "center", style: "info" },
        ];
      });

      // ---------- Header ----------

      const header = [
        { text: "ক্রমিক", style: "tableHeader", alignment: "center" },
        { text: "ফি এর বিবরণ", style: "tableHeader", alignment: "center" },

        ...allMonths.map((m: any) => {
          const [mo, yr] = m.split("/");

          return {
            stack: [
              { text: mo, alignment: "center", style: "info" },
              { text: yr, alignment: "center", style: "info" },
            ],
            style: "tableHeader",
          };
        }),

        { text: "মোট", style: "tableHeader", alignment: "center" },
      ];
      const doc: any = {
        pageSize: "A4",
        pageMargins: [10, 5, 10, 0],
        content: [
          // Header
          {
            columns: [
              { width: 50, image: images.logo, fit: [50, 50] },
              {
                width: "*",
                alignment: "center",
                image: images.sbanner,
                fit: [350, 60],
              },
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
            margin: [0, 2, 0, 2],
          },

          // Student Info
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
                          {
                            text: `: ${student.admissions?.[0]?.currentClass}`,
                            style: "info",
                          },
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
                              trx.createdAt
                                ? formatDateBn(trx.createdAt)
                                : "N/A"
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
                            text: "পাওনা পরিশোধ করায় আপনাকে আন্তরিক মোবারকবাদ জাযাকাল্লাহ",
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
          subtotalsSection(trx),
          subtotalsSectionwithWord(trx),
          signartureRow,
          lastRow(trx),
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

      pdfMake.createPdf(doc).open();
    }

    // ==================== DONATION PDF ====================
    if (trx.source === "DONATION") {
      const items = trx.items ?? [];
      const donation = trx.items?.[0]?.donationItem?.donation;
      const bodyRows = items.map((i: any, idx: number) => [
        {
          text: toBn(idx + 1),
          alignment: "center",
          style: "info",
          fillColor: COLORS.zebra1,
        },
        { text: i.donationItem?.title ?? "ডোনেশন", style: "info" },
        { text: toBn(i.amount), alignment: "right", style: "info" },
      ]);

      const doc: any = {
        pageSize: "A4",
        pageMargins: [10, 5, 10, 0],
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
                    image: images.dbanner,
                    fit: [350, 60],
                  },

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
                    lineWidth: 2.2,
                    lineColor: "#444",
                  },
                ],
                margin: [0, 5, 0, 3],
              },
            ],
          },

          {
            table: {
              widths: [160, "*", "*"],
              body: [
                [
                  // ---------------- LEFT INFO ----------------
                  {
                    table: {
                      widths: [50, "*"], // first column fixed width
                      body: [
                        [
                          { text: "দানকারীর নাম", style: "info" },
                          { text: `: ${donation.donorName}`, style: "info" },
                        ],
                        [
                          { text: "ঠিকানা", style: "info" },
                          { text: `: ${donation.address}`, style: "info" },
                        ],
                        [
                          { text: "মোবাইল", style: "info" },
                          { text: `: ${donation.mobile}`, style: "info" },
                        ],
                      ],
                    },
                    layout: {
                      hLineWidth: () => 0,
                      vLineWidth: () => 0,
                      paddingTop: () => 0, // কমাও
                      paddingBottom: () => 0, // কমাও
                    },
                    margin: [0, 10, 0, 10],
                  },
                  {
                    table: {
                      widths: [50, "*"], // label | value
                      body: [
                        [
                          { text: "রশিদ নং", style: "info" },
                          { text: `: ${trx.roshidNo}`, style: "info" },
                        ],
                        [
                          { text: "ট্রানজেকশন নং", style: "info" },
                          {
                            text: `: ${trx?.transactionId || "N/A"}`,
                            style: "info",
                          },
                        ],

                        [
                          { text: "তারিখ", style: "info" },
                          {
                            text: `: ${
                              trx.createdAt
                                ? formatDateBn(trx.createdAt)
                                : "N/A"
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
                    margin: [0, 10, 0, 10],
                  },
                  // ---------------- PHOTO ----------------
                  {
                    margin: [0, 7, 0, 10],
                    stack: [
                      {
                        canvas: [
                          {
                            type: "rect",
                            x: 0,
                            y: 0,
                            w: 170,
                            h: 40,
                            r: 12,
                            lineWidth: 1,
                            lineColor: "#444444",
                          },
                        ],
                      },
                      {
                        margin: [0, -40, 0, 0], // 🔥 উপরে তুলে আনা
                        stack: [
                          {
                            text: "বার্তা",
                            alignment: "center",
                            bold: true,
                            style: "info",
                            margin: [0, 5, 0, 5],
                          },
                          {
                            text: "আপনাকে আন্তরিক মোবারকবাদ জাযাকাল্লাহ",
                            alignment: "center",
                            bold: true,
                            color: "green",
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

            margin: [0, 0, 0, 2],
          },
          {
            table: {
              headerRows: 1,
              widths: [30, "*", 45],
              body: [
                [
                  {
                    text: "ক্রমিক",
                    style: "info",
                    alignment: "center",
                    fillColor: COLORS.zebra1,
                  },
                  {
                    text: "দান এর বিবরণ",
                    style: "info",
                    alignment: "center",
                    fillColor: COLORS.zebra1,
                  },
                  {
                    text: "পরিমাণ",
                    style: "info",
                    alignment: "center",
                    fillColor: COLORS.zebra1,
                  },
                ],
                ...bodyRows,
              ],
            },
          },
          subtotalsSection(trx),
          subtotalsSectionwithWord(trx),
          signartureRow,
          lastRow(trx),
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

      pdfMake.createPdf(doc).open();
      return;
    }

    // ==================== MONTHLY DONATION PDF ====================
    if (trx.source === "MONTHLY_DONATION") {
      const MONTHS = [
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

      const shortMonthYear = (month?: number, year?: number | string) => {
        if (!month || !year) return "";
        const m = MONTHS[month - 1];
        const y = String(year).slice(-2);
        return `${m}/${y}`;
      };

      // -------- All Months --------

      const allMonths = Array.from(
        new Set(
          (trx.items ?? []).map((i: any) =>
            shortMonthYear(i.monthlyInvoice?.month, i.monthlyInvoice?.year),
          ),
        ),
      ).sort();

      // -------- Ledger Row --------

      let total = 0;

      const monthCells = allMonths.map((month) => {
        const item = (trx.items ?? []).find(
          (i: any) =>
            shortMonthYear(i.monthlyInvoice?.month, i.monthlyInvoice?.year) ===
            month,
        );

        const amount = item?.monthlyInvoice?.amount ?? 0;

        total += amount;

        return {
          text: toBn(amount),
          alignment: "center",
          style: "info",
        };
      });

      const ledgerRows = [
        [
          { text: "1", alignment: "center", style: "info" },
          { text: "মাসিক/বাৎসরিক দাতা সদস্য অনুদান", style: "info" },
          ...monthCells,
          { text: toBn(total), alignment: "center", style: "info" },
        ],
      ];

      // -------- Header --------

      const header = [
        { text: "ক্রমিক", style: "tableHeader", alignment: "center" },
        { text: "বিবরণ", style: "tableHeader", alignment: "center" },

        ...allMonths.map((m: any) => {
          const [mo, yr] = m.split("/");
          return {
            stack: [
              { text: mo, alignment: "center", style: "info" },
              { text: yr, alignment: "center", style: "info" },
            ],
            style: "tableHeader",
          };
        }),

        { text: "মোট", style: "tableHeader", alignment: "center" },
      ];
      const invoice = trx.items?.[0]?.monthlyInvoice ?? {};
      const doc: any = {
        pageSize: "A4",
        pageMargins: [10, 5, 10, 0],
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
                    image: images.dbanner,
                    fit: [350, 60],
                  },

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
                    lineWidth: 2.2,
                    lineColor: "#444",
                  },
                ],
                margin: [0, 5, 0, 3],
              },
            ],
          },
          {
            table: {
              widths: [160, "*", "*"],
              body: [
                [
                  // ---------------- LEFT INFO ----------------
                  {
                    table: {
                      widths: [50, "*"], // first column fixed width
                      body: [
                        [
                          { text: "দানকারীর নাম", style: "info" },
                          {
                            text: `: ${invoice.donor.donor.name}`,
                            style: "info",
                          },
                        ],
                        [
                          { text: "ঠিকানা", style: "info" },
                          {
                            text: `: ${invoice.donor.donor.address}`,
                            style: "info",
                          },
                        ],
                        [
                          { text: "মোবাইল", style: "info" },
                          {
                            text: `: ${invoice.donor.donor.mobile1}`,
                            style: "info",
                          },
                        ],
                        [
                          { text: "মোবাইল", style: "info" },
                          {
                            text: `: ${invoice.donor.donor.mobile2}`,
                            style: "info",
                          },
                        ],
                      ],
                    },
                    layout: {
                      hLineWidth: () => 0,
                      vLineWidth: () => 0,
                      paddingTop: () => 0, // কমাও
                      paddingBottom: () => 0, // কমাও
                    },
                    margin: [0, 10, 0, 10],
                  },
                  {
                    table: {
                      widths: [50, "*"], // label | value
                      body: [
                        [
                          { text: "রশিদ নং", style: "info" },
                          { text: `: ${trx.roshidNo}`, style: "info" },
                        ],
                        [
                          { text: "ট্রানজেকশন নং", style: "info" },
                          {
                            text: `: ${trx?.transactionId || "N/A"}`,
                            style: "info",
                          },
                        ],
                        [
                          { text: "দাতা ধরন", style: "info" },
                          {
                            text: ": ৩১৩ বদরের সদস্য",
                            style: "info",
                          },
                        ],
                        [
                          { text: "তারিখ", style: "info" },
                          {
                            text: `: ${
                              trx.createdAt
                                ? formatDateBn(trx.createdAt)
                                : "N/A"
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
                    margin: [0, 10, 0, 10],
                  },
                  // ---------------- PHOTO ----------------
                  {
                    margin: [0, 7, 0, 10],
                    stack: [
                      {
                        canvas: [
                          {
                            type: "rect",
                            x: 0,
                            y: 0,
                            w: 170,
                            h: 40,
                            r: 12,
                            lineWidth: 1,
                            lineColor: "#444444",
                          },
                        ],
                      },
                      {
                        margin: [0, -40, 0, 0], // 🔥 উপরে তুলে আনা
                        stack: [
                          {
                            text: "বার্তা",
                            alignment: "center",
                            bold: true,
                            style: "info",
                            margin: [0, 5, 0, 5],
                          },
                          {
                            text: "আপনাকে আন্তরিক মোবারকবাদ জাযাকাল্লাহ",
                            alignment: "center",
                            bold: true,
                            color: "green",
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

            margin: [0, 0, 0, 2],
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
          },
          subtotalsSection(trx),
          subtotalsSectionwithWord(trx),
          signartureRow,
          lastRow(trx),
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

      pdfMake.createPdf(doc).open();
      return;
    }
  };

  if (loading)
    return <div className="p-6 text-center text-gray-500">লোড হচ্ছে...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">সকল লেনদেন তালিকা</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">ক্রমিক</th>
              <th className="border p-2">ধরণ</th>
              <th className="border p-2 text-left">নাম</th>
              <th className="border p-2 text-left">কোড</th>
              <th className="border p-2 text-right">পরিমাণ</th>
              <th className="border p-2">গ্রহণকারী</th>
              <th className="border p-2">তারিখ</th>
              <th className="border p-2">রশিদ</th>
              <th className="border p-2 text-center">অ্যাকশন</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t, index) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="border p-2">{(page - 1) * limit + index + 1}</td>
                <td className="border p-2 text-center">{getBadge(t.source)}</td>
                <td className="border p-2 font-medium">{getName(t)}</td>
                <td className="border p-2">{getCode(t)}</td>
                <td className="border p-2 text-right font-semibold">
                  {toBn(t.totalAmount)} ৳
                </td>
                <td className="border p-2">{t.receivedBy}</td>
                <td className="border p-2">{formatDate(t.createdAt)}</td>
                <td className="border p-2">{t.roshidNo}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => generateTransactionPDF(t)}
                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center p-4 text-gray-500">
                  কোন লেনদেন পাওয়া যায়নি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ArrowLeft /> Prev
          </button>

          <div className="flex items-center gap-1">
            {pages.map((item, index) =>
              item === "..." ? (
                <span
                  key={`dots-${index}`}
                  className="w-9 h-9 flex items-center justify-center text-gray-500"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    page === item
                      ? "bg-green-600 text-white shadow-sm"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Next <ArrowRight />
          </button>
        </div>
      )}
    </div>
  );
}
