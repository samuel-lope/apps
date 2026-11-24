import { describe, expect, it } from 'vitest';
import {
  formatCpfCnpj,
  formatCurrencyInput,
  formatDateBr,
  valorPorExtenso,
} from '../apps/recibo/utils';

describe('Recibo utils', () => {
  it('converts numbers to Brazilian Portuguese currency words', () => {
    expect(valorPorExtenso('0,00')).toBe('zero reais');
    expect(valorPorExtenso('1,00')).toBe('um real');
    expect(valorPorExtenso('100,00')).toBe('cem reais');
    expect(valorPorExtenso('101,01')).toBe('cento e um reais e um centavo');
    expect(valorPorExtenso('1234,56')).toBe(
      'mil duzentos e trinta e quatro reais e cinquenta e seis centavos',
    );
    expect(valorPorExtenso('1000000,00')).toBe('um milhão de reais');
  });

  it('formats CPF and CNPJ masks cleanly', () => {
    expect(formatCpfCnpj('12345678901')).toBe('123.456.789-01');
    expect(formatCpfCnpj('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('formats currency digits from raw numeric input', () => {
    expect(formatCurrencyInput('5')).toBe('0,05');
    expect(formatCurrencyInput('150')).toBe('1,50');
    expect(formatCurrencyInput('0012345')).toBe('123,45');
  });

  it('formats ISO date without UTC timezone shift', () => {
    expect(formatDateBr('2026-11-23')).toBe('23/11/2026');
  });
});
