import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// KEY must be 32 bytes (64 hex chars). Falls back to 'a'.repeat(64) in dev.
const KEY = Buffer.from(process.env.ENCRYPTION_KEY ?? 'a'.repeat(64), 'hex');

/**
 * Encrypt plaintext with AES-256-CBC.
 * Returns "iv_hex:ciphertext_hex".
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a value produced by encrypt().
 * Expects "iv_hex:ciphertext_hex".
 */
export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted text format.');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedBuf = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedBuf), decipher.final()]);
  return decrypted.toString('utf8');
}
