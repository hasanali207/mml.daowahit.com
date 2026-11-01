"use client";

import api from "@/lib/axios";
import axios from "axios";
import { DeleteIcon } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// ✅ Category type define
interface ExpenseCategory {
  id: string;
  name: string;
  serial: number;
}

export default function ExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [name, setName] = useState<string>("");
  const [serial, setSerial] = useState<number>(0);

  const fetchCategories = async (): Promise<void> => {
    const res = await api.get("/api/v1/expense/categories");
    setCategories(res.data.data);
  };
  useEffect(() => {
    fetchCategories(); // শুধু কল
  }, []);

  const addCategory = async (): Promise<void> => {
    if (!name.trim() || !serial) {
      toast.error("দয়া করে নাম এবং সিরিয়াল উভয়ই প্রদান করুন");
      return;
    }

    try {
      await api.post("/api/v1/expense/category", { name, serial });
      setName("");
      setSerial(0); // reset to 0 after adding
      toast.success("খাত সফলভাবে যোগ করা হয়েছে");
      fetchCategories();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "খাত যোগ করতে সমস্যা হয়েছে",
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const confirmDelete = window.confirm(
        "আপনি কি নিশ্চিতভাবে এই খাতটি মুছে ফেলতে চান?",
      );
      if (!confirmDelete) return;

      await axios.delete(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/expense/categories/${id}`,
      );

      toast.success("খাত সফলভাবে মুছে ফেলা হয়েছে");
      fetchCategories();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "ব্যয় মুছে ফেলতে সমস্যা হয়েছে",
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ব্যয়ের ধরণ</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="number"
          placeholder="Serial"
          value={serial}
          onChange={(e) => setSerial(Number(e.target.value))}
          className="border p-2 rounded w-24"
        />
        <input
          type="text"
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button
          onClick={addCategory}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Serial</th>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories
            .sort((a, b) => a.serial - b.serial) // ensure numeric order
            .map((c) => (
              <tr key={c.id}>
                <td className="border px-4 py-2">{c.serial}</td>
                <td className="border px-4 py-2">{c.name}</td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    <DeleteIcon />
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
