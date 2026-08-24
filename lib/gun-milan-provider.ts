/**
 * Paid Gun Milan providers sit behind this adapter.
 * Prokerala is the first implementation. DivineAPI is not wired in this PR.
 */

export type ChartPerson = {
  datetime: string;
  coordinates: string;
};

export type GunMilanMatchInput = {
  girl: ChartPerson;
  boy: ChartPerson;
};

export type GunMilanProvider = {
  id: string;
  isConfigured(): boolean;
  fetchKundliMatching(input: GunMilanMatchInput): Promise<unknown>;
};

export function createMissingKeysError() {
  return new Error("GUN_MILAN_NOT_CONFIGURED");
}

// DivineAPI can be added later as another GunMilanProvider. Do not call it here.
