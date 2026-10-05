import type { Field } from './field.js';

export interface BoolOptions {
  default?: boolean;
  optional?: boolean;
}

export const bool = (opts: BoolOptions = {}): Field<boolean> => ({
  __type: false as boolean,
  kind: 'boolean',
  ...opts,
});