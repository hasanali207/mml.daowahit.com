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
import { selectCurrentUser } from "@/Redux/Features/Auth/authSlice";
import { useAppSelector } from "@/Redux/hook";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/* ---------------- Types ---------------- */
type SessionType = { id: string; name: string };
type ClassType = { id: string; name: string };
type FeeCategoryType = { id: string; name: string };
type ClassFeeType = {
  id: string;
  amount: number;
  feeCategory: FeeCategoryType;
};

/* ---------------- Component ---------------- */
export default function ClassFeePage() {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const currentUser = useAppSelector(selectCurrentUser);

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);

  const [feeCategories, setFeeCategories] = useState<FeeCategoryType[]>([]);
  const [classFees, setClassFees] = useState<ClassFeeType[]>([]);

  const [form, setForm] = useState({
    feeCategoryId: "",
    amount: "",
  });

  /* ---------------- Fetch Sessions ---------------- */
  const fetchSessions = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session`,
      );
      const json = await res.json();
      setSessions(json.data || []);

      if (json.data?.length) {
        setSelectedSessionId(json.data[0].id);
      }
    } catch {
      toast.error("Failed to fetch sessions");
    }
  };

  /* ---------------- Fetch Classes by Session ---------------- */
  const fetchClasses = async (sessionId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session/${sessionId}/classes`,
      );
      const json = await res.json();
      setClasses(json.data || []);
      setSelectedClass(null);
      setClassFees([]);
    } catch {
      toast.error("Failed to fetch classes");
    }
  };

  /* ---------------- Fetch Fee Categories ---------------- */
  const fetchFeeCategories = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/feecategory`,
      );
      const json = await res.json();
      if (json.success) setFeeCategories(json.data || []);
    } catch {
      toast.error("Failed to fetch fee categories");
    }
  };

  /* ---------------- Fetch Class Fees ---------------- */
  const fetchClassFees = async (classId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/classfee/${classId}`,
      );
      const json = await res.json();
      setClassFees(Array.isArray(json.data) ? json.data : []);
    } catch {
      toast.error("Failed to fetch class fees");
    }
  };

  /* ---------------- Effects ---------------- */
  useEffect(() => {
    fetchSessions();
    fetchFeeCategories();
  }, []);

  useEffect(() => {
    if (selectedSessionId) fetchClasses(selectedSessionId);
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedClass) fetchClassFees(selectedClass.id);
  }, [selectedClass]);

  /* ---------------- Save Fee ---------------- */
  const handleSave = async () => {
    if (!selectedClass) return toast.error("Select a class");
    if (!form.feeCategoryId || !form.amount)
      return toast.error("Fill all fields");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/classfee`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId: selectedClass.id,
            feeCategoryId: form.feeCategoryId,
            amount: Number(form.amount),
          }),
        },
      );

      if (!res.ok) throw new Error();

      toast.success("Fee saved");
      setForm({ feeCategoryId: "", amount: "" });
      fetchClassFees(selectedClass.id);
    } catch {
      toast.error("Failed to save fee");
    }
  };

  /* ---------------- Delete Fee ---------------- */
  const handleDelete = async (id: string) => {
    if (!selectedClass) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/classfee/${id}`,
        { method: "DELETE" },
      );

      if (!res.ok) throw new Error();

      toast.success("Deleted");
      fetchClassFees(selectedClass.id);
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ---------------- Edit Fee ---------------- */
  const handleEdit = (fee: ClassFeeType) => {
    setForm({
      feeCategoryId: fee.feeCategory.id,
      amount: String(fee.amount),
    });
  };

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  /* ---------------- UI ---------------- */
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Class Fee Management</h2>

      <div className="flex gap-4 mb-4">
        <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Select Session" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedClass?.id || ""}
          onValueChange={(id) =>
            setSelectedClass(classes.find((c) => c.id === id) || null)
          }
        >
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 mb-6">
        <Select
          value={form.feeCategoryId}
          onValueChange={(v) => setForm({ ...form, feeCategoryId: v })}
        >
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Fee Category" />
          </SelectTrigger>
          <SelectContent>
            {feeCategories.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />

        <Button onClick={handleSave} className="bg-primary text-white">
          Save
        </Button>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {classFees.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center">
                No fees found
              </td>
            </tr>
          )}
          {classFees.map((f, i) => (
            <tr key={f.id} className="text-center">
              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">{f.feeCategory.name}</td>
              <td className="border p-2">{f.amount}</td>
              <td className="border p-2 flex justify-center gap-2">
                <Button size="sm" onClick={() => handleEdit(f)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(f.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
