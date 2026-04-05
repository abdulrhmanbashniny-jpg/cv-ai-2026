// PII Masking utility for admin dashboards
// Masks phone numbers and names to comply with PDPL

/**
 * Masks a phone number: "966512345678" → "9665****5678"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const clean = phone.replace(/\s+/g, "");
  if (clean.length <= 6) return clean.slice(0, 2) + "****";
  return clean.slice(0, 4) + "****" + clean.slice(-2);
}

/**
 * Masks a name: "عبدالرحمن باشنيني" → "عبدالرحمن ب."
 * For single names: "Ali" → "A***"
 */
export function maskName(name: string | null | undefined): string {
  if (!name || name === "زائر") return name || "زائر";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0) + "***";
  }
  // Keep first name, abbreviate last
  return parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
}
