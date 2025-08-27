// Lint-clean RFC4122 v4 UUID with progressive fallbacks (no bitwise, no ++)
export default function safeId(): string {
  // Prefer standards-based crypto if available
  const cryptoObj: Crypto | undefined =
    typeof globalThis !== 'undefined'
      ? (globalThis as unknown as { crypto?: Crypto }).crypto
      : undefined;

  const getBytes = (n: number): Uint8Array => {
    const bytes = new Uint8Array(n);
    if (cryptoObj?.getRandomValues) {
      cryptoObj.getRandomValues(bytes);
      return bytes;
    }
    // Last resort: Math.random (not cryptographically strong)
    for (let i = 0; i < n; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  };

  const b = getBytes(16);

  // RFC 4122 §4.4:
  // version (byte 6 high nibble = 0b0100) and variant (byte 8 = 0b10xxxxxx)
  // Avoid bitwise by using modulo arithmetic to keep low bits, then add the flags.
  b[6] = (b[6] % 16) + 64; // (b[6] & 0x0f) | 0x40
  b[8] = (b[8] % 64) + 128; // (b[8] & 0x3f) | 0x80

  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  const hex = Array.from(b, toHex);

  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}
