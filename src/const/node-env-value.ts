export const nodeEnvValue = {
  Development: 'development',
  Production: 'production',
  Test: 'test',
} as const;

export const nodeEnvValues = Object.values(nodeEnvValue);

export type NodeEnvValueType =
  (typeof nodeEnvValue)[keyof typeof nodeEnvValue];