"use client";
import Image from "next/image";
import { motion } from "framer-motion";
// import img from "../../../public/tutor.jpg";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IUser } from "@/types/user";

const TutorSection = ({ tutors }: { tutors: IUser[] }) => {
  // const tutors = [
  //     {
  //       name: 'Emily Johnson',
  //       subject: 'Mathematics',
  //       image: '/tutors/emily.jpg',
  //       bio: 'Passionate math tutor with 5+ years of experience helping students excel.',
  //     },
  //     {
  //       name: 'Daniel Kim',
  //       subject: 'Physics',
  //       image: '/tutors/daniel.jpg',
  //       bio: 'Physics enthusiast making complex concepts simple and fun.',
  //     },
  //     {
  //       name: 'Sophia Lee',
  //       subject: 'English Literature',
  //       image: '/tutors/sophia.jpg',
  //       bio: 'Experienced English tutor helping students master writing & analysis.',
  //     },
  //   ]

  return (
    <section className="py-6 my-6 max-w-7xl mx-auto px-4 transition-colors duration-300">
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl  font-bold text-blue-700 dark:text-white"
        >
          Meet Our Top Tutors 👩‍🏫👨‍🏫
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {tutors.map((tutor, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md dark:shadow-lg group relative transform transition-transform duration-300 hover:scale-105"
          >
            <div className="relative w-full h-60">
              <Image
                src={tutor?.image || "https://i.ibb.co/6s0x5gD/default-profile.png"}
                alt={tutor?.name || "tutor"}
                layout="fill"
                objectFit="cover"
                className="group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4 space-y-1">
              <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition duration-300">
                {tutor?.name}
              </h3>
              <p className="text-red-400 font-semibold ">
                {" "}
                {tutor?.subjects?.split(",").map((subject, index) => (
                  <span key={index}>
                    {index > 0 ? ", " : ""}{subject}
                  </span>
                ))}
              </p>
              <p className="text-sm text-gray-600">{tutor?.bio}</p>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition duration-300">
              <Link
                href={`/tutors/${tutor?.id}`}
                className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-md shadow-lg hover:bg-blue-700"
              >
                View Profile
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center my-10">
        <Link href="/tutors">
          <Button className="transition-transform duration-300 hover:-translate-y-1 hover:scale-105">
            See All
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default TutorSection;
