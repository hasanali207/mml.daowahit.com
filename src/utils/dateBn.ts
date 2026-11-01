const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const toBnNumber = (num: number | string) =>
  String(num)
    .split("")
    .map((d) => (/\d/.test(d) ? bnDigits[Number(d)] : d))
    .join("");

export const formatDateBn = (dateInput: string | Date) => {
  if (!dateInput) return "-";

  return new Intl.DateTimeFormat("bn-BD", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateInput));
};

export const formatBanglaDateTime = (isoString: string) => {
  if (!isoString) return "-";

  return new Intl.DateTimeFormat("bn-BD", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
};

export const fmtTime = (value: string | null): string => {
  if (!value) return "—";

  const timePart = value.includes("T")
    ? value.split("T")[1]
    : value.split(" ")[1];

  if (!timePart) return "—";

  const [hourStr, minute] = timePart.split(":");
  const hour = Number(hourStr);

  if (Number.isNaN(hour)) return "—";

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${String(hour12).padStart(2, "0")}:${minute} ${period}`;
};
