import 'dotenv/config';
import { get } from 'env-var';

export const envs = {
  PORT: get('PORT').required().asPortNumber(),
  OPENAI_API_KEY: get('OPENAI_API_KEY').required().asString(),

  DATABASE_URL: get('DATABASE_URL').required().asString(),
  DB_PASSWORD: get('DB_PASSWORD').required().asString(),
  DB_USER: get('DB_USER').required().asString(),
  DB_NAME: get('DB_NAME').required().asString(),
};
