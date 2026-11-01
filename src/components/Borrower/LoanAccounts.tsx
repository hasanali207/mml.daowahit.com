"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

// ⚠️ ASSUMPTION: geo-data import path গুলো তোমার borrower form-এ যেভাবে আছে সেভাবেই ধরে নিয়েছি।
// তোমার actual project structure অনুযায়ী path/type গুলো মিলিয়ে নাও।
import districtsData from "@/data/bd-districts.json";
import divisionsData from "@/data/bd-divisions.json";
import upazilasData from "@/data/bd-upazilas.json";
import api from "@/lib/axios";

/* ================= GEO TYPES ================= */
interface GeoItem {
  id: string;
  bn_name: string;
}
interface DistrictItem extends GeoItem {
  division_id: string;
}
interface UpazilaItem extends GeoItem {
  district_id: string;
}

interface AddressType {
  divisionId: string;
  districtId: string;
  thanaId: string;
  division: string;
  district: string;
  thana: string;
  postOffice: string;
  village: string;
}

const emptyAddress = (): AddressType => ({
  divisionId: "",
  districtId: "",
  thanaId: "",
  division: "",
  district: "",
  thana: "",
  postOffice: "",
  village: "",
});

/* ================= TYPES ================= */
interface IBorrowerLite {
  id: string;
  code?: string;
  name: string;
}

interface IGuarantorForm {
  name: string;
  fatherName: string;
  mobile1: string;
  mobile2: string;
  nid: string;
  relation: string;
  presentAddress: AddressType;
}

const emptyGuarantor = (): IGuarantorForm => ({
  name: "",
  fatherName: "",
  mobile1: "",
  mobile2: "",
  nid: "",
  relation: "",
  presentAddress: emptyAddress(),
});

/* ================= CONSTANTS ================= */
const ROUND_TO = 10;

/* ================= GUARANTOR ADDRESS SUB-COMPONENT ================= */
const GuarantorAddressFields = ({
  index,
  address,
  handleGuarantorChange,
}: {
  index: number;
  address: AddressType;
  handleGuarantorChange: (index: number, field: string, value: string) => void;
}) => {
  const fieldClass = "w-full border rounded px-3 py-2 text-sm";

  const divisions = useMemo(
    () => (divisionsData as { divisions: GeoItem[] }).divisions,
    [],
  );

  const districts = useMemo(() => {
    if (!address.divisionId) return [];
    return (districtsData as { districts: DistrictItem[] }).districts.filter(
      (d) => d.division_id === address.divisionId,
    );
  }, [address.divisionId]);

  const thanas = useMemo(() => {
    if (!address.districtId) return [];
    return (upazilasData as { upazilas: UpazilaItem[] }).upazilas.filter(
      (t) => t.district_id === address.districtId,
    );
  }, [address.districtId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      <div className="flex flex-col">
        <label className="mb-1 text-xs">বিভাগ</label>
        <Select
          value={address.divisionId}
          onValueChange={(id) => {
            const name = divisions.find((d) => d.id === id)?.bn_name || "";
            handleGuarantorChange(index, "presentAddress.divisionId", id);
            handleGuarantorChange(index, "presentAddress.division", name);
            handleGuarantorChange(index, "presentAddress.districtId", "");
            handleGuarantorChange(index, "presentAddress.district", "");
            handleGuarantorChange(index, "presentAddress.thanaId", "");
            handleGuarantorChange(index, "presentAddress.thana", "");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="বিভাগ নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            {divisions.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-xs">জেলা</label>
        <Select
          value={address.districtId}
          onValueChange={(id) => {
            const name = districts.find((d) => d.id === id)?.bn_name || "";
            handleGuarantorChange(index, "presentAddress.districtId", id);
            handleGuarantorChange(index, "presentAddress.district", name);
            handleGuarantorChange(index, "presentAddress.thanaId", "");
            handleGuarantorChange(index, "presentAddress.thana", "");
          }}
          disabled={!districts.length}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="জেলা নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-xs">থানা/উপজেলা</label>
        <Select
          value={address.thanaId}
          onValueChange={(id) => {
            const name = thanas.find((t) => t.id === id)?.bn_name || "";
            handleGuarantorChange(index, "presentAddress.thanaId", id);
            handleGuarantorChange(index, "presentAddress.thana", name);
          }}
          disabled={!thanas.length}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="থানা/উপজেলা নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            {thanas.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-xs">পোস্ট অফিস</label>
        <Input
          className={fieldClass}
          value={address.postOffice}
          onChange={(e) =>
            handleGuarantorChange(
              index,
              "presentAddress.postOffice",
              e.target.value,
            )
          }
        />
      </div>

      <div className="flex flex-col sm:col-span-2">
        <label className="mb-1 text-xs">গ্রাম/মহল্লা</label>
        <Input
          className={fieldClass}
          value={address.village}
          onChange={(e) =>
            handleGuarantorChange(
              index,
              "presentAddress.village",
              e.target.value,
            )
          }
        />
      </div>
    </div>
  );
};

/* ================= IMAGE UPLOAD FIELD SUB-COMPONENT (reusable, clean) ================= */
// ⚠️ <input type="file"> uncontrolled — শুধু state null করলে ব্রাউজারে দেখানো ফাইলনেম মুছে না।
// তাই resetKey পরিবর্তন করে (parent থেকে key prop হিসেবে পাঠিয়ে) এই কম্পোনেন্টটাকে
// force-remount করানো হয়, যেটা input-কে visually খালি করে দেয়।
const ProductImageField = ({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) => {
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm">{label}</label>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      {preview && (
        <img
          src={preview}
          alt={label}
          className="w-20 h-20 object-cover rounded-lg border mt-2"
        />
      )}
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
const LoanAccounts = ({ onCreated }: { onCreated?: () => void }) => {
  const [borrowers, setBorrowers] = useState<IBorrowerLite[]>([]);
  const [loadingBorrowers, setLoadingBorrowers] = useState(false);

  /* loan fields */
  const [borrowerId, setBorrowerId] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [profitRate, setProfitRate] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [creating, setCreating] = useState(false);

  /* product fields */
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");

  /* ✅ ৩টা আলাদা, নির্দিষ্ট-নামের ইমেজ ফিল্ড — backend-এ ঠিক এই ক্রমে image1, image2, image3 হিসেবে সেভ হয় */
  const [imagePaymentProof, setImagePaymentProof] = useState<File | null>(null); // টাকা প্রদানের ছবি → image1
  const [imagePurchaseProof, setImagePurchaseProof] = useState<File | null>(
    null,
  ); // পণ্য ক্রয়ের ছবি → image2
  const [imageDeliveryProof, setImageDeliveryProof] = useState<File | null>(
    null,
  ); // পণ্য বিতরণের ছবি → image3

  /* guarantors (array, address সহ) */
  const [guarantors, setGuarantors] = useState<IGuarantorForm[]>([
    emptyGuarantor(),
  ]);

  /* ✅ file input remount key — <input type="file"> uncontrolled হওয়ায়
     এইভাবে key বাড়িয়ে reset-এর সময় ইনপুট visually খালি করা হয় */
  const [imageResetKey, setImageResetKey] = useState(0);

  /* ================= LIVE PREVIEW ================= */
  const preview = useMemo(() => {
    const principal = Number(principalAmount) || 0;
    const rate = Number(profitRate) || 0;
    const installments = Number(totalInstallments) || 6;
    const discount = Number(discountAmount) || 0;

    const rawProfit = (principal * rate) / 100;
    const profit = Math.max(rawProfit - discount, 0);

    const totalPayable = principal + profit;

    const rawMonthly = totalPayable / installments;
    const monthly = Math.floor(rawMonthly / ROUND_TO) * ROUND_TO;

    const rawLast = totalPayable - monthly * (installments - 1);
    const lastInstallment = Math.ceil(rawLast);

    return { rawProfit, profit, totalPayable, monthly, lastInstallment };
  }, [principalAmount, profitRate, totalInstallments, discountAmount]);

  /* ================= FETCH BORROWERS ================= */
  const fetchBorrowers = async () => {
    setLoadingBorrowers(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/borrower?page=1&limit=2000`,
      );
      const data = await res.json();
      setBorrowers(data.data || []);
    } catch (err) {
      console.error("Fetch borrowers error:", err);
      toast.error("Failed to load borrowers");
    } finally {
      setLoadingBorrowers(false);
    }
  };

  useEffect(() => {
    fetchBorrowers();
  }, []);

  /* ================= GUARANTOR HANDLING ================= */
  const handleGuarantorChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    setGuarantors((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field.startsWith("presentAddress.")) {
        const addrField = field.split(".")[1] as keyof AddressType;
        target.presentAddress = {
          ...target.presentAddress,
          [addrField]: value,
        };
      } else {
        (target as any)[field] = value;
      }

      updated[index] = target;
      return updated;
    });
  };

  const addGuarantor = () => {
    setGuarantors((prev) => [...prev, emptyGuarantor()]);
  };

  const removeGuarantor = (index: number) => {
    setGuarantors((prev) => prev.filter((_, i) => i !== index));
  };

  /* ================= RESET FORM ================= */
  const resetCreateForm = () => {
    setBorrowerId("");
    setPrincipalAmount("");
    setProfitRate("");
    setStartMonth("");
    setTotalInstallments("6");
    setDiscountAmount("");
    setProductName("");
    setProductDetails("");
    setImagePaymentProof(null);
    setImagePurchaseProof(null);
    setImageDeliveryProof(null);
    setGuarantors([emptyGuarantor()]);
    setImageResetKey((k) => k + 1); // ✅ file input গুলো force-remount হয়ে visually খালি হবে
  };

  /* ================= CREATE ================= */
  const handleCreate = async () => {
    if (
      !borrowerId ||
      !principalAmount ||
      !profitRate ||
      !startMonth ||
      !totalInstallments
    ) {
      return toast.error(
        "Borrower, Principal Amount, Profit Rate, Start Month, Total Installments দিন",
      );
    }

    if (!productName) {
      return toast.error("Product Name দিতে হবে");
    }

    const validGuarantors = guarantors.filter((g) => g.name && g.mobile1);
    if (validGuarantors.length === 0) {
      return toast.error("অন্তত একজন জামিনদার (নাম ও মোবাইল) দিতে হবে");
    }

    const discount = Number(discountAmount) || 0;
    const rawProfit = (Number(principalAmount) * Number(profitRate)) / 100;

    if (discount < 0) {
      return toast.error("Discount amount ঋণাত্মক হতে পারবে না");
    }

    if (discount > rawProfit) {
      return toast.error(
        "Discount amount, মোট Profit Amount থেকে বেশি হতে পারবে না",
      );
    }

    setCreating(true);
    try {
      const payload = {
        borrowerId,
        principalAmount: Number(principalAmount),
        profitRate: Number(profitRate),
        startMonth,
        totalInstallments: Number(totalInstallments),
        discountAmount: discount,
        product: {
          name: productName,
          details: productDetails,
        },
        guarantors: validGuarantors.map((g) => ({
          name: g.name,
          fatherName: g.fatherName,
          mobile1: g.mobile1,
          mobile2: g.mobile2,
          nid: g.nid,
          relation: g.relation,
          presentAddress: {
            division: g.presentAddress.division,
            district: g.presentAddress.district,
            thana: g.presentAddress.thana,
            postOffice: g.presentAddress.postOffice,
            village: g.presentAddress.village,
          },
        })),
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));

      // ✅ এই নির্দিষ্ট ক্রমেই append করতে হবে — backend-এ multer.array("images", 3)
      // req.files[0] → image1, req.files[1] → image2, req.files[2] → image3
      // undefined/null ফাইল append না করাই ভালো (multer skip করবে, ক্রম ঠিক থাকবে)
      if (imagePaymentProof) formData.append("images", imagePaymentProof);
      if (imagePurchaseProof) formData.append("images", imagePurchaseProof);
      if (imageDeliveryProof) formData.append("images", imageDeliveryProof);

      const res = await api.post(`/api/v1/loan/account`, formData);

      if (!res.data?.success)
        throw new Error(res.data?.message || "Loan create failed");

      toast.success("Loan account created successfully");
      resetCreateForm();
      onCreated?.();
    } catch (err: any) {
      console.error("Create loan error:", err);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const [borrowerSearch, setBorrowerSearch] = useState("");

  const filteredBorrowers = borrowers.filter((b) => {
    const search = borrowerSearch.toLowerCase();

    return (
      b.name.toLowerCase().includes(search) ||
      (b.code && b.code.toLowerCase().includes(search))
    );
  });
  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        নতুন লোন অ্যাকাউন্ট তৈরি করুন
      </h2>

      {/* ================= LOAN INFO ================= */}
      <div className="bg-white p-5 rounded-xl shadow mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">লোনের তথ্য</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col">
            <label className="mb-1 text-sm">
              গ্রহীতার নাম <span className="text-red-500">*</span>
            </label>

            <Select
              value={borrowerId}
              onValueChange={setBorrowerId}
              disabled={loadingBorrowers}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="নাম নির্বাচন করুন" />
              </SelectTrigger>

              <SelectContent className="p-0">
                {/* Search Box */}
                <div className="sticky top-0 z-10 border-b bg-background p-2">
                  <input
                    type="text"
                    value={borrowerSearch}
                    onChange={(e) => setBorrowerSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Borrower search করুন..."
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Scrollable List */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredBorrowers.length > 0 ? (
                    filteredBorrowers.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} {b.code ? `(${b.code})` : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      কোনো Borrower পাওয়া যায়নি
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm">
              Principal Amount (আসল) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={principalAmount}
              onChange={(e) => setPrincipalAmount(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm">
              Profit Rate % (মুনাফা হার) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              placeholder=""
              value={profitRate}
              onChange={(e) => setProfitRate(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm">
              Total Installments (মোট কিস্তি){" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm">
              Discount on Profit (ছাড়, ঐচ্ছিক)
            </label>
            <Input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm">
              Start Month <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
            />
          </div>
        </div>

        {/* LIVE PREVIEW */}
        {principalAmount && profitRate && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <span className="text-gray-500">মূল মুনাফা: </span>
              <span className="font-semibold">
                ৳{preview.rawProfit.toFixed(2)}
              </span>
            </div>
            {Number(discountAmount) > 0 && (
              <div>
                <span className="text-gray-500">ছাড় পরবর্তী মুনাফা: </span>
                <span className="font-semibold text-green-600">
                  ৳{preview.profit.toFixed(2)}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">মোট পরিশোধযোগ্য: </span>
              <span className="font-semibold">
                ৳{preview.totalPayable.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">
                মাসিক কিস্তি (১-{Number(totalInstallments) - 1}তম):{" "}
              </span>
              <span className="font-semibold">৳{preview.monthly}</span>
            </div>
            <div>
              <span className="text-gray-500">
                শেষ কিস্তি ({totalInstallments}তম):{" "}
              </span>
              <span className="font-semibold">৳{preview.lastInstallment}</span>
            </div>
          </div>
        )}
      </div>

      {/* ================= PRODUCT ================= */}
      <div className="bg-white p-5 rounded-xl shadow mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">
          জামিনকৃত জিনিসের তথ্য (Product)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="mb-1 text-sm">
              Product Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:col-span-2">
            <label className="mb-1 text-sm">Product Details</label>
            <Input
              value={productDetails}
              onChange={(e) => setProductDetails(e.target.value)}
            />
          </div>
        </div>

        {/* ✅ ৩টা আলাদা, নির্দিষ্ট-উদ্দেশ্যের ইমেজ ফিল্ড
            key={imageResetKey} — submit-এর পর input visually খালি করার জন্য force-remount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ProductImageField
            key={`payment-${imageResetKey}`}
            label="টাকা প্রদানের ছবি"
            file={imagePaymentProof}
            onChange={setImagePaymentProof}
          />
          <ProductImageField
            key={`purchase-${imageResetKey}`}
            label="পণ্য ক্রয়ের ছবি"
            file={imagePurchaseProof}
            onChange={setImagePurchaseProof}
          />
          <ProductImageField
            key={`delivery-${imageResetKey}`}
            label="পণ্য বিতরণের ছবি"
            file={imageDeliveryProof}
            onChange={setImageDeliveryProof}
          />
        </div>
      </div>

      {/* ================= GUARANTORS ================= */}
      <div className="bg-white p-5 rounded-xl shadow mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700">জামিনদার (Guarantor)</h3>
        </div>

        {guarantors.map((g, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-4 mb-3 relative bg-gray-50"
          >
            {guarantors.length > 1 && (
              <button
                type="button"
                onClick={() => removeGuarantor(idx)}
                className="absolute top-3 right-3 text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            )}

            <p className="text-xs text-gray-500 mb-2">জামিনদার #{idx + 1}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="mb-1 text-xs">
                  নাম <span className="text-red-500">*</span>
                </label>
                <Input
                  value={g.name}
                  onChange={(e) =>
                    handleGuarantorChange(idx, "name", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-xs">পিতার নাম</label>
                <Input
                  value={g.fatherName}
                  onChange={(e) =>
                    handleGuarantorChange(idx, "fatherName", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-xs">
                  মোবাইল <span className="text-red-500">*</span>
                </label>
                <Input
                  value={g.mobile1}
                  onChange={(e) =>
                    handleGuarantorChange(idx, "mobile1", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-xs">মোবাইল (বিকল্প)</label>
                <Input
                  value={g.mobile2}
                  onChange={(e) =>
                    handleGuarantorChange(idx, "mobile2", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-xs">NID</label>
                <Input
                  value={g.nid}
                  onChange={(e) =>
                    handleGuarantorChange(idx, "nid", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-xs">সম্পর্ক (Relation)</label>
                <Input
                  placeholder="e.g. Brother"
                  value={g.relation}
                  onChange={(e) =>
                    handleGuarantorChange(idx, "relation", e.target.value)
                  }
                />
              </div>
            </div>

            {/* ✅ Cascading division → district → thana address */}
            <GuarantorAddressFields
              index={idx}
              address={g.presentAddress}
              handleGuarantorChange={handleGuarantorChange}
            />
          </div>
        ))}
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end mb-8">
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? "Creating..." : "Add Loan"}
        </Button>
      </div>
    </div>
  );
};

export default LoanAccounts;
