export function normalizePkPhone(input: string): string | null {
  let raw = input.trim().replace(/[\s-]/g, "");
  if (raw.startsWith("+")) raw = raw.slice(1);
  raw = raw.replace(/\D/g, "");
  if (raw.startsWith("92") && raw.length === 12) raw = "0" + raw.slice(2);
  if (/^03\d{9}$/.test(raw)) return raw;
  return null;
}

export function formatPkPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (/^03\d{9}$/.test(d)) return `+92 ${d.slice(1, 4)} ${d.slice(4)}`;
  return phone;
}