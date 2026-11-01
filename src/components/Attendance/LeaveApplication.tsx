"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useState } from "react";
import toast from "react-hot-toast";

const LeaveApplication = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromDate || !toDate || !reason.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (fromDate > toDate) {
      toast.error("Invalid leave date range");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/v1/leave", {
        fromDate,
        toDate,
        reason,
        ...(image ? { image } : {}),
      });

      toast.success("Leave application submitted successfully");

      setFromDate("");
      setToDate("");
      setReason("");
      setImage("");
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message || "Failed to submit leave application",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Leave Application</h2>

          <p className="text-sm text-gray-500 mt-1">
            Submit your leave request
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* DATE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>

              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* REASON */}
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder="Write your reason..."
              className="w-full rounded-lg border p-3 resize-none outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* IMAGE URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Attachment URL
              <span className="text-gray-400"> (Optional)</span>
            </label>

            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="px-6">
              {loading ? "Submitting..." : "Apply for Leave"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveApplication;
