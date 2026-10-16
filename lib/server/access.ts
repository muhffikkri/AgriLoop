import { readStore, type User } from "./db.ts";

/**
 * Organisation scope for the demo store: two accounts belong together when they share
 * an organisation name. A real deployment replaces this with an organisation id on a
 * membership row.
 */
export function sameOrg(userId: string, actor: User): boolean {
  if (userId === actor.id) return true;
  if (!actor.orgName) return false;
  const other = readStore().users.find((candidate) => candidate.id === userId);
  return Boolean(other?.orgName) && other!.orgName === actor.orgName;
}

export function userById(userId: string): User | null {
  return readStore().users.find((candidate) => candidate.id === userId) ?? null;
}
