"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
{
  /* ===== Mapping Form ===== */
}

type IncomeCategory = { id: string; name: string };
type ExpenseCategory = { id: string; name: string };
type Mapping = {
  id: string;
  incomeCategory: IncomeCategory;
  expenseCategory: ExpenseCategory;
  priority: number;
};

export default function MappingUI() {
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>(
    []
  );
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(
    []
  );
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [form, setForm] = useState({
    incomeCategoryId: "",
    expenseCategoryId: "",
    priority: 1,
  });

  // Fetch categories + mappings
  const fetchData = async () => {
    try {
      const incomeRes = await api.get("/api/v1/income/categories");
      const expenseRes = await api.get("/api/v1/expense/categories");
      const mappingRes = await api.get("/api/v1/mapping");

      setIncomeCategories(incomeRes.data.data);
      setExpenseCategories(expenseRes.data.data);
      setMappings(mappingRes.data.data);
    } catch (err: any) {
      toast.error("Error fetching data: " + err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.incomeCategoryId || !form.expenseCategoryId) {
      toast.error("Both income and expense category are required");
      return;
    }

    try {
      const res = await api.post("/api/v1/mapping", form);
      toast.success("Mapping created successfully");
      setForm({ incomeCategoryId: "", expenseCategoryId: "", priority: 1 });
      fetchData();
    } catch (err: any) {
      toast.error("Error creating mapping: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/v1/mapping/${id}`);
      toast.success("Mapping deleted");
      fetchData();
    } catch (err: any) {
      toast.error("Error deleting mapping: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Income → Expense Mapping</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-6 space-y-4 border p-4 rounded shadow"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ===== Income Category ===== */}
          <div>
            <label className="mb-1 block font-medium">Income Category</label>
            <Select
              value={form.incomeCategoryId}
              onValueChange={(value: string) =>
                setForm({ ...form, incomeCategoryId: value })
              }
            >
              <SelectTrigger className="w-full border rounded">
                <SelectValue placeholder="Select Income Category" />
              </SelectTrigger>
              <SelectContent>
                {incomeCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ===== Expense Category ===== */}
          <div>
            <label className="mb-1 block font-medium">Expense Category</label>
            <Select
              value={form.expenseCategoryId}
              onValueChange={(value: string) =>
                setForm({ ...form, expenseCategoryId: value })
              }
            >
              <SelectTrigger className="w-full border rounded">
                <SelectValue placeholder="Select Expense Category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ===== Priority ===== */}
          <div>
            <label className="mb-1 block font-medium">Priority</label>
            <input
              type="number"
              min={1}
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: Number(e.target.value) })
              }
              placeholder="Priority"
              className="border p-2 rounded w-full"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Add Mapping
        </button>
      </form>

      {/* ===== Mappings Table ===== */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Income Category</th>
            <th className="border px-4 py-2">Expense Category</th>
            <th className="border px-4 py-2">Priority</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((m) => (
            <tr key={m.id}>
              <td className="border px-4 py-2">{m.incomeCategory.name}</td>
              <td className="border px-4 py-2">{m.expenseCategory.name}</td>
              <td className="border px-4 py-2">{m.priority}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => handleDelete(m.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {mappings.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4">
                No mappings found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
