"use client";

import Sidebar from "@/components/dashboard/SideBar";
import { logout, selectCurrentUser } from "@/Redux/Features/Auth/authSlice";
import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

type Role =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "ACCOUNTANT"
  | "DONOR"
  | "SUPER_ADMIN";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const currentUser = useSelector(selectCurrentUser);

  const role = (currentUser?.role?.toUpperCase() as Role) || "STUDENT";

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  const roleLabel: Record<string, string> = {
    ADMIN: "অ্যাডমিন",
    SUPER_ADMIN: "সুপার অ্যাডমিন",
    TEACHER: "শিক্ষক",
    STUDENT: "শিক্ষার্থী",
    ACCOUNTANT: "হিসাবরক্ষক",
    DONOR: "দাতা",
  };

  const displayName =
    currentUser?.name || currentUser?.username || "অজানা ব্যবহারকারী";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden shrink-0 md:block">
        <Sidebar open={open} setOpen={setOpen} userRole={role} />
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 z-30 h-full md:hidden">
            <Sidebar
              open={true}
              setOpen={() => {}}
              userRole={role}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}

      {/* RIGHT SIDE */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <h1 className="bangla hidden text-base font-semibold text-gray-700 dark:text-gray-200 md:block">
            ড্যাশবোর্ড
          </h1>

          {/* USER INFO */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow">
              {displayName.trim().charAt(0).toUpperCase()}
            </div>

            <div className="bangla text-right">
              <p className="font-medium leading-tight text-gray-800 dark:text-gray-100">
                {displayName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {roleLabel[role] || role}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="bangla flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
