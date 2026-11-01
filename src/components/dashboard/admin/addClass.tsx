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
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/* ================= TYPE DEFINITIONS ================= */
interface Session {
  id: string;
  name: string;
}

interface ClassType {
  id: string;
  name: string;
  sessionId: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/* ================= COMPONENT ================= */
const AddClass = () => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_API;

  /* ================= STATES ================= */
  const [sessionList, setSessionList] = useState<Session[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [classesForSession, setClassesForSession] = useState<ClassType[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [className, setClassName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  /* ================= LOAD SESSIONS & CLASSES ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch sessions
        const resSessions = await fetch(`${BASE_URL}/api/v1/session`);
        const dataSessions: ApiResponse<Session[]> = await resSessions.json();
        const sessions = dataSessions.data || [];
        setSessionList(sessions);

        // Fetch classes
        const resClasses = await fetch(`${BASE_URL}/api/v1/class`);
        const dataClasses: ApiResponse<ClassType[]> = await resClasses.json();
        const allClasses = dataClasses.data || [];
        setClasses(allClasses);

        // Select first session by default
        if (sessions.length > 0) {
          const firstSessionId = sessions[0].id;
          setSelectedSessionId(firstSessionId);

          // Filter classes for first session
          const filtered = allClasses.filter(
            (c) => c.sessionId === firstSessionId
          );
          setClassesForSession(filtered);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load sessions or classes");
      }
    };

    loadData();
  }, [BASE_URL]);

  /* ================= HANDLE SESSION CHANGE ================= */
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedClassId(""); // reset class selection
    const filteredClasses = classes.filter((c) => c.sessionId === sessionId);
    setClassesForSession(filteredClasses);
  };

  /* ================= HANDLE SUBMIT ================= */
  const handleSubmit = async () => {
    if (!selectedSessionId || !className) {
      toast.error("সব ঘর পূরণ করুন");
      return;
    }

    setLoading(true);
    try {
      const url = editingClassId
        ? `${BASE_URL}/api/v1/class/${editingClassId}`
        : `${BASE_URL}/api/v1/class`;
      const method = editingClassId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: className, sessionId: selectedSessionId }),
      });
      const result: ApiResponse<ClassType> = await res.json();

      if (!res.ok || result.success === false) {
        toast.error(result.message || "কিছু ভুল হয়েছে");
        return;
      }

      toast.success(result.message || "সফলভাবে সংরক্ষিত হয়েছে");
      setClassName("");
      setSelectedClassId("");
      setEditingClassId(null);

      // Refresh classes after submit
      const resClasses = await fetch(`${BASE_URL}/api/v1/class`);
      const dataClasses: ApiResponse<ClassType[]> = await resClasses.json();
      const allClasses = dataClasses.data || [];
      setClasses(allClasses);

      // Update filtered classes for selected session
      const filtered = allClasses.filter(
        (c) => c.sessionId === selectedSessionId
      );
      setClassesForSession(filtered);
    } catch (err) {
      console.error(err);
      toast.error("সার্ভার সমস্যা");
    } finally {
      setLoading(false);
    }
  };

  /* ================= HANDLE EDIT ================= */
  const handleEdit = (cls: ClassType) => {
    setEditingClassId(cls.id);
    setClassName(cls.name);
    setSelectedSessionId(cls.sessionId);
    handleSessionChange(cls.sessionId);
    setSelectedClassId(cls.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= RENDER ================= */
  return (
    <div className="space-y-10">
      {/* ========== ADD / UPDATE FORM ========== */}
      <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-4">
          {editingClassId ? "Update Class" : "Add Class"}
        </h1>

        <div className="space-y-4">
          {/* Session select */}
          <div>
            <label className="mb-1 block font-medium">Select Session</label>
            <Select
              onValueChange={(value: string) => handleSessionChange(value)}
              value={selectedSessionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent>
                {sessionList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Name */}
          <div>
            <label className="mb-1 block font-medium">Class Name</label>
            <Input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Class Name"
            />
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Saving..." : editingClassId ? "Update" : "Save"}
          </Button>
        </div>
      </div>

      {/* ========== CLASSES LIST ========== */}
      <div className="max-w-4xl mx-auto bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">All Classes</h3>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr className="text-center">
              <th className="border p-2">Class Name</th>
              <th className="border p-2">Session</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classesForSession.map((cls) => {
              const sessionName =
                sessionList.find((s) => s.id === cls.sessionId)?.name || "-";
              return (
                <tr key={cls.id} className="text-center">
                  <td className="border p-2">{cls.name}</td>
                  <td className="border p-2">{sessionName}</td>
                  <td className="border p-2 space-x-2">
                    <Button size="sm" onClick={() => handleEdit(cls)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddClass;
