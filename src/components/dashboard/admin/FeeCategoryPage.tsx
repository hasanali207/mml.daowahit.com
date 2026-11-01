"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface FeeCategory {
  id: string;
  name: string;
}

export default function FeeCategoryPage() {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/feecategory`,
      );
      const json = await res.json();
      setCategories(json.data || []);
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Add new category
  const handleAdd = async () => {
    if (!newName) return toast.error("Name is required");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/feecategory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        },
      );
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Fee Category added");
        setNewName("");
        fetchCategories();
      } else {
        toast.error(json.message || "Failed to add category");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  // Update category
  const handleUpdate = async (id: string) => {
    if (!editName) return toast.error("Enter a name");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/feecategory/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName }),
        },
      );
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Updated successfully");
        setEditId(null);
        setEditName("");
        fetchCategories();
      } else {
        toast.error(json.message || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Fee Categories</h2>

      {/* Add New */}
      <div className="mb-6 flex gap-4">
        <Input
          placeholder="New Category Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button className="bg-primary text-white" onClick={handleAdd}>
          Add
        </Button>
      </div>

      {/* Table */}
      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">#</th>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, idx) => (
            <tr key={cat.id} className="text-center">
              <td className="border px-4 py-2">{idx + 1}</td>
              <td className="border px-4 py-2">
                {editId === cat.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  cat.name
                )}
              </td>
              <td className="border px-4 py-2 flex justify-center gap-2">
                {editId === cat.id ? (
                  <Button
                    className="bg-primary text-white"
                    onClick={() => handleUpdate(cat.id)}
                  >
                    Save
                  </Button>
                ) : (
                  <Button
                    className="bg-blue-500 text-white"
                    onClick={() => {
                      setEditId(cat.id);
                      setEditName(cat.name);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
