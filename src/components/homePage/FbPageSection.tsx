"use client";

import { motion } from "framer-motion";
import { Play, Videotape } from "lucide-react";
import { useEffect, useState } from "react";

interface VideoItem {
  videoUrl: string;
  thumbnail: string;
}

const videos: VideoItem[] = [
  {
    videoUrl: "https://www.facebook.com/share/r/181Fm3dvgc/",
    thumbnail: "https://via.placeholder.com/600x400",
  },
  {
    videoUrl: "https://www.facebook.com/yourpage/videos/9876543210",
    thumbnail: "https://via.placeholder.com/600x400",
  },
];

export default function FbPageSection() {
  const [activeVideo, setActiveVideo] = useState<number | null>(null);

  useEffect(() => {
    if (activeVideo !== null) {
      if (!document.getElementById("facebook-jssdk")) {
        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.src =
          "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }
  }, [activeVideo]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Animated Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h1 className="text-4xl bangla font-bold text-gray-800 mb-4">
            <Videotape /> ভিডিও গ্যালারী
          </h1>
          <p className="text-gray-600">
            ভিডিও দেখার জন্য প্লে বাটন আইকনে ক্লিক করুন..
          </p>
        </motion.div>

        {/* Video Grid */}
        <div className="grid md:grid-cols-2 gap-10">
          {videos.map((video, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              {activeVideo === index ? (
                <div
                  className="fb-video w-full"
                  data-href={video.videoUrl}
                  data-width="500"
                  data-show-text="false"
                ></div>
              ) : (
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setActiveVideo(index)}
                >
                  <img
                    src={video.thumbnail}
                    alt="Video Thumbnail"
                    className="w-full h-72 object-cover group-hover:scale-105 transition duration-500"
                  />

                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition"></div>

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-full shadow-lg group-hover:scale-110 transition">
                      <Play size={32} className="text-blue-600 ml-1" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
