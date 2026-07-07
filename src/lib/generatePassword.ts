/** Generates a password meeting admin registration rules (upper, lower, digit, 8+ chars). */
export function generateSecurePassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@#$!";
  const all = upper + lower + digits + special;

  const chars = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  for (let i = chars.length; i < length; i++) {
    chars.push(all[Math.floor(Math.random() * all.length)]);
  }

  return chars.sort(() => Math.random() - 0.5).join("");
}
