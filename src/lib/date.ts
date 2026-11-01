const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";

  const d = new Date(dateStr);

  if (isNaN(d.getTime())) return "Invalid";

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default formatDate;