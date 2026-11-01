"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";

const API = `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/notice`;

export default function NoticeManagement() {
  const [header, setHeader] = useState("");
  const [text, setText] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch Notices
  const {
    data: notices = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const res = await axios.get(API);
      return res.data?.data || [];
    },
  });

  // Add Notice
  const handleAdd = async () => {
    if (!header || !text) return toast.error("Header and Text are required!");

    try {
      await axios.post(API, { header, text });
      toast.success("Notice added successfully");
      setHeader("");
      setText("");
      refetch(); // 🔥 Refresh list
    } catch (err) {
      console.error(err);
      toast.error("Failed to add notice");
    }
  };

  // Edit Notice
  const handleEdit = (notice: any) => {
    setEditId(notice.id);
    setHeader(notice.header);
    setText(notice.text);
    setOpenModal(true);
  };

  // Update Notice
  const handleUpdate = async () => {
    if (!header || !text) return toast.error("Header and Text are required!");
    if (!editId) return;

    try {
      await axios.patch(`${API}/${editId}`, { header, text });
      toast.success("Notice updated successfully");
      closeModal();
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notice");
    }
  };

  // Delete Notice
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notice?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      toast.success("Notice deleted successfully");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete notice");
    }
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditId(null);
    setHeader("");
    setText("");
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading notices</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto bangla">
      {/* Add Notice */}
      <div className="mb-6 border p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">নোটিশ প্রকাশ!</h2>
        <input
          type="text"
          placeholder="নোটিশের বিষয়"
          className="w-full p-2 border rounded mb-2"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
        />
        <textarea
          placeholder="নোটিশ বিস্তারিত"
          className="w-full p-2 border rounded mb-2"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          যোগ করুন
        </button>
      </div>

      {/* Notice List */}
      {notices.length === 0 ? (
        <p>No notices found</p>
      ) : (
        <div className="flex flex-col space-y-5">
          {notices.map((notice: any) => (
            <div
              key={notice.id}
              className="border rounded p-3 shadow-sm relative"
            >
              <h3 className="text-2xl">{notice.header}</h3>
              <p className="mt-2 text-lg">{notice.text}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(notice)}
                  className="px-3 py-1 bg-primary text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(notice.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
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
            <h2 className="text-lg font-semibold mb-3">Update Notice</h2>
            <input
              type="text"
              placeholder="Notice Header"
              className="w-full p-2 border rounded mb-2"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
            />
            <textarea
              placeholder="Notice Text"
              className="w-full p-2 border rounded mb-2"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
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
