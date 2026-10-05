const IP_SEPARATOR = ',';

export const transformStringIPsToArr = (stringIPs: string): string[] =>
  stringIPs
    .split(IP_SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean);