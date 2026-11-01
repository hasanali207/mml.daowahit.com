"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type FormValues = {
  name: string;
  username: string;
  password: string;
  code: string;
  contactNumber: string;
  role: "SUPER_ADMIN" | "ADMIN" | "ACCOUNTANT";
};

export default function CreateUserPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "data",
        JSON.stringify({
          password: data.password,
          role: data.role,
          admin: {
            name: data.name,
            username: data.username,
            code: data.code,
            contactNumber: data.contactNumber,
          },
        }),
      );

      if (image) {
        formData.append("file", image);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/user/admin`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await res.json();
  
      if (!res.ok) {
        toast.error(
          result?.message ||
            result?.errorMessages?.[0]?.message ||
            "Something went wrong",
        );
        return;
      }

      toast.success("User Created Successfully");

      reset();
      setImage(null);
      setPreview("");
    } catch (error: any) {
      console.error(error);

      toast.error(error?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white shadow-sm border border-slate-200">
          {/* Header */}
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold text-slate-900">Create User</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create Admin, Accountant or Super Admin Account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 grid lg:grid-cols-3 gap-8">
              {/* Left Side */}
              <div className="lg:col-span-2 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>

                    <input
                      {...register("name", {
                        required: "Name is required",
                      })}
                      placeholder="Enter full name"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    />

                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Username</label>

                    <input
                      {...register("username", {
                        required: "Username is required",
                      })}
                      placeholder="admin00001"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    />

                    {errors.username && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Password</label>

                    <input
                      type="password"
                      {...register("password", {
                        required: "Password is required",
                      })}
                      placeholder="********"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">User Role</label>

                    <select
                      {...register("role", {
                        required: true,
                      })}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    >
                      <option value="">Select Role</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="ACCOUNTANT">Accountant</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Code</label>

                    <input
                      {...register("code")}
                      placeholder="10001"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Contact Number
                    </label>

                    <input
                      {...register("contactNumber")}
                      placeholder="01XXXXXXXXX"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div>
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-semibold mb-4">Profile Picture</h3>

                  <div className="flex justify-center">
                    <div className="w-36 h-36 rounded-full border-4 border-dashed border-slate-300 overflow-hidden">
                      {preview ? (
                        <img
                          src={preview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    className="mt-5 w-full text-sm border p-4 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      if (!file) return;

                      setImage(file);
                      setPreview(URL.createObjectURL(file));
                    }}
                  />

                  <p className="text-xs text-slate-500 mt-3">
                    JPG, PNG, WEBP supported
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-5 rounded-xl  py-3 font-medium hover:opacity-90 transition"
                >
                  {loading ? "Creating User..." : "Create User"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
