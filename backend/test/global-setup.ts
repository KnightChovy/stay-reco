import { execSync } from 'child_process';
import { join } from 'path';

export default function globalSetup() {
  process.loadEnvFile(join(__dirname, '..', '.env.test'));
  execSync('npx prisma migrate deploy', {
    cwd: join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });
}
