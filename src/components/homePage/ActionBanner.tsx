'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const ActionBanner = () => {
  return (
    <section className="bg-slate-100 dark:bg-blue-900 text-slate-900 dark:text-white py-16 px-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-4xl  font-bold text-blue-700 dark:text-white">🎓 Ready to Learn or Teach?</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Join <span className="font-semibold text-blue-600 dark:text-blue-400">TutorLink</span> today and start your educational journey with trusted <br/> tutors or share your expertise with students worldwide.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
          <Link
            href="/tutors"
            className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 dark:focus:ring-offset-slate-900 transition"
          >
            Find a Tutor
          </Link>
          <Link
            href="/register"
            className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 dark:focus:ring-offset-slate-900 transition"
          >
            Become a Tutor
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default ActionBanner;
