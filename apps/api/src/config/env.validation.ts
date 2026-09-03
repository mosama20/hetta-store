import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  DATABASE_URL: string = '';

  @IsString()
  @MinLength(16)
  JWT_ACCESS_SECRET: string = 'fashion_store_super_secret_jwt_access_key_2026';

  @IsString()
  @MinLength(16)
  JWT_REFRESH_SECRET: string = 'fashion_store_super_secret_jwt_refresh_key_2026';

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRATION: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION: string = '7d';

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = 'http://localhost:5173';

  @IsString()
  @IsOptional()
  STORAGE_PROVIDER: string = 'LOCAL';

  @IsNumber()
  @IsOptional()
  DATABASE_CONNECTION_LIMIT: number = 5;

  @IsNumber()
  @IsOptional()
  DATABASE_POOL_TIMEOUT: number = 10;

  @IsNumber()
  @IsOptional()
  PUBLIC_CACHE_TTL_SECONDS: number = 60;

  @IsNumber()
  @IsOptional()
  PUBLIC_CACHE_STALE_SECONDS: number = 300;

  @IsString()
  @IsOptional()
  LOG_REQUEST_TIMING: string = 'false';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation error: ${errors.toString()}`);
  }
  return validatedConfig;
}
