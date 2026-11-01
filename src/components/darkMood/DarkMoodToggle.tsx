"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed bottom-4 right-4 z-50 p-3 rounded-full dark:bg-gray-100 bg-gray-800 shadow-lg hover:scale-110 transition"
    >
      {theme === "dark" ? (
        <Sun size={20} className="text-orange-600" />
      ) : (
        <Moon size={20} className="text-white" />
      )}
    </button>
  );
};

export default DarkModeToggle;
