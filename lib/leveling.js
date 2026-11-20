const need = (n) => 5 * n * n + 50 * n + 100;
export function levelFromXp(xp) {
  let level = 0, rem = Number(xp);
  while (rem >= need(level)) { rem -= need(level); level++; }
  return level;
}
