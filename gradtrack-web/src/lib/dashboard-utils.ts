export const EMPLOYED_STATUSES = [
  "Employed (Full-time)",
  "Employed (Part-time)",
  "Self-employed / Entrepreneur",
  "Internship / Attachment",
] as const;

export type EmployedStatus = (typeof EMPLOYED_STATUSES)[number];

export const EMPLOYED_STATUSES_SET = new Set<string>(EMPLOYED_STATUSES);

export function isEmployed(status: string): boolean {
  return EMPLOYED_STATUSES_SET.has(status);
}

export function shortSchool(n: string) { return n.match(/\(([^)]+)\)/)?.[1] ?? n; }
export function shortDept(n: string)   { return n.replace("Department of ", ""); }
export function shortSector(n: string) { return n.match(/\(([^)]+)\)/)?.[1] ?? n.substring(0, 25); }
export function shortProg(n: string)   { return n.length > 40 ? n.substring(0, 37) + "…" : n; }
export function shortStatus(s: string) {
  return s.replace("Unemployed — ", "").replace("Self-employed / ", "Self-emp. ");
}
