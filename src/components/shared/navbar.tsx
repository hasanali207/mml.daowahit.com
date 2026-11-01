"use client";

import { useAcademicInfo } from "@/lib/useAcademicInfo";
import { logout, selectCurrentUser } from "@/Redux/Features/Auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/Redux/hook";
import { persistor } from "@/Redux/store";
import {
  ChevronDown,
  Facebook,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  UserRound,
  X,
  Youtube,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// মূল মেনু (নেভবারে সরাসরি দেখাবে)
const mainLinks = [
  { label: "হোম", href: "/" },
  { label: "শিক্ষকবৃন্দ", href: "/teachers" },
  { label: "নোটিশ বোর্ড", href: "/notices" },
  { label: "পরীক্ষার ফলাফল", href: "/results" },
  { label: "যোগাযোগ", href: "/contact" },
];

// বাকি পেজগুলো "আরও" ড্রপডাউনে থাকবে
const moreLinks = [
  { label: "দৈনিক পড়ার শীট", href: "/shitgallery" },
  { label: "শিক্ষার্থী", href: "/students" },
  { label: "আবেদন ফরম", href: "/application" },
];

const dashboardRoutes: Record<string, string> = {
  STUDENT: "/studentdashboard",
  TEACHER: "/teacher",
  ADMIN: "/admin",
  ACCOUNTANT: "/accountant",
  DONOR: "/donordashboard",
  SUPER_ADMIN: "/superadmin",
};

const roleLabels: Record<string, string> = {
  STUDENT: "শিক্ষার্থী",
  TEACHER: "শিক্ষক",
  ADMIN: "অ্যাডমিন",
  ACCOUNTANT: "হিসাবরক্ষক",
  DONOR: "দাতা",
  SUPER_ADMIN: "সুপার অ্যাডমিন",
};

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { info } = useAcademicInfo();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const user = useAppSelector((state) => state.auth.user);

  // info থেকে ডাটা আসলে সেটা ব্যবহার হবে, না এলে নিচের ডিফল্ট
  // (ফিল্ডের নাম আপনার API অনুযায়ী মিলিয়ে নিন)
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const address = anyInfo.address || "তুষভান্ডার, কালীগঞ্জ, লালমনিরহাট";
  const phone = anyInfo.phone || "+880-1723-220778";
  const email = anyInfo.email || "afzalhussain0778@gmail.com";
  const logo = anyInfo.logo || "/logo.png";
  const facebook = anyInfo.facebook || "#";
  const youtube = anyInfo.youtube || "#";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogOut = async () => {
    dispatch(logout());
    await persistor.purge();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  const dashboardHref = (user && dashboardRoutes[user.role]) || "/";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const moreActive = moreLinks.some((l) => isActive(l.href));

  const desktopLink = (active: boolean) =>
    `rounded-md px-3.5 py-2 text-[16px] font-medium whitespace-nowrap transition-colors ${
      active ? "bg-[#0f6b4b] text-emerald-300" : "text-white hover:bg-white/10"
    }`;

  const loginButton = (
    <Link
      href="/login"
      className="inline-flex items-center gap-2 rounded-md bg-[#0f9a6b] px-4 py-2.5 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#12b07c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
    >
      <UserRound size={18} />
      লগইন করুন
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full bangla bg-[#0a3d2a] text-white shadow-md">
      {/* TOP INFO BAR (স্ক্রল করলে লুকিয়ে যাবে) */}
      <div
        className={`hidden md:block overflow-hidden border-b border-white/10 bg-[#07301f] text-[14px] transition-all duration-300 ${
          scrolled ? "max-h-0 border-b-0 opacity-0" : "max-h-10 opacity-100"
        }`}
      >
        <div className="mx-auto flex h-10 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="text-emerald-400" />
              {address}
            </span>
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1.5 hover:text-emerald-300"
            >
              <Phone size={15} className="text-emerald-400" />
              {phone}
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 hover:text-emerald-300"
            >
              <Mail size={15} className="text-emerald-400" />
              {email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-emerald-300"
            >
              <Facebook size={18} />
            </a>
            <a
              href={youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="hover:text-emerald-300"
            >
              <Youtube size={19} />
            </a>
          </div>
        </div>
      </div>

      {/* MAIN BAR */}
      <div className="mx-auto flex h-[78px] max-w-6xl items-center justify-between gap-4 px-4">
        {/* Logo + name */}
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-white p-0.5">
            <Image
              src={logo}
              alt={instituteName}
              fill
              sizes="56px"
              className="object-contain"
            />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[22px] font-bold sm:text-[26px]">
              {instituteName}
            </span>
            <span className="hidden truncate text-[13px] text-emerald-200 sm:block">
              {address}
            </span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={desktopLink(isActive(link.href))}
            >
              {link.label}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`${desktopLink(moreActive)} flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-emerald-300`}
              >
                আরও <ChevronDown size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-48 bangla bg-white text-gray-800"
            >
              {moreLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href} className="cursor-pointer">
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right: login / user */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="ব্যবহারকারীর মেনু"
                    className="rounded-full ring-2 ring-emerald-400/70 transition hover:ring-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300"
                  >
                    <Avatar className="size-11">
                      <AvatarImage
                        src={currentUser?.profilePicture}
                        alt="Profile"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-emerald-600 font-semibold text-white">
                        {(roleLabels[user.role] || "U").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-48 bangla bg-white text-gray-800"
                >
                  <DropdownMenuLabel className="text-[#0a3d2a]">
                    {roleLabels[user.role] || user.role}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={dashboardHref}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <LayoutDashboard size={18} /> ড্যাশবোর্ড
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={handleLogOut}
                    className="flex cursor-pointer items-center gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
                  >
                    <LogOut size={18} /> লগ আউট
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              loginButton
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={isOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-md hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-300 lg:hidden"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* MOBILE / TABLET MENU */}
      {isOpen && (
        <div className="max-h-[calc(100vh-78px)] overflow-y-auto border-t border-white/10 bg-[#07301f] lg:hidden">
          <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {[...mainLinks, ...moreLinks].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-3 text-[17px] transition-colors ${
                    isActive(link.href)
                      ? "bg-[#0f6b4b] font-semibold text-emerald-300"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            <li className="pt-2">
              {user ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={dashboardHref}
                    className="flex items-center justify-center gap-2 rounded-md bg-[#0f9a6b] px-4 py-2.5 font-semibold"
                  >
                    <LayoutDashboard size={18} /> ড্যাশবোর্ড
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogOut}
                    className="flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 font-semibold hover:bg-red-700"
                  >
                    <LogOut size={18} /> লগ আউট
                  </button>
                </div>
              ) : (
                <div className="[&>a]:flex [&>a]:w-full [&>a]:justify-center">
                  {loginButton}
                </div>
              )}
            </li>

            <li className="flex flex-wrap gap-x-5 gap-y-1 pt-3 text-[14px] text-emerald-100">
              <a href={`tel:${phone}`} className="flex items-center gap-1.5">
                <Phone size={15} /> {phone}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-1.5">
                <Mail size={15} /> {email}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default NavBar;
