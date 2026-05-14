import type { BioBank } from "../data/bioTypes";

/** Do not drop below this many whole projects when the bank has at least this many (matches tailored cap of 3). */
const RESUME_FIT_MIN_WHOLE_PROJECTS = 3;

export function minWholeProjectFloor(bank: BioBank): number {
  if (bank.projects.length === 0) return 0;
  return Math.min(RESUME_FIT_MIN_WHOLE_PROJECTS, bank.projects.length);
}
