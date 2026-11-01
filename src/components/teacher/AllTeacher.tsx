"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

interface teacher {
  name: string;
  profilePicture: string;
  designation: string;
  jimmadarClass: string;
  mobile1: string;
  id: string;
}

const AllTeachers = () => {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<teacher[]>([]);
  // ✅ Fetch students function
  const fetchAllTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacher`,
      );
      const data = await res.json();
      setTeachers(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllTeachers();
  }, []);

  return (
    <section
      className="py-16 px-4 bg-white dark:bg-gray-900 text-center bangla"
      id="team"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto text-center"
      >
        <h2 className="text-4xl font-bold text-blue-800 dark:text-white mb-4">
          শিক্ষক / পরিচালক
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-lg mb-12">
          আমাদের রয়েছে দক্ষ ও প্রশিক্ষণ প্রাপ্ত শিক্ষক ও মোহতামীম
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teachers.map((teacher, idx) => (
            <div
              key={idx}
              className="bg-blue-50 dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-all"
            >
              <div className="w-28 h-28 mx-auto relative mb-4">
                <Image
                  src={teacher.profilePicture}
                  alt={teacher.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-blue-700 dark:text-white">
                শিক্ষকের নাম: {teacher.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                জিম্মাদার ক্লাস: {teacher.jimmadarClass}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                যোগাযোগ:{teacher.mobile1}
              </p>

              <Link href={`/tutors/${teacher.id}`}>
                <Button className="bg-blue-600 text-white px-6 py-6 rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 dark:focus:ring-offset-slate-900 transition mt-6 cursor-pointer bangla text-sm">
                  বিস্তারিত
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default AllTeachers;
