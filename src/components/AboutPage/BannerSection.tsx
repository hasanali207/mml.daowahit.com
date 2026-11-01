'use client';

import Image from 'next/image';
import Link from 'next/link';

const BannerSection = () => {
  return (
    <section className="mt-[80px] px-6 py-12">
      {/* Banner Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Text Section */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-blue-800 dark:text-white mb-4">
            Find the Right Tutor for You 🎯
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Personalized one-on-one learning with top-rated tutors. Book your first session today and excel in your studies!
          </p>
          <Link href={"/tutors"}>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
              Get Started
            </button>
          </Link>
        </div>

        {/* Image Section */}
        <div className="relative w-full h-[350px] md:h-[550px] hover:shadow-blue-600 hover:scale-105 transition-transform duration-300 ease-in-out rounded-xl overflow-hidden">
          <Image
            src="https://i.ibb.co.com/2Yf91FR6/banner2-removebg-preview.png" // place your image in the public folder
            alt="Banner"
            fill
            className="object-cover rounded-xl shadow-xl"
            priority
          />
        </div>
      </div>

      {/* Small Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-7xl mx-auto">
        {[
          { icon: '🎓', title: 'Expert Tutors', desc: 'Learn from certified professionals across subjects.' },
          { icon: '⏳', title: 'Flexible Times', desc: 'Book sessions that fit your schedule.' },
          { icon: '💬', title: 'Interactive Learning', desc: 'Engage through live chats, quizzes & more.' },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg shadow-blue-600 p-6 text-center transition-all"
          >
            <div className="text-4xl mb-3">{card.icon}</div>
            <h3 className="text-xl font-semibold text-blue-700 dark:text-white mb-2">{card.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{card.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BannerSection;
