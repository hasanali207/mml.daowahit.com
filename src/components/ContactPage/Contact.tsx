"use client";

import { useAcademicInfo } from "@/lib/useAcademicInfo";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import SocialIcons from "../shared/socialIcons";

const ContactSection = () => {
  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const secondaryPhone = anyInfo.secondaryPhone || "";

  return (
    <section
      id="contact"
      className="w-full min-h-screen py-16 px-6 bg-white dark:bg-gray-900 text-blue-800 dark:text-white"
    >
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl font-semibold md:text-4xl text-center mb-6 bangla"
        >
          🤝 যোগাযোগ করুন
        </motion.h2>
        <p className="text-center mb-12 text-gray-600 dark:text-gray-300 bangla text-lg">
          কোনো প্রশ্ন, মতামত, অথবা আমাদের সাথে অংশীদার হতে চান? <br /> নিচের
          ফর্মটি ব্যবহার করে যোগাযোগ করুন অথবা লাইভ চ্যাটে কথা বলুন!
        </p>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact Form */}
          <form className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl shadow bangla">
            <div className="mb-4">
              <label className="block mb-1 text-lg font-medium">নাম*</label>
              <input
                type="text"
                className="w-full p-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium text-lg">মোবাইল*</label>
              <input
                type="email"
                className="w-full p-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium text-lg">মন্তব্য</label>
              <textarea
                className="w-full p-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-lg text-white px-6 py-2 rounded-md transition flex justify-between items-center gap-3 cursor-pointer"
            >
              পাঠান <Send />
            </button>
          </form>

          {/* Live Chat or Contact Info */}
          <div className="flex flex-col justify-center text-center md:text-left bangla">
            <h3 className="text-2xl font-semibold mb-4">
              {`📍 আমাদের ঠিকানা: ${address}`}
            </h3>
            <h3 className="text-2xl font-semibold mb-4">💬 সরাসরি কথা বলুন!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              যে কোন সময়, যে কোন প্রয়োজনে যোগাযোগ করতে।
            </p>
            <div className="text-gray-700 dark:text-gray-200 flex flex-col space-y-3">
              <p>ই-মেইল: {info?.email || "afzalhussain0778@gmail.com"}</p>
              <p>মোবাইল: {phone}</p>
              <p>{secondaryPhone}</p>
              {/* Live chat script goes here */}
              {/* Example: <div id="tawk-widget" /> */}
            </div>

            <SocialIcons />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
