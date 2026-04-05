/**
 * AES-256-GCM Encryption Utilities — Counselor Notes
 *
 * Security guarantees:
 *  - Key derivation: PBKDF2 (100,000 iterations, SHA-256) — prevents brute-force
 *  - Cipher: AES-256-GCM — authenticated encryption (integrity + confidentiality)
 *  - IV: 96-bit random nonce per encryption — never reused
 *  - Salt: derived from saltContext (student_id) so same passphrase ≠ same key across students
 *  - Plaintext NEVER leaves the browser
 *
 * Field names match backend schema: encrypted_blob, iv, auth_tag (all base64)
 */

export interface EncryptedNote {
  encrypted_blob: string; // base64-encoded ciphertext (without auth tag)
  iv: string;             // base64-encoded 12-byte nonce
  auth_tag: string;       // base64-encoded 16-byte GCM auth tag
}

// ─── Base64 helpers ──────────────────────────────────────────────────────────

const toBase64 = (buf: Uint8Array): string =>
  btoa(String.fromCharCode(...buf));

const fromBase64 = (b64: string): Uint8Array =>
  new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));

// ─── Key derivation ──────────────────────────────────────────────────────────

/**
 * Derive an AES-256-GCM CryptoKey from a passphrase using PBKDF2.
 *
 * @param password    - The counselor's passphrase
 * @param saltContext - A per-student identifier (student_id) used to derive the salt,
 *                      so the same passphrase produces a different key per student.
 * @param usage       - ['encrypt'] or ['decrypt']
 */
async function deriveKey(
  password: string,
  saltContext: string,
  usage: KeyUsage[]
): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Salt is deterministic per student so the same passphrase yields a different
  // derived key for each student, without needing to store a random salt.
  const saltSource = encoder.encode(`lumina-counselor-${saltContext}`);
  const salt = await crypto.subtle.digest('SHA-256', saltSource);

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    usage
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string.
 *
 * @param plaintext   - The note content to encrypt
 * @param password    - The counselor's passphrase
 * @param saltContext - student_id (or 'default'); used to derive the per-student salt
 * @returns           EncryptedNote with base64-encoded encrypted_blob, iv, auth_tag
 */
export async function encryptNote(
  plaintext: string,
  password: string,
  saltContext: string = 'default'
): Promise<EncryptedNote> {
  const encoder = new TextEncoder();
  const key = await deriveKey(password, saltContext, ['encrypt']);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Web Crypto appends the 16-byte GCM auth tag at the end of the ciphertext
  const encryptedArray = new Uint8Array(encrypted);
  const auth_tag = encryptedArray.slice(-16);
  const blob = encryptedArray.slice(0, -16);

  return {
    encrypted_blob: toBase64(blob),
    iv: toBase64(iv),
    auth_tag: toBase64(auth_tag),
  };
}

/**
 * Decrypt an EncryptedNote back to plaintext.
 *
 * @param encrypted_blob - base64-encoded ciphertext (without auth tag)
 * @param iv             - base64-encoded 12-byte nonce
 * @param auth_tag       - base64-encoded 16-byte GCM auth tag
 * @param password       - The counselor's passphrase
 * @param saltContext    - student_id (must match the value used during encryption)
 * @returns              Decrypted plaintext, or an error sentinel string on failure
 */
export async function decryptNote(
  encrypted_blob: string,
  iv: string,
  auth_tag: string,
  password: string,
  saltContext: string = 'default'
): Promise<string> {
  try {
    const decoder = new TextDecoder();
    const key = await deriveKey(password, saltContext, ['decrypt']);

    const blob = fromBase64(encrypted_blob);
    const ivBytes = fromBase64(iv);
    const authTagBytes = fromBase64(auth_tag);

    // Reconstruct the full AES-GCM ciphertext: blob || auth_tag
    const encryptedData = new Uint8Array(blob.length + authTagBytes.length);
    encryptedData.set(blob);
    encryptedData.set(authTagBytes, blob.length);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes as Uint8Array<ArrayBuffer> },
      key,
      encryptedData
    );

    return decoder.decode(decrypted);
  } catch (e) {
    console.error('Decryption failed', e);
    return '[Decryption Failed — Wrong passphrase or corrupted data]';
  }
}
