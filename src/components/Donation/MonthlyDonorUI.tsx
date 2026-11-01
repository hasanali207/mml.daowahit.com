"use client";

import api from "@/lib/axios";
import { useState } from "react";
import toast from "react-hot-toast";

export default function MonthlyDonorUI() {
  const [searchCode, setSearchCode] = useState("");
  const [donor, setDonor] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [startMonth, setStartMonth] = useState("");

  const searchDonor = async () => {
    if (!searchCode.trim()) return toast.error("ডোনার কোড লিখুন");

    setLoading(true);
    try {
      const res = await api.get(`/api/v1/monthlydonations`, {
        params: { code: searchCode },
      });

      const d = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
      if (!d) throw new Error("ডোনার পাওয়া যায়নি");

      setDonor(d);

      if (d.monthlyProfiles && d.monthlyProfiles.length > 0) {
        setMonthlyAmount(d.monthlyProfiles[0].monthlyAmount || 0);
        setStartMonth(d.monthlyProfiles[0].startMonth?.slice(0, 10) || "");
      } else {
        setMonthlyAmount(0);
        setStartMonth("");
      }

      toast.success("ডোনার পাওয়া গেছে");
    } catch (err: any) {
      console.error("Search Donor Error:", err);
      toast.error(err.message || "ডোনার পাওয়া যায়নি");
      setDonor(null);
      setMonthlyAmount(0);
      setStartMonth("");
    } finally {
      setLoading(false);
    }
  };

  const createMonthlyDonor = async () => {
    if (!donor) return toast.error("প্রথমে ডোনার সার্চ করুন");
    if (!monthlyAmount || !startMonth) return toast.error("সব ফিল্ড পূরণ করুন");

    try {
      const res = await api.post(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/monthlydonations/monthly-donor`,
        {
          donorId: donor.id,
          monthlyAmount,
          startMonth,
        },
      );

      toast.success("Monthly Donor তৈরি হয়েছে");

      setDonor((prev: any) => ({
        ...prev,
        monthlyProfiles: [{ monthlyAmount, startMonth }],
      }));
    } catch (err: any) {
      console.error("Create Monthly Donor Error:", err);
      toast.error(err.message || "Monthly Donor তৈরি হয়নি");
    }
  };

  const updateMonthlyDonor = async () => {
    if (!donor) return toast.error("প্রথমে ডোনার সার্চ করুন");
    if (!monthlyAmount || !startMonth) return toast.error("সব ফিল্ড পূরণ করুন");

    try {
      const monthlyDonorId = donor.monthlyProfiles[0].id;
      const res = await api.put(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/monthlydonations/update/${monthlyDonorId}`,
        {
          monthlyAmount,
          startMonth,
        },
      );

      toast.success("Monthly Donor আপডেট হয়েছে");

      setDonor((prev: any) => ({
        ...prev,
        monthlyProfiles: [
          { ...prev.monthlyProfiles[0], monthlyAmount, startMonth },
        ],
      }));
    } catch (err: any) {
      console.error("Update Monthly Donor Error:", err);
      toast.error(err.message || "Monthly Donor আপডেট হয়নি");
    }
  };

  const isMonthlyDonor = donor?.monthlyProfiles?.length > 0;
  const donorTypeLabel: Record<string, string> = {
    GENERAL: "সাধারণ দাতা সদস্য",
    LIFETIME: "আজীবন দাতা সদস্য",
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-6">
      {/* Search Section */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="ডোনার কোড লিখুন"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchDonor()}
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={searchDonor}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "সার্চ হচ্ছে..." : "সার্চ"}
        </button>
      </div>

      {/* Donor Info + Create/Update Card */}
      {donor && (
        <div className="border rounded-lg shadow-md p-4 bg-white space-y-4">
          {/* Donor Info */}
          <div className="bg-gray-50 p-3 rounded-md space-y-1">
            <p>
              <strong>নাম:</strong> {donor.name}
            </p>
            <p>দাতার ধরণ: {donorTypeLabel[donor.donorType] || ""}</p>
            <p>
              <strong>বর্তমান মাসিক অনুদান:</strong>{" "}
              {isMonthlyDonor ? donor.monthlyProfiles[0].monthlyAmount : 0}
            </p>
          </div>

          {/* Monthly Donor Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div className="flex flex-col">
              <label className="font-medium">মাসিক অনুদান</label>
              <input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                className="border rounded px-3 py-2"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium">শুরু মাস</label>
              <input
                type="date"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            {/* Buttons */}
            <div className="sm:col-span-2 flex gap-2 mt-2">
              {!isMonthlyDonor ? (
                <button
                  onClick={createMonthlyDonor}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-primary"
                >
                  তৈরি করুন
                </button>
              ) : (
                <button
                  onClick={updateMonthlyDonor}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-yellow-700"
                >
                  আপডেট করুন
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
