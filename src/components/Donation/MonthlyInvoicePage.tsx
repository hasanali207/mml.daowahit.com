"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import api from "@/lib/axios";
import toast from "react-hot-toast";

interface IMonthlyDonor {
  id: string;
  donorId: string;
  monthlyAmount: number;

  donor: {
    name: string;
    mobile1: string;
    code: string;
    donorType: string;
  };
}

const months = [
  { label: "জানুয়ারি", value: "1" },
  { label: "ফেব্রুয়ারি", value: "2" },
  { label: "মার্চ", value: "3" },
  { label: "এপ্রিল", value: "4" },
  { label: "মে", value: "5" },
  { label: "জুন", value: "6" },
  { label: "জুলাই", value: "7" },
  { label: "আগস্ট", value: "8" },
  { label: "সেপ্টেম্বর", value: "9" },
  { label: "অক্টোবর", value: "10" },
  { label: "নভেম্বর", value: "11" },
  { label: "ডিসেম্বর", value: "12" },
];

export default function MonthlyInvoicePage() {
  const [loading, setLoading] = useState(false);

  const [donors, setDonors] = useState<IMonthlyDonor[]>([]);

  const [search, setSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // ==================================
  // FETCH DONORS
  // ==================================

  const fetchDonors = async () => {
    try {
      const res = await api.get("/api/v1/monthlydonations/all/monthlydonor");

      setDonors(res.data.data);
    } catch {
      toast.error("Failed to load donors");
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  // ==================================
  // SEARCH
  // ==================================

  const filteredDonors = useMemo(() => {
    return donors.filter((item) => {
      const q = search.toLowerCase();

      return (
        item.donor.name.toLowerCase().includes(q) ||
        item.donor.code.toLowerCase().includes(q) ||
        item.donor.mobile1?.includes(q)
      );
    });
  }, [donors, search]);

  // ==================================
  // SELECT SINGLE
  // ==================================

  const toggleDonor = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // ==================================
  // SELECT ALL
  // ==================================

  const allSelected =
    filteredDonors.length > 0 &&
    filteredDonors.every((item) => selectedIds.includes(item.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredDonors.some((donor) => donor.id === id)),
      );

      return;
    }

    const ids = filteredDonors.map((item) => item.id);

    setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
  };

  // ==================================
  // GENERATE
  // ==================================

  const handleGenerate = async () => {
    if (!month) {
      return toast.error("Month select করুন");
    }

    if (!year) {
      return toast.error("Year select করুন");
    }

    if (!selectedIds.length) {
      return toast.error("কমপক্ষে একজন donor select করুন");
    }

    try {
      setLoading(true);

      await api.post("/api/v1/monthlydonations/monthly-invoice", {
        month: Number(month),
        year: Number(year),
        monthlyDonorIds: selectedIds,
      });

      toast.success("Monthly Invoice Generated Successfully");

      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Generate failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            পেমেন্ট তৈরি করুন
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* LEFT */}

            <div className="space-y-4">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full mt-4">
                  <SelectValue placeholder="মাস নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full mt-4">
                  <SelectValue placeholder="বছর নির্বাচন করুন" />
                </SelectTrigger>

                <SelectContent>
                  {[2025, 2026, 2027, 2028].map((item) => (
                    <SelectItem key={item} value={String(item)}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold">Summary</h3>

                <div className="mt-2 text-sm space-y-1">
                  <p>Total Donor : {filteredDonors.length}</p>

                  <p>Selected : {selectedIds.length}</p>
                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div>
              <Input
                placeholder="নাম / কোড / মোবাইল দিয়ে খুঁজুন"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="flex justify-end mt-3">
                <Button
                  size="sm"
                  onClick={handleSelectAll}
                  className="cursor-pointer"
                >
                  {allSelected ? "Unselect All" : "Select All"}
                </Button>
              </div>

              <div className="overflow-y-auto h-[500px] mt-2  rounded-md">
                {filteredDonors.map((item) => (
                  <label
                    key={item.id}
                    className="flex gap-2 mb-2 bg-gray-100 border p-4 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleDonor(item.id)}
                    />

                    <div className="flex-1">
                      <p className="font-medium">{item.donor.name}</p>

                      <p className="text-xs text-muted-foreground">
                        Code: {item.donor.code}
                        {" • "}
                        {item.donor.mobile1}
                        {" • "}
                        {item.monthlyAmount} টাকা
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <Button
                className="w-full mt-4"
                disabled={loading}
                onClick={handleGenerate}
              >
                {loading ? "Generating..." : "Generate Payment"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
