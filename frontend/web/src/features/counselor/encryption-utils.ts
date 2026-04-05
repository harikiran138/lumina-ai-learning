/**
 * AES-256-GCM Encryption utilities for Counselor Notes.
 * Ensures data is encrypted before sent to server and decrypted after retrieval.
 */

export async function encryptNote(text: string, password: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Derive key from password (in a real app, use a salt and PBKDF2)
    const pwHash = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    const key = await crypto.subtle.importKey(
        'raw', 
        pwHash, 
        { name: 'AES-GCM' }, 
        false, 
        ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );

    const encryptedArray = new Uint8Array(encrypted);
    
    // Auth tag is the last 16 bytes in AES-GCM
    const authTag = encryptedArray.slice(-16);
    const blob = encryptedArray.slice(0, -16);

    return {
        blob: btoa(String.fromCharCode(...blob)),
        iv: btoa(String.fromCharCode(...iv)),
        authTag: btoa(String.fromCharCode(...authTag))
    };
}

export async function decryptNote(
    encryptedBlob: string, 
    ivBase64: string, 
    authTagBase64: string, 
    password: string
) {
    try {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const pwHash = await crypto.subtle.digest('SHA-256', encoder.encode(password));
        const key = await crypto.subtle.importKey(
            'raw', 
            pwHash, 
            { name: 'AES-GCM' }, 
            false, 
            ['decrypt']
        );

        const blob = new Uint8Array(atob(encryptedBlob).split('').map(c => c.charCodeAt(0)));
        const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
        const authTag = new Uint8Array(atob(authTagBase64).split('').map(c => c.charCodeAt(0)));

        // Reconstruct the full encrypted data with auth tag for Web Crypto API
        const encryptedData = new Uint8Array(blob.length + authTag.length);
        encryptedData.set(blob);
        encryptedData.set(authTag, blob.length);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encryptedData
        );

        return decoder.decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        return "[Decryption Failed - Check Passphrase]";
    }
}
