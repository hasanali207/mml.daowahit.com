"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/* ---------------- Types ---------------- */
type LoanType = {
  id: string;
  totalLoanAmount: number;
  monthlyInstallment: number;
  borrower: { name: string; code?: string };
};

/* ---------------- Month / Year ---------------- */
const months = [
  { label: "জানুয়ারি", value: 1 },
  { label: "ফেব্রুয়ারি", value: 2 },
  { label: "মার্চ", value: 3 },
  { label: "এপ্রিল", value: 4 },
  { label: "মে", value: 5 },
  { label: "জুন", value: 6 },
  { label: "জুলাই", value: 7 },
  { label: "আগস্ট", value: 8 },
  { label: "সেপ্টেম্বর", value: 9 },
  { label: "অক্টোবর", value: 10 },
  { label: "নভেম্বর", value: 11 },
  { label: "ডিসেম্বর", value: 12 },
];

const generateYears = () => {
  const current = new Date().getFullYear();
  return Array.from({ length: 3 }, (_, i) => current - 1 + i);
};

/* ---------------- Component ---------------- */
export default function GenerateLoanInstallment() {
  const [loans, setLoans] = useState<LoanType[]>([]);
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);

  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [selectedYear, setSelectedYear] = useState("");

  const [loadingLoans, setLoadingLoans] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");

  /* ---------------- Load Loans ---------------- */
  useEffect(() => {
    const fetchLoans = async () => {
      setLoadingLoans(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/loan/account`,
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLoans(json.data);
        }
      } catch (err) {
        toast.error("Loan fetch failed");
      } finally {
        setLoadingLoans(false);
      }
    };

    fetchLoans();
  }, []);

  /* ---------------- Toggle Loan ---------------- */
  const toggleLoan = (id: string) => {
    setSelectedLoans((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  /* ---------------- Generate Installment ---------------- */
  const handleGenerateInstallment = async () => {
    if (!selectedMonth || !selectedYear || selectedLoans.length === 0) {
      return toast.error("Month, Year এবং কমপক্ষে একটি Loan নির্বাচন করুন!");
    }

    setGenerating(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/loan/installment/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loanIds: selectedLoans,
            month: selectedMonth,
            year: Number(selectedYear),
          }),
        },
      );

      const result = await res.json();
      if (!res.ok)
        throw new Error(result?.message || "Failed to generate installment");

      const { createdCount, skippedCount, totalSelected } = result.data;
      toast.success(
        `${createdCount}/${totalSelected} টি কিস্তি তৈরি হয়েছে, ${skippedCount} টি স্কিপ হয়েছে`,
      );
      setSelectedLoans([]);
    } catch (error: any) {
      console.error("Installment generate error:", error);
      toast.error(error.message || "Something went wrong!");
    } finally {
      setGenerating(false);
    }
  };

  const filteredLoans = loans.filter((l) => {
    const term = search.toLowerCase();
    return (
      l.borrower.name.toLowerCase().includes(term) ||
      l.borrower.code?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-center items-center flex-col">
        <h2 className="text-2xl mb-4 bangla">কিস্তি তৈরি করুন</h2>
        <p className="text-lg mb-4 text-red-500 bangla">
          কিস্তি তৈরির পূর্বে মাস ও বছর সঠিকভাবে নির্বাচন করুন।
        </p>
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div className="">
          {/* Month */}
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            <option value="">মাস নির্বাচন করুন</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Year */}
          <select
            className="w-full border rounded px-3 py-2 mt-4"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">বছর নির্বাচন করুন</option>
            {generateYears().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          {/* Loans */}
          {filteredLoans.length === 0 && (
            <p className="text-sm text-red-400 text-center py-4">
              কোন লোন অ্যাকাউন্ট পাওয়া যায়নি
            </p>
          )}
          {loans.length > 0 && (
            <div className="border p-3 rounded max-h-96 overflow-y-auto">
              <input
                type="text"
                placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full mb-3 px-2 p-2 border rounded text-sm"
              />

              <div className="flex justify-end mb-2">
                {selectedLoans.length === loans.length ? (
                  <button
                    type="button"
                    className="text-sm bg-blue-200 p-2 rounded-3xl cursor-pointer"
                    onClick={() => setSelectedLoans([])}
                  >
                    Deselect All
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-sm bg-blue-500 p-2 rounded-3xl text-white cursor-pointer"
                    onClick={() => setSelectedLoans(loans.map((l) => l.id))}
                  >
                    Select All
                  </button>
                )}
              </div>

              {filteredLoans.map((l) => (
                <label
                  key={l.id}
                  className="flex justify-between gap-2 mb-2 bg-gray-100 p-4 cursor-pointer"
                >
                  <span className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={selectedLoans.includes(l.id)}
                      onChange={() => toggleLoan(l.id)}
                    />
                    {l.borrower.name} ({l.borrower.code})
                  </span>
                  <span className="text-sm text-gray-500">
                    ৳{l.monthlyInstallment}
                  </span>
                </label>
              ))}
            </div>
          )}

          <Button
            className="mt-4 bg-primary text-white w-full"
            onClick={handleGenerateInstallment}
            disabled={generating}
          >
            {generating ? "তৈরি হচ্ছে..." : "কিস্তি তৈরি করুন"}
          </Button>
        </div>
      </div>
    </div>
  );
}
