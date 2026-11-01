"use client";

import { useAppSelector } from "@/Redux/hook";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Profile {
  id: string;
  username: string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "DONOR";
  student?: any;
  teacher?: any;
  admin?: any;
  donor?: any;
}

const ProfileCard = () => {
  const authUser = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?.username || !token) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/user/${authUser.username}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          },
        );
        const data = await res.json();
        if (!data.success) {
          toast.error("Failed to load profile");
          setProfile(null);
        } else {
          setProfile(data.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch profile");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authUser?.username, token]);

  if (loading) return <p>Loading profile...</p>;
  if (!profile) return <p>No profile data found.</p>;

  // Determine which profile data to show
  const roleMap = {
    STUDENT: profile.student,
    TEACHER: profile.teacher,
    DONOR: profile.donor,
    ADMIN: profile.admin,
  };

  const userProfile = roleMap[profile.role];

  if (!userProfile) return <p>No profile details available.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6   rounded-2xl  dark:border-zinc-700 bangla">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
        {/* Profile Picture */}
        <div className="flex-shrink-0 flex flex-col space-y-3 text-center">
          <Image
            src={userProfile.profilePicture || "/default-avatar.png"}
            alt="Profile"
            width={112}
            height={112}
            className="w-32 h-32 rounded-xl object-cover border-2 border-blue-500 mx-auto"
          />

          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {userProfile.name}
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-500">
            ইউজার: {userProfile.username}
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-500">
            আইডি: {userProfile.code}
          </p>
          <p className="text-gray-500 dark:text-gray-500 mt-1 capitalize">
            {profile.role}
          </p>
          {userProfile.currentClass && (
            <p className="text-gray-500 dark:text-gray-500 mt-1">
              Class:{" "}
              <span className="font-medium">{userProfile.currentClass}</span>
            </p>
          )}
        </div>

        {/* Basic Info */}
        <div className="flex-1">
          <div className="mt-4 grid grid-cols-2 gap-5 text-lg text-gray-700">
            {userProfile.mobile1 && <p>মোবাইল-1: {userProfile.mobile1}</p>}
            {userProfile.mobile2 && <p> মোবাইল-2: {userProfile.mobile2}</p>}
            {userProfile.fatherName && (
              <p> পিতার নাম: {userProfile.fatherName}</p>
            )}
            {userProfile.motherName && (
              <p> মাতার নাম: {userProfile.motherName}</p>
            )}
            {userProfile.dob && (
              <p>
                জন্ম তারিখ: {new Date(userProfile.dob).toLocaleDateString()}
              </p>
            )}
            {userProfile.presentAddress && (
              <p>
                বর্তমান ঠিকানা : {userProfile.presentAddress?.village},{" "}
                {userProfile.presentAddress?.thana},{" "}
                {userProfile.presentAddress?.district},{" "}
                {userProfile.presentAddress?.division}
              </p>
            )}
            {userProfile.permanentAddress && (
              <p>
                স্থায়ী ঠিকানা : {userProfile.permanentAddress?.village},{" "}
                {userProfile.permanentAddress?.thana},{" "}
                {userProfile.permanentAddress?.district},{" "}
                {userProfile.permanentAddress?.division}
              </p>
            )}
            {userProfile.nid && <p>জন্ম নিবন্ধন নম্বর: {userProfile.nid}</p>}
            {userProfile.admissionStatus && (
              <p>ভর্তি অবস্থা: {userProfile.admissionStatus}</p>
            )}
            {userProfile.studentType && (
              <p> আবাসিক: {userProfile.studentType}</p>
            )}
            <p>
              এন্ট্রি তারিখ:{" "}
              {new Date(userProfile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
