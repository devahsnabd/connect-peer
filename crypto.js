(function initCrypto(global) {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  const PASSPHRASE = "peer-connect-local-only-key";

  async function deriveKey() {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      textEncoder.encode(PASSPHRASE),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: textEncoder.encode("peer-connect-salt"),
        iterations: 100000,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  function toBase64(bytes) {
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binary);
  }

  function fromBase64(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }

  async function encryptText(plainText) {
    if (!plainText) {
      return "";
    }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey();
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      textEncoder.encode(plainText)
    );
    const cipherBytes = new Uint8Array(cipherBuffer);
    const payload = new Uint8Array(iv.length + cipherBytes.length);
    payload.set(iv, 0);
    payload.set(cipherBytes, iv.length);
    return toBase64(payload);
  }

  async function decryptText(cipherText) {
    if (!cipherText) {
      return "";
    }
    try {
      const payload = fromBase64(cipherText);
      const iv = payload.slice(0, 12);
      const encrypted = payload.slice(12);
      const key = await deriveKey();
      const plainBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
      );
      return textDecoder.decode(plainBuffer);
    } catch (error) {
      // TODO: In production, add secure telemetry without storing user content.
      return "";
    }
  }

  global.PeerConnectCrypto = {
    encryptText,
    decryptText
  };
})(typeof window !== "undefined" ? window : self);
