"use client";

import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PosterManagement() {
  const [posters, setPosters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("কোনো ছবি নির্বাচিত হয়নি");

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch posters
  const fetchPosters = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/poster`,
      );
      setPosters(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch posters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosters();
  }, []);

  // Add Poster (modal ছাড়া)
  const handleAdd = async () => {
    if (!text) return toast.error("Text is required!");
    const formData = new FormData();
    formData.append("data", JSON.stringify({ text }));
    if (file) formData.append("file", file);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/poster`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      toast.success("Poster added successfully");
      setText("");
      setFile(null);
      setFileName("কোনো ছবি নির্বাচিত হয়নি");
      fetchPosters();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add poster");
    }
  };

  // Open Edit Modal
  const handleEdit = (poster: any) => {
    setEditId(poster.id);
    setText(poster.text);
    setFile(null);
    setFileName("নতুন ছবি দিতে চাইলে নির্বাচন করুন");
    setOpenModal(true);
  };

  // Update Poster
  const handleUpdate = async () => {
    if (!text) return toast.error("Text is required!");
    if (!editId) return;

    const formData = new FormData();
    formData.append("data", JSON.stringify({ text }));
    if (file) formData.append("file", file);

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/poster/${editId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      toast.success("Poster updated successfully");
      closeModal();
      fetchPosters();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update poster");
    }
  };

  // Delete Poster
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this poster?")) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/poster/${id}`,
      );
      toast.success("Poster deleted successfully");
      fetchPosters();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete poster");
    }
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditId(null);
    setText("");
    setFile(null);
    setFileName("কোনো ছবি নির্বাচিত হয়নি");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Add Poster */}
      <div className="mb-6 border p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">পোস্টার যুক্ত করুন।</h2>

        <input
          type="text"
          placeholder="Poster Text"
          className="w-full p-2 border rounded mb-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="relative w-[270px] mb-2">
          <input
            id="posterFile"
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setFile(e.target.files[0]);
                setFileName(e.target.files[0].name);
              }
            }}
          />
          <div className="px-4 py-2 border rounded bg-gray-100 cursor-pointer">
            <span className="text-gray-600 truncate">{fileName}</span>
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Poster
        </button>
      </div>

      {/* Poster List */}
      {loading ? (
        <p>Loading...</p>
      ) : posters.length === 0 ? (
        <p>No posters found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-4">
          {posters.map((poster: any) => (
            <div
              key={poster.id}
              className="border rounded w-full h-full p-3 shadow-lg flex flex-col"
            >
              <Image
                src={poster.imageUrl}
                alt=""
                width={600}
                height={200}
                className="w-full object-cover rounded"
              />

              <p className="mt-2 font-semibold">{poster.text}</p>

              <div className="flex gap-3 mt-auto pt-3">
                <button
                  onClick={() => handleEdit(poster)}
                  className="px-3 py-1 bg-primary text-white rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(poster.id)}
                  title="Delete poster"
                  className="
                  px-3 py-1
                  bg-red-500
                  text-white
                  rounded
                  transition
                  duration-200
                  hover:bg-red-700
                  hover:scale-105
                  active:scale-95
                  focus:outline-none
                  focus:ring-2
                  focus:ring-red-400
                "
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-lg font-semibold mb-3">Update Poster</h2>

            <input
              type="text"
              placeholder="Poster Text"
              className="w-full p-2 border rounded mb-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="relative w-full mb-2">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFile(e.target.files[0]);
                    setFileName(e.target.files[0].name);
                  }
                }}
              />
              <div className="px-4 py-2 border rounded bg-gray-100 cursor-pointer">
                <span className="text-gray-600 truncate">{fileName}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
