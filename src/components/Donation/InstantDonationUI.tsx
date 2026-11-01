"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SolaimanLipiBase64 } from "@/fonts/solaiman";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/getErrorMessage ";
import { numberToBanglaWords } from "@/types/numberToBanglaWords ";
import { formatBanglaDateTime, formatDateBn } from "@/utils/dateBn";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Donation {
  id: string;
  donorName: string;
  mobile?: string;
  address?: string;
  receiptNo: string;
  totalAmount: number;
  transactionId: string;
  updatedAt: string;
  receivedBy: string;
  method: string;
  items: { title: string; amount: number }[];
  payments?: { method: string }[];
}

export default function InstantDonationPage() {
  const [donorName, setDonorName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [items, setItems] = useState([{ title: "", amount: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const totalAmount = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [images, setImages] = useState({
    logo: "",
    sign1: "",
    sign2: "",
    webicon: "",
    fbicon: "",
    qrcode: "",
  });

  // Load Images
  useEffect(() => {
    const loadImages = async () => {
      const toBase64FromUrl = async (url: string) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<string>((resolve) => {
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

  // Load All Donations
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/api/v1/income/categories");
        setCategories(res.data.data);
      } catch (err) {
        console.error("Category load error", err);
      }
    };

    loadCategories();
  }, []);
  // Submit Donation
  const handleSubmit = async () => {
    if (!donorName) return alert("Donor name required");
    setLoading(true);

    try {
      const res = await api.post("/api/v1/donations", {
        donorName,
        mobile,
        address,
        items,
        amount: totalAmount,
        paymentMethod,
      });

      const donation = res.data.data; // ✅ POST হওয়া single donation object
      console.log({ donation });

      // Instant PDF open
      generateDonationPDF(donation);

      // Reset form
      setDonorName("");
      setMobile("");
      setAddress("");
      setItems([{ title: "", amount: 0 }]);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF
  const generateDonationPDF = async (donations: Donation) => {
    console.log({ donations });
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

    const toBn = (num: number) => num.toLocaleString("bn-BD");
    const COLORS = {
      header: "#d9d9d9",
      zebra1: "#FFFFFF",
      zebra2: "#d9d9d9",
      total: "#d9d9d9",
    };

    const itemsRows =
      donations.items?.map((item, index) => [
        {
          text: toBn(index + 1),
          alignment: "center",
          fillColor: COLORS.zebra2,
          style: "info",
        },
        {
          text: item.title,
          alignment: "left",
          fillColor: COLORS.zebra1,
          style: "info",
        },
        {
          text: toBn(item.amount),
          alignment: "right",
          fillColor: COLORS.zebra1,
          style: "info",
        },
      ]) || [];

    const studentPhoto = "";

    const doc: any = {
      pageSize: "A4",
      pageMargins: [10, 5, 10, 5],
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
                        { text: `: ${donations.donorName}`, style: "info" },
                      ],
                      [
                        { text: "ঠিকানা", style: "info" },
                        { text: `: ${donations.address}`, style: "info" },
                      ],
                      [
                        { text: "মোবাইল", style: "info" },
                        { text: `: ${donations.mobile}`, style: "info" },
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
                        { text: `: ${donations.receiptNo}`, style: "info" },
                      ],
                      [
                        { text: "ট্রানজেকশন নং", style: "info" },
                        {
                          text: `: ${donations?.transactionId || "N/A"}`,
                          style: "info",
                        },
                      ],

                      [
                        { text: "তারিখ", style: "info" },
                        {
                          text: `: ${
                            donations.updatedAt
                              ? formatDateBn(donations.updatedAt)
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
                          w: 175,
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
            widths: [30, "*", 60],
            body: [
              [
                {
                  text: "ক্রমিক",
                  bold: true,
                  style: "info",
                  fillColor: COLORS.zebra2,
                },
                {
                  text: "দান এর ধরণ",
                  bold: true,
                  style: "info",
                  fillColor: COLORS.zebra2,
                  alignment: "center",
                },
                {
                  text: "টাকা",
                  bold: true,
                  alignment: "right",
                  style: "info",
                  fillColor: COLORS.zebra2,
                },
              ],
              ...itemsRows,
            ],
          },
          layout: {
            hLineColor: () => "#888",
            vLineColor: () => "#888",
          },
          marign: 0,
        },

        {
          columns: [
            {
              width: "*",
              table: {
                widths: ["*", 61, 65],
                body: [
                  [
                    {
                      text: "",
                      fillColor: COLORS.zebra2,
                      margin: [6, 4, 2, 4],
                    },
                    {
                      text: "সর্বমোট",
                      alignment: "left",
                      fillColor: COLORS.zebra2,
                      bold: true,
                      margin: [2, 4, 2, 4],
                      style: "info",
                    },
                    {
                      text: toBn(donations.totalAmount),
                      alignment: "right",
                      fillColor: COLORS.zebra2,
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
                widths: ["*", 122], // ডান কলাম একটু বড় করলাম
                body: [
                  [
                    // 🔹 কথায় (আগের মতোই থাকবে)
                    {
                      text: `কথায় : ${numberToBanglaWords(donations.totalAmount)} টাকা মাত্র`,
                      fillColor: COLORS.zebra1,
                      bold: true,
                      margin: [2, 2, 2, 2],
                      style: "info",
                      alignment: "left",
                    },

                    // 🔹 মোট পরিশোধ → এখন ২ কলাম
                    {
                      table: {
                        widths: ["*", 55],
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
                              text: toBn(donations.totalAmount),
                              bold: true,
                              alignment: "right",
                              margin: [0, 0, 0, 0],
                              style: "info",
                            },
                          ],
                        ],
                      },
                      layout: "noBorders",
                      fillColor: COLORS.zebra1,
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
                  text: `পেমেন্ট মাধ্যম: HAND ${donations.method}`,
                  alignment: "left",
                  fillColor: COLORS.zebra2,
                  bold: true,
                  style: "info",
                  margin: [2, 0, 0, 0],
                },

                {
                  text: `এন্ট্রি তারিখ: ${formatBanglaDateTime(donations.updatedAt)}`,
                  alignment: "center",
                  fillColor: COLORS.zebra2,
                  bold: true,
                  margin: 0,
                  style: "info",
                },
                {
                  text: `গ্রহণকারী: ${donations.receivedBy}`,
                  alignment: "right",
                  fillColor: COLORS.zebra2,
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

    pdfMake.createPdf(doc).open();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            সাধারণ অনুদান গ্রহণ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            placeholder="Donor Name"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
          />
          <Input
            placeholder="Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <Input
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                {/* ✅ Category Select */}
                <Select
                  value={item.title}
                  onValueChange={(value) => {
                    const copy = [...items];
                    copy[idx].title = value;
                    setItems(copy);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="খাত নির্বাচন করুন" />
                  </SelectTrigger>

                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* ✅ Amount */}
                <Input
                  type="number"
                  placeholder="Amount"
                  value={item.amount}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx].amount = Number(e.target.value);
                    setItems(copy);
                  }}
                />
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => setItems([...items, { title: "", amount: 0 }])}
            >
              + খাত যুক্ত
            </Button>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-lg font-bold">সর্বমোট: ৳ {totalAmount}</div>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              অনুদান গ্রহণ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
