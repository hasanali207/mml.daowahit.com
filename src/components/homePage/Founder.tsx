"use client";
import Image from "next/image";
// import img from "../../../public/tutor.jpg";

const FounderSection = () => {
  return (
    <section className="bg-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 transition-colors duration-300">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-blue-800 dark:text-white mb-4 bangla">
            প্রতিষ্ঠাতা ও পরিচালনায়
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="shadow-md bg-white rounded-xl p-4">
            <div className="relative w-50 h-50 rounded-full overflow-hidden mx-auto">
              <Image
                src="https://i.ibb.co.com/wFnq9LTw/founder1.png"
                alt="মুফতি জুবায়ের আহমাদ (হাফি:)"
                fill
                className="object-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4 space-y-1">
              <h3 className="text-3xl my-5 bangla text-center">
                মুফতি জুবায়ের আহমাদ (হাফি:)
              </h3>
              <p className="mb-5 bangla text-lg ">
                মুফতি জুবায়ের আহমদ বাংলাদেশের একজন বিখ্যাত আলেম এবং দায়ী। একাধিক
                বিষয়ের উপর তার প্রায় ৪২ টির মত লিখিত বই বিভিন্ন অঙ্গনে সমাদৃত
                হয়েছে। তার লেখা বই মক্কা ও মদীনা লাইব্রেরীতে গৃহীত হয়েছে। তিনি
                একাধিক মাদ্রাসার সাথে জড়িত থেকে দ্বীনের কাজ করে যাচ্ছেন।
              </p>
              <p className="bangla text-lg ">
                তিনি ইসলামী দাওয়াহ ইনস্টিটিউট, তুষভান্ডার এর প্রিন্সিপাল। তিনি
                শিক্ষাগত জীবনে মেশকাত(স্নাতোক) শেষ করেছেন জামিয়া রহমানিয়া , ঢাকা
                থেকে। এরপর দাওরা হাদীস (মাস্টার্স) শেষ করেছেন দারুল উলুম
                দেওবন্দ, ইন্ডিয়া থেকে । এছাড়াও উচ্চতর অরবী সাহিত্যের উপর তিনি
                উচ্চতর পড়াশোনা করেন দারুল উলুম নদওয়াতুল উলামা লখনৌ, ইউপি,
                ইন্ডিয়া থেকে।
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;
