'use client';

import { Award, BookOpenCheck, CalendarDays, Clock4, SmilePlus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { FaCertificate } from 'react-icons/fa';

export default function BenefitsSection() {


const benefits = [
  {
    title: 'বোর্ড কর্তৃক স্বীকৃত',
    icon: <Award size={36} className="text-blue-600 dark:text-blue-400" />,
    description: 'হাটহাজারি কওমি বোর্ড কর্তৃক স্বীকৃত ও ISO সনদপ্রাপ্ত আন্তর্জাতিক মানের শিক্ষা প্রতিষ্ঠান এবং এশিয়া মহাদেশের সবচেয়ে বড় অনলাইন মাদ্রাসা',
  },
  {
    title: 'মশক ক্লাসের ব্যবস্থা',
    icon: <BookOpenCheck size={36} className="text-blue-600 dark:text-blue-400" />,
    description: 'তাজবীদ তথা কুরআন তিলাওয়াত সহিহ করার জন্য ছোট ছোট গ্রুপ করে তাকরার করানো এবং পড়া শোনা হয়',
  },
  {
    title: 'সাপ্তাহিক তালিম',
    icon: <CalendarDays size={36} className="text-blue-600 dark:text-blue-400" />,
    description: 'ভাই-বোনদের জন্য আলাদাভাবে প্রতি সপ্তাহে দ্বীনি ইলমসহ সাম্প্রতিক বিষয়ে তালিমের ব্যবস্থা রয়েছে.',
  },
  {
    title: 'সার্টিফিকেট',
    icon: <FaCertificate size={36} className="text-blue-600 dark:text-blue-400" />,
    description: 'ফ্রি কিংবা পেইড, আমাদের সকল কোর্সে অংশগ্রহণকারীদের কোর্স শেষে সার্টিফিকেট প্রদান করা হয়',
  },
];


  return (
    <section className="py-20 mt-20 md:mt-0 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 bangla">
      <motion.div 
        className="text-center mb-10"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="lg:text-4xl text-3xl md:px-4 font-semibold text-blue-800 dark:text-white bangla">
          কেন ইসলামী দাওয়াহ্ ইনস্টিটিউট?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-3 bangla lg:text-lg text-base md:px-4">
          দাওয়াত,তালিম ও তাজকিয়ার মাধ্যমে দ্বীন জিন্দা করার মহান লক্ষে আমাদের পথ চলা
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 text-center transition hover:shadow-lg dark:hover:shadow-blue-500/20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-4">{benefit.icon}</div>
            <h4 className="text-2xl font-medium text-blue-700 dark:text-blue-400 mb-2">
              {benefit.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              {benefit.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
