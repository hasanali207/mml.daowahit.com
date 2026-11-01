"use client";

import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function BannerManagement() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("কোনো ছবি নির্বাচিত হয়নি");

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch banners
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/banner`,
      );
      setBanners(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Add Banner (modal ছাড়া)
  const handleAdd = async () => {
    if (!text) return toast.error("Text is required!");
    const formData = new FormData();
    formData.append("data", JSON.stringify({ text }));
    if (file) formData.append("file", file);
    console.log(formData);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/banner`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      toast.success("Banner added successfully");
      setText("");
      setFile(null);
      setFileName("কোনো ছবি নির্বাচিত হয়নি");
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add banner");
    }
  };

  // Open Edit Modal
  const handleEdit = (banner: any) => {
    setEditId(banner.id);
    setText(banner.text);
    setFile(null);
    setFileName("নতুন ছবি দিতে চাইলে নির্বাচন করুন");
    setOpenModal(true);
  };

  // Update Banner
  const handleUpdate = async () => {
    if (!text) return toast.error("Text is required!");
    if (!editId) return;

    const formData = new FormData();
    formData.append("data", JSON.stringify({ text }));
    if (file) formData.append("file", file);

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/banner/${editId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      toast.success("Banner updated successfully");
      closeModal();
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update banner");
    }
  };

  // Delete Banner
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/banner/${id}`,
      );
      toast.success("Banner deleted successfully");
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete banner");
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
      {/* Add Banner */}
      <div className="mb-6 border p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">ব্যানার যুক্ত করুন।</h2>

        <input
          type="text"
          placeholder="Banner Text"
          className="w-full p-2 border rounded mb-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="relative w-[270px] mb-2">
          <input
            id="bannerFile"
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
          Add Banner
        </button>
      </div>

      {/* Banner List */}
      {loading ? (
        <p>Loading...</p>
      ) : banners.length === 0 ? (
        <p>No banners found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner: any) => (
            <div
              key={banner.id}
              className="border rounded p-3 shadow-sm flex flex-col"
            >
              <Image
                src={banner.imageUrl}
                alt=""
                width={600}
                height={150}
                className="w-full object-cover rounded"
              />

              <p className="mt-2 font-semibold">{banner.text}</p>

              <div className="flex gap-3 mt-auto pt-3">
                <button
                  onClick={() => handleEdit(banner)}
                  className="px-3 py-1 bg-primary text-white rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(banner.id)}
                  title="Delete banner"
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
            <h2 className="text-lg font-semibold mb-3">Update Banner</h2>

            <input
              type="text"
              placeholder="Banner Text"
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
