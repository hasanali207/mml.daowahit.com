"use client";

import { useCurrentToken } from "@/Redux/Features/Auth/authSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

const BASE = `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacherresp`;

interface Responsibility {
  id: string;
  title: string;
}
interface Teacher {
  id: string;
  name: string;
}

export default function ResponsibilityManage() {
  const token = useSelector(useCurrentToken);
  const headers = { Authorization: token };

  const [responsibilities, setResponsibilities] = useState<Responsibility[]>(
    [],
  );
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [selectedResp, setSelectedResp] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([]);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, tRes] = await Promise.all([
          axios.get(`${BASE}/responsibility/all`, { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacher/`, {
            headers,
          }),
        ]);
        setResponsibilities(rRes.data.data);
        setTeachers(tRes.data.data);
      } catch {
        toast.error("লোড হয়নি");
      }
    };
    load();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await axios.post(
        `${BASE}/responsibility/create`,
        { title: newTitle },
        { headers },
      );
      setResponsibilities((prev) => [...prev, res.data.data]);
      setNewTitle("");
      toast.success("তৈরি হয়েছে!");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "ব্যর্থ হয়েছে");
    } finally {
      setCreating(false);
    }
  };

  const addTeacher = (id: string) => {
    const t = teachers.find((t) => t.id === id);
    if (t && !selectedTeachers.find((s) => s.id === id)) {
      setSelectedTeachers((prev) => [...prev, t]);
    }
  };

  const removeTeacher = (id: string) =>
    setSelectedTeachers((prev) => prev.filter((t) => t.id !== id));

  const handleAssign = async () => {
    if (!selectedResp || !selectedTeachers.length) return;
    setAssigning(true);
    try {
      await axios.post(
        `${BASE}/assign`,
        {
          teacherIds: selectedTeachers.map((t) => t.id),
          responsibilityId: selectedResp,
        },
        { headers },
      );
      setSelectedTeachers([]);
      setSelectedResp("");
      toast.success("Assign হয়েছে!");
    } catch {
      toast.error("ব্যর্থ হয়েছে");
    } finally {
      setAssigning(false);
    }
  };

  const availableTeachers = teachers.filter(
    (t) => !selectedTeachers.find((s) => s.id === t.id),
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          দায়িত্ব ব্যবস্থাপনা
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          নতুন দায়িত্ব তৈরি করুন এবং শিক্ষকদের assign করুন
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ===== CREATE CARD ===== */}
        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
              +
            </div>
            <div>
              <p className="text-sm font-semibold">নতুন দায়িত্ব তৈরি</p>
              <p className="text-xs text-gray-400">
                Responsibility list এ যোগ করুন
              </p>
            </div>
          </div>

          <div className="p-4">
            <label className="text-xs text-gray-500 block mb-1">
              দায়িত্বের শিরোনাম
            </label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="যেমন: শিট দেখেছেন কি না?"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
              className="w-full py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {creating ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
            </button>

            {/* LIST */}
            <div className="mt-4 border-t pt-3">
              <p className="text-xs text-gray-400 font-medium mb-2">
                বিদ্যমান দায়িত্বসমূহ
              </p>
              {responsibilities.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">
                  কোনো দায়িত্ব নেই
                </p>
              ) : (
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {responsibilities.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 py-1.5 border-b last:border-0"
                    >
                      <span className="text-xs text-gray-300 min-w-[18px]">
                        {i + 1}.
                      </span>
                      <span className="text-xs text-gray-700 flex-1">
                        {r.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-green-700">
                        সক্রিয়
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== ASSIGN CARD ===== */}
        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-green-600 text-sm font-bold">
              →
            </div>
            <div>
              <p className="text-sm font-semibold">শিক্ষকদের assign করুন</p>
              <p className="text-xs text-gray-400">
                একাধিক শিক্ষককে একসাথে assign করুন
              </p>
            </div>
          </div>

          <div className="p-4">
            <label className="text-xs text-gray-500 block mb-1">
              দায়িত্ব বেছে নিন
            </label>
            <select
              value={selectedResp}
              onChange={(e) => setSelectedResp(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            >
              <option value="">-- বেছে নিন --</option>
              {responsibilities.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>

            <label className="text-xs text-gray-500 block mb-1">
              শিক্ষক যোগ করুন
            </label>
            <select
              value=""
              onChange={(e) => {
                addTeacher(e.target.value);
                e.target.value = "";
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            >
              <option value="">-- শিক্ষক বেছে নিন --</option>
              {availableTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* TAGS */}
            <div className="min-h-[40px] flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50 mb-3">
              {selectedTeachers.length === 0 ? (
                <span className="text-xs text-gray-300 self-center">
                  কোনো শিক্ষক যোগ হয়নি
                </span>
              ) : (
                selectedTeachers.map((t) => (
                  <span
                    key={t.id}
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {t.name}
                    <button
                      onClick={() => removeTeacher(t.id)}
                      className="text-blue-500 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            <button
              onClick={handleAssign}
              disabled={assigning || !selectedResp || !selectedTeachers.length}
              className="w-full py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {assigning ? "Assign হচ্ছে..." : "Assign করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
