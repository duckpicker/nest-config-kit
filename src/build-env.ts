import type { Field } from './field/field.js';

type InferField<F> = F extends Field<infer U> ? U : never;

export type InferEnv<S extends Record<string, Field<unknown>>> = {
  [K in keyof S]: InferField<S[K]>;
};

export class EnvValidationError extends Error {
  constructor(
    public readonly issues: Array<{ key: string; message: string }>,
  ) {
    const lines = issues.map((i) => `  - ${i.key}: ${i.message}`);
    super(`Env validation failed:\n${lines.join('\n')}`);
    this.name = 'EnvValidationError';
  }
}

function parseValue(key: string, raw: unknown, field: Field<unknown>): unknown {
  const str = String(raw);

  switch (field.kind) {
    case 'number': {
      const n = Number(str);
      if (Number.isNaN(n)) throw new Error(`expected number, got "${str}"`);
      if (field.min != null && n < field.min) throw new Error(`min is ${field.min}`);
      if (field.max != null && n > field.max) throw new Error(`max is ${field.max}`);
      return n;
    }
    case 'boolean': {
      if (str === 'true' || str === '1') return true;
      if (str === 'false' || str === '0') return false;
      throw new Error(`expected boolean ("true"/"false"/"1"/"0"), got "${str}"`);
    }
    case 'string': {
      if (field.values && !field.values.includes(str)) {
        throw new Error(`must be one of: ${field.values.join(', ')}`);
      }
      return str;
    }
    case 'array': {
      const itemField = field.item!;
      const sep = field.separator ?? ',';
      return str
        .split(sep)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => parseValue(key, s, itemField));
    }
  }
}

export function buildEnv<S extends Record<string, Field<unknown>>>(
  schema: S,
  raw: Record<string, unknown>,
): InferEnv<S> {
  const out: Record<string, unknown> = {};
  const issues: Array<{ key: string; message: string }> = [];

  for (const [key, field] of Object.entries(schema)) {
    const rawValue = raw[key];

    if (rawValue === undefined || rawValue === '') {
      if (field.default !== undefined) {
        out[key] = field.default;
        continue;
      }
      if (field.optional) continue;
      issues.push({ key, message: 'is required but not set' });
      continue;
    }

    try {
      out[key] = parseValue(key, rawValue, field);
    } catch (e) {
      issues.push({ key, message: (e as Error).message });
    }
  }

  if (issues.length) {
    throw new EnvValidationError(issues);
  }

  return out as InferEnv<S>;
}