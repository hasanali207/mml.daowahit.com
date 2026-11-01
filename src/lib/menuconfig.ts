import {
  ArrowLeftRight,
  Banknote,
  BanknoteArrowDown,
  BanknoteArrowUp,
  BarChart3,
  BookOpen,
  BookText,
  Brush,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronsLeft,
  ClipboardList,
  Clock3,
  CreditCard,
  DollarSignIcon,
  Download,
  FileBarChart,
  FileDown,
  FileIcon,
  FilePlus,
  FileText,
  Fingerprint,
  GlobeIcon,
  GraduationCap,
  HandHelping,
  HeartHandshake,
  Home,
  IdCard,
  Image,
  KeySquareIcon,
  Library,
  List,
  ListMinus,
  ListPlus,
  LogOut,
  MailOpen,
  Megaphone,
  MonitorSmartphone,
  NotebookPen,
  NotebookPenIcon,
  PenLine,
  Power,
  Presentation,
  Printer,
  Settings,
  ShoppingCart,
  Stamp,
  User2Icon,
  UserCheck,
  UserCog,
  UserPlus,
  UserRound,
  UserRoundSearch,
  Users,
  Wallet,
} from "lucide-react";

interface MenuItem {
  name: string; // Menu item এর নাম
  icon: any; // Icon component
  href?: string; // সাধারণ লিঙ্ক
  sub?: MenuItem[]; // Dropdown sub items
  protectedPath?: string; // Protected route এর path
}

/**
 * =====================================================================
 *  মেনু কাঠামো (সব প্রতিষ্ঠানের জন্য একই নিয়ম)
 * =====================================================================
 *  প্রতিটি role-এর মেনু একই ক্রমে সাজানো:
 *
 *   1. ড্যাশবোর্ড
 *   2. প্রতিষ্ঠান পরিচিতি      (প্রতিষ্ঠানের তথ্য, গঠনতন্ত্র, যোগাযোগ)
 *   3. একাডেমিক               (সেশন, শিক্ষার্থী, পরীক্ষা, ফলাফল)
 *   4. শিক্ষক ও কর্মী (HR)     (প্রোফাইল, দায়িত্ব, বেতন, হাজিরা)
 *   5. অফিস একাউন্টিং          (ফি, আয়-ব্যয়, অনুদান, ইনভয়েস)
 *   6. আবাসিক ও সেবা বিভাগ    (বোর্ডিং, ক্যান্টিন, কেয়ার টেকার)
 *   7. ওয়েবসাইট ও ডকুমেন্টস
 *   8. যোগাযোগ (SMS)
 *   9. সিস্টেম / Settings
 *  10. বাহির ও লগ আউট
 *
 *  নিয়ম: ৩ লেভেলের বেশি নেস্টিং নয়।
 * =====================================================================
 */

export const menus: Record<string, MenuItem[]> = {
  // =====================================================================
  //  ADMIN  (শিক্ষা বিভাগ / একাডেমিক অফিস)
  // =====================================================================
  admin: [
    { name: "ড্যাশবোর্ড", icon: Home, href: "/admin" },

    // ---------- একাডেমিক ----------
    {
      name: "সেশন ও শ্রেণি",
      icon: CalendarClock,
      sub: [
        { name: "নতুন সেশন", icon: CalendarDays, href: "/admin/session" },
        {
          name: "নতুন শ্রেণি যোগ",
          icon: CalendarDays,
          href: "/admin/addclass",
        },
        { name: "কিতাবসমূহ", icon: FileDown, href: "/admin/subjects" },
      ],
    },
    {
      name: "শিক্ষার্থী",
      icon: Users,
      sub: [
        {
          name: "নতুন শিক্ষার্থী ভর্তি",
          icon: UserPlus,
          href: "/admin/addstudent",
        },
        { name: "ক্লাস ভর্তি", icon: NotebookPen, href: "/admin/admission" },
        {
          name: "সকল শিক্ষার্থী",
          icon: UserRoundSearch,
          href: "/admin/student",
        },
        {
          name: "ক্লাসওয়ারী পেমেন্ট রিপোর্ট",
          icon: UserRoundSearch,
          href: "/admin/classledger",
        },
        { name: "ডাটা ডাউনলোড", icon: FileDown, href: "/admin/downlaod" },
      ],
    },
    {
      name: "পরীক্ষা",
      icon: BookOpen,
      sub: [
        { name: "পরীক্ষার নাম", href: "/admin/examname", icon: BookOpen },
        {
          name: "পরীক্ষার বিষয় সমূহ",
          href: "/admin/examsubjects",
          icon: BookOpen,
        },
        {
          name: "পরীক্ষা ছাত্র রেজিষ্ট্রেশন",
          href: "/admin/examstudent",
          icon: BookOpen,
        },
        { name: "এডমিট কার্ড", href: "/admin/admitcard", icon: BookOpen },
        {
          name: "পরীক্ষার সিট সিরিয়াল",
          href: "/admin/examsitserial",
          icon: BookOpen,
        },
      ],
    },
    {
      name: "ফলাফল",
      icon: BookOpen,
      sub: [
        {
          name: "গড় ফলাফল এন্ট্রি",
          href: "/admin/entryresult",
          icon: BookOpen,
        },
        { name: "ফলাফল", href: "/admin/result", icon: BookOpen },
        {
          name: "ফলাফল রিপোর্ট",
          href: "/admin/singleresult",
          icon: BookOpen,
        },
      ],
    },

    // ---------- শিক্ষক ----------
    {
      name: "শিক্ষক",
      icon: Users,
      sub: [
        {
          name: "নতুন শিক্ষক ভর্তি",
          icon: UserPlus,
          href: "/admin/addteacher",
        },
        {
          name: "সকল শিক্ষক",
          icon: UserRoundSearch,
          href: "/admin/teacher",
        },
        {
          name: "দায়িত্ব বন্টন",
          icon: UserRoundSearch,
          href: "/admin/teacher/responsibilty",
        },
        {
          name: "দৈনিক দায়িত্ব এন্ট্রি",
          icon: UserRoundSearch,
          href: "/admin/teacher/dailytaskentry",
        },
        {
          name: "দৈনিক দায়িত্ব রিপোর্ট",
          icon: UserRoundSearch,
          href: "/admin/teacher/responsibilitydashboard",
        },
      ],
    },

    // ---------- ওয়েবসাইট ও ডকুমেন্টস ----------
    {
      name: "ওয়েবসাইট",
      icon: GlobeIcon,
      sub: [
        {
          name: "ব্যানার ডিজাইন",
          href: "/admin/website/banner",
          icon: Image,
        },
        {
          name: "পোস্টার যুক্ত",
          href: "/admin/website/poster",
          icon: Image,
        },
        {
          name: "নোটিশ যুক্ত করুন",
          href: "/admin/website/notices",
          icon: Megaphone,
        },
        {
          name: "পড়ালেখার শিট",
          href: "/admin/website/shits",
          icon: NotebookPenIcon,
        },
      ],
    },
    {
      name: "ডকুমেন্টস/ফরমেট",
      icon: FileIcon,
      sub: [
        {
          name: "শিট ফাইল কভার",
          href: "/admin/shitfilecover",
          icon: NotebookPenIcon,
        },
      ],
    },

    // ---------- সিস্টেম ----------
    { name: "সকল ব্যবহারকারী", icon: UserRound, href: "/admin/users" },
    { name: "প্রোফাইল", icon: Settings, href: "/admin/profile" },
    {
      name: "Settings",
      icon: Settings,
      sub: [
        {
          name: "পাসওয়ার্ড পরিবর্তন",
          icon: KeySquareIcon,
          href: "/password",
        },
      ],
    },
    { name: "বাহির", icon: ChevronsLeft, href: "/" },
    { name: "লগ আউট", icon: LogOut, href: "/logout" },
  ],

  // =====================================================================
  //  ACCOUNTANT  (হিসাব বিভাগ)
  // =====================================================================
  accountant: [
    // ---------- শিক্ষার্থী ----------
    {
      name: "শিক্ষার্থী",
      icon: Users,
      sub: [
        {
          name: "নতুন শিক্ষার্থী ভর্তি",
          icon: UserPlus,
          href: "/accountant/addstudent",
        },
        {
          name: "ক্লাস ভর্তি",
          icon: NotebookPen,
          href: "/accountant/studentadmission",
        },
        {
          name: "সকল শিক্ষার্থী",
          icon: UserRoundSearch,
          href: "/accountant/allstudents",
        },
        {
          name: "ডাটা ডাউনলোড",
          icon: FileDown,
          href: "/accountant/downlaod",
        },
      ],
    },

    // ---------- শিক্ষার্থী ফি (সেটআপ → আদায় → রিপোর্ট) ----------
    {
      name: "শিক্ষার্থী ফি",
      icon: DollarSignIcon,
      sub: [
        {
          name: "ফি সেটআপ",
          icon: List,
          sub: [
            {
              name: "ফি এর ধরন",
              href: "/accountant/payments/feecategory",
              icon: List,
            },
            {
              name: "শ্রেণী ভিত্তিক ফি",
              href: "/accountant/payments/classfees",
              icon: GraduationCap,
            },
            {
              name: "ছাত্র আলাদা ফি",
              href: "/accountant/payments/studentfees",
              icon: UserCog,
            },
          ],
        },
        {
          name: "বেতন তৈরি ও আদায়",
          icon: CreditCard,
          sub: [
            {
              name: "বেতন তৈরী",
              href: "/accountant/payments/payment",
              icon: FilePlus,
            },
            {
              name: "এক্সট্রা ফি যুক্ত",
              href: "/accountant/payments/addextrafee",
              icon: FilePlus,
            },
            {
              name: "শিক্ষার্থী বেতন জমা",
              icon: CalendarRange,
              href: "/accountant/accounts/payments/mutiplemonthcash",
            },
            {
              name: "ইনভয়েস প্রিন্ট",
              icon: Printer,
              href: "/accountant/accounts/transactioninvoice",
            },
          ],
        },
        {
          name: "ফি রিপোর্ট",
          icon: BarChart3,
          sub: [
            {
              name: "লেনদেন রিপোর্ট",
              icon: BarChart3,
              href: "/accountant/payments/paidpayments",
            },
            {
              name: "ক্লাসওয়ারী রিপোর্ট",
              icon: GraduationCap,
              href: "/accountant/classledger",
            },
          ],
        },
      ],
    },

    // ---------- আয়-ব্যয় ----------
    {
      name: "আয়-ব্যয়",
      icon: Wallet,
      sub: [
        {
          name: "আয়",
          icon: BanknoteArrowUp,
          sub: [
            {
              name: "আয়ের খাতসমূহ",
              href: "/accountant/accounts/income/accountcategory",
              icon: ListPlus,
            },
            {
              name: "আয়ের হিসাব",
              href: "/accountant/accounts/income/accountentries",
              icon: BanknoteArrowUp,
            },
          ],
        },
        {
          name: "ব্যয়",
          icon: BanknoteArrowDown,
          sub: [
            {
              name: "ব্যয়ের খাতসমূহ",
              href: "/accountant/accounts/expense/accountcategory",
              icon: ListMinus,
            },
            {
              name: "ব্যয়ের হিসাব",
              href: "/accountant/accounts/expense/accountentries",
              icon: BanknoteArrowDown,
            },
          ],
        },
        {
          name: "রিপোর্ট ও ক্লোজিং",
          icon: FileBarChart,
          sub: [
            {
              name: "আয় ব্যয় ম্যাপিং",
              href: "/accountant/accounts/mapping",
              icon: ArrowLeftRight,
            },
            {
              name: "আয় ব্যয় খাত রিপোর্ট",
              href: "/accountant/accounts/allocationreport",
              icon: Banknote,
            },
            {
              name: "আয় ব্যয় রিপোর্ট",
              href: "/accountant/accounts/report",
              icon: FileBarChart,
            },
            {
              name: "বাৎসরিক হিসাব ক্লোজিং",
              href: "/accountant/accounts/yearly",
              icon: Stamp,
            },
          ],
        },
      ],
    },

    // ---------- অনুদান (সাধারণ + মাসিক এক জায়গায়) ----------
    {
      name: "অনুদান",
      icon: HandHelping,
      sub: [
        {
          name: "সাধারণ অনুদান",
          icon: HandHelping,
          sub: [
            {
              name: "জমা করুন",
              icon: KeySquareIcon,
              href: "/accountant/donation",
            },
            {
              name: "রিপোর্ট দেখুন",
              icon: FileBarChart,
              href: "/accountant/donation/report",
            },
          ],
        },
        {
          name: "মাসিক সদস্য অনুদান",
          icon: HeartHandshake,
          sub: [
            {
              name: "দাতা সদস্য তৈরি",
              icon: UserPlus,
              href: "/accountant/donor/adddonor",
            },
            {
              name: "দাতা সদস্যগণ",
              icon: Users,
              href: "/accountant/donor/alldonor",
            },
            {
              name: "দানের পরিমাণ",
              icon: Banknote,
              href: "/accountant/donor/addamount",
            },
            {
              name: "অনুদান পেমেন্ট তৈরি",
              icon: FilePlus,
              href: "/accountant/donor/generateinvoice",
            },
            {
              name: "জমা করুন",
              icon: KeySquareIcon,
              href: "/accountant/donor/receivedamount",
            },
            {
              name: "অনুদান রিপোর্ট",
              icon: FileBarChart,
              href: "/accountant/donor/report",
            },
          ],
        },
      ],
    },

    // ---------- বেতন শীট ----------
    {
      name: "বেতন শীট",
      icon: FileText,
      sub: [
        {
          name: "আবাসিক বেতন শিট",
          icon: FileText,
          href: "/accountant/betnsheet",
        },
        {
          name: "নূরানী বেতন শিট",
          icon: FileText,
          href: "/accountant/nuranibetnsheet",
        },
      ],
    },

    // ---------- যোগাযোগ ----------
    {
      name: "SMS Services",
      icon: MailOpen,
      sub: [
        {
          name: "SMS Dashboard",
          icon: BarChart3,
          href: "/accountant/sms/smsconfig",
        },
        {
          name: "সকল প্রদানকৃত SMS",
          icon: List,
          href: "/accountant/sms/smslogs",
        },
      ],
    },

    // ---------- সিস্টেম ----------
    {
      name: "Settings",
      icon: Settings,
      sub: [
        {
          name: "পাসওয়ার্ড পরিবর্তন",
          icon: KeySquareIcon,
          href: "/password",
        },
      ],
    },
    { name: "বাহির", icon: ChevronsLeft, href: "/" },
    { name: "লগ আউট", icon: LogOut, href: "/logout" },
  ],

  // =====================================================================
  //  TEACHER  (শিক্ষক)
  // =====================================================================
  teacher: [
    { name: "ড্যাশবোর্ড", icon: Home, href: "/teacher" },

    // ---------- ক্লাস সংক্রান্ত ----------
    {
      name: "শিক্ষার্থী ও ক্লাস",
      icon: Users,
      sub: [
        {
          name: "ক্লাস ওয়ারী পেমেন্ট",
          icon: CreditCard,
          href: "/teacher/classledger",
        },
        {
          name: "ডাটা ডাউনলোড",
          icon: FileDown,
          href: "/teacher/download",
        },
      ],
    },

    // ---------- নিজের ছুটি ----------
    {
      name: "ছুটি/ছাটা",
      icon: CalendarClock,
      sub: [
        {
          name: "ছুটির আবেদন",
          icon: CalendarCheck,
          href: "/teacher/leave/leaveapplication",
        },
        {
          name: "আমার ছুটি",
          icon: CalendarDays,
          href: "/teacher/leave/myleave",
        },
      ],
    },

    // ---------- সিস্টেম ----------
    {
      name: "Settings",
      icon: Settings,
      sub: [
        {
          name: "পাসওয়ার্ড পরিবর্তন",
          icon: KeySquareIcon,
          href: "/password",
        },
      ],
    },
    { name: "বাহির", icon: ChevronsLeft, href: "/" },
    { name: "লগ আউট", icon: LogOut, href: "/logout" },
  ],

  // =====================================================================
  //  STUDENT  (শিক্ষার্থী)
  // =====================================================================
  student: [
    { name: "ড্যাশবোর্ড", icon: Home, href: "/studentdashboard" },
    { name: "ফলাফল", icon: BookOpen, href: "/studentdashboard/result" },
    {
      name: "পেমেন্ট তথ্য",
      icon: CreditCard,
      href: "/studentdashboard/mypayments",
    },
    { name: "প্রোফাইল", icon: UserRound, href: "/studentdashboard/profile" },
    {
      name: "Settings",
      icon: Settings,
      sub: [
        {
          name: "পাসওয়ার্ড পরিবর্তন",
          icon: KeySquareIcon,
          href: "/password",
        },
      ],
    },
    { name: "বাহির", icon: ChevronsLeft, href: "/" },
    { name: "লগ আউট", icon: LogOut, href: "/logout" },
  ],

  // =====================================================================
  //  DONOR  (দাতা সদস্য)
  // =====================================================================
  donor: [
    // TODO: ড্যাশবোর্ড লিঙ্ক student-এর দিকে যাচ্ছে, "/donordashboard" হবে কি?
    { name: "ড্যাশবোর্ড", icon: Home, href: "/studentdashboard" },
    {
      name: "পেমেন্ট তথ্য",
      icon: CreditCard,
      href: "/donordashboard/mypayments",
    },
    { name: "প্রোফাইল", icon: UserRound, href: "/donordashboard/profile" },
    {
      name: "Settings",
      icon: Settings,
      sub: [
        {
          name: "পাসওয়ার্ড পরিবর্তন",
          icon: KeySquareIcon,
          href: "/password",
        },
      ],
    },
    { name: "বাহির", icon: ChevronsLeft, href: "/" },
    { name: "লগ আউট", icon: LogOut, href: "/logout" },
  ],

  // =====================================================================
  //  SUPER ADMIN  (প্রধান / মোহতামীম — সম্পূর্ণ নিয়ন্ত্রণ)
  // =====================================================================
  super_admin: [
    { name: "ড্যাশবোর্ড", icon: Home, href: "/superadmin" },

    // =====================================================
    // ১. প্রতিষ্ঠান পরিচিতি (তথ্য ও যোগাযোগ তালিকা)
    //    TODO: পেজ তৈরি হলে নিচের "/superadmin" বদলে আসল route দিন
    // =====================================================
    {
      name: "মোহতামীম প্রোফাইল",
      icon: Home,
      sub: [
        {
          name: "প্রাতিষ্ঠানিক কাঠামো",
          icon: Stamp,
          sub: [
            {
              name: "প্রাতিষ্ঠানিক গঠনতন্ত্র",
              icon: BookText,
              href: "/superadmin",
            },
            { name: "মজলিসে শুরা", icon: Users, href: "/superadmin" },
            { name: "মজলিসে আমেলা", icon: Users, href: "/superadmin" },
            {
              name: "উপজেলা নির্বাহী পরিচিতি",
              icon: Users,
              href: "/superadmin",
            },
            {
              name: "প্রশাসন থানা পরিচিতি",
              icon: Users,
              href: "/superadmin",
            },
          ],
        },
        {
          name: "দাতা ও সহযোগী ডাটা",
          icon: HeartHandshake,
          sub: [
            {
              name: "সহযোগী দায়ী ডাটা",
              icon: UserRound,
              href: "/superadmin",
            },
            { name: "নওমুসলিম ডাটা", icon: UserRound, href: "/superadmin" },
            {
              name: "চাকুরীজীবী অভিভাবক",
              icon: UserRound,
              href: "/superadmin",
            },
            {
              name: "রাজনৈতিক অভিভাবক",
              icon: UserRound,
              href: "/superadmin",
            },
            {
              name: "ব্যবসায়িক অভিভাবক",
              icon: UserRound,
              href: "/superadmin",
            },
            {
              name: "নোয়াফিক এলাকাবাসী",
              icon: UserRound,
              href: "/superadmin",
            },
          ],
        },
        {
          name: "জরুরি সেবা ও মিস্ত্রী",
          icon: UserCog,
          sub: [
            { name: "ফায়ার সার্ভিস", icon: UserCog, href: "/superadmin" },
            { name: "ইলেকট্রিক মিস্ত্রী", icon: UserCog, href: "/superadmin" },
            { name: "নির্মাণ মিস্ত্রি", icon: UserCog, href: "/superadmin" },
            { name: "ফিটিং ও প্লামবার", icon: UserCog, href: "/superadmin" },
          ],
        },
      ],
    },

    // =====================================================
    // ২. একাডেমিক (নাযেমে তালিমাত)
    //    সেশন → শিক্ষার্থী → পরীক্ষা → ফলাফল
    // =====================================================
    {
      name: "নাযেমে তালিমাত",
      icon: User2Icon,
      sub: [
        {
          name: "সেশন ও শ্রেণি",
          icon: CalendarClock,
          sub: [
            {
              name: "নতুন সেশন",
              icon: CalendarDays,
              href: "/superadmin/admin/session",
            },
            {
              name: "নতুন শ্রেণি যোগ",
              icon: CalendarDays,
              href: "/superadmin/admin/addclass",
            },
            {
              name: "কিতাবসমূহ",
              icon: Library,
              href: "/superadmin/admin/subjects",
            },
          ],
        },
        {
          name: "শিক্ষার্থী",
          icon: Users,
          sub: [
            {
              name: "নতুন শিক্ষার্থী ভর্তি",
              icon: UserPlus,
              href: "/superadmin/admin/addstudent",
            },
            {
              name: "ক্লাস ভর্তি",
              icon: NotebookPen,
              href: "/superadmin/admin/admission",
            },
            {
              name: "সকল শিক্ষার্থী",
              icon: UserRoundSearch,
              href: "/superadmin/admin/student",
            },
            {
              name: "ডাটা ডাউনলোড",
              icon: FileDown,
              href: "/superadmin/admin/downlaod",
            },
          ],
        },
        {
          name: "পরীক্ষা",
          icon: BookOpen,
          sub: [
            {
              name: "পরীক্ষার নাম",
              href: "/superadmin/admin/examname",
              icon: BookText,
            },
            {
              name: "পরীক্ষার বিষয় সমূহ",
              href: "/superadmin/admin/examsubjects",
              icon: Library,
            },
            {
              name: "পরীক্ষা ছাত্র রেজিষ্ট্রেশন",
              href: "/superadmin/admin/examstudent",
              icon: ClipboardList,
            },
            {
              name: "এডমিট কার্ড",
              href: "/superadmin/admin/admitcard",
              icon: IdCard,
            },
          ],
        },
        {
          name: "ফলাফল",
          icon: FileBarChart,
          sub: [
            {
              name: "গড় ফলাফল এন্ট্রি",
              href: "/superadmin/admin/entryresult",
              icon: PenLine,
            },
            {
              name: "ফলাফল",
              href: "/superadmin/admin/result",
              icon: FileBarChart,
            },
            {
              name: "ফলাফল রিপোর্ট",
              href: "/superadmin/admin/classwarymarksheet",
              icon: FileText,
            },
          ],
        },
      ],
    },

    // =====================================================
    // ৩. শিক্ষক ও কর্মী (HR)
    //    প্রোফাইল → দায়িত্ব → বেতন → হাজিরা/ছুটি
    // =====================================================
    {
      name: "শিক্ষক প্রোফাইল",
      icon: Users,
      sub: [
        {
          name: "শিক্ষক তথ্য",
          icon: UserRoundSearch,
          sub: [
            {
              name: "শিক্ষক প্রোফাইল তৈরি",
              icon: UserPlus,
              href: "/superadmin/admin/addteacher",
            },
            {
              name: "শিক্ষক বায়োডাটা",
              icon: UserRoundSearch,
              href: "/superadmin/teacher/allteacher",
            },
            {
              // TODO: শিক্ষক কোয়ার্টার নীতিমালার আসল route দিন
              name: "শিক্ষক কোয়ার্টার নীতিমালা",
              icon: FileText,
              href: "/superadmin",
            },
          ],
        },
        {
          name: "দায়িত্ব",
          icon: ClipboardList,
          sub: [
            // TODO: নিচের দুটির route একই — আলাদা route দিন
            {
              name: "শিক্ষকগণের অতিরিক্ত দায়িত্ব",
              icon: ClipboardList,
              href: "/superadmin/teacher/responsibilitydashboard",
            },
            {
              name: "দৈনিক দায়িত্ব রিপোর্ট",
              icon: FileBarChart,
              href: "/superadmin/teacher/responsibilitydashboard",
            },
          ],
        },
        {
          name: "বেতন",
          icon: Banknote,
          sub: [
            {
              name: "বেতন তৈরি",
              icon: FilePlus,
              href: "/superadmin/teacher/createsalary",
            },
            {
              name: "শিক্ষক প্রোফাইল/বেতন তালিকা",
              icon: List,
              href: "/superadmin/teacher/salarylist",
            },
          ],
        },
      ],
    },

    // =====================================================
    // ৪. অফিস একাউন্টিং
    //    শিক্ষার্থী ফি → আয়-ব্যয় → অনুদান → ইনভয়েস
    // =====================================================
    {
      name: "অফিস একাউন্টিং",
      icon: Wallet,
      sub: [
        {
          name: "শিক্ষার্থী ফি ব্যবস্থাপনা",
          icon: CreditCard,
          sub: [
            // ফি সেটআপ
            {
              name: "ফি এর ধরন",
              href: "/superadmin/accountant/payments/feecategory",
              icon: List,
            },
            {
              name: "শ্রেণী ভিত্তিক ফি",
              href: "/superadmin/accountant/payments/classfees",
              icon: GraduationCap,
            },
            {
              name: "ছাত্র আলাদা ফি",
              href: "/superadmin/accountant/payments/studentfees",
              icon: UserCog,
            },
            // বেতন তৈরি ও আদায়
            {
              name: "বেতন তৈরী",
              href: "/superadmin/accountant/payments/payment",
              icon: FilePlus,
            },
            {
              name: "এক্সট্রা ফি যুক্ত",
              href: "/superadmin/accountant/addextrafee",
              icon: FilePlus,
            },
            {
              name: "শিক্ষার্থী ফি গ্রহণ",
              href: "/superadmin/accountant/accounts/payments/mutiplemonthcash",
              icon: CalendarRange,
            },
            {
              name: "ইনভয়েস প্রিন্ট",
              href: "/superadmin/accountant/transactioninvoice",
              icon: Printer,
            },
            // রিপোর্ট
            {
              name: "লেনদেন রিপোর্ট",
              href: "/superadmin/accountant/payments/paidpayments",
              icon: BarChart3,
            },
            {
              name: "ক্লাসভিত্তিক রিপোর্ট",
              href: "/superadmin/admin/classledger",
              icon: GraduationCap,
            },
          ],
        },

        {
          name: "আয়-ব্যয় ব্যবস্থাপনা",
          icon: Wallet,
          sub: [
            // আয়
            {
              name: "আয়ের খাতসমূহ",
              href: "/superadmin/accountant/accounts/income/accountcategory",
              icon: ListPlus,
            },
            {
              name: "হ্যান্ড রশিদ এন্ট্রি",
              href: "/superadmin/accountant/accounts/income/accountentries",
              icon: BanknoteArrowUp,
            },
            // ব্যয়
            {
              name: "ব্যয়ের খাতসমূহ",
              href: "/superadmin/accountant/accounts/expense/accountcategory",
              icon: ListMinus,
            },
            {
              name: "হ্যান্ড ভাউচার এন্ট্রি",
              href: "/superadmin/accountant/accounts/expense/accountentries",
              icon: BanknoteArrowDown,
            },
            // ম্যাপিং ও রিপোর্ট
            {
              name: "আয় ব্যয় ম্যাপিং",
              href: "/superadmin/accountant/accounts/mapping",
              icon: ArrowLeftRight,
            },
            {
              name: "আয় ব্যয় খাত রিপোর্ট",
              href: "/superadmin/accountant/accounts/allocationreport",
              icon: Banknote,
            },
            {
              name: "আয়-ব্যয় রিপোর্ট",
              href: "/superadmin/accountant/accounts/report",
              icon: FileBarChart,
            },
            {
              name: "কলামনার ক্যাশবুক",
              href: "/superadmin/accountant/monthreport",
              icon: BookOpen,
            },
            {
              name: "বছরব্যাপী হিসাব রিপোর্ট",
              href: "/superadmin/accountant/accounts/yearly",
              icon: CalendarDays,
            },
          ],
        },

        {
          name: "সাধারণ অনুদান",
          icon: HandHelping,
          sub: [
            {
              name: "জমা করুন",
              icon: KeySquareIcon,
              href: "/superadmin/accountant/donation",
            },
            {
              name: "রিপোর্ট দেখুন",
              icon: FileBarChart,
              href: "/superadmin/accountant/donations/report",
            },
          ],
        },
        {
          name: "মাসিক সদস্য অনুদান",
          icon: HeartHandshake,
          sub: [
            {
              name: "দাতা সদস্য তৈরি",
              icon: UserPlus,
              href: "/superadmin/accountant/donor/adddonor",
            },
            {
              name: "দাতা সদস্যগণ",
              icon: Users,
              href: "/superadmin/donor/donor_list",
            },
            {
              name: "দানের পরিমাণ",
              icon: Banknote,
              href: "/superadmin/accountant/donor/donoramount",
            },
            {
              name: "অনুদান পেমেন্ট তৈরি",
              icon: FilePlus,
              href: "/superadmin/accountant/monthlydonation/generateinvoice",
            },
            {
              name: "জমা করুন",
              icon: KeySquareIcon,
              href: "/superadmin/accountant/monthlydonation",
            },
            {
              name: "অনুদান রিপোর্ট",
              icon: FileBarChart,
              href: "/superadmin/accountant/monthlydonation/report",
            },
            {
              name: "ডাটা ডাউনলোড",
              icon: Download,
              href: "/superadmin/donor/download",
            },
          ],
        },
      ],
    },

    // =====================================================
    // ৫. আবাসিক ও সেবা বিভাগ (পেজ তৈরি হচ্ছে)
    // =====================================================
    {
      name: "আবাসিক ও সেবা",
      icon: Presentation,
      sub: [
        {
          name: "নাযেমে দারুল ইকামাহ",
          icon: Stamp,
        },
        {
          name: "বোর্ডিং ডিপার্টমেন্ট",
          icon: Presentation,
          sub: [
            { name: "সকল বোর্ডিং সদস্য", icon: Users },
            { name: "বোর্ডিং খানার হিসাব", icon: Wallet },
            { name: "বোর্ডিং খানার হাজিরা", icon: ClipboardList },
          ],
        },
        { name: "কেয়ার টেকার", icon: Brush },
        { name: "ক্যান্টিন ব্যবস্থাপনা", icon: ShoppingCart },
      ],
    },

    // =====================================================
    // ৬. ডিজিটাল হাজিরা (শিক্ষক ও কর্মীর উপস্থিতি/ছুটি)
    // =====================================================
    {
      name: "ডিজিটাল হাজিরা",
      icon: Fingerprint,
      sub: [
        {
          name: "ডিভাইস",
          icon: MonitorSmartphone,
          sub: [
            {
              name: "ডিভাইস কানেকশন",
              href: "/superadmin/attendance/devicestatus",
              icon: MonitorSmartphone,
            },
            {
              name: "ডিভাইস ইউজার",
              href: "/superadmin/attendance/deviceuser",
              icon: Users,
            },
          ],
        },
        {
          name: "হাজিরা",
          icon: UserCheck,
          sub: [
            {
              name: "উপস্থিতি রিপোর্ট",
              href: "/superadmin/attendance/report",
              icon: ClipboardList,
            },
            {
              name: "ম্যানুয়াল হাজিরা",
              href: "/superadmin/attendance/manual",
              icon: UserCheck,
            },
            {
              // শিক্ষক প্রোফাইল থেকে সরানো হয়েছে
              name: "শিফট বরাদ্দ",
              href: "/superadmin/teacher/assignshift",
              icon: Clock3,
            },
            {
              name: "শিফট",
              href: "/superadmin/attendance/shift",
              icon: Clock3,
            },
          ],
        },
        {
          name: "ছুটি",
          icon: CalendarClock,
          sub: [
            {
              name: "ছুটির দিন",
              href: "/superadmin/attendance/holiday",
              icon: CalendarCheck,
            },
            {
              name: "ছুটির আবেদন",
              href: "/superadmin/attendance/leave",
              icon: CalendarClock,
            },
            {
              // শিক্ষক প্রোফাইল থেকে সরানো হয়েছে
              // TODO: route আলাদা করুন (এখন responsibilitydashboard)
              name: "ছুটি / ছাটা",
              href: "/superadmin/teacher/responsibilitydashboard",
              icon: CalendarDays,
            },
          ],
        },
      ],
    },

    // =====================================================
    // ৭. ওয়েবসাইট ও ডকুমেন্টস
    // =====================================================
    {
      name: "ওয়েবসাইট",
      icon: GlobeIcon,
      sub: [
        {
          name: "একাডেমিক তথ্য",
          href: "/superadmin/admin/website/academicinfo",
          icon: Image,
        },
        {
          name: "ব্যানার ডিজাইন",
          href: "/superadmin/admin/website/banner",
          icon: Image,
        },
        {
          name: "পোস্টার যুক্ত",
          href: "/superadmin/admin/website/poster",
          icon: Image,
        },
        {
          name: "নোটিশ যুক্ত করুন",
          href: "/superadmin/admin/website/notices",
          icon: Megaphone,
        },
        {
          name: "পড়ালেখার শিট",
          href: "/superadmin/admin/website/shits",
          icon: NotebookPenIcon,
        },
      ],
    },
    {
      name: "ডকুমেন্টস/ফরমেট",
      icon: FileIcon,
      sub: [
        {
          name: "শিট ফাইল কভার",
          href: "/superadmin/admin/shitfilecover",
          icon: NotebookPenIcon,
        },
        {
          name: "আবাসিক বেতন শিট",
          icon: FileText,
          href: "/superadmin/accountant/betnsheet",
        },
        {
          name: "নূরানী বেতন শিট",
          icon: FileText,
          href: "/superadmin/accountant/nuranibetnsheet",
        },
      ],
    },

    // =====================================================
    // ৮. যোগাযোগ (SMS)
    // =====================================================
    {
      name: "SMS Services",
      icon: MailOpen,
      sub: [
        {
          name: "SMS Dashboard",
          icon: BarChart3,
          href: "/superadmin/sms/smsconfig",
        },
        {
          name: "সকল প্রদানকৃত SMS",
          icon: List,
          href: "/superadmin/sms/smslogs",
        },
      ],
    },

    // =====================================================
    // ৯. অন্যান্য প্রতিষ্ঠান/ব্যবসা
    // =====================================================
    {
      name: "তিজারাহ পয়েন্ট",
      icon: DollarSignIcon,
      href: "/superadmin/borrower/allborrower",
    },

    // =====================================================
    // ১০. সিস্টেম (ব্যবহারকারী + সুরক্ষিত সংশোধন + পাসওয়ার্ড)
    // =====================================================
    {
      name: "ব্যবহারকারী",
      icon: UserRound,
      sub: [
        {
          name: "সকল ব্যবহারকারী",
          icon: Users,
          href: "/superadmin/admin/users",
        },
        {
          name: "নতুন ব্যবহারকারী",
          icon: UserPlus,
          href: "/superadmin/user/createuser",
        },
      ],
    },
    {
      name: "Settings",
      icon: Settings,
      sub: [
        {
          name: "পাসওয়ার্ড পরিবর্তন",
          icon: KeySquareIcon,
          href: "/password",
        },
        // সুরক্ষিত সংশোধন (protected route)
        {
          name: "পেমেন্ট সংশোধন",
          icon: UserPlus,
          protectedPath: "/superadmin/accountant/paymentmanager",
        },
        {
          name: "ট্রানজেকশন সংশোধন",
          icon: UserPlus,
          protectedPath: "/superadmin/accountant/transactionmanager",
        },
        {
          name: "পেমেন্ট",
          icon: BarChart3,
          protectedPath:
            "/superadmin/accountant/accounts/payments/allstudentpayments",
        },
      ],
    },

    { name: "Subscription", icon: ChevronsLeft, href: "/subscription" },
    { name: "বাহির", icon: ChevronsLeft, href: "/" },
    { name: "লগ আউট", icon: Power, href: "/logout" },
  ],
};
