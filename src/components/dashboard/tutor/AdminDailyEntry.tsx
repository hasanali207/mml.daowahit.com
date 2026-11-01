"use client";

import { useCurrentToken } from "@/Redux/Features/Auth/authSlice";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

const BASE = `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacherresp`;

interface EntryItem {
  teacherResponsibilityId: string;
  teacher: { id: string; name: string };
  responsibility: { id: string; title: string };
  entry: { done: boolean; reason: string | null } | null;
}

// ✅ teacher wise structure
interface TeacherBlock {
  teacher: { id: string; name: string };
  assignments: {
    teacherResponsibilityId: string;
    responsibility: { id: string; title: string };
    entry: { done: boolean; reason: string | null } | null;
  }[];
}

// key = teacherResponsibilityId
interface CellState {
  done: boolean | null;
  reason: string;
}

type StateMap = Record<string, CellState>;

export default function AdminDailyEntry() {
  const token = useSelector(useCurrentToken);

  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [items, setItems] = useState<EntryItem[]>([]);
  const [state, setState] = useState<StateMap>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ teacher wise group
  const teacherBlocks = useMemo<TeacherBlock[]>(() => {
    const map = new Map<string, TeacherBlock>();
    items.forEach((item) => {
      if (!map.has(item.teacher.id)) {
        map.set(item.teacher.id, { teacher: item.teacher, assignments: [] });
      }
      map.get(item.teacher.id)!.assignments.push({
        teacherResponsibilityId: item.teacherResponsibilityId,
        responsibility: item.responsibility,
        entry: item.entry,
      });
    });
    return [...map.values()];
  }, [items]);

  useEffect(() => {
    if (!date) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE}/daily-entries`, {
          params: { date },
          headers: { Authorization: token },
        });
        const data: EntryItem[] = res.data.data;
        setItems(data);

        // ✅ key = teacherResponsibilityId
        const init: StateMap = {};
        data.forEach((item) => {
          init[item.teacherResponsibilityId] = {
            done: item.entry !== null ? item.entry.done : null,
            reason: item.entry?.reason || "",
          };
        });
        setState(init);
      } catch {
        toast.error("লোড হয়নি");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date, token]);

  const toggle = (trId: string, val: boolean) => {
    setState((prev) => ({
      ...prev,
      [trId]: { done: val, reason: val ? "" : prev[trId]?.reason || "" },
    }));
  };

  const setReason = (trId: string, val: string) => {
    setState((prev) => ({
      ...prev,
      [trId]: { ...prev[trId], reason: val },
    }));
  };

  const bulkUpdate = (block: TeacherBlock, value: boolean | null) => {
    setState((prev) => {
      const updated = { ...prev };
      block.assignments.forEach((a) => {
        updated[a.teacherResponsibilityId] = {
          done: value,
          reason: value ? "" : prev[a.teacherResponsibilityId]?.reason || "",
        };
      });
      return updated;
    });
  };

  // stats
  const total = items.length;
  const filled = Object.values(state).filter((c) => c.done !== null).length;
  const yesCount = Object.values(state).filter((c) => c.done === true).length;
  const noCount = Object.values(state).filter((c) => c.done === false).length;

  const cardProgress = (block: TeacherBlock) =>
    block.assignments.filter(
      (a) => state[a.teacherResponsibilityId]?.done !== null,
    ).length;

  const handleSubmit = async () => {
    if (filled < total) {
      toast.error("সব পূরণ করুন");
      return;
    }

    const payload = items.map((item) => ({
      teacherResponsibilityId: item.teacherResponsibilityId,
      done: state[item.teacherResponsibilityId]?.done!,
      reason: state[item.teacherResponsibilityId]?.done
        ? undefined
        : state[item.teacherResponsibilityId]?.reason || undefined,
      entrydate: date,
    }));

    setSubmitting(true);
    try {
      await axios.post(
        `${BASE}/daily-entries/submit`,
        { payload },
        { headers: { Authorization: token } },
      );
      toast.success("সফলভাবে সংরক্ষিত হয়েছে!");
    } catch {
      toast.error("সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const bdDateLabel = new Date(date).toLocaleDateString("bn-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">দৈনিক এন্ট্রি</h1>
        <p className="text-sm text-gray-500 mt-1">
          প্রতিটি শিক্ষকের দায়িত্ব হ্যা / না দিয়ে পূরণ করুন
        </p>
      </div>

      {/* DATE BAR */}
      <div className="flex items-center gap-3 mb-6 flex-wrap bg-white border rounded-xl px-4 py-3 shadow-sm">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="text-sm text-gray-500">{bdDateLabel}</span>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "মোট", val: total, color: "text-gray-900" },
          { label: "হ্যা", val: yesCount, color: "text-green-600" },
          { label: "না", val: noCount, color: "text-red-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border rounded-xl p-4 text-center shadow-sm"
          >
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-semibold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl border">
          এই তারিখে কোনো assignment নেই
        </div>
      ) : (
        <>
          {/* ✅ TEACHER BLOCKS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {teacherBlocks.map((block) => (
              <div
                key={block.teacher.id}
                className="bg-white border rounded-2xl shadow-sm overflow-hidden"
              >
                {/* CARD HEADER */}
                <div className="px-4 py-3 border-b flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {block.teacher.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {block.teacher.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">
                      {cardProgress(block)}/{block.assignments.length}
                    </span>
                    <button
                      onClick={() => bulkUpdate(block, true)}
                      className="px-2 py-1 text-xs rounded-md border bg-green-50 text-green-700 hover:bg-secondary transition"
                    >
                      সব হ্যা
                    </button>
                    <button
                      onClick={() => bulkUpdate(block, false)}
                      className="px-2 py-1 text-xs rounded-md border bg-red-50 text-red-600 hover:bg-red-100 transition"
                    >
                      সব না
                    </button>
                    <button
                      onClick={() => bulkUpdate(block, null)}
                      className="px-2 py-1 text-xs rounded-md border bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                    >
                      রিসেট
                    </button>
                  </div>
                </div>

                {/* ✅ শুধু assigned responsibilities */}
                {block.assignments.map((a, idx) => {
                  const cell = state[a.teacherResponsibilityId];
                  return (
                    <div
                      key={a.teacherResponsibilityId}
                      className="border-b last:border-0"
                    >
                      <div className="flex items-start gap-3 px-4 py-2.5">
                        <span className="text-xs text-gray-300 mt-0.5 min-w-[18px]">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-700 flex-1 leading-snug">
                          {a.responsibility.title}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() =>
                              toggle(a.teacherResponsibilityId, true)
                            }
                            className={`px-2.5 py-1 text-xs rounded-md border transition ${
                              cell?.done === true
                                ? "bg-primary text-white border-green-600"
                                : "bg-white text-gray-400 border-gray-200 hover:bg-green-50"
                            }`}
                          >
                            হ্যা
                          </button>
                          <button
                            onClick={() =>
                              toggle(a.teacherResponsibilityId, false)
                            }
                            className={`px-2.5 py-1 text-xs rounded-md border transition ${
                              cell?.done === false
                                ? "bg-red-600 text-white border-red-600"
                                : "bg-white text-gray-400 border-gray-200 hover:bg-red-50"
                            }`}
                          >
                            না
                          </button>
                        </div>
                      </div>

                      {cell?.done === false && (
                        <div className="px-4 pb-2.5 pl-10">
                          <input
                            value={cell.reason}
                            onChange={(e) =>
                              setReason(
                                a.teacherResponsibilityId,
                                e.target.value,
                              )
                            }
                            placeholder="কারণ লিখুন..."
                            className="w-full border rounded-md px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-300"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* SUBMIT BAR */}
          <div className="flex items-center justify-between bg-white border rounded-xl px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-500">
              {filled} / {total} পূরণ হয়েছে
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting || filled < total}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                submitting || filled < total
                  ? "bg-gray-300 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {submitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
