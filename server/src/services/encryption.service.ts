import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

/**
 * Encryption service for sensitive data like API keys
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private static masterKey: Buffer | null = null;

  /**
   * Initialize the encryption service with a master key
   * The master key should be stored securely in environment variables
   */
  static initialize(masterKeyHex?: string) {
    if (masterKeyHex) {
      this.masterKey = Buffer.from(masterKeyHex, 'hex');
      if (this.masterKey.length !== KEY_LENGTH) {
        throw new Error(`Master key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex chars)`);
      }
    } else {
      // Generate a random master key if none provided (for development)
      this.masterKey = crypto.randomBytes(KEY_LENGTH);
      console.warn('⚠️  No ENCRYPTION_MASTER_KEY provided. Generated random key (data will not persist across restarts)');
      console.warn('   Set ENCRYPTION_MASTER_KEY in .env to:', this.masterKey.toString('hex'));
    }
  }

  /**
   * Derive a user-specific encryption key from the master key and user ID
   * This allows per-user encryption without storing individual keys
   */
  private static deriveUserKey(userId: string, salt: Buffer): Buffer {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    return crypto.pbkdf2Sync(
      Buffer.concat([this.masterKey, Buffer.from(userId, 'utf8')]),
      salt,
      100000, // iterations
      KEY_LENGTH,
      'sha256'
    );
  }

  /**
   * Encrypt data for a specific user
   * Returns base64-encoded string: salt:iv:authTag:ciphertext
   */
  static encrypt(plaintext: string, userId: string): string {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive user-specific key
    const key = this.deriveUserKey(userId, salt);

    // Encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine all components: salt:iv:authTag:ciphertext
    const result = Buffer.concat([salt, iv, authTag, ciphertext]);
    return result.toString('base64');
  }

  /**
   * Decrypt data for a specific user
   * Expects base64-encoded string: salt:iv:authTag:ciphertext
   */
  static decrypt(encrypted: string, userId: string): string {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    // Decode from base64
    const buffer = Buffer.from(encrypted, 'base64');

    // Extract components
    let offset = 0;
    const salt = buffer.subarray(offset, offset + SALT_LENGTH);
    offset += SALT_LENGTH;
    const iv = buffer.subarray(offset, offset + IV_LENGTH);
    offset += IV_LENGTH;
    const authTag = buffer.subarray(offset, offset + AUTH_TAG_LENGTH);
    offset += AUTH_TAG_LENGTH;
    const ciphertext = buffer.subarray(offset);

    // Derive user-specific key
    const key = this.deriveUserKey(userId, salt);

    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    return plaintext.toString('utf8');
  }

  /**
   * Re-encrypt data from client-side encryption to server-side encryption
   * Used during migration from localStorage to backend
   */
  static reencrypt(clientEncrypted: string, userId: string): string {
    // In a real implementation, the client would decrypt and send the plaintext
    // over HTTPS, then we encrypt it with the server key
    // For now, we'll assume the input is already plaintext
    return this.encrypt(clientEncrypted, userId);
  }

  /**
   * Verify if encrypted data is valid
   */
  static isValidEncrypted(encrypted: string): boolean {
    try {
      const buffer = Buffer.from(encrypted, 'base64');
      const minLength = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1;
      return buffer.length >= minLength;
    } catch {
      return false;
    }
  }

  /**
   * Get the master key for backup purposes (use carefully!)
   */
  static getMasterKeyHex(): string {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }
    return this.masterKey.toString('hex');
  }
}
