"use client";

import { ArrowRightCircle, Calendar } from "lucide-react";
import Link from "next/link";
import BannerSliderBottom from "../ImageSlider/BannerSliderBottom";
import ImageSlider from "../ImageSlider/ImageSlider";
import { Button } from "../ui/button";
import NoticeBoard from "./NoticeBoard";

const Banner = () => {
  return (
    <section className="w-full bg-gradient-to-br from-indigo-50 to-white py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 mb-12">
        {/* Slider Section */}
        <div className="w-full">
          <ImageSlider />
        </div>

        {/* Notice Panel */}

        <NoticeBoard />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 ">
        {/* Bottom Slider Section */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <h1 className="bg-[#005caa] text-white px-4 py-2  border-b-3 border-orange-500 lg:text-2xl text-xl bangla flex items-center gap-3">
            <Calendar />
            প্রতিষ্ঠান কর্তৃক আয়োজিত কোর্সসমূহঃ
          </h1>
          <BannerSliderBottom />
        </div>

        {/* Notice Panel */}
        <div className="w-full md:w-1/2 hover:shadow-blue-500 transition-transform duration-300 ease-in-out ">
          <h2 className="text-2xl  mb-4 my-10">আমাদের মাদরাসা সম্পর্কে...</h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg">
            📚 ইসলামী দাওয়াহ ইনস্টিটিউট তুষভান্ডার{" "}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            🕌 শুদ্ধ আকীদা, সঠিক ইলম, নৈতিক মানুষ গঠনের প্রত্যয় ইসলামী দাওয়াহ
            ইনস্টিটিউট তুষভান্ডার একটি অরাজনৈতিক ও কুরআন-সুন্নাহভিত্তিক ইসলামী
            শিক্ষা প্রতিষ্ঠান।
          </p>
          <p className="text-gray-700 dark:text-gray-300 mt-3">
            এটি লালমনিরহাট জেলার কালীগঞ্জ উপজেলার তুষভান্ডার, মাষ্টারপাড়া গ্রামে
            অবস্থিত। আমরা শিশুদের শৈশব থেকেই কুরআন শিক্ষায় শিক্ষিত করে তুলতে এবং
            একজন সৎ, আদর্শ ও দ্বীনদার মানুষ হিসেবে গড়ে তুলতে কাজ করে যাচ্ছি।
          </p>

          <div className="flex items-center justify-around mt-10 text-center">
            <div>
              <h3 className="text-2xl text-blue-600">৫+</h3>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                বছরের অভিজ্ঞতা
              </p>
            </div>
            <div>
              <h3 className="text-2xl text-blue-600">৫০০+</h3>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                সফল শিক্ষার্থী
              </p>
            </div>
            <div>
              <h3 className="text-2xl text-blue-600">১৫+</h3>
              <p className="text-gray-700 dark:text-gray-300 mt-1">উস্তায</p>
            </div>
          </div>

          <div className="my-10">
            <Link href="/about">
              <Button className="transition-transform duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer">
                <ArrowRightCircle />
                বিস্তারিত দেখুন
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
