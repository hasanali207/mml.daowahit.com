"use client";
import { verifyToken } from "@/lib/verifyToken";
import { setUser, TUser } from "@/Redux/Features/Auth/authSlice";
import { useAppDispatch } from "@/Redux/hook";
import { loginUser } from "@/services/auth";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import Turnstile from "react-turnstile";
const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirectPath");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      toast.error("Captcha verify করুন");
      return;
    }
    try {
      const res = await loginUser({ ...formData, turnstileToken });
      if (res?.success) {
        const userFromToken = verifyToken(res?.data?.accessToken) as TUser;

        const userRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/user/${userFromToken.username}`,
        );
        if (!userRes.ok) throw new Error("Failed to fetch full user profile");
        const fullUserData = await userRes.json();

        const user = fullUserData.data || fullUserData.user || fullUserData;

        const importantUserData = {
          id: user.id,
          username: user.username,
          name: user.name,
          image: user.image,
          role: user.role,
          isProfileComplete: user.isProfileComplete,
        };

        dispatch(
          setUser({ user: importantUserData, token: res?.data?.accessToken }),
        );

        if (user.isProfileComplete == false) {
          if (user.role === "STUDENT") {
            router.push("/studentdashboard/profile");
          } else if (user.role === "TEACHER") {
            router.push("/tutor/profile");
          } else if (user.role === "ACCOUNTANT") {
            router.push("/accountant/profile"); // ✅ NEW
          }
        } else if (redirect) {
          router.push(redirect);
        } else {
          // default dashboard by role
          if (user.role === "STUDENT") {
            router.push("/studentdashboard");
          } else if (user.role === "TEACHER") {
            router.push("/tutor");
          } else if (user.role === "ADMIN") {
            router.push("/admin");
          } else if (user.role === "SUPER_ADMIN") {
            router.push("/superadmin");
          } else if (user.role === "ACCOUNTANT") {
            router.push("/accountant"); // ✅ NEW
          } else {
            router.push("/");
          }
        }
      } else {
        toast.error("আপনার লগ-ইন তথ্য ভূল");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r flex items-center justify-center px-4 py-5 bangla">
      <div className="shadow-[0px_0px_20px_theme(colors.blue.600)] overflow-hidden rounded-lg border border-[#066ccb] py-6 px-8 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-3xl font-extrabold text-blue-800 text-center py-5 border-b">
          লগ-ইন করুন।
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 mt-5">
          {/* Email Input */}
          <div className="relative">
            <label className="text-md font-semibold">দাখেলা / ইউজার আইডি</label>
            <input
              type="text"
              name="username"
              placeholder="দাখেলা / আইডি (ইংরেজীতে লিখুন)"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border text-black rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <label className="text-md font-semibold">পাসওয়ার্ড</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="পাসওয়ার্ড"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border text-black rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <div
              onClick={togglePasswordVisibility}
              className="absolute right-4 top-[50%] transform -translate-y-1/2 cursor-pointer"
            >
              {showPassword ? (
                <AiFillEyeInvisible size={24} color="#6B7280" />
              ) : (
                <AiFillEye size={24} color="#6B7280" />
              )}
            </div>
          </div>

          <div className="flex justify-center my-4">
            <div className="flex">
              <Turnstile
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                size="flexible"
                style={{ width: "385px" }}
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            Login
          </button>
        </form>

        {/* Social Login Buttons */}
        <div className="text-center mt-6 space-y-4">
          <h1>দাখেলা / আইডি ও পাসওয়ার্ড এর জন্য প্রতিষ্ঠানে যোগাযোগ করুন!</h1>
          <Link
            href="/"
            className="flex gap-3 items-center text-base font-semibold text-gray-400 hover:text-[#066ccb]"
          >
            <MoveLeft /> হোম-এ ফিরুন
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
