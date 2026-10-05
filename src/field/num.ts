import type { Field } from './field.js';

export interface NumOptions {
  min?: number;
  max?: number;
  default?: number;
  optional?: boolean;
}

export const num = (opts: NumOptions = {}): Field<number> => ({
  __type: 0 as number,
  kind: 'number',
  ...opts,
});