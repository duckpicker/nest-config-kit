import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'es2022',
  external: [
    '@nestjs/common',
    '@nestjs/config',
    'class-transformer',
    'class-validator',
    'reflect-metadata',
    'tsx',
  ],
});