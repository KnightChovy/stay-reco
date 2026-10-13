import { join } from 'path';

// Loaded before ConfigModule reads .env; ConfigModule never overrides existing vars.
process.loadEnvFile(join(__dirname, '..', '.env.test'));
