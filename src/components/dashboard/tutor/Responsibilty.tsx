"use client";

import { useCurrentToken } from "@/Redux/Features/Auth/authSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

/* ================= TYPES ================= */
interface Responsibility {
  id: string;
  responsibilityId: string;
  responsibility: { title: string };
  done: boolean;
  reason?: string;
  entrydate: string;
  updatedAt: string;
}

/* ================= DATE UTILS ================= */
const getDateKey = (date: string) => {
  return new Date(date).toDateString();
};

const isToday = (date: string) => {
  const d = new Date(date);
  const t = new Date();

  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
};

const isOverdue = (date: string, done: boolean) => {
  const d = new Date(date);
  const t = new Date();

  return d < t && !done;
};

/* ================= GROUP BY DATE ================= */
const groupByDate = (data: Responsibility[]) => {
  return data.reduce((acc: Record<string, Responsibility[]>, item) => {
    const key = getDateKey(item.entrydate);

    if (!acc[key]) acc[key] = [];
    acc[key].push(item);

    return acc;
  }, {});
};

/* ================= MAIN COMPONENT ================= */
export default function TeacherCalendar() {
  const token = useSelector(useCurrentToken);

  const [data, setData] = useState<Responsibility[]>([]);
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacher/teacher/my-responsibilities`,
          {
            headers: { Authorization: token },
          },
        );
        setData(res.data.data);
      } catch {
        toast.error("Failed to load");
      }
    };

    fetch();
  }, [token]);

  /* ================= AUTO SAVE ================= */
  const autoSave = async (item: Responsibility) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacher/update-responsibility`,
        {
          id: item.id,
          done: item.done,
          reason: item.reason,
        },
        {
          headers: { Authorization: token },
        },
      );
    } catch {
      toast.error("Auto save failed");
    }
  };

  /* ================= FIELD UPDATE ================= */
  const updateField = (id: string, field: string, value: any) => {
    setData((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      );

      const changed = updated.find((r) => r.id === id);
      if (changed) autoSave(changed); // ⚡ AUTO SAVE

      return updated;
    });
  };

  /* ================= TOGGLE COLLAPSE ================= */
  const toggleDate = (date: string) => {
    setOpenDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  /* ================= GROUP ================= */
  const grouped = groupByDate(data);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        📅 Google Calendar Style Responsibilities
      </h1>

      {/* ================= MONTH VIEW GRID ================= */}
      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(grouped)
          .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
          .map(([date, items]) => {
            const today = items.some((i) => isToday(i.entrydate));

            const doneCount = items.filter((i) => i.done).length;
            const percent = Math.round((doneCount / items.length) * 100);

            const open = openDates[date] ?? true;

            return (
              <div
                key={date}
                className={`rounded-2xl border p-4 shadow-sm transition ${
                  today ? "border-green-500" : "border-gray-200"
                }`}
              >
                {/* ================= HEADER ================= */}
                <div
                  onClick={() => toggleDate(date)}
                  className="cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <h2 className="font-bold text-sm">
                      📅 {date}
                      {today && (
                        <span className="ml-2 text-xs bg-secondary text-green-700 px-2 py-1 rounded-full">
                          Today
                        </span>
                      )}
                    </h2>

                    {/* completion */}
                    <p className="text-xs text-gray-500 mt-1">
                      ✅ {doneCount}/{items.length} ({percent}%)
                    </p>
                  </div>

                  <span className="text-xs text-gray-400">
                    {open ? "▲" : "▼"}
                  </span>
                </div>

                {/* ================= COLLAPSIBLE BODY ================= */}
                {open && (
                  <div className="mt-4 space-y-3">
                    {items.map((r) => (
                      <div
                        key={r.id}
                        className={`border rounded-xl p-3 transition ${
                          isOverdue(r.entrydate, r.done)
                            ? "border-red-500 bg-red-50"
                            : r.done
                              ? "bg-green-50"
                              : "bg-gray-50"
                        }`}
                      >
                        {/* TITLE */}
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            {r.responsibility.title}
                          </span>

                          <button
                            onClick={() => updateField(r.id, "done", !r.done)}
                            className={`px-2 py-1 text-xs rounded-full ${
                              r.done
                                ? "bg-primary text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {r.done ? "✔ Done" : "❌ Pending"}
                          </button>
                        </div>

                        {/* REASON */}
                        {!r.done && (
                          <input
                            value={r.reason || ""}
                            onChange={(e) =>
                              updateField(r.id, "reason", e.target.value)
                            }
                            className="mt-2 w-full border px-2 py-1 text-xs rounded"
                            placeholder="Write reason..."
                          />
                        )}

                        {/* STATUS TEXT */}
                        {isOverdue(r.entrydate, r.done) && (
                          <p className="text-xs text-red-600 mt-1">⚠ Overdue</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
