"use client";

import { menus } from "@/lib/menuconfig";
import ProtectedRouteModal from "@/utils/ProtectedRouteModal";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onClose?: () => void;
  userRole?:
    | "ADMIN"
    | "TEACHER"
    | "STUDENT"
    | "ACCOUNTANT"
    | "DONOR"
    | "SUPER_ADMIN";
}

interface MenuItem {
  name: string;
  icon?: any;
  href?: string;
  protectedPath?: string;
  sub?: MenuItem[];
}

interface RecursiveItemProps {
  item: MenuItem;
  level: number;
  open: boolean;
  dropdown: Record<string, boolean>;
  setDropdown: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onClose?: () => void;
  handleProtectedRouteClick: (path: string) => void;
  pathname: string;
}

/* ============================================================
   MENU KEY
============================================================ */

const getMenuKey = (item: MenuItem, level: number) => {
  return `${level}-${item.name.toLowerCase()}`;
};

/* ============================================================
   FIND ACTIVE PARENT DROPDOWNS
============================================================ */

const findParentKeys = (
  items: MenuItem[],
  pathname: string,
  level = 0,
): string[] => {
  for (const item of items) {
    const key = getMenuKey(item, level);

    // Direct route
    if (item.href && pathname.startsWith(item.href)) {
      return [key];
    }

    // Protected route
    if (item.protectedPath && pathname.startsWith(item.protectedPath)) {
      return [key];
    }

    // Nested route
    if (item.sub?.length) {
      const childKeys = findParentKeys(item.sub, pathname, level + 1);

      if (childKeys.length > 0) {
        return [key, ...childKeys];
      }
    }
  }

  return [];
};

/* ============================================================
   RECURSIVE MENU ITEM
   শুধু functionality recursive করা হয়েছে
============================================================ */

function RecursiveMenuItem({
  item,
  level,
  open,
  dropdown,
  setDropdown,
  onClose,
  handleProtectedRouteClick,
  pathname,
}: RecursiveItemProps) {
  const Icon = item.icon;

  const isDropdown = Array.isArray(item.sub) && item.sub.length > 0;

  const menuKey = getMenuKey(item, level);

  const isOpenDropdown = dropdown[menuKey] || false;

  /* ==========================================================
     DROPDOWN TOGGLE
  ========================================================== */

  const handleDropdown = () => {
    setDropdown((prev) => ({
      ...prev,
      [menuKey]: !isOpenDropdown,
    }));
  };

  /* ==========================================================
     PARENT / DROPDOWN
  ========================================================== */

  if (isDropdown) {
    return (
      <div key={item.name}>
        <button
          onClick={handleDropdown}
          className="flex items-center w-full gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition group cursor-pointer"
        >
          <span className="dark:text-gray-400 group-hover:text-blue-600 shrink-0">
            {Icon && <Icon size={20} />}
          </span>

          {open && (
            <>
              <span className="font-medium dark:text-gray-200 group-hover:text-blue-600 truncate">
                {item.name}
              </span>

              <span className="ml-auto text-gray-400 shrink-0">
                {isOpenDropdown ? (
                  <ChevronDown size={15} />
                ) : (
                  <ChevronRight size={15} />
                )}
              </span>
            </>
          )}
        </button>

        {/* ====================================================
            NESTED DROPDOWN
        ==================================================== */}

        <AnimatePresence>
          {isOpenDropdown && open && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="overflow-hidden"
            >
              <div
                className="
                  ml-4
                  mt-0.5
                  mb-1
                  space-y-0.5
                  border-l-2
                  border-blue-300
                  dark:border-gray-600
                  bg-gray-100
                  dark:bg-gray-700
                  rounded-lg
                "
              >
                {item.sub!.map((sub, index) => (
                  <RecursiveMenuItem
                    key={`${sub.name}-${index}`}
                    item={sub}
                    level={level + 1}
                    open={open}
                    dropdown={dropdown}
                    setDropdown={setDropdown}
                    onClose={onClose}
                    handleProtectedRouteClick={handleProtectedRouteClick}
                    pathname={pathname}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ==========================================================
     PROTECTED ROUTE
  ========================================================== */

  if (item.protectedPath) {
    return (
      <button
        key={item.name}
        onClick={() => {
          handleProtectedRouteClick(item.protectedPath!);
        }}
        className="flex items-center gap-2 px-2 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 w-full text-left dark:text-gray-300 hover:text-blue-600 transition group"
      >
        {Icon && (
          <Icon
            size={15}
            className="shrink-0 text-gray-400 group-hover:text-blue-500"
          />
        )}

        <span className="truncate">{item.name}</span>
      </button>
    );
  }

  /* ==========================================================
     NORMAL LINK
  ========================================================== */

  return (
    <Link
      key={item.name}
      href={item.href || "#"}
      onClick={() => onClose?.()}
      className="flex items-center gap-2 px-2 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 dark:text-gray-300 hover:text-blue-600 transition group border-b-2 hover:border-blue-500"
    >
      {Icon && (
        <Icon size={15} className="shrink-0 group-hover:text-blue-500" />
      )}

      <span className="truncate">{item.name}</span>
    </Link>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

export default function Sidebar({
  open,
  setOpen,
  onClose,
  userRole = "STUDENT",
}: SidebarProps) {
  const [dropdown, setDropdown] = useState<Record<string, boolean>>({});

  const router = useRouter();
  const pathname = usePathname();

  const [modalOpen, setModalOpen] = useState(false);

  const [targetPath, setTargetPath] = useState("");

  /* ==========================================================
     PROTECTED ROUTE
  ========================================================== */

  const handleProtectedRouteClick = (path: string) => {
    setTargetPath(path);
    setModalOpen(true);
  };

  /* ==========================================================
     CONFIRM
  ========================================================== */

  const handleConfirm = (password: string) => {
    if (password === process.env.NEXT_PUBLIC_TRANSACTION_PW) {
      router.push(targetPath);
      setModalOpen(false);
      onClose?.();
    } else {
      alert("ভুল পাসওয়ার্ড");
    }
  };

  /* ==========================================================
     MENU
  ========================================================== */

  const menu = (menus[(userRole || "STUDENT").toLowerCase()] ||
    []) as MenuItem[];

  /* ==========================================================
     AUTO OPEN ACTIVE ROUTE
     nested dropdown support
  ========================================================== */

  useEffect(() => {
    if (!pathname) return;

    const parentKeys = findParentKeys(menu, pathname);

    if (parentKeys.length === 0) return;

    setDropdown((prev) => {
      const updated = {
        ...prev,
      };

      parentKeys.forEach((key) => {
        updated[key] = true;
      });

      return updated;
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, userRole]);

  /* ==========================================================
     UI
     আগের design একদম same
  ========================================================== */

  return (
    <>
      <motion.aside
        animate={{
          width: open ? 270 : 64,
        }}
        transition={{
          type: "tween",
          duration: 0.25,
        }}
        className="h-full bg-white dark:bg-gray-800 shadow-md flex flex-col overflow-hidden relative"
      >
        {/* Toggle Button */}

        <div className="flex items-center justify-between px-3 py-4 border-b dark:border-gray-700">
          {open && (
            <span className="text-sm font-bold text-blue-600 bangla truncate">
              মেনু
            </span>
          )}

          <button
            onClick={() => (onClose ? onClose() : setOpen(!open))}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition ml-auto"
          >
            {open || onClose ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Menu Items */}

        <nav className="flex-1 mt-2 overflow-y-auto px-2 space-y-0.5 bangla custom-scrollbar">
          {menu.map((item, index) => (
            <RecursiveMenuItem
              key={`${item.name}-${index}`}
              item={item}
              level={0}
              open={open}
              dropdown={dropdown}
              setDropdown={setDropdown}
              onClose={onClose}
              handleProtectedRouteClick={handleProtectedRouteClick}
              pathname={pathname}
            />
          ))}
        </nav>

        {/* Bottom — collapsed hint */}

        {!open && (
          <div className="pb-4 flex justify-center">
            <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-600 rounded" />
          </div>
        )}
      </motion.aside>

      {/* Protected Modal */}

      <ProtectedRouteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
