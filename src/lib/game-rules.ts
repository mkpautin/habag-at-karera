// Shared counts only. Challenge answers and hints stay in server-only modules.
export const roundCounts = [0, 5, 2, 5] as const;
export const totalRounds = roundCounts.reduce<number>((total, count) => total + count, 0);
