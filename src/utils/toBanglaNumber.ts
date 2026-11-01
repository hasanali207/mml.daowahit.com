export const toBanglaNumber = (num: number | string) => {
  if (num === null || num === undefined || num === "") return "-"

  const number = Number(num)

  // 👉 1,00,000 format (Bangladesh/India style)
  const formatted = number.toLocaleString("en-IN")

  const en = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]

  return formatted
    .split("")
    .map((c) => (en.includes(c) ? bn[en.indexOf(c)] : c))
    .join("")
}
