import 'dotenv/config';
import { get } from 'env-var';

export const envs = {
  PORT: get('PORT').required().asPortNumber(),
  OPENAI_API_KEY: get('OPENAI_API_KEY').required().asString(),

  SUPABASE_URL: get('SUPABASE_URL').required().asString(),
  SUPABASE_PRIVATE_KEY: get('SUPABASE_PRIVATE_KEY').required().asString(),
  DB_PASSWORD: get('DB_PASSWORD').required().asString(),
  DB_USER: get('DB_USER').required().asString(),
  DB_NAME: get('DB_NAME').required().asString(),
  MONGO_DB_URL: get('MONGO_DB_URL').required().asString(),
};
