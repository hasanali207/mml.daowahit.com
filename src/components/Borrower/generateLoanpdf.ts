// ⚠️ এই ফাইল client-only (pdfmake ব্রাউজারে চলে) — "use client" component থেকেই কল করতে হবে।
// প্যাটার্ন হুবহু AccountReports.tsx-এর downloadPdf ফাংশনের মতো রাখা হয়েছে —
// একই SolaimanLipi সেটআপ, একই org-header স্টাইল, একই সহজ (কোনো custom layout ছাড়া) টেবিল স্ট্রাকচার।

import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import { formatDateBn } from "@/utils/dateBn";

/* ================= TYPES (backend getSingleLoan response অনুযায়ী) ================= */
interface IAddressDetail {
  division?: string | null;
  district?: string | null;
  thana?: string | null;
  postOffice?: string | null;
  village?: string | null;
}

interface IGuarantorDetail {
  id: string;
  name: string;
  fatherName?: string | null;
  mobile1?: string | null;
  mobile2?: string | null;
  nid?: string | null;
  relation?: string | null;
  presentAddress?: IAddressDetail | null;
}

interface IBorrowerDetail {
  id: string;
  code: string;
  name: string;
  fatherName?: string | null;
  motherName?: string | null;
  mobile1?: string | null;
  mobile2?: string | null;
  nid?: string | null;
  presentAddress?: IAddressDetail | null;
  permanentAddress?: IAddressDetail | null;
  guarantors?: IGuarantorDetail[]; // borrower-এর অধীনে থাকা সব guarantor
}

interface IProductDetail {
  name: string;
  details?: string | null;
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
}

interface IInstallmentDetail {
  installmentNo: number;
  month: number;
  year: number;
  amount: number;
  status: "PAID" | "UNPAID" | "PARTIAL";
  paidAmount: number;
}

export interface ILoanPdfData {
  id: string;
  principalAmount: number;
  profitRate: number;
  profitAmount: number;
  totalPayableAmount: number;
  monthlyInstallment: number;
  lastInstallmentAmount: number;
  totalInstallments: number;
  discountAmount?: number | null;
  startMonth: string;
  isActive: boolean;
  borrower: IBorrowerDetail;
  guarantors?: IGuarantorDetail[]; // শুধু এই লোনের guarantor
  products?: IProductDetail[];
  installments: IInstallmentDetail[];
}

/* ================= HELPERS ================= */
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

const BN_DIGITS: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

const toBnNumber = (n: number | string) =>
  String(n).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

const formatAddress = (addr?: IAddressDetail | null) => {
  if (!addr) return "—";
  return (
    [addr.village, addr.postOffice, addr.thana, addr.district, addr.division]
      .filter(Boolean)
      .join(", ") || "—"
  );
};

const money = (n?: number | null) =>
  `৳ ${toBnNumber((n ?? 0).toLocaleString("en-BD"))}`;

/* ================= IMAGE HELPERS (স্টুডেন্ট ফটো প্যাটার্নের মতোই) ================= */
const toBase64FromUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const mime = blob.type || "image/jpeg";
      resolve(`data:${mime};base64,${base64.split(",")[1]}`);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// ✅ ছবি থাকলে সেটা দেখাবে, না থাকলে ফাঁকা বর্ডার-বক্স (placeholder) — স্টুডেন্ট ফটোর মতোই প্যাটার্ন
const buildProductImageNode = (base64: string | null, label: string) => {
  const IMG_SIZE = 100;

  return {
    width: "*",
    stack: [
      {
        text: label,
        alignment: "center",
        fontSize: 9,
        margin: [0, 0, 0, 4],
      },
      base64
        ? {
            image: base64,
            width: IMG_SIZE,
            height: IMG_SIZE,
            fit: [IMG_SIZE, IMG_SIZE],
            border: [true, true, true, true],
            alignment: "center",
          }
        : {
            canvas: [
              {
                type: "rect",
                x: 0,
                y: 0,
                w: IMG_SIZE,
                h: IMG_SIZE,
                r: 6,
                lineWidth: 1,
                lineColor: "#888",
              },
            ],
            alignment: "center",
          },
    ],
  };
};

/* ================= MAIN — PDF তৈরি ও ডাউনলোড ================= */
export const generateLoanPdf = async (loan: ILoanPdfData) => {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfMake = pdfMakeModule.default;

  pdfMake.vfs = { "SolaimanLipi.ttf": SolaimanLipiBase64 };
  pdfMake.fonts = {
    SolaimanLipi: {
      normal: "SolaimanLipi.ttf",
      bold: "SolaimanLipi.ttf",
    },
  };

  const borrower = loan.borrower;
  const product = loan.products?.[0];

  // ✅ প্রোডাক্টের ৩টা ছবি (থাকলে) base64-এ কনভার্ট করা — একটা fail করলেও বাকিগুলো যেন আটকে না যায়
  const [image1Base64, image2Base64, image3Base64] = await Promise.all([
    product?.image1
      ? toBase64FromUrl(product.image1).catch(() => null)
      : Promise.resolve(null),
    product?.image2
      ? toBase64FromUrl(product.image2).catch(() => null)
      : Promise.resolve(null),
    product?.image3
      ? toBase64FromUrl(product.image3).catch(() => null)
      : Promise.resolve(null),
  ]);

  const printDate = formatDateBn(new Date().toISOString().slice(0, 10));
  const startMonthLabel = formatDateBn(
    new Date(loan.startMonth).toISOString().slice(0, 10),
  );

  /* ================= BORROWER INFO TABLE ================= */
  const borrowerInfoBody = [
    ["তথ্য", "বিবরণ"],
    ["নাম", borrower.name || "—"],
    ["কোড", borrower.code || "—"],
    ["পিতার নাম", borrower.fatherName || "—"],
    ["মাতার নাম", borrower.motherName || "—"],
    ["মোবাইল ১", borrower.mobile1 || "—"],
    ["মোবাইল ২", borrower.mobile2 || "—"],
    ["NID", borrower.nid || "—"],
    ["বর্তমান ঠিকানা", formatAddress(borrower.presentAddress)],
    ["স্থায়ী ঠিকানা", formatAddress(borrower.permanentAddress)],
  ];

  /* ================= LOAN INFO TABLE ================= */
  const loanInfoBody = [
    ["তথ্য", "বিবরণ"],
    ["আসল পরিমাণ", money(loan.principalAmount)],
    ["ছাড় (Discount)", money(loan.discountAmount)],
    ["মোট পরিশোধযোগ্য", money(loan.totalPayableAmount)],
    ["মাসিক কিস্তি", money(loan.monthlyInstallment)],
    ["শেষ কিস্তি", money(loan.lastInstallmentAmount)],
    ["মোট কিস্তি সংখ্যা", toBnNumber(loan.totalInstallments)],
    ["শুরুর মাস", startMonthLabel],
    ["অবস্থা", loan.isActive ? "সক্রিয়" : "বন্ধ"],
  ];

  if (product) {
    loanInfoBody.push(["পণ্যের নাম", product.name]);
    if (product.details) {
      loanInfoBody.push(["পণ্যের বিবরণ", product.details]);
    }
  }

  /* ================= GUARANTOR TABLE BUILDER ================= */
  const buildGuarantorBody = (guarantors?: IGuarantorDetail[]) => {
    if (!guarantors || guarantors.length === 0) return null;

    return [
      ["নাম", "পিতার নাম", "মোবাইল", "সম্পর্ক", "ঠিকানা"],
      ...guarantors.map((g) => [
        g.name || "—",
        g.fatherName || "—",
        g.mobile1 || "—",
        g.relation || "—",
        formatAddress(g.presentAddress) || "—",
      ]),
    ];
  };

  const loanGuarantorBody = buildGuarantorBody(loan.guarantors);

  /* ================= INSTALLMENT TABLE (স্বাক্ষর কলাম সহ) ================= */
  const statusLabel = (s: IInstallmentDetail["status"]) =>
    s === "PAID" ? "পরিশোধিত" : s === "PARTIAL" ? "আংশিক" : "বাকি";

  const installmentBody = [
    ["ক্রম", "মাস", "বছর", "কিস্তির পরিমাণ", "স্ট্যাটাস", "স্বাক্ষর"],
    ...loan.installments.map((inst) => [
      toBnNumber(inst.installmentNo),
      BANGLA_MONTHS[inst.month - 1] || String(inst.month),
      toBnNumber(inst.year),
      money(inst.amount),
      statusLabel(inst.status),
      "\n\n", // ✅ প্রতি মাসে ম্যানুয়ালি কিস্তি সংগ্রহের সময় এই ঘরে স্বাক্ষর নেওয়া হবে — তাই খালি, শুধু height তৈরির জন্য ব্ল্যাংক লাইন
    ]),
  ];

  const docDefinition: any = {
    content: [
      // ===== HEADER ===== (⚠️ তোমার প্রতিষ্ঠানের নাম/ঠিকানা বসাও)
      {
        text: "আল-মদিনা তিজারাহ, পয়েন্ট", // Change to your org name
        style: "orgName",
        alignment: "center",
      },
      {
        text: "তুষভান্ডার, কালিগঞ্জ, লালমনিরহাট", // Address
        style: "orgAddress",
        alignment: "center",
        margin: [0, 0, 0, 10],
      },
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
        margin: [0, 0, 0, 10],
      },

      // ===== TITLE + PRINT DATE =====
      {
        text: "ঋণ হিসাব বিবরণী",
        style: "header",
        alignment: "center",
        margin: [0, 0, 0, 5],
      },
      {
        text: `প্রিন্টের তারিখ: ${printDate}`,
        alignment: "right",
        margin: [0, 0, 0, 10],
      },

      // ===== BORROWER INFO =====
      { text: "ঋণগ্রহীতার তথ্য", style: "subHeader" },
      {
        table: { widths: ["*", "*"], body: borrowerInfoBody },
        margin: [0, 5, 0, 15],
      },

      // ===== BORROWER'S GUARANTORS =====
      { text: "ঋণগ্রহীতার জামিনদার", style: "subHeader" },
      loanGuarantorBody
        ? {
            table: {
              widths: ["*", "*", "*", "*", "*"],
              body: loanGuarantorBody,
            },
            margin: [0, 5, 0, 15],
          }
        : { text: "কোনো জামিনদার যোগ করা হয়নি", margin: [0, 5, 0, 15] },

      // ===== LOAN INFO =====
      { text: "ঋণের তথ্য", style: "subHeader" },
      {
        table: { widths: ["*", "*"], body: loanInfoBody },
        margin: [0, 5, 0, 15],
      },

      // ===== PRODUCT IMAGES =====
      { text: "পণ্যের ছবি", style: "subHeader" },
      {
        columns: [
          buildProductImageNode(image1Base64, "টাকা প্রদানের ছবি"),
          buildProductImageNode(image2Base64, "পণ্য ক্রয়ের ছবি"),
          buildProductImageNode(image3Base64, "পণ্য বিতরণের ছবি"),
        ],
        columnGap: 10,
        margin: [0, 5, 0, 15],
      },

      // ===== INSTALLMENT SCHEDULE =====
      { text: "মাসিক কিস্তি বিবরণী", style: "subHeader" },
      {
        table: {
          widths: ["auto", "*", "auto", "auto", "auto", "*"],
          body: installmentBody,
        },
        margin: [0, 5, 0, 10],
      },

      {
        text: "* প্রতি মাসে কিস্তি সংগ্রহের সময় সংশ্লিষ্ট ঘরে গ্রাহকের স্বাক্ষর নেওয়া বাধ্যতামূলক।",
        fontSize: 9,
        margin: [0, 5, 0, 0],
      },
    ],

    defaultStyle: { font: "SolaimanLipi" },
    styles: {
      orgName: { fontSize: 20, bold: true },
      orgAddress: { fontSize: 12 },
      header: { fontSize: 16, bold: true },
      subHeader: { fontSize: 13, bold: true, margin: [0, 8, 0, 4] },
    },
  };

  const fileName = `Loan-${borrower.code}-${toBnNumber(loan.installments.length)}.pdf`;
  pdfMake.createPdf(docDefinition).open();
};
