import { Logger } from '@nestjs/common';
import type { Field } from './field/field.js';
import { buildEnv, type InferEnv } from './build-env.js';

const logger = new Logger('EnvValidation');

export function validate<S extends Record<string, Field<unknown>>>(
  schema: S,
) {
  return (raw: Record<string, unknown>): InferEnv<S> => {
    logger.log(`Validating ${Object.keys(schema).length} env variable(s)`);
    try {
      return buildEnv(schema, raw);
    } catch (e) {
      logger.error((e as Error).message);
      throw e;
    }
  };
}