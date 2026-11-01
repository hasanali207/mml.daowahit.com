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
import api from "@/lib/axios";
import { getPagination } from "@/lib/getPageNumber";
import { AlertTriangle, FileText, SquarePen, Trash2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

// ⚠️ ASSUMPTION: এই geo-data import path গুলো তোমার borrower form-এ যেভাবে আছে সেভাবেই ধরে নিয়েছি।
// তোমার actual project structure অনুযায়ী path/type গুলো মিলিয়ে নাও।
import districtsData from "@/data/bd-districts.json";
import divisionsData from "@/data/bd-divisions.json";
import upazilasData from "@/data/bd-upazilas.json";
import { generateLoanPdf, ILoanPdfData } from "./generateLoanpdf";

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

interface ILoanProduct {
  id?: string;
  name: string;
  details?: string;
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
}

interface IGuarantorLite {
  id: string;
  name: string;
  fatherName?: string;
  mobile1?: string;
  relation?: string;
}

interface ILoan {
  id: string;
  borrowerId: string;
  principalAmount: number;
  profitRate: number;
  profitAmount: number;
  totalPayableAmount: number;
  monthlyInstallment: number;
  lastInstallmentAmount: number;
  totalInstallments: number;
  startMonth: string;
  isActive: boolean;
  installmentCount?: number;
  discountAmount?: number;
  borrower?: { name: string; code?: string; mobile1?: string };
  products?: ILoanProduct[];
  guarantors?: IGuarantorLite[];
}

/* ================= CONSTANTS ================= */
const ROUND_TO = 10;
const emptyGuarantor = (): IGuarantorForm => ({
  name: "",
  fatherName: "",
  mobile1: "",
  mobile2: "",
  nid: "",
  relation: "",
  presentAddress: emptyAddress(),
});

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

/* ================= MAIN COMPONENT ================= */
const LoanAccountsList = () => {
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<ILoan[]>([]);
  const [loading, setLoading] = useState(false);

  const [borrowers, setBorrowers] = useState<IBorrowerLite[]>([]);
  const [loadingBorrowers, setLoadingBorrowers] = useState(false);

  /* create form — loan */
  const [borrowerId, setBorrowerId] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [profitRate, setProfitRate] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("12");
  const [discountAmount, setDiscountAmount] = useState("");
  const [creating, setCreating] = useState(false);

  /* create form — product */
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  /* create form — guarantors (array, address সহ) */
  const [guarantors, setGuarantors] = useState<IGuarantorForm[]>([
    emptyGuarantor(),
  ]);

  /* filter */
  const [searchTerm, setSearchTerm] = useState("");

  /* pagination */
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const pages = getPagination(page, totalPages);

  /* expanded row (product/guarantor details) */
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  /* edit modal */
  const [open, setOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<ILoan | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFront, setImageFront] = useState<File | null>(null);
  const [imageBack, setImageBack] = useState<File | null>(null);
  const [imageCloseup, setImageCloseup] = useState<File | null>(null);

  /* ✅ PDF ডাউনলোড — কোন loan-এর জন্য এখন জেনারেট হচ্ছে (per-row loading state) */
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  /* ✅ DELETE LOAN ACCOUNT (force — সব related data সহ) */
  const [deleteTarget, setDeleteTarget] = useState<ILoan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  /* ================= LIVE PREVIEW (create form) ================= */
  const preview = useMemo(() => {
    const principal = Number(principalAmount) || 0;
    const rate = Number(profitRate) || 0;
    const installments = Number(totalInstallments) || 12;
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

  const frontPreview = useMemo(
    () => (imageFront ? URL.createObjectURL(imageFront) : null),
    [imageFront],
  );
  const backPreview = useMemo(
    () => (imageBack ? URL.createObjectURL(imageBack) : null),
    [imageBack],
  );
  const closeupPreview = useMemo(
    () => (imageCloseup ? URL.createObjectURL(imageCloseup) : null),
    [imageCloseup],
  );

  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
      if (closeupPreview) URL.revokeObjectURL(closeupPreview);
    };
  }, [frontPreview, backPreview, closeupPreview]);
  /* ================= LIVE PREVIEW (edit modal) ================= */
  const editPreview = useMemo(() => {
    if (!selectedLoan) return null;

    const principal = Number(selectedLoan.principalAmount) || 0;
    const rate = Number(selectedLoan.profitRate) || 0;
    const discount = Number(selectedLoan.discountAmount) || 0;

    const rawProfit = (principal * rate) / 100;
    const newProfit = Math.max(rawProfit - discount, 0);

    return { rawProfit, newProfit };
  }, [
    selectedLoan?.principalAmount,
    selectedLoan?.profitRate,
    selectedLoan?.discountAmount,
  ]);

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

  /* ================= FETCH LOANS ================= */
  const fetchAllLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/loan/account?page=1&limit=2000`,
      );
      const data = await res.json();
      setLoans(data.data || []);
      setFilteredLoans(data.data || []);
      setTotalPages(Math.ceil((data.data?.length || 0) / limit));
      setPage(1);
    } catch (err) {
      console.error("Fetch all loans error:", err);
      toast.error("Failed to load loan accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowers();
    fetchAllLoans();
  }, []);

  /* FILTER */
  useEffect(() => {
    const filtered = loans.filter((l) =>
      searchTerm
        ? l.borrower?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.borrower?.code?.toLowerCase().includes(searchTerm.toLowerCase())
        : true,
    );
    setFilteredLoans(filtered);
    setTotalPages(Math.ceil(filtered.length / limit));
    setPage(1);
  }, [searchTerm, loans]);

  const paginatedLoans = filteredLoans.slice((page - 1) * limit, page * limit);

  /* ================= IMAGE HANDLING ================= */
  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  /* ================= EDIT ================= */
  const handleEdit = (loan: ILoan) => {
    setSelectedLoan({ ...loan, discountAmount: loan.discountAmount ?? 0 });
    setOpen(true);
  };

  const cancelEdit = () => {
    setSelectedLoan(null);
    setError(null);
    setOpen(false);
  };

  const handleUpdate = async () => {
    if (!selectedLoan) return;

    setUpdating(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/loan/account/${selectedLoan.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            principalAmount: Number(selectedLoan.principalAmount),
            profitRate: Number(selectedLoan.profitRate),
            totalInstallments: Number(selectedLoan.totalInstallments),
            monthlyInstallment: Number(selectedLoan.monthlyInstallment),
            lastInstallmentAmount: Number(selectedLoan.lastInstallmentAmount),
            startMonth: selectedLoan.startMonth,
            isActive: selectedLoan.isActive,
            discountAmount: Number(selectedLoan.discountAmount) || 0,
          }),
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Update failed");

      toast.success("Loan account updated successfully");
      cancelEdit();
      fetchAllLoans();
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  /* ================= PDF DOWNLOAD =================
     Action কলামের list-এ শুধু lite borrower/guarantor আছে — PDF-এর জন্য পূর্ণাঙ্গ
     ডেটা (borrower-এর সব ঠিকানা + সব guarantor + installment schedule) লাগে,
     তাই ক্লিক করলে আগে /account/:id থেকে বিস্তারিত fetch করে নেওয়া হয়। */
  const handleDownloadPdf = async (loanId: string) => {
    setDownloadingPdfId(loanId);
    try {
      const res = await api.get(`/api/v1/loan/account/${loanId}`);
      await generateLoanPdf(res.data.data as ILoanPdfData);
    } catch (err: any) {
      console.error("PDF generate error:", err);
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "PDF তৈরি করতে সমস্যা হয়েছে",
      );
    } finally {
      setDownloadingPdfId(null);
    }
  };

  /* ================= DELETE LOAN ACCOUNT (force) =================
     ⚠️ এই একশন irreversible — loan + transactions + items + installments +
     guarantors + product সব একসাথে মুছে যাবে। তাই confirm modal-এ
     borrower code টাইপ করিয়ে নেওয়া হচ্ছে, যাতে ভুলে ক্লিক না হয়ে যায়। */
  const handleDeleteLoan = async () => {
    if (!deleteTarget) return;

    const expectedCode = deleteTarget.borrower?.code || "";
    if (expectedCode && confirmText.trim() !== expectedCode) {
      return toast.error("Borrower code সঠিকভাবে টাইপ করুন");
    }

    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/loan/account/${deleteTarget.id}/force`,
        { method: "DELETE" },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Delete failed");

      toast.success("Loan account সম্পূর্ণভাবে ডিলিট করা হয়েছে");
      setDeleteTarget(null);
      setConfirmText("");
      fetchAllLoans();
    } catch (err: any) {
      console.error("Delete loan error:", err);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const isLocked = (selectedLoan?.installmentCount ?? 0) > 0;

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Loan Account List
      </h2>

      {/* SEARCH */}
      <div className="mb-4">
        <Input
          placeholder="Search Borrower Name / Code"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm min-w-[">
          <thead className="bg-secondary text-white">
            <tr>
              {[
                "গ্রহীতার নাম",
                "Product",
                "Principal",
                "Profit Rate",
                "Profit Amount",
                "Total Payable",
                "Monthly Installment",
                "Last Installment",
                "Total Installments",
                "Start Month",
                "Status",
                "Action",
              ].map((h) => (
                <th key={h} className="border p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={12} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              paginatedLoans.map((l) => {
                const product = l.products?.[0];
                const isExpanded = expandedLoanId === l.id;
                const isDownloading = downloadingPdfId === l.id;

                return (
                  <Fragment key={l.id}>
                    <tr
                      key={l.id}
                      className="odd:bg-gray-50 hover:bg-blue-50 cursor-pointer"
                      onClick={() =>
                        setExpandedLoanId(isExpanded ? null : l.id)
                      }
                    >
                      <td className="border p-2">
                        {l.borrower?.name}{" "}
                        {l.borrower?.code ? `(${l.borrower.code})` : ""}
                      </td>
                      <td className="border p-2">
                        {product ? (
                          <div className="flex items-center gap-2">
                            {product.image1 && (
                              <img
                                src={product.image1}
                                alt={product.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <span>{product.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="border p-2">৳{l.principalAmount}</td>
                      <td className="border p-2">{l.profitRate}%</td>
                      <td className="border p-2">৳{l.profitAmount}</td>
                      <td className="border p-2">৳{l.totalPayableAmount}</td>
                      <td className="border p-2">৳{l.monthlyInstallment}</td>
                      <td className="border p-2">৳{l.lastInstallmentAmount}</td>
                      <td className="border p-2">{l.totalInstallments}</td>
                      <td className="border p-2">
                        {new Date(l.startMonth).toLocaleDateString("en-GB")}
                      </td>
                      <td className="border p-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            l.isActive
                              ? "bg-accent text-white"
                              : "bg-red-100 text-accent"
                          }`}
                        >
                          {l.isActive ? "Active" : "Closed"}
                        </span>
                      </td>
                      <td className="border p-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(l);
                            }}
                          >
                            <SquarePen />
                          </Button>

                          {/* ✅ PDF ডাউনলোড বাটন */}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isDownloading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPdf(l.id);
                            }}
                            title="PDF ডাউনলোড করুন"
                          >
                            {isDownloading ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <FileText />
                            )}
                          </Button>

                          {/* ✅ DELETE LOAN ACCOUNT বাটন — সব related data সহ মুছে যাবে */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(l);
                              setConfirmText("");
                            }}
                            title="Loan Account সম্পূর্ণভাবে ডিলিট করুন"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* ================= EXPANDED ROW — Product & Guarantor details ================= */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={12} className="border p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Product details */}
                            <div>
                              <h4 className="font-semibold text-sm mb-2">
                                Product বিস্তারিত
                              </h4>
                              {product ? (
                                <div className="text-sm space-y-1">
                                  <p>
                                    <span className="text-gray-500">নাম: </span>
                                    {product.name}
                                  </p>
                                  {product.details && (
                                    <p>
                                      <span className="text-gray-500">
                                        বিস্তারিত:{" "}
                                      </span>
                                      {product.details}
                                    </p>
                                  )}
                                  <div className="flex gap-2 mt-2">
                                    {[
                                      product.image1,
                                      product.image2,
                                      product.image3,
                                    ]
                                      .filter(Boolean)
                                      .map((img, i) => (
                                        <img
                                          key={i}
                                          src={img as string}
                                          alt={`product-${i}`}
                                          className="w-16 h-16 object-cover rounded-lg border"
                                        />
                                      ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400">
                                  কোনো Product তথ্য নেই
                                </p>
                              )}
                            </div>

                            {/* Guarantor details */}
                            <div>
                              <h4 className="font-semibold text-sm mb-2">
                                জামিনদার তালিকা
                              </h4>
                              {l.guarantors && l.guarantors.length > 0 ? (
                                <ul className="text-sm space-y-2">
                                  {l.guarantors.map((g) => (
                                    <li
                                      key={g.id}
                                      className="border rounded-lg p-2 bg-white"
                                    >
                                      <p className="font-medium">{g.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {g.relation ? `${g.relation} • ` : ""}
                                        {g.mobile1}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-400">
                                  কোনো জামিনদার যোগ করা হয়নি
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            {!loading && paginatedLoans.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center py-4">
                  No loan accounts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Prev
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
            Next
          </button>
        </div>
      )}

      {/* EDIT MODAL */}
      {open && selectedLoan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Update Loan Account</h3>
            {error && <div className="text-red-600 mb-2">{error}</div>}

            {isLocked && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-3 rounded-lg">
                এই লোনের ইতিমধ্যে {selectedLoan.installmentCount}টি কিস্তি
                জেনারেট হয়ে গেছে। Principal/Profit Rate/Total Installments
                পরিবর্তন করা যাবে না, তবে Discount দিলে সেটা শুধু বাকি
                কিস্তিগুলোতে apply হবে।
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm">
                  Principal Amount (আসল)
                </label>
                <Input
                  type="number"
                  value={selectedLoan.principalAmount}
                  disabled={isLocked}
                  onChange={(e) =>
                    setSelectedLoan({
                      ...selectedLoan,
                      principalAmount: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">
                  Profit Rate % (মুনাফা হার)
                </label>
                <Input
                  type="number"
                  value={selectedLoan.profitRate}
                  disabled={isLocked}
                  onChange={(e) =>
                    setSelectedLoan({
                      ...selectedLoan,
                      profitRate: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">
                  Discount on Profit (মুনাফা থেকে ছাড়)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={selectedLoan.discountAmount ?? 0}
                  onChange={(e) =>
                    setSelectedLoan({
                      ...selectedLoan,
                      discountAmount: Number(e.target.value) || 0,
                    })
                  }
                />
                {editPreview && (selectedLoan.discountAmount ?? 0) > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    নতুন Profit Amount: ৳{editPreview.newProfit.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm">
                  Total Installments (মোট কিস্তি)
                </label>
                <Input
                  type="number"
                  value={selectedLoan.totalInstallments}
                  disabled={isLocked}
                  onChange={(e) =>
                    setSelectedLoan({
                      ...selectedLoan,
                      totalInstallments: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Start Month</label>
                <Input
                  type="date"
                  value={selectedLoan.startMonth?.slice(0, 10)}
                  onChange={(e) =>
                    setSelectedLoan({
                      ...selectedLoan,
                      startMonth: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-3">
                <label className="text-sm">Loan Status</label>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedLoan({
                      ...selectedLoan,
                      isActive: !selectedLoan.isActive,
                    })
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedLoan.isActive
                      ? "bg-accent text-white"
                      : "bg-red-100 text-accent"
                  }`}
                >
                  {selectedLoan.isActive ? "Active" : "Closed"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE LOAN ACCOUNT — FORCE DELETE CONFIRM MODAL ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">
                Loan Account সম্পূর্ণভাবে ডিলিট করবেন?
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">{deleteTarget.borrower?.name}</span>{" "}
              (
              <span className="font-medium">{deleteTarget.borrower?.code}</span>
              )-এর এই লোনের সাথে সম্পর্কিত <b>
                সব ডেটা স্থায়ীভাবে মুছে যাবে
              </b>{" "}
              —
            </p>

            <ul className="text-sm text-gray-600 list-disc list-inside mb-4 space-y-0.5">
              <li>সব Payment Transaction ও তার Item</li>
              <li>সব Installment (Paid/Unpaid নির্বিশেষে)</li>
              <li>এই লোনের সব Guarantor</li>
              <li>Product তথ্য ও ছবি</li>
              <li>Loan Account নিজেই</li>
            </ul>

            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4">
              এই কাজ <b>ফিরিয়ে নেওয়া যাবে না</b>। নিশ্চিত হতে নিচে Borrower
              Code লিখুন:{" "}
              <span className="font-mono font-semibold">
                {deleteTarget.borrower?.code}
              </span>
            </div>

            <Input
              placeholder="Borrower Code টাইপ করুন"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mb-4"
            />

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteTarget(null);
                  setConfirmText("");
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteLoan}
                disabled={
                  deleting ||
                  (!!deleteTarget.borrower?.code &&
                    confirmText.trim() !== deleteTarget.borrower.code)
                }
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? "Deleting..." : "সম্পূর্ণভাবে Delete করুন"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanAccountsList;
