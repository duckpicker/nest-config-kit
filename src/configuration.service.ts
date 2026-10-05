import { ConfigService } from '@nestjs/config';
import { type Provider } from '@nestjs/common';

export const CONFIGURATION = Symbol('CONFIGURATION');

export type EnvProxy<T> = {
  readonly [K in keyof T]: T[K];
};

export function createConfigurationProvider<
  T extends Record<string, unknown>,
>(): Provider {
  return {
    provide: CONFIGURATION,
    inject: [ConfigService],
    useFactory: (config: ConfigService<T, true>): EnvProxy<T> => {
      return new Proxy({} as EnvProxy<T>, {
        get: (_, prop: string | symbol) => {
          if (typeof prop === 'symbol') return undefined;
          return config.get(prop as keyof T & string, { infer: true });
        },
        has: (_, prop: string | symbol) => {
          if (typeof prop === 'symbol') return false;
          return config.get(prop as keyof T & string) !== undefined;
        },
      });
    },
  };
}