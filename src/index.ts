export { str, num, bool, arr } from './field/index.js';
export type {
  Field,
  FieldKind,
  StrOptions,
  NumOptions,
  BoolOptions,
  ArrOptions,
} from './field/index.js';

export {
  CONFIGURATION,
  createConfigurationProvider,
  type EnvProxy,
} from './configuration.service.js';

export { buildEnv, EnvValidationError } from './build-env.js';
export type { InferEnv } from './build-env.js';

export { validate } from './validate.js';

export { IsCorsOriginValue } from './decorators/is-cors-origin.decorator.js';

export { transformStringIPsToArr } from './utils/transform-string-ips.js';

export {
  nodeEnvValue,
  nodeEnvValues,
} from './const/node-env-value.js';
export type { NodeEnvValueType } from './const/node-env-value.js';