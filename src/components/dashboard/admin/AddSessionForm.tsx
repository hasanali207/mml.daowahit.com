"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as Checkbox from "@radix-ui/react-checkbox";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Session = {
  id: string;
  name: string;
  yearStart: number;
  yearEnd: number;
  isActive: boolean;
};

export default function SessionPage() {
  /* ================= FORM STATE ================= */
  const [form, setForm] = useState({
    name: "",
    yearStart: "",
    yearEnd: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [fetching, setFetching] = useState(true);

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_API;

  /* ================= FETCH ALL SESSIONS ================= */
  const fetchSessions = async () => {
    try {
      setFetching(true);
      const res = await fetch(`${BASE_URL}/api/v1/session/activeinactive`);
      const data = await res.json();
      setSessions(data.data || []);
    } catch {
      toast.error("সেশন লোড করা যায়নি");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  /* ================= FORM HANDLERS ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.yearStart || !form.yearEnd) {
      toast.error("সব ঘর পূরণ করুন");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/v1/session/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          yearStart: Number(form.yearStart),
          yearEnd: Number(form.yearEnd),
          isActive: form.isActive,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("নতুন সেশন যোগ হয়েছে");
        setForm({ name: "", yearStart: "", yearEnd: "", isActive: true });
        fetchSessions();
      } else {
        toast.error(data.message || "কিছু ভুল হয়েছে");
      }
    } catch {
      toast.error("সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  /* ================= ACTIVE / DEACTIVE ================= */
  const toggleSessionStatus = async (id: string, active: boolean) => {
    try {
      const url = active
        ? `${BASE_URL}/api/v1/session/${id}/active`
        : `${BASE_URL}/api/v1/session/${id}/deactive`;

      const res = await fetch(url, { method: "PATCH" });
      const data = await res.json();

      if (res.ok) {
        toast.success(active ? "সেশন Active হয়েছে" : "সেশন Deactive হয়েছে");
        fetchSessions();
      } else {
        toast.error(data.message || "কাজটি সম্পন্ন হয়নি");
      }
    } catch {
      toast.error("সার্ভার সমস্যা");
    }
  };

  return (
    <div className="space-y-10">
      {/* ================= ADD SESSION FORM ================= */}
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-2xl p-6 space-y-5">
        <h2 className="text-xl font-semibold text-center">
          নতুন সেশন যুক্ত করুন
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>সেশন নাম</Label>
            <Input
              name="name"
              placeholder="নুরানী ২০২৬-২৭"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>শুরুর বছর</Label>
              <Input
                type="number"
                name="yearStart"
                value={form.yearStart}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label>শেষ বছর</Label>
              <Input
                type="number"
                name="yearEnd"
                value={form.yearEnd}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox.Root
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm((p) => ({ ...p, isActive: Boolean(checked) }))
              }
              className="w-5 h-5 border rounded flex items-center justify-center"
            >
              <Checkbox.Indicator>✓</Checkbox.Indicator>
            </Checkbox.Root>
            <Label>সক্রিয় সেশন</Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "সংরক্ষণ হচ্ছে..." : "সেশন যুক্ত করুন"}
          </Button>
        </form>
      </div>

      {/* ================= SESSION LIST ================= */}
      <div className="max-w-4xl mx-auto bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">সব সেশন</h3>

        {fetching ? (
          <p className="text-center py-4">লোড হচ্ছে...</p>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">নাম</th>
                <th className="border p-2">বছর</th>
                <th className="border p-2">স্ট্যাটাস</th>
                <th className="border p-2">একশন</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="text-center">
                  <td className="border p-2">{s.name}</td>
                  <td className="border p-2">
                    {s.yearStart} - {s.yearEnd}
                  </td>
                  <td className="border p-2">
                    {s.isActive ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 font-medium">Deactive</span>
                    )}
                  </td>
                  <td className="border p-2">
                    {s.isActive ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => toggleSessionStatus(s.id, false)}
                      >
                        Deactive
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => toggleSessionStatus(s.id, true)}
                      >
                        Active
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
