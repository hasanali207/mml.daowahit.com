"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

const API = `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/notice`;
const ITEMS_PER_PAGE = 10;

export default function UserNoticeTabs() {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: notices = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const res = await axios.get(API);
      return res.data?.data || [];
    },
  });

  if (isLoading) return <p className="text-center mt-10">Loading notices...</p>;
  if (isError)
    return <p className="text-center mt-10">Failed to load notices.</p>;
  if (notices.length === 0)
    return <p className="text-center mt-10">No notices found.</p>;

  // Pagination calculation
  const totalPages = Math.ceil(notices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentNotices = notices.slice(startIndex, endIndex);

  return (
    <div className="max-w-4xl mx-auto p-6 bangla">
      <h1 className="text-3xl  mb-6 text-center">নোটিশ বোর্ড</h1>

      {/* Notice List */}
      <div className="flex flex-col space-y-5">
        {currentNotices.map((notice: any) => (
          <div
            key={notice.id}
            className="p-4 border rounded shadow-sm bg-white "
          >
            <h2 className="text-2xl mb-2">{notice.header}</h2>
            <p className="text-lg text-gray-700">{notice.text}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded hover:bg-gray-100 ${
                page === currentPage
                  ? "bg-blue-600 text-white border-blue-600"
                  : ""
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
