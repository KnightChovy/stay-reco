import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  // Verified against when the account does not exist, so response time doesn't leak it.
  private readonly dummyHash = argon2.hash('dummy-password-for-timing', {
    type: argon2.argon2id,
  });

  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(hash: string | null | undefined, password: string) {
    try {
      return await argon2.verify(hash ?? (await this.dummyHash), password);
    } catch {
      return false;
    }
  }
}
