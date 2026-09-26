import { jwtVerify } from 'jose';
import type { AuthToken } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'luxe-super-secret-key-2024-prototype'
);

export async function verifyToken(token: string): Promise<AuthToken | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthToken;
  } catch {
    return null;
  }
}
