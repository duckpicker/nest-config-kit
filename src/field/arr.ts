import type { Field } from './field.js';

export interface ArrOptions {
  separator?: string;
  optional?: boolean;
}

export const arr = <T>(
  item: Field<T>,
  opts: ArrOptions = {},
): Field<T[]> => ({
  __type: [] as T[],
  kind: 'array',
  item,
  separator: opts.separator ?? ',',
  optional: opts.optional,
});