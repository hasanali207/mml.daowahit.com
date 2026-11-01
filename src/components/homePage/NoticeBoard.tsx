"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function NoticeBoardTicker() {
  const itemHeight = 110;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [index, setIndex] = useState(0);
  const [enableTransition, setEnableTransition] = useState(true);

  // ===== Fetch notices with React Query =====
  const { data: notices = [] } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/notice`
      );
      return res.data.data.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    refetchInterval: 5000, // auto-refresh every 5s
  });

  // Duplicate for infinite loop
  const allNotices = [...notices, ...notices];

  // ===== Auto Slide =====
  const startAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, 5000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  // Infinite loop fix
  useEffect(() => {
    if (index === notices.length) {
      setTimeout(() => {
        setEnableTransition(false);
        setIndex(0);
      }, 700);

      setTimeout(() => {
        setEnableTransition(true);
      }, 750);
    }
  }, [index, notices.length]);

  const nextSlide = () => {
    stopAutoSlide();
    setIndex((prev) => prev + 1);
    startAutoSlide();
  };

  const prevSlide = () => {
    stopAutoSlide();
    setEnableTransition(true);

    if (index === 0) {
      setEnableTransition(false);
      setIndex(notices.length - 1);

      setTimeout(() => setEnableTransition(true), 50);
    } else {
      setIndex((prev) => prev - 1);
    }

    startAutoSlide();
  };

  // Date format
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("bn-BD", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-md bg-[#005caa] rounded-md shadow-lg overflow-hidden">
      <div className="bg-[#005caa] text-white px-4 py-3 border-b border-blue-800 text-xl flex gap-3 bangla">
        <Bell /> সকল নোটিশ!
      </div>

      <div
        className="bg-white h-[450px] overflow-hidden relative"
        onMouseEnter={stopAutoSlide}
        onMouseLeave={startAutoSlide}
      >
        {notices.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 bangla">
            কোনো নোটিশ নেই
          </div>
        ) : (
          <div
            className={`${
              enableTransition ? "transition-transform duration-700" : ""
            }`}
            style={{
              transform: `translateY(-${index * itemHeight}px)`,
            }}
          >
            {allNotices.map((notice, i) => (
              <div
                key={i}
                className="px-4 py-4 h-28 border-b cursor-pointer gap-3"
              >
                <p className="text-lg text-black border-l-2 pl-3 border-orange-500 bangla">
                  {notice.header}
                </p>
                <p className="text-gray-600 pl-4 bangla">
                  প্রকাশ তারিখ: {formatDate(notice.createdAt)}
                </p>
                <p className="text-gray-600 pl-4 bangla">
                  {notice.text?.split(" ").slice(0, 6).join(" ")}...
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#005caa] p-3 flex justify-between items-center gap-5">
        <button
          onClick={prevSlide}
          className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 cursor-pointer bangla text-lg"
        >
          আরও দেখুন
        </button>

        <div className="gap-5 flex">
          <button
            onClick={prevSlide}
            className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 cursor-pointer"
          >
            <ChevronUp />
          </button>

          <button
            onClick={nextSlide}
            className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 cursor-pointer"
          >
            <ChevronDown />
          </button>
        </div>
      </div>
    </div>
  );
}
