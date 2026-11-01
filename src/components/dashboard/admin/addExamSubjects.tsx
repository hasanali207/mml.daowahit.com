"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

/* ---------------- TYPES ---------------- */
type Session = { id: string; name: string };
type Class = { id: string; name: string };
type Exam = { id: string; examName: string };
type Subject = { id: string; name: string };

type ExamSubject = {
  id: string;
  subject: Subject;
  maxMarks: number;
  passMarks: number;
};

/* ---------------- COMPONENT ---------------- */
export default function ExamSubjectPage() {
  const API = process.env.NEXT_PUBLIC_BASE_API!;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);

  console.log({ examSubjects });

  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    maxMarks: "",
    passMarks: "",
  });

  const [form, setForm] = useState({
    subjectId: "",
    maxMarks: "",
    passMarks: "",
  });

  /* ---------------- FETCHERS ---------------- */
  useEffect(() => {
    fetch(`${API}/api/v1/session`)
      .then((res) => res.json())
      .then((d) => d.success && setSessions(d.data));
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API}/api/v1/session/${sessionId}/classes`)
      .then((res) => res.json())
      .then((d) => {
        setClasses(d.success ? d.data : []);
        setClassId("");
        setExamId("");
        setSubjects([]);
        setExamSubjects([]);
      });
  }, [sessionId]);

  useEffect(() => {
    if (!classId) return;

    fetch(`${API}/api/v1/exam/class/${classId}`)
      .then((res) => res.json())
      .then((d) => setExams(d.success ? d.data : []));

    fetch(`${API}/api/v1/subject?classId=${classId}`)
      .then((res) => res.json())
      .then((d) => setSubjects(d.success ? d.data : []));

    setExamId("");
    setExamSubjects([]);
  }, [classId]);

  useEffect(() => {
    if (!examId) return;
    fetch(`${API}/api/v1/examsubject/exam/${classId}/${examId}`)
      .then((res) => res.json())
      .then((d) => setExamSubjects(d.success ? d.data : []));
  }, [examId]);

  /* ---------------- CREATE ---------------- */
  const handleSubmit = async () => {
    if (!examId || !form.subjectId || !form.maxMarks || !form.passMarks) {
      return toast.error("সব ঘর পূরণ করুন");
    }

    if (examSubjects.some((es) => es.subject.id === form.subjectId)) {
      return toast.error("এই বিষয় ইতিমধ্যে যোগ করা আছে");
    }

    if (Number(form.maxMarks) <= 0 || Number(form.passMarks) <= 0) {
      return toast.error("Marks must be positive numbers");
    }

    if (Number(form.passMarks) > Number(form.maxMarks)) {
      return toast.error("Pass marks cannot exceed max marks");
    }
    const subjectName = subjects.find((s) => s.id === form.subjectId)?.name;

    const res = await fetch(`${API}/api/v1/examsubject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: subjectName,
        examId,
        classId,
        subjectId: form.subjectId,
        maxMarks: Number(form.maxMarks),
        passMarks: Number(form.passMarks),
      }),
    });

    const data = await res.json();
    if (!data.success) return toast.error("Save failed");

    if (data.success) {
      setExamSubjects((prev) => [data.data, ...prev]);
    }

    toast.success("Subject added");
    setForm({ subjectId: "", maxMarks: "", passMarks: "" });
    setExamId(examId);
  };

  /* ---------------- UPDATE ---------------- */
  const handleUpdate = async (
    id: string,
    data: { maxMarks: string; passMarks: string },
  ) => {
    try {
      const res = await fetch(`${API}/api/v1/examsubject/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxMarks: Number(data.maxMarks),
          passMarks: Number(data.passMarks),
        }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Updated successfully");

        // ✅ Update local state without refetch
        setExamSubjects((prev) =>
          prev.map((es) =>
            es.id === id
              ? {
                  ...es,
                  maxMarks: Number(data.maxMarks),
                  passMarks: Number(data.passMarks),
                }
              : es,
          ),
        );

        setEditingId(null); // close edit UI
      } else {
        toast.error(result.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error!");
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete subject?")) return;
    await fetch(`${API}/api/v1/examsubject/${id}`, { method: "DELETE" });
    setExamSubjects((prev) => prev.filter((es) => es.id !== id));
    toast.success("Deleted");
    setExamId(examId);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <h2 className="font-bold text-lg">📘 Exam Subject Setup</h2>

          <div className="grid md:grid-cols-4 gap-4">
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger>
                <SelectValue placeholder="Exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.examName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={form.subjectId}
              onValueChange={(v) => setForm({ ...form, subjectId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              placeholder="Max Marks"
              type="number"
              value={form.maxMarks}
              onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
            />
            <Input
              placeholder="Pass Marks"
              type="number"
              value={form.passMarks}
              onChange={(e) => setForm({ ...form, passMarks: e.target.value })}
            />
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="font-semibold text-lg mb-3 text-green-700">
            📚 Registered Subjects
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-md">
              <thead>
                <tr className="bg-gray-100 text-sm text-gray-700">
                  <th className="border px-3 py-2 text-left">Subject</th>
                  <th className="border px-3 py-2 text-center">Max Marks</th>
                  <th className="border px-3 py-2 text-center">Pass Marks</th>
                  <th className="border px-3 py-2 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {examSubjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      No subjects added yet
                    </td>
                  </tr>
                )}

                {examSubjects.map((es) => {
                  const isEditing = editingId === es.id;

                  return (
                    <tr
                      key={es.id}
                      className={`text-sm ${
                        isEditing ? "bg-green-50" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Subject */}
                      <td className="border px-3 py-2 font-medium">
                        {es.subject.name}
                      </td>

                      {/* Max Marks */}
                      <td className="border px-3 py-2 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            className="h-8 text-center"
                            value={editForm.maxMarks}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                maxMarks: e.target.value,
                              })
                            }
                          />
                        ) : (
                          es.maxMarks
                        )}
                      </td>

                      {/* Pass Marks */}
                      <td className="border px-3 py-2 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            className="h-8 text-center"
                            value={editForm.passMarks}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                passMarks: e.target.value,
                              })
                            }
                          />
                        ) : (
                          es.passMarks
                        )}
                      </td>

                      {/* Actions */}
                      <td className="border px-3 py-2 text-center space-x-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary"
                              onClick={() => {
                                handleUpdate(es.id, editForm);
                                setEditingId(null);
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(es.id);
                                setEditForm({
                                  maxMarks: String(es.maxMarks),
                                  passMarks: String(es.passMarks),
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(es.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
