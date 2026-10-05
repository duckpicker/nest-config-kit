# @duckpicker/nest-config-kit

Typed env config with schema-based validation for NestJS.

## Install

\`\`\`bash
pnpm add @duckpicker/nest-config-kit
\`\`\`

## Usage

\`\`\`typescript
import { str, num, bool, arr, type InferEnv } from '@duckpicker/nest-config-kit';

export const envSchema = {
NODE_ENV: str({ values: ['development', 'production', 'test'] }),
APP_PORT: num({ min: 1, max: 65535 }),
DB_SYNCHRONIZE: bool(),
CORS_ORIGINS: arr(str()),
} as const;

export type Env = InferEnv<typeof envSchema>;
\`\`\`

\`\`\`typescript
import { ConfigModule } from '@nestjs/config';
import { validate, createConfigurationProvider, CONFIGURATION } from '@duckpicker/nest-config-kit';
import { envSchema, type Env } from './env.schema';

@Module({
imports: [ConfigModule.forRoot({ isGlobal: true, validate: validate(envSchema) })],
providers: [createConfigurationProvider<Env>()],
exports: [CONFIGURATION],
})
export class AppModule {}
\`\`\`

\`\`\`typescript
@Injectable()
export class AuthService {
constructor(@Inject(CONFIGURATION) private readonly env: EnvProxy<Env>) {}

sign(payload: object) {
return jwt.sign(payload, this.env.JWT_ACCESS_SECRET);
}
}
\`\`\`