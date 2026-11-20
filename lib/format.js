export const fmt = (t) => new Date(Number(t) * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC";
