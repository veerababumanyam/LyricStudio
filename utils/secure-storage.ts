/**
 * Secure Storage Utility
 * 
 * Provides encrypted localStorage with AES-256-GCM encryption.
 * Automatically migrates plaintext data on first access.
 */

// Simple encryption using Web Crypto API (browser-native, no dependencies)
class SecureStorage {
  private encryptionKey: CryptoKey | null = null;
  private readonly SALT_KEY = 'swaz_storage_salt';
  private readonly VERSION_KEY = 'swaz_storage_version';
  private readonly CURRENT_VERSION = '1.0';

  /**
   * Initialize encryption key from device-specific data
   * This creates a deterministic key based on device characteristics
   */
  private async initializeKey(): Promise<CryptoKey> {
    if (this.encryptionKey) return this.encryptionKey;

    // Get or create salt
    let salt = localStorage.getItem(this.SALT_KEY);
    
    if (!salt) {
      // Generate random salt on first use
      const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
      salt = Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(this.SALT_KEY, salt);
    }

    // Derive key from salt + device fingerprint
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(salt + this.getDeviceFingerprint()),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return this.encryptionKey;
  }

  /**
   * Generate a simple device fingerprint
   * Not cryptographically secure, but sufficient for client-side encryption
   */
  private getDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ];
    return components.join('|');
  }

  /**
   * Encrypt data using AES-GCM
   */
  private async encrypt(data: string): Promise<string> {
    const key = await this.initializeKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    );

    // Return: iv + encrypted data (both as hex)
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const encryptedHex = Array.from(new Uint8Array(encrypted))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    return ivHex + ':' + encryptedHex;
  }

  /**
   * Decrypt data using AES-GCM
   */
  private async decrypt(encrypted: string): Promise<string> {
    const key = await this.initializeKey();
    const [ivHex, dataHex] = encrypted.split(':');
    
    const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const data = new Uint8Array(dataHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Check if data is encrypted (has our format)
   */
  private isEncrypted(value: string): boolean {
    return value.includes(':') && /^[0-9a-f]+:[0-9a-f]+$/.test(value);
  }

  /**
   * Get item from secure storage
   */
  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue || null;

      // Migrate from plaintext if needed
      if (!this.isEncrypted(stored)) {
        console.info(`Migrating '${key}' to encrypted storage`);
        const decrypted = stored; // Already plaintext
        await this.setItem(key, JSON.parse(decrypted));
        return JSON.parse(decrypted);
      }

      const decrypted = await this.decrypt(stored);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`SecureStorage: Failed to read '${key}'`, error);
      return defaultValue || null;
    }
  }

  /**
   * Set item in secure storage
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      const json = JSON.stringify(value);
      const encrypted = await this.encrypt(json);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`SecureStorage: Failed to store '${key}'`, error);
      throw error;
    }
  }

  /**
   * Remove item from secure storage
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all secure storage
   */
  clear(): void {
    // Preserve salt for re-encryption
    const salt = localStorage.getItem(this.SALT_KEY);
    localStorage.clear();
    if (salt) localStorage.setItem(this.SALT_KEY, salt);
  }

  /**
   * Initialize storage version tracking
   */
  async initialize(): Promise<void> {
    const version = await this.getItem<string>(this.VERSION_KEY);
    if (!version) {
      await this.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
      console.info('SecureStorage initialized');
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

// Initialize on module load
secureStorage.initialize().catch(console.error);
