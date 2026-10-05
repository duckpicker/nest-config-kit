# @duckpicker/nest-config-kit

Typed, validated env config for NestJS. One schema file — no more editing three files per variable.

- **Codegen from a single schema** — add a variable with one line
- **Fails at startup** if a required variable is missing — before `NestFactory.create` even runs
- **Fully typed** — `env.PORT` is `number`, `env.DATABASE_URL` is `string`
- **No `get('KEY')`** — a Proxy gives you direct property access with autocomplete

## Install

```bash
pnpm add @duckpicker/nest-config-kit
pnpm add @nestjs/config@^4.0.0 class-validator class-transformer
```

### Peer dependencies

The kit expects these to be present in your project:

| Package             | Version            |
| ------------------- | ------------------ |
| `@nestjs/common`    | `^10.0.0 \|\| ^11.0.0` |
| `@nestjs/config`    | `^4.0.0`           |
| `class-transformer` | `^0.5.0`           |
| `class-validator`   | `^0.14.0`          |
| `reflect-metadata`  | `^0.2.0`           |

`@nestjs/config` **must be `4.x`**. Version `12.x` targets NestJS 12 and is not compatible.

## Quick start

### 1. Write the schema

Create `src/config/env.schema.ts` (see “Where the CLI looks” below for other locations):

```typescript
import { str, num, bool, arr, InferEnv } from '@duckpicker/nest-config-kit';

export const envSchema = {
  PORT: num({ min: 1, max: 65535, default: 3000 }),
  DATABASE_URL: str(),
  NODE_ENV: str({ values: ['development', 'production', 'test'] }),
  DEBUG: bool({ default: false }),
  CORS_ORIGINS: arr(str(), { separator: ',' }),
} as const;

export type Env = InferEnv<typeof envSchema>;
```

> The `as const` is **required**. Without it, TypeScript widens the schema to `Record<string, Field<unknown>>` and you lose per-key types.

### 2. Wire it up

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  validate,
  createConfigurationProvider,
  CONFIGURATION,
} from '@duckpicker/nest-config-kit';
import { envSchema, type Env } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validate(envSchema),
    }),
  ],
  providers: [createConfigurationProvider<Env>()],
  exports: [CONFIGURATION],
})
export class AppModule {}
```

### 3. Add scripts to `package.json`

```json
{
  "scripts": {
    "gen:env": "nest-config-kit gen",
    "dev": "pnpm gen:env && nest start --watch",
    "build": "pnpm gen:env && nest build",
    "start:prod": "node dist/main.js"
  }
}
```

`pnpm dev` generates `environment-variables.generated.ts` next to your schema, then starts Nest.

### 4. Use it

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { CONFIGURATION, type EnvProxy } from '@duckpicker/nest-config-kit';
import type { Env } from './config/env.schema';

@Injectable()
export class DbService {
  constructor(
    @Inject(CONFIGURATION) private readonly env: EnvProxy<Env>,
  ) {}

  connect() {
    // env.DATABASE_URL is typed as string
    // env.PORT is typed as number
    // env.UNKNOWN is a compile-time error
    return createPool({ connectionString: this.env.DATABASE_URL });
  }
}
```

In `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { CONFIGURATION, type EnvProxy } from '@duckpicker/nest-config-kit';
import { AppModule } from './app.module';
import type { Env } from './config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get<EnvProxy<Env>>(CONFIGURATION);
  await app.listen(env.PORT);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

## Where the CLI looks for the schema

The `nest-config-kit gen` command searches, in order, from the project root:

```
src/env.schema.ts
src/config/env.schema.ts
env.schema.ts
```

The first existing file wins. The generated `environment-variables.generated.ts` is written **next to the schema**.

The generated file must be in `.gitignore`:

```gitignore
**/environment-variables.generated.ts
```

## Field factories

All factories return a `Field<T>` descriptor used by the codegen and by `buildEnv` at runtime.

### `str(options?)`

| Option     | Type              | Default | Description                          |
| ---------- | ----------------- | ------- | ------------------------------------ |
| `values`   | `readonly string[]` | —     | Enum of allowed values               |
| `default`  | `string`          | —       | Fallback if env is missing           |
| `optional` | `boolean`         | `false` | If `true`, missing is OK             |

```typescript
NODE_ENV: str({ values: ['development', 'production', 'test'] }),
API_KEY: str(),
GREETING: str({ default: 'hello' }),
MAYBE: str({ optional: true }),
```

### `num(options?)`

| Option     | Type     | Default | Description             |
| ---------- | -------- | ------- | ----------------------- |
| `min`      | `number` | —       | Lower bound (inclusive) |
| `max`      | `number` | —       | Upper bound (inclusive) |
| `default`  | `number` | —       | Fallback                |
| `optional` | `boolean`| `false` | If `true`, missing OK   |

```typescript
PORT: num({ min: 1, max: 65535, default: 3000 }),
TIMEOUT_MS: num({ min: 0 }),
```

### `bool(options?)`

| Option     | Type      | Default | Description           |
| ---------- | --------- | ------- | --------------------- |
| `default`  | `boolean` | —       | Fallback              |
| `optional` | `boolean` | `false` | If `true`, missing OK |

Accepts `"true"`, `"false"`, `"1"`, `"0"` in `.env`.

```typescript
DEBUG: bool({ default: false }),
FEATURE_X: bool(),
```

### `arr(item, options?)`

| Option      | Type     | Default | Description             |
| ----------- | -------- | ------- | ----------------------- |
| `separator` | `string` | `','`   | Splits the raw env var  |
| `optional`  | `boolean`| `false` | If `true`, missing OK   |

Composes the item factory for element validation.

```typescript
CORS_ORIGINS: arr(str()),
PORTS: arr(num({ min: 1, max: 65535 })),
TAGS: arr(str(), { separator: ';' }),
```

## Validation rules at startup

`validate(schema)` returns a function passed to `ConfigModule.forRoot({ validate })`. It runs **before the application instance is created**:

1. For each key: if missing and `default` set → use default
2. If missing and `optional: true` → skip
3. If missing and neither → collect error
4. If present → parse and validate
5. If **any** error → throw `EnvValidationError` with a full list

Example failure:

```
[Nest] ERROR [EnvValidation] Env validation failed:
  - DATABASE_URL: is required but not set
  - PORT: max is 65535
  - NODE_ENV: must be one of: development, production, test
```

The application **does not start** until every required variable is valid.

## Type helpers

### `InferEnv<S>`

Extracts the runtime shape from a schema:

```typescript
import type { InferEnv } from '@duckpicker/nest-config-kit';

export type Env = InferEnv<typeof envSchema>;
```

### `EnvProxy<T>`

The type of the injected configuration object. Readonly mapped type over `T`.

```typescript
import type { EnvProxy } from '@duckpicker/nest-config-kit';

constructor(
  @Inject(CONFIGURATION) private readonly env: EnvProxy<Env>,
) {}
```

## API reference

| Export                          | Kind       | Purpose                                          |
| ------------------------------- | ---------- | ------------------------------------------------ |
| `str`, `num`, `bool`, `arr`     | factories  | Build schema fields                              |
| `Field<T>`                      | type       | A single schema field                            |
| `InferEnv<S>`                   | type       | Extract runtime type from schema                 |
| `buildEnv(schema, raw)`         | fn         | Parse + validate a schema against a raw record   |
| `EnvValidationError`            | class      | Thrown when validation fails                     |
| `validate(schema)`              | fn         | Returns a `ConfigModule` validate function       |
| `createConfigurationProvider<T>()` | fn      | Nest provider factory returning the Proxy        |
| `CONFIGURATION`                 | Symbol     | DI token for the Proxy                           |
| `EnvProxy<T>`                   | type       | Type of the injected Proxy                       |
| `IsCorsOriginValue`             | decorator  | `class-validator` decorator for CORS origins     |
| `transformStringIPsToArr`       | fn         | `"a,b,c"` → `["a", "b", "c"]`                    |
| `nodeEnvValue`, `nodeEnvValues` | const      | `development` / `production` / `test`            |

## Advanced schema — how weird you can get

`arr`, `str`, `num`, `bool` compose. Every nested item is validated independently.

```typescript
import { str, num, bool, arr, InferEnv } from '@duckpicker/nest-config-kit';

export const envSchema = {
  // primitives
  NODE_ENV: str({ values: ['development', 'production', 'test'] }),
  PORT: num({ min: 1, max: 65535, default: 3000 }),
  DEBUG: bool({ default: false }),

  // required string with no fallback
  DATABASE_URL: str(),
  JWT_ACCESS_SECRET: str(),

  // string with a fixed set of values
  LOG_LEVEL: str({ values: ['debug', 'info', 'warn', 'error'] }),

  // optional string — `env.SENTRY_DSN` is `string | undefined`
  SENTRY_DSN: str({ optional: true }),

  // array of strings, comma-separated
  CORS_ORIGINS: arr(str()),

  // array of numbers, semicolon-separated
  WORKER_PORTS: arr(num({ min: 1024, max: 65535 }), { separator: ';' }),

  // array of enum strings
  ENABLED_REGIONS: arr(str({ values: ['eu', 'us', 'asia'] })),

  // array of arrays — `[[1,2],[3,4]]` from `"1,2;3,4"`
  // (nested arrays are split by the outer separator first)
  SHARD_MATRIX: arr(arr(num({ min: 0 }), { separator: ',' }), {
    separator: ';',
  }),

  // three levels deep — [[['a']]]
  TAGS: arr(arr(arr(str(), { separator: '|' }), { separator: ';' }), {
    separator: ',',
  }),
} as const;

export type Env = InferEnv<typeof envSchema>;
```

With the above, the generated `EnvironmentVariables` class carries **all** of it — `@Transform` chains, `@IsArray({ each: true })`, `@IsIn(..., { each: true })`, `@Min` / `@Max`. You never touch that file.

Usage:

```typescript
const env = app.get<EnvProxy<Env>>(CONFIGURATION);

env.ENABLED_REGIONS;   // ('eu' | 'us' | 'asia')[]
env.WORKER_PORTS;      // number[]
env.SHARD_MATRIX;      // number[][]
env.SENTRY_DSN;        // string | undefined
```

## CORS origins

`IsCorsOriginValue` is a `class-validator` decorator that accepts an IP, `localhost`, a hostname, or a full origin URL. It's already applied if you use `arr(str())` for a CORS field — but it's exported if you want it in a hand-written DTO:

```typescript
import { IsCorsOriginValue } from '@duckpicker/nest-config-kit';

class SomeDto {
  @IsCorsOriginValue({ each: true })
  origins!: string[];
}
```

Accepted values:

- `localhost`
- `127.0.0.1`, `::1`, `0.0.0.0`
- `example.com`, `sub.example.com`
- `http://localhost:3000`, `https://api.example.com`

## License

MIT