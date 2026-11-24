import { useState, type FormEvent } from 'react';
import { Check, Copy, Loader2, Printer, QrCode } from 'lucide-react';
import { formatCurrencyInput } from '../recibo/utils';

interface PixResponse {
  pixCopiaECola: string;
  svgQrCode: string;
  message?: string;
}

export default function PixApp() {
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [merchantCity, setMerchantCity] = useState('');
  const [txid, setTxid] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PixResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pixKey.trim() || !merchantName.trim() || !merchantCity.trim()) {
      setErrorMsg('Preencha todos os campos obrigatórios (*).');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    const payload: Record<string, unknown> = {
      pixKey: pixKey.trim(),
      merchantName: merchantName.trim(),
      merchantCity: merchantCity.trim(),
      amount: !Number.isNaN(numericAmount) && numericAmount > 0 ? numericAmount.toFixed(2) : '',
      qrECL: 'Q',
      qrCellSize: 8,
      qrMargin: 10,
    };

    if (txid.trim()) payload.txid = txid.trim();
    if (description.trim()) payload.description = description.trim();

    setLoading(true);
    try {
      const response = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as Partial<PixResponse>;
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao gerar código PIX.');
      }
      if (!data.pixCopiaECola || !data.svgQrCode) {
        throw new Error(data.message || 'A resposta da API não contém os dados esperados.');
      }

      setResult({
        pixCopiaECola: data.pixCopiaECola,
        svgQrCode: data.svgQrCode,
      });
    } catch (err) {
      setResult(null);
      setErrorMsg(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.pixCopiaECola);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMsg('Não foi possível copiar automaticamente.');
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="print:hidden space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Criar QRCode PIX</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gere código PIX Copia e Cola e placa A4 de QR Code pronta para impressão.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="pixKey">
                Chave PIX*
              </label>
              <input
                id="pixKey"
                type="text"
                required
                placeholder="CPF, CNPJ, E-mail, Telefone ou Chave Aleatória"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="pixAmount">
                Valor (R$)
              </label>
              <input
                id="pixAmount"
                type="text"
                inputMode="numeric"
                placeholder="0,00 (Opcional)"
                value={amount}
                onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="merchantName">
                Nome do Recebedor*
              </label>
              <input
                id="merchantName"
                type="text"
                required
                placeholder="Nome completo ou empresa"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="merchantCity">
                Cidade do Recebedor*
              </label>
              <input
                id="merchantCity"
                type="text"
                required
                placeholder="Ex: Brasilia"
                value={merchantCity}
                onChange={(e) => setMerchantCity(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="txid">
                Identificador (Opcional)
              </label>
              <input
                id="txid"
                type="text"
                placeholder="ID da transação (alfanumérico)"
                value={txid}
                onChange={(e) => setTxid(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="description">
                Descrição (Opcional)
              </label>
              <input
                id="description"
                type="text"
                placeholder="Referente a..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {loading ? 'Gerando...' : 'Gerar Código'}
            </button>
          </div>
        </form>

        {result && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="flex flex-col items-center gap-3 shrink-0">
                <img
                  src={result.svgQrCode}
                  alt="QR Code PIX"
                  className="w-52 h-52 p-3 rounded-xl border border-slate-200 bg-white object-contain"
                />
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Imprimir Placa A4
                </button>
              </div>

              <div className="flex-1 w-full space-y-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  PIX Copia e Cola
                </h2>
                <textarea
                  readOnly
                  rows={5}
                  value={result.pixCopiaECola}
                  className={`${inputClass} font-mono text-xs resize-none`}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar Código'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {result && (
        <div className="hidden print:flex flex-col items-center justify-center min-h-[260mm] text-center text-black bg-white p-6">
          <img src="/assets/logo-pix.svg" alt="Logo PIX" className="w-60 mb-8" />
          <img src={result.svgQrCode} alt="QR Code PIX" className="w-80 h-80 object-contain" />
          <p className="text-2xl font-bold mt-6">{merchantName}</p>
          <p className="text-base text-slate-600 mt-2 break-all">Chave PIX: {pixKey}</p>
          {amount && <p className="text-xl font-semibold mt-3">Valor: R$ {amount}</p>}
        </div>
      )}
    </div>
  );
}
