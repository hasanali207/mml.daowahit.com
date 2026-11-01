"use client";

import { cn } from "@/lib/utils";
import {
  DollarSignIcon,
  ReceiptText,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ================= SUB-LINKS ================= */
const tijaraLinks = [
  {
    name: "তিজারা সদস্য তৈরি",
    icon: UserPlus,
    href: "/superadmin/borrower/addborrower",
  },
  {
    name: "সকল সদস্যগণ",
    icon: Users,
    href: "/superadmin/borrower/allborrower",
  },
  {
    name: "তিজারা বিতরণ",
    icon: Wallet,
    href: "/superadmin/borrower/loans",
  },
  {
    name: "সকল তিজারাহ লোন",
    icon: Wallet,
    href: "/superadmin/borrower/loanaccountlist",
  },
  {
    name: "লোন জমা/পরিশোধ",
    icon: ReceiptText,
    href: "/superadmin/borrower/receiveloan",
  },
  {
    name: "লোন রিপোর্ট",
    icon: DollarSignIcon,
    href: "/superadmin/borrower/report",
  },
  {
    name: "ট্রানজেকশন রিপোর্ট",
    icon: DollarSignIcon,
    href: "/superadmin/borrower/transactionreport",
  },
];

/* ================= LAYOUT ================= */
export default function TijaraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-6 bangla">
        <DollarSignIcon className="text-primary" />
        <h1 className="text-2xl font-bold text-gray-800">তিজারাহ পয়েন্ট</h1>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b mb-8 bangla">
        {tijaraLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all",
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50",
              )}
            >
              <Icon size={16} />
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* PAGE CONTENT */}
      <div>{children}</div>
    </div>
  );
}
