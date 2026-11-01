// ⚠️ client-only — "use client" component থেকেই কল করতে হবে।
// প্যাটার্ন হুবহু generateTransactionPDF (school fee receipt)-এর স্টাইল অনুসরণ করে —
// একই COLORS/layout/table কনভেনশন, numberToBanglaWords ও formatBanglaDateTime ব্যবহার করে।

import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import { numberToBanglaWords } from "@/types/numberToBanglaWords ";
// ⚠️ ASSUMPTION: formatBanglaDateTime এই util ফাইলেই আছে ধরে নিলাম (formatDateBn-এর পাশে)।
// আলাদা ফাইলে থাকলে import path মিলিয়ে নাও।
import { formatBanglaDateTime, formatDateBn } from "@/utils/dateBn";
// ⚠️ ASSUMPTION: numberToBanglaWords util path — তোমার actual path অনুযায়ী মিলিয়ে নাও।

const BANGLA_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
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

const toBn = (num: number) => num.toLocaleString("bn-BD");

const COLORS = {
  header: "#d9d9d9",
  zebra1: "#d9d9d9",
  zebra2: "#FFFFFF",
  totalPaid: "#d9d9d9",
};

/* ================= TYPES ================= */
interface IPaidInstallment {
  id: string;
  month: number;
  year: number;
  amount: number;
  principalAmount: number;
  profitAmount: number;
}

export interface IReceiptData {
  transactionId: string;
  roshidNo: string;
  totalPaid: number;
  method: string;
  createdAt: string;
  receivedBy?: string; // ⚠️ backend-এর receiveInstallmentPayment রেসপন্সে এটা যোগ করতে হবে (নিচে নোট দ্রষ্টব্য)
  paidInstallments: IPaidInstallment[];
  totalDue?: number;
}

export interface IReceiptBorrowerInfo {
  name: string;
  code: string;
  mobile1?: string | null;
  presentAddress?: {
    village?: string | null;
    postOffice?: string | null;
    thana?: string | null;
    district?: string | null;
    division?: string | null;
  } | null;
}

const formatAddress = (addr?: IReceiptBorrowerInfo["presentAddress"]) => {
  if (!addr) return "—";
  return (
    [addr.village, addr.postOffice, addr.thana, addr.district, addr.division]
      .filter(Boolean)
      .join(", ") || "—"
  );
};

const methodLabel = (m: string) => {
  const map: Record<string, string> = {
    CASH: "CASH",
    BKASH: "BKASH",
    NAGAD: "NAGAD",
    BANK: "BANK",
  };
  return map[m] || m;
};

/* ================= MAIN — রিসিট PDF ওপেন করা (তাৎক্ষণিক প্রিন্টের জন্য) ================= */
export const generatePaymentReceiptPdf = async (
  receipt: IReceiptData,
  borrower: IReceiptBorrowerInfo,
) => {
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

  const totalDueAmount = receipt.totalDue ?? 0;

  // ✅ বকেয়া আছে না নেই তার উপর ভিত্তি করে বার্তা (স্কুল রিসিটের messageText লজিকের মতোই)
  const messageText =
    totalDueAmount > 0
      ? "সম্পূর্ণ বকেয়া কিস্তি পরিশোধ করার জন্য বিশেষভাবে অনুরোধ করা হলো"
      : "সম্পূর্ণ কিস্তি পরিশোধ করায় আপনাকে আন্তরিক ধন্যবাদ";

  const sortedInstallments = [...receipt.paidInstallments].sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );

  const ledgerHeader = [
    { text: "ক্রমিক", style: "tableHeader", alignment: "center" },
    { text: "বিবরণ", style: "tableHeader", alignment: "center" },
    ...sortedInstallments.map((inst) => ({
      stack: [
        {
          text: BANGLA_MONTHS[inst.month - 1] || String(inst.month),
          alignment: "center",
        },
        { text: String(inst.year).slice(-2), alignment: "center" },
      ],
      style: "tableHeader",
      alignment: "center",
    })),
    { text: "মোট", style: "tableHeader", alignment: "center" },
  ];

  // ✅ ঋণে সাধারণত একটাই "খাত" (কিস্তি) থাকে, তাই একটাই row — প্রতিটা কলামে সেই মাসের পরিমাণ
  const ledgerDataRow = [
    {
      text: toBn(1),
      alignment: "center",
      fillColor: COLORS.zebra1,
      style: "info",
    },
    {
      text: "তিজারাহ পরিশোধিত কিস্তি",
      alignment: "left",
      fillColor: COLORS.zebra2,
      style: "info",
    },
    ...sortedInstallments.map((inst) => ({
      text: toBn(inst.amount),
      alignment: "right",
      fillColor: COLORS.zebra2,
      style: "info",
    })),
    {
      text: toBn(receipt.totalPaid),
      alignment: "right",
      bold: true,
      fillColor: COLORS.zebra2,
      style: "info",
    },
  ];

  const ledgerRows = [ledgerDataRow];

  const doc: any = {
    pageSize: "A4",
    pageMargins: [20, 20, 20, 20],
    content: [
      // ===== HEADER ===== (⚠️ তোমার প্রতিষ্ঠানের নাম/ঠিকানা বসাও)
      {
        stack: [
          {
            text: "আল-মদিনা তিজারাহ, পয়েন্ট", // Change to your org name
            alignment: "center",
            style: "title",
          },
          {
            text: "তুষভান্ডার, কালিগঞ্জ, লালমনিরহাট", // Address
            alignment: "center",
            style: "subtitle",
            margin: [0, 2, 0, 5],
          },
          {
            text: "টাকা প্রাপ্তির রশিদ",
            alignment: "center",
            style: "header",
            margin: [0, 0, 0, 8],
          },
          {
            canvas: [
              {
                type: "line",
                x1: 0,
                y1: 0,
                x2: 555,
                y2: 0,
                lineWidth: 2,
                lineColor: "#444",
              },
            ],
            margin: [0, 0, 0, 8],
          },
        ],
      },

      // ===== INFO TABLE (left: receipt/txn info | middle: borrower info | right: message box) =====
      {
        table: {
          widths: [140, "*", 190],
          body: [
            [
              // ---------------- LEFT — RECEIPT / TXN INFO ----------------
              {
                table: {
                  widths: [50, "*"],
                  body: [
                    [
                      { text: "রশিদ নং", style: "info" },
                      {
                        text: `: ${toBn(Number(receipt.roshidNo) || 0) || receipt.roshidNo}`,
                        style: "info",
                      },
                    ],
                    [
                      { text: "ট্রানজেকশন", style: "info" },
                      {
                        text: `: ${receipt.transactionId?.slice(0, 8) || "N/A"}`,
                        style: "info",
                      },
                    ],
                    [
                      { text: "পদ্ধতি", style: "info" },
                      {
                        text: `: ${methodLabel(receipt.method)}`,
                        style: "info",
                      },
                    ],
                    [
                      { text: "তারিখ", style: "info" },
                      {
                        text: `: ${formatDateBn(new Date(receipt.createdAt).toISOString().slice(0, 10))}`,
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

              // ---------------- MIDDLE — BORROWER INFO ----------------
              {
                table: {
                  widths: [55, "*"],
                  body: [
                    [
                      { text: "নাম", style: "info" },
                      { text: `: ${borrower.name}`, style: "info" },
                    ],
                    [
                      { text: "কোড", style: "info" },
                      { text: `: ${borrower.code}`, style: "info" },
                    ],
                    [
                      { text: "মোবাইল", style: "info" },
                      { text: `: ${borrower.mobile1 || "—"}`, style: "info" },
                    ],
                    [
                      { text: "ঠিকানা", style: "info" },
                      {
                        text: `: ${formatAddress(borrower.presentAddress)}`,
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

              // ---------------- RIGHT — MESSAGE BOX ----------------
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
                    margin: [0, -50, 0, 0],
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
            ],
          ],
        },
        layout: {
          hLineWidth: (i: any, node: any) =>
            i === 0 || i === node.table.body.length ? 1 : 0,
          vLineWidth: (i: any, node: any) =>
            i === 0 || i === node.table.widths.length ? 1 : 0,
          hLineColor: () => "#444444",
          vLineColor: () => "#444444",
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 4,
          paddingBottom: () => 4,
          fillColor: (rowIndex: number) =>
            rowIndex % 2 === 0 ? "#F7F9FA" : "#FFFFFF",
        },
        margin: [0, 0, 0, 0],
      },

      // ===== LEDGER TABLE (পরিশোধিত কিস্তির তালিকা — মাস কলাম হিসেবে বামে থেকে ডানে) =====
      {
        table: {
          headerRows: 1,
          widths: [30, "*", ...sortedInstallments.map(() => "auto"), 60],
          body: [ledgerHeader, ...ledgerRows],
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
        margin: [0, 8, 0, 0],
      },

      // ===== TOTAL ROW =====
      {
        table: {
          widths: ["*", 61, 100],
          body: [
            [
              { text: "", fillColor: COLORS.totalPaid, margin: [6, 4, 2, 4] },
              {
                text: "সর্বমোট",
                alignment: "left",
                fillColor: COLORS.totalPaid,
                bold: true,
                margin: [2, 4, 2, 4],
                style: "info",
              },
              {
                text: toBn(receipt.totalPaid),
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
          vLineWidth: (i: any) => (i === 2 ? 0 : 1),
          hLineColor: () => "#888",
          vLineColor: () => "#888",
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
        margin: [0, 2, 0, 0],
      },

      // ===== কথায় (words) + মোট পরিশোধ / মোট বকেয়া =====
      {
        table: {
          widths: ["*", 130],
          body: [
            [
              {
                text: `কথায় : ${numberToBanglaWords(receipt.totalPaid)} টাকা মাত্র`,
                fillColor: COLORS.zebra2,
                bold: true,
                margin: [2, 2, 2, 2],
                style: "info",
                alignment: "left",
              },
              {
                table: {
                  widths: ["*", 40],
                  body: [
                    [
                      {
                        text: "মোট পরিশোধ",
                        bold: true,
                        alignment: "left",
                        margin: 0,
                        style: "info",
                      },
                      {
                        text: toBn(receipt.totalPaid),
                        bold: true,
                        alignment: "right",
                        margin: 0,
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
            ...(receipt.totalDue !== undefined
              ? [
                  [
                    {
                      text: `কথায় : ${numberToBanglaWords(totalDueAmount)} টাকা মাত্র`,
                      fillColor: COLORS.zebra2,
                      bold: true,
                      margin: [2, 2, 2, 2],
                      style: "info",
                      alignment: "left",
                    },
                    {
                      table: {
                        widths: ["*", 40],
                        body: [
                          [
                            {
                              text: "মোট বকেয়া",
                              bold: true,
                              alignment: "left",
                              margin: 0,
                              style: "info",
                            },
                            {
                              text: toBn(totalDueAmount),
                              bold: true,
                              alignment: "right",
                              margin: 0,
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
                ]
              : []),
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

      // ===== SIGNATURES =====
      // ⚠️ তোমার প্রতিষ্ঠানের সাইনেচার ইমেজ থাকলে { image: images.sign1, width: 60 } এভাবে stack-এর শুরুতে যোগ করে দিতে পারো (student receipt-এর মতো)
      {
        columns: [
          {
            stack: [
              { text: "\n" },
              { text: "--------------------" },
              { text: "গ্রহীতার স্বাক্ষর", style: "info" },
            ],
            width: "*",
            alignment: "left",
          },
          {
            stack: [
              { text: "\n" },
              { text: "--------------------" },
              { text: "আদায়কারীর স্বাক্ষর", style: "info" },
            ],
            width: "*",
            alignment: "right",
          },
        ],
        layout: "noBorders",
        margin: [0, 25, 0, 0],
      },

      // ===== FOOTER INFO BAR =====
      {
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              {
                text: `পেমেন্ট মাধ্যম: ${methodLabel(receipt.method)}`,
                alignment: "left",
                fillColor: COLORS.totalPaid,
                bold: true,
                style: "info",
                margin: [2, 0, 0, 0],
              },
              {
                text: `এন্ট্রি তারিখ: ${formatBanglaDateTime(receipt.createdAt)}`,
                alignment: "center",
                fillColor: COLORS.totalPaid,
                bold: true,
                margin: 0,
                style: "info",
              },
              {
                text: `গ্রহণকারী: ${receipt.receivedBy || "—"}`,
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
        margin: [0, 10, 0, 0],
      },
    ],

    defaultStyle: { font: "SolaimanLipi", fontSize: 12 },
    styles: {
      title: { fontSize: 16, bold: true },
      subtitle: { fontSize: 10 },
      header: { fontSize: 13, bold: true },
      info: { fontSize: 9, margin: 0 },
      tableHeader: { fontSize: 10, bold: true, fillColor: COLORS.zebra1 },
    },
  };

  const pdf = pdfMake.createPdf(doc);
  pdf.open();
  pdf.download(`Loan-${borrower.name}.pdf`);
};
