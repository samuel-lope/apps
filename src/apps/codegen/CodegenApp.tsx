import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, RefreshCw } from 'lucide-react';
import {
  generateBase58,
  generateCustom,
  generateHex,
  generatePassword,
  type GeneratorType,
} from './utils';

const TYPE_OPTIONS: { value: GeneratorType; label: string }[] = [
  { value: 'hex', label: 'Hexadecimal' },
  { value: 'base58', label: 'Base58' },
  { value: 'custom', label: 'Personalizado' },
  { value: 'password', label: 'Senha' },
];

export default function CodegenApp() {
  const [type, setType] = useState<GeneratorType>('hex');
  const [bitLength, setBitLength] = useState(128);
  const [customChars, setCustomChars] = useState(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  );
  const [customFormat, setCustomFormat] = useState('PREFIXO-******-SUFIXO');

  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSpecialChars, setIncludeSpecialChars] = useState(true);
  const [includeCustom, setIncludeCustom] = useState(false);
  const [passwordCustomChars, setPasswordCustomChars] = useState('');

  const [seed, setSeed] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!result) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    QRCode.toCanvas(canvas, result, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' },
    }).catch((err) => console.error('QR generation failed:', err));
  }, [result]);

  const handleGenerate = () => {
    setError(null);
    try {
      let value = '';
      switch (type) {
        case 'hex':
          value = generateHex(bitLength, seed);
          break;
        case 'base58':
          value = generateBase58(bitLength, seed);
          break;
        case 'custom':
          value = generateCustom(customChars, customFormat, seed);
          break;
        case 'password':
          value = generatePassword(
            {
              length: passwordLength,
              includeUppercase,
              includeLowercase,
              includeNumbers,
              includeSpecialChars,
              includeCustom,
              customChars: passwordCustomChars,
            },
            seed,
          );
          break;
      }
      setResult(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar código.');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Não foi possível copiar para a área de transferência.');
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Gerador Avançado de Códigos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Entropia via Web Crypto API + geração instantânea de QR Code.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                type === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {(type === 'hex' || type === 'base58') && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Tamanho em Bits
            </label>
            <select
              value={bitLength}
              onChange={(e) => setBitLength(Number(e.target.value))}
              className={inputClass}
            >
              <option value={16}>16 bits</option>
              <option value={32}>32 bits</option>
              <option value={64}>64 bits</option>
              <option value={128}>128 bits</option>
              <option value={256}>256 bits</option>
            </select>
          </div>
        )}

        {type === 'custom' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Caracteres permitidos
              </label>
              <input
                type="text"
                value={customChars}
                onChange={(e) => setCustomChars(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Formato (use * para caracteres aleatórios)
              </label>
              <input
                type="text"
                value={customFormat}
                onChange={(e) => setCustomFormat(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {type === 'password' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Quantidade de caracteres
              </label>
              <input
                type="number"
                min={4}
                value={passwordLength}
                onChange={(e) => setPasswordLength(Number(e.target.value))}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                />
                Letras Maiúsculas
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                />
                Letras Minúsculas
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                />
                Números
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSpecialChars}
                  onChange={(e) => setIncludeSpecialChars(e.target.checked)}
                />
                Caracteres Especiais
              </label>
              <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={includeCustom}
                  onChange={(e) => setIncludeCustom(e.target.checked)}
                />
                Caracteres Personalizados
              </label>
            </div>

            {includeCustom && (
              <input
                type="text"
                placeholder="Seus caracteres: !@#..."
                value={passwordCustomChars}
                onChange={(e) => setPasswordCustomChars(e.target.value)}
                className={inputClass}
              />
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Seed (Opcional — entropia adicional)
          </label>
          <input
            type="text"
            placeholder="Seed opcional..."
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="min-h-14 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-base font-bold text-blue-600 dark:text-blue-400 break-all flex items-center justify-center text-center">
          {result || <span className="text-slate-400 text-xs font-sans font-normal">Clique em Gerar Código</span>}
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Gerar Código
          </button>
          <button
            type="button"
            disabled={!result}
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        {result && (
          <div className="flex justify-center pt-2">
            <canvas
              ref={canvasRef}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
