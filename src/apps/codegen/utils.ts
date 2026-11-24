export type GeneratorType = 'hex' | 'base58' | 'custom' | 'password';

export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
  includeCustom: boolean;
  customChars: string;
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export function getSecureRandomBytes(byteLength: number, seed = ''): Uint8Array {
  const array = new Uint8Array(byteLength);
  crypto.getRandomValues(array);

  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      for (let j = 0; j < array.length; j++) {
        array[j] ^= seed.charCodeAt(i) + j;
      }
    }
  }
  return array;
}

function getRandomChar(charSet: string, seed = ''): string {
  const bytes = getSecureRandomBytes(1, seed);
  return charSet[bytes[0] % charSet.length];
}

export function generateHex(bits: number, seed = ''): string {
  const bytes = getSecureRandomBytes(bits / 8, seed);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateBase58(bits: number, seed = ''): string {
  const base = BASE58_ALPHABET.length;
  const bytes = getSecureRandomBytes(bits / 8, seed);
  const digits = [0];

  for (let i = 0; i < bytes.length; i++) {
    for (let j = 0; j < digits.length; j++) {
      digits[j] <<= 8;
    }
    digits[0] += bytes[i];
    let carry = 0;
    for (let j = 0; j < digits.length; j++) {
      digits[j] += carry;
      carry = (digits[j] / base) | 0;
      digits[j] %= base;
    }
    while (carry > 0) {
      digits.push(carry % base);
      carry = (carry / base) | 0;
    }
  }

  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    digits.push(0);
  }

  return digits
    .reverse()
    .map((d) => BASE58_ALPHABET[d])
    .join('');
}

export function generateCustom(chars: string, format: string, seed = ''): string {
  if (!chars || !format) {
    throw new Error('Preencha os campos de caracteres permitidos e formato.');
  }
  const randomCharCount = (format.match(/\*/g) || []).length;
  if (randomCharCount === 0) return format;

  const bytes = getSecureRandomBytes(randomCharCount, seed);
  let idx = 0;
  return format.replace(/\*/g, () => chars[bytes[idx++] % chars.length]);
}

export function generatePassword(options: PasswordOptions, seed = ''): string {
  let allowedChars = '';
  const forcedChars: string[] = [];

  if (options.includeUppercase) {
    allowedChars += UPPERCASE_CHARS;
    forcedChars.push(getRandomChar(UPPERCASE_CHARS, seed));
  }
  if (options.includeLowercase) {
    allowedChars += LOWERCASE_CHARS;
    forcedChars.push(getRandomChar(LOWERCASE_CHARS, seed));
  }
  if (options.includeNumbers) {
    allowedChars += NUMBER_CHARS;
    forcedChars.push(getRandomChar(NUMBER_CHARS, seed));
  }
  if (options.includeSpecialChars) {
    allowedChars += SPECIAL_CHARS;
    forcedChars.push(getRandomChar(SPECIAL_CHARS, seed));
  }
  if (options.includeCustom && options.customChars) {
    allowedChars += options.customChars;
    forcedChars.push(getRandomChar(options.customChars, seed));
  }

  if (!allowedChars) {
    throw new Error('Selecione pelo menos um tipo de caractere para gerar a senha.');
  }
  if (options.length < forcedChars.length) {
    throw new Error(
      `O comprimento deve ser de pelo menos ${forcedChars.length} caracteres para incluir todos os tipos selecionados.`,
    );
  }

  const remaining = options.length - forcedChars.length;
  const password = [...forcedChars];

  if (remaining > 0) {
    const bytes = getSecureRandomBytes(remaining, seed);
    for (let i = 0; i < remaining; i++) {
      password.push(allowedChars[bytes[i] % allowedChars.length]);
    }
  }

  for (let i = password.length - 1; i > 0; i--) {
    const j = getSecureRandomBytes(1, seed)[0] % (i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}
