"use client";

import { useCurrentToken } from "@/Redux/Features/Auth/authSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

const BASE = `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacherresp`;

interface ReportItem {
  id: string;
  done: boolean;
  reason: string | null;
  entrydate: string;
  teacherResponsibility: {
    teacher: { id: string; name: string };
    responsibility: { id: string; title: string };
  };
}

export default function AdminDailyReport() {
  const token = useSelector(useCurrentToken);
  const headers = { Authorization: token };

  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE}/daily-report`, {
          params: { date },
          headers,
        });
        setItems(res.data.data);
      } catch {
        toast.error("লোড হয়নি");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date]);

  // unique teachers & responsibilities
  const teachers = [
    ...new Map(
      items.map((i) => [
        i.teacherResponsibility.teacher.id,
        i.teacherResponsibility.teacher,
      ]),
    ).values(),
  ];

  const responsibilities = [
    ...new Map(
      items.map((i) => [
        i.teacherResponsibility.responsibility.id,
        i.teacherResponsibility.responsibility,
      ]),
    ).values(),
  ];

  // cell finder
  const getCell = (teacherId: string, respId: string) =>
    items.find(
      (i) =>
        i.teacherResponsibility.teacher.id === teacherId &&
        i.teacherResponsibility.responsibility.id === respId,
    );

  // stats
  const total = items.length;
  const yes = items.filter((i) => i.done).length;
  const no = items.filter((i) => !i.done).length;
  const pct = total > 0 ? Math.round((yes / total) * 100) : 0;

  // teacher summary
  const teacherSummary = (tid: string) => {
    const tItems = items.filter(
      (i) => i.teacherResponsibility.teacher.id === tid,
    );
    return {
      yes: tItems.filter((i) => i.done).length,
      no: tItems.filter((i) => !i.done).length,
      total: responsibilities.length,
    };
  };

  const bdDateLabel = new Date(date).toLocaleDateString("bn-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("");

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          📊 দৈনিক রিপোর্ট
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          তারিখ অনুযায়ী শিক্ষকদের দায়িত্ব পালনের চিত্র
        </p>
      </div>

      {/* DATE BAR */}
      <div className="flex items-center gap-3 mb-6 flex-wrap bg-white p-3 rounded-xl shadow-sm border">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <span className="text-sm text-gray-500 font-medium">
          📅 {bdDateLabel}
        </span>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "মোট এন্ট্রি",
            val: total,
            color: "text-gray-800",
            bg: "bg-white",
          },
          {
            label: "হ্যা",
            val: yes,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          { label: "না", val: no, color: "text-red-500", bg: "bg-red-50" },
          {
            label: "সম্পন্নের হার",
            val: `${pct}%`,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-2xl p-4 text-center shadow-sm border hover:shadow-md transition`}
          >
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20 animate-pulse">
          ⏳ লোড হচ্ছে...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          🚫 এই তারিখে কোনো ডেটা নেই
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm min-w-[800px]">
            <thead className="bg-gray-100 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 font-semibold border-b">
                  শিক্ষক
                </th>

                {responsibilities.map((r) => (
                  <th
                    key={r.id}
                    className="px-3 py-3 text-center text-gray-600 font-semibold border-b align-top"
                  >
                    <span className="block whitespace-normal break-words text-xs leading-tight">
                      {r.title}
                    </span>
                  </th>
                ))}

                <th className="px-4 py-3 text-center text-gray-600 font-semibold border-b">
                  সারসংক্ষেপ
                </th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {teachers.map((teacher) => {
                const {
                  yes: tYes,
                  no: tNo,
                  total: tTotal,
                } = teacherSummary(teacher.id);

                const yesW = tTotal > 0 ? Math.round((tYes / tTotal) * 100) : 0;
                const noW = tTotal > 0 ? Math.round((tNo / tTotal) * 100) : 0;

                return (
                  <tr
                    key={teacher.id}
                    className="border-b hover:bg-blue-50/40 transition"
                  >
                    {/* TEACHER */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-800">
                          {teacher.name}
                        </span>
                      </div>
                    </td>

                    {/* CELLS */}
                    {responsibilities.map((resp) => {
                      const cell = getCell(teacher.id, resp.id);

                      return (
                        <td key={resp.id} className="px-3 py-3 text-center">
                          {!cell ? (
                            <span className="text-gray-200">—</span>
                          ) : cell.done ? (
                            <span className="px-2 py-1 rounded-full bg-primary text-white text-xs font-semibold shadow-sm">
                              ✔ হ্যা
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold shadow-sm">
                                ✖ না
                              </span>
                              {cell.reason && (
                                <span
                                  className=" text-gray-600 text-[10px]  truncate"
                                  title={cell.reason}
                                >
                                  {cell.reason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* SUMMARY */}
                    <td className="px-4 py-3 text-center">
                      <div className="text-xs text-gray-500 mb-1 font-medium">
                        {tYes}✔ {tNo}✖
                      </div>

                      <div className="flex h-2 rounded-full overflow-hidden w-24 mx-auto bg-gray-100">
                        <div
                          className="bg-primary"
                          style={{ width: `${yesW}%` }}
                        />
                        <div
                          className="bg-red-400"
                          style={{ width: `${noW}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
