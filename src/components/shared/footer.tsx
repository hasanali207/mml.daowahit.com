"use client";

import { useAcademicInfo } from "@/lib/useAcademicInfo";
import Image from "next/image";
import Link from "next/link";
import SocialIcons from "./socialIcons";

const Footer = () => {
  const { info } = useAcademicInfo();

  const anyInfo = (info ?? {}) as Record<string, any>;

  // Institute Information
  const instituteName = anyInfo.name || "Masha Garden International Play Lab";

  const shortName = anyInfo.shortName || "Masha Garden";

  const tagline =
    anyInfo.tagline || "A joyful place for learning, creativity and growth.";

  const description =
    anyInfo.description ||
    "We provide a nurturing and engaging environment where children learn, play, explore and grow with confidence.";

  // Images
  const logo = anyInfo.logo || "/logo.png";

  // Contact Information
  const email = anyInfo.email || "";
  const phone = anyInfo.phone || "";
  const secondaryPhone = anyInfo.secondaryPhone || "";
  const address = anyInfo.address || "";
  const website = anyInfo.website || "";

  // Social Links
  const facebook = anyInfo.facebookUrl || "";
  const youtube = anyInfo.youtubeUrl || "";

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Our Programs", href: "/programs" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
  ];

  const usefulLinks = [
    { label: "Admission", href: "/admission" },
    { label: "Login", href: "/login" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
  ];

  return (
    <footer className="bg-[#073520] text-gray-300 border-t border-white/10 bangla">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] gap-10 lg:gap-12">
          {/* Brand Information */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-5">
              <div className="relative w-16 h-16 bg-white rounded-2xl overflow-hidden p-1.5 shadow-lg">
                <Image
                  src={logo}
                  alt={instituteName}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>

              <div>
                <h3 className="text-white font-bold text-lg leading-tight">
                  {shortName}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{tagline}</p>
              </div>
            </Link>

            <p className="text-gray-400 text-sm leading-7 max-w-sm">
              {description}
            </p>

            {/* Social Icons */}
            <div className="mt-6">
              <SocialIcons />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-5">
              Quick Links
            </h4>

            <div className="w-10 h-1 bg-emerald-400 rounded-full mb-5" />

            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-emerald-300 hover:translate-x-1 inline-block transition-all duration-200 text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-5">
              Useful Links
            </h4>

            <div className="w-10 h-1 bg-emerald-400 rounded-full mb-5" />

            <ul className="space-y-3">
              {usefulLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-emerald-300 hover:translate-x-1 inline-block transition-all duration-200 text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-5">
              Contact Us
            </h4>

            <div className="w-10 h-1 bg-emerald-400 rounded-full mb-5" />

            <ul className="space-y-4 text-sm text-gray-400">
              {email && (
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">✉</span>
                  <a
                    href={`mailto:${email}`}
                    className="hover:text-emerald-300 transition-colors break-all"
                  >
                    {email}
                  </a>
                </li>
              )}

              {phone && (
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">☎</span>
                  <a
                    href={`tel:${phone}`}
                    className="hover:text-emerald-300 transition-colors"
                  >
                    {phone}
                  </a>
                </li>
              )}

              {secondaryPhone && (
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">☎</span>
                  <a
                    href={`tel:${secondaryPhone}`}
                    className="hover:text-emerald-300 transition-colors"
                  >
                    {secondaryPhone}
                  </a>
                </li>
              )}

              {address && (
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">⌖</span>
                  <span className="leading-6">{address}</span>
                </li>
              )}

              {website && (
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">↗</span>
                  <a
                    href={
                      website.startsWith("http")
                        ? website
                        : `https://${website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-300 transition-colors break-all"
                  >
                    {website}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-gray-500 text-center">
            © {currentYear}{" "}
            <span className="font-semibold text-emerald-300">
              {instituteName}
            </span>
            . All rights reserved.
          </p>

          <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
            Designed & Developed by{" "}
            <Link
              href="https://hasanali-dev.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-300 hover:text-white transition-colors"
            >
              Md Hasan Ali
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
