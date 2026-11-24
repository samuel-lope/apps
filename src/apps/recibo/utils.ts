export function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 1) return `0,0${digits}`;
  if (digits.length === 2) return `0,${digits}`;
  const intPart = String(parseInt(digits.slice(0, -2), 10));
  const decPart = digits.slice(-2);
  return `${intPart},${decPart}`;
}

export function formatCurrencyDisplay(value: string): string {
  if (!value) return '0,00';
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  if (Number.isNaN(parsed)) return '0,00';
  return parsed.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCpfCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    if (digits.length > 9) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    if (digits.length > 6) return digits.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    if (digits.length > 3) return digits.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    return digits;
  }
  if (digits.length > 12) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
  }
  if (digits.length > 8) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
  }
  if (digits.length > 5) {
    return digits.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
  }
  return digits.replace(/(\d{2})(\d{0,3})/, '$1.$2');
}

export function formatDateBr(isoDate: string): string {
  if (!isoDate) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function getTodayLocalIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const DEZ_A_DEZENOVE = [
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

function converterGrupo(numero: number): string {
  if (numero === 0) return '';
  if (numero === 100) return 'cem';
  if (numero < 10) return UNIDADES[numero];
  if (numero < 20) return DEZ_A_DEZENOVE[numero - 10];
  if (numero < 100) {
    const dezena = Math.floor(numero / 10);
    const unidade = numero % 10;
    return DEZENAS[dezena] + (unidade ? ` e ${UNIDADES[unidade]}` : '');
  }
  const centena = Math.floor(numero / 100);
  const resto = numero % 100;
  return CENTENAS[centena] + (resto ? ` e ${converterGrupo(resto)}` : '');
}

function converterNumeroCompleto(numero: number): string {
  if (numero === 0) return 'zero';

  const grupos: number[] = [];
  const nomesSingular = ['', 'mil', 'milhão', 'bilhão', 'trilhão'];
  const nomesPlural = ['', 'mil', 'milhões', 'bilhões', 'trilhões'];

  let numeroStr = String(numero);
  while (numeroStr.length > 0) {
    const tamanho = Math.min(3, numeroStr.length);
    grupos.unshift(parseInt(numeroStr.slice(numeroStr.length - tamanho), 10));
    numeroStr = numeroStr.slice(0, numeroStr.length - tamanho);
  }

  let resultado = '';
  for (let i = 0; i < grupos.length; i++) {
    const val = grupos[i];
    const pos = grupos.length - 1 - i;
    if (val === 0) continue;

    const nomeGrupo = val === 1 && pos !== 0 ? nomesSingular[pos] : nomesPlural[pos];
    if (resultado !== '') {
      const proximoTemValor = grupos.slice(i + 1).some((g) => g !== 0);
      if (proximoTemValor) {
        resultado += ', ';
      } else if (val < 100 || val % 100 === 0) {
        resultado += ' e ';
      } else {
        resultado += ' ';
      }
    }

    if (pos === 1 && val === 1 && grupos.length === 2) {
      resultado += 'mil';
    } else {
      resultado += converterGrupo(val);
      if (nomeGrupo) {
        resultado += ` ${nomeGrupo}`;
      }
    }
  }

  return resultado;
}

export function valorPorExtenso(valorInput: string): string {
  if (!valorInput) return 'zero reais';
  const normalized = valorInput.replace(/\./g, '').replace(',', '.');
  const valor = parseFloat(normalized);
  if (Number.isNaN(valor) || valor < 0) return 'valor inválido';

  const parteInteira = Math.floor(valor);
  const parteDecimal = Math.round((valor - parteInteira) * 100);

  if (parteInteira === 0 && parteDecimal === 0) return 'zero reais';

  let extenso = '';
  if (parteInteira > 0) {
    extenso = converterNumeroCompleto(parteInteira);
    if (parteInteira >= 1_000_000 && parteInteira % 1_000_000 === 0) {
      extenso += ' de reais';
    } else {
      extenso += parteInteira === 1 ? ' real' : ' reais';
    }
  }

  if (parteDecimal > 0) {
    if (parteInteira > 0) extenso += ' e ';
    extenso +=
      parteDecimal === 1 ? 'um centavo' : `${converterGrupo(parteDecimal)} centavos`;
  }

  return extenso;
}
