import type { Field } from './field.js';

export interface StrOptions {
  values?: readonly string[];
  default?: string;
  optional?: boolean;
}

export const str = (opts: StrOptions = {}): Field<string> => ({
  __type: '' as string,
  kind: 'string',
  ...opts,
});