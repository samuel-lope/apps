import { describe, expect, it } from 'vitest';
import { generateBase58, generateCustom, generateHex, generatePassword } from '../apps/codegen/utils';

describe('Codegen utils', () => {
  it('generates hex codes with expected bit length', () => {
    expect(generateHex(128)).toMatch(/^[0-9a-f]{32}$/);
    expect(generateHex(256, 'seed')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates valid base58 strings', () => {
    const out = generateBase58(128);
    expect(out.length).toBeGreaterThan(0);
    expect(out).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it('generates custom masked format replacing only asterisks', () => {
    const out = generateCustom('ABC', 'PRE-****-END');
    expect(out).toMatch(/^PRE-[ABC]{4}-END$/);
  });

  it('generates password respecting length and required char classes', () => {
    const pwd = generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSpecialChars: true,
      includeCustom: false,
      customChars: '',
    });
    expect(pwd).toHaveLength(16);
    expect(pwd).toMatch(/[A-Z]/);
    expect(pwd).toMatch(/[a-z]/);
    expect(pwd).toMatch(/[0-9]/);
  });

  it('throws when no character set is selected', () => {
    expect(() =>
      generatePassword({
        length: 8,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSpecialChars: false,
        includeCustom: false,
        customChars: '',
      }),
    ).toThrow();
  });
});
