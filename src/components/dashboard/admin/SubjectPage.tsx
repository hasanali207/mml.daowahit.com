"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SubjectPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: "", code: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", code: "", classId: "" });

  // ✅ Fetch Sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session`,
        );
        const data = await res.json();

        if (data.success) {
          setSessions(data.data);
          if (data.data.length > 0) setSelectedSession(data.data[0]);
        }
      } catch (e) {
        console.error("Session fetch error:", e);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    if (!selectedSession?.id) return;

    async function fetchClasses() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/session/${selectedSession.id}/classes`,
        );
        const data = await res.json();

        if (data.success) {
          setClasses(data.data);
          setSelectedClass(data.data[0] || null);
        } else {
          setClasses([]);
          setSelectedClass(null);
        }
      } catch (err) {
        console.error("Class fetch error", err);
        setClasses([]);
        setSelectedClass(null);
      }
    }

    fetchClasses();
  }, [selectedSession]);

  // ✅ Fetch subjects
  const fetchSubjects = async (classId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/subject/${classId}/class`,
      );
      const data = await res.json();
      setSubjects(data.success ? data.data : []);
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass?.id) fetchSubjects(selectedClass.id);
  }, [selectedClass]);

  // --------------------
  // CRUD Functions
  // --------------------

  const addSubject = async () => {
    if (!form.name) return toast.error("বিষয়ের নাম লিখুন!");
    if (!selectedClass?.id) return toast.error("একটি ক্লাস নির্বাচন করুন!");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/subject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId: selectedClass.id,
            subjects: [form],
          }),
        },
      );

      const data = await res.json();
      if (data.success) {
        toast.success("বিষয় যোগ হয়েছে!");
        setForm({ name: "", code: "" });
        fetchSubjects(selectedClass.id);
      } else toast.error(data.message);
    } catch {
      toast.error("যোগ ব্যর্থ হয়েছে!");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("মুছতে নিশ্চিত?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/subject/${id}`,
        { method: "DELETE" },
      );

      const data = await res.json();
      if (data.success) {
        toast.success("মুছে ফেলা হয়েছে!");
        fetchSubjects(selectedClass.id);
      }
    } catch {
      toast.error("কিছু ভুল হয়েছে!");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/subject/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        },
      );

      const data = await res.json();
      if (data.success) {
        toast.success("আপডেট হয়েছে!");
        setEditId(null);
        fetchSubjects(selectedClass.id);
      }
    } catch {}
  };

  return (
    <div className="p-6 space-y-6 text-bangla bangla">
      <h1 className="text-2xl text-center font-semibold text-green-800">
        📚 কিতাব / বিষয় তথ্য
      </h1>

      {/* SESSION SELECT */}
      <div className="flex justify-center gap-4">
        <label className="mt-2">সেশন:</label>

        <Select
          value={selectedSession?.id || ""}
          onValueChange={(value) => {
            const ses = sessions.find((s) => s.id === value);
            setSelectedSession(ses);
          }}
        >
          <SelectTrigger className="w-60">
            <SelectValue placeholder="সেশন নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((ses: any) => (
              <SelectItem key={ses.id} value={ses.id}>
                {ses.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* CLASS SELECT */}
      <div className="flex justify-center gap-4">
        <label className="mt-2">ক্লাস:</label>

        <Select
          value={selectedClass?.id || ""}
          onValueChange={(value) => {
            const cls = classes.find((c) => c.id === value);
            setSelectedClass(cls);
          }}
        >
          <SelectTrigger className="w-60">
            <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls: any) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ADD SUBJECT */}
      <div className="border p-4 bg-slate-50 rounded shadow">
        <h2 className="text-lg mb-3">
          ✏️ নতুন কিতাব যোগ করুন ({selectedClass?.name})
        </h2>

        <div className="grid grid-cols-3 gap-4">
          <Input
            placeholder="বিষয়ের নাম"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Input
            placeholder="কোড"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />

          <Button className="bg-primary" onClick={addSubject}>
            Add
          </Button>
        </div>
      </div>

      {/* SUBJECT TABLE */}
      <div className="border rounded p-4 bg-white shadow">
        <h2 className="text-lg mb-3">
          📖 সংরক্ষিত কিতাব তালিকা ({selectedClass?.name})
        </h2>

        {loading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <p className="text-center py-4">কোনো বিষয় পাওয়া যায়নি।</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-secondary">
                <th className="p-2">#</th>
                <th className="p-2">নাম</th>
                <th className="p-2">কোড</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {subjects.map((s: any, i: number) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{i + 1}</td>

                  {/* Name */}
                  <td className="p-2">
                    {editId === s.id ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      s.name
                    )}
                  </td>

                  {/* Code */}
                  <td className="p-2">
                    {editId === s.id ? (
                      <Input
                        value={editForm.code}
                        onChange={(e) =>
                          setEditForm({ ...editForm, code: e.target.value })
                        }
                      />
                    ) : (
                      s.code
                    )}
                  </td>

                  <td className="p-2 flex gap-2">
                    {editId === s.id ? (
                      <Button onClick={() => handleUpdate(s.id)}>Save</Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setEditId(s.id);
                          setEditForm({
                            name: s.name,
                            code: s.code,
                            classId: s.classId,
                          });
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(s.id)}
                    >
                      <Trash size={16} />
                    </Button>
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
