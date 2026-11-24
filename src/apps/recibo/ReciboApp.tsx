import { useState } from 'react';
import { Eye, Printer, RotateCcw, X } from 'lucide-react';
import {
  formatCpfCnpj,
  formatCurrencyDisplay,
  formatCurrencyInput,
  formatDateBr,
  getTodayLocalIso,
  valorPorExtenso,
} from './utils';

interface ReciboFormState {
  nomePagador: string;
  cpfPagador: string;
  enderecoPagador: string;
  nomeRecebedor: string;
  cpfRecebedor: string;
  enderecoRecebedor: string;
  valor: string;
  formaPagamento: string;
  referente: string;
  data: string;
  cidade: string;
  observacoes: string;
}

const INITIAL_STATE = (): ReciboFormState => ({
  nomePagador: '',
  cpfPagador: '',
  enderecoPagador: '',
  nomeRecebedor: '',
  cpfRecebedor: '',
  enderecoRecebedor: '',
  valor: '',
  formaPagamento: 'PIX',
  referente: '',
  data: getTodayLocalIso(),
  cidade: '',
  observacoes: '',
});

const PAYMENT_METHODS = [
  'Dinheiro',
  'PIX',
  'Transferência Bancária',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Cheque',
  'Boleto',
  'Outro',
];

function ReceiptSheet({ data, receiptNumber }: { data: ReciboFormState; receiptNumber: string }) {
  const valorFormatado = formatCurrencyDisplay(data.valor);
  const extenso = valorPorExtenso(data.valor);
  const dataFormatada = formatDateBr(data.data);

  return (
    <div className="bg-white text-slate-900 p-8 border border-slate-200 rounded-xl shadow-xs print:shadow-none print:border-slate-300 print:p-6">
      <div className="flex items-center justify-between pb-3 mb-5 border-b-2 border-blue-600">
        <h2 className="text-2xl font-bold uppercase tracking-wide text-blue-600">Recibo</h2>
        <span className="text-base font-mono text-slate-600">Nº {receiptNumber}</span>
      </div>

      <div className="text-2xl font-bold text-blue-600 text-center py-3.5 px-4 my-5 border-2 border-blue-600 rounded-lg bg-blue-50/40">
        R$ {valorFormatado}
      </div>

      <div className="space-y-4 text-sm sm:text-base leading-relaxed">
        <p>
          Recebi de <strong>{data.nomePagador}</strong>
          {data.cpfPagador ? `, CPF/CNPJ: ${data.cpfPagador}` : ''}
          {data.enderecoPagador ? `, residente em ${data.enderecoPagador}` : ''}, a quantia de{' '}
          <strong>R$ {valorFormatado}</strong> ({extenso})
          {data.referente ? `, referente a ${data.referente}` : ''}, pago através de{' '}
          <strong>{data.formaPagamento}</strong>.
        </p>

        <div className="pt-2 space-y-1 text-sm">
          <p className="font-semibold text-slate-700">Dados do Recebedor:</p>
          <p>Nome: {data.nomeRecebedor}</p>
          {data.cpfRecebedor && <p>CPF/CNPJ: {data.cpfRecebedor}</p>}
          {data.enderecoRecebedor && <p>Endereço: {data.enderecoRecebedor}</p>}
        </div>

        {data.observacoes && (
          <div className="pt-2 text-sm">
            <p className="font-semibold text-slate-700">Observações:</p>
            <p className="whitespace-pre-line">{data.observacoes}</p>
          </div>
        )}
      </div>

      <div className="mt-12 text-center space-y-10">
        <p className="text-sm">
          {data.cidade ? `${data.cidade}, ` : ''}
          {dataFormatada}
        </p>

        <div className="w-72 max-w-full mx-auto border-t border-slate-900 pt-2 text-sm font-medium">
          {data.nomeRecebedor}
        </div>
      </div>
    </div>
  );
}

export default function ReciboApp() {
  const [form, setForm] = useState<ReciboFormState>(INITIAL_STATE);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState(() => String(Date.now()).slice(-8));
  const [notice, setNotice] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const showNotice = (text: string, type: 'error' | 'success') => {
    setNotice({ text, type });
    window.setTimeout(() => setNotice(null), 3000);
  };

  const updateField = <K extends keyof ReciboFormState>(field: K, value: ReciboFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    if (!form.nomePagador.trim() || !form.nomeRecebedor.trim() || !form.valor.trim() || !form.data) {
      showNotice('Preencha todos os campos obrigatórios (*).', 'error');
      return false;
    }
    if (!/^[0-9]+,[0-9]{2}$|^[0-9]+$/.test(form.valor.trim())) {
      showNotice('Informe um valor válido (ex: 100,00).', 'error');
      return false;
    }
    return true;
  };

  const handleOpenPreview = () => {
    if (!validate()) return;
    setReceiptNumber(String(Date.now()).slice(-8));
    setPreviewOpen(true);
  };

  const handlePrint = () => {
    if (!validate()) return;
    if (!previewOpen) {
      setReceiptNumber(String(Date.now()).slice(-8));
      setPreviewOpen(true);
      window.setTimeout(() => window.print(), 50);
    } else {
      window.print();
    }
  };

  const handleReset = () => {
    setForm(INITIAL_STATE());
    setPreviewOpen(false);
    showNotice('Formulário limpo.', 'success');
  };

  const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerador de Recibos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Preencha os dados para visualizar, imprimir ou salvar em PDF.
            </p>
          </div>
          {notice && (
            <div
              className={`px-3.5 py-2 rounded-lg text-xs font-medium text-white ${
                notice.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
              }`}
            >
              {notice.text}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleOpenPreview();
          }}
          className="space-y-6"
        >
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-base font-semibold text-blue-600 dark:text-blue-400">Dados do Pagador</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="nomePagador">
                  Nome*
                </label>
                <input
                  id="nomePagador"
                  type="text"
                  required
                  value={form.nomePagador}
                  onChange={(e) => updateField('nomePagador', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="cpfPagador">
                  CPF/CNPJ
                </label>
                <input
                  id="cpfPagador"
                  type="text"
                  value={form.cpfPagador}
                  onChange={(e) => updateField('cpfPagador', formatCpfCnpj(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="enderecoPagador">
                Endereço
              </label>
              <input
                id="enderecoPagador"
                type="text"
                value={form.enderecoPagador}
                onChange={(e) => updateField('enderecoPagador', e.target.value)}
                className={inputClass}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-base font-semibold text-blue-600 dark:text-blue-400">Dados do Recebedor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="nomeRecebedor">
                  Nome*
                </label>
                <input
                  id="nomeRecebedor"
                  type="text"
                  required
                  value={form.nomeRecebedor}
                  onChange={(e) => updateField('nomeRecebedor', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="cpfRecebedor">
                  CPF/CNPJ
                </label>
                <input
                  id="cpfRecebedor"
                  type="text"
                  value={form.cpfRecebedor}
                  onChange={(e) => updateField('cpfRecebedor', formatCpfCnpj(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="enderecoRecebedor">
                Endereço
              </label>
              <input
                id="enderecoRecebedor"
                type="text"
                value={form.enderecoRecebedor}
                onChange={(e) => updateField('enderecoRecebedor', e.target.value)}
                className={inputClass}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h2 className="text-base font-semibold text-blue-600 dark:text-blue-400">
              Informações do Pagamento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="valor">
                  Valor (R$)*
                </label>
                <input
                  id="valor"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) => updateField('valor', formatCurrencyInput(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="formaPagamento">
                  Forma de Pagamento
                </label>
                <select
                  id="formaPagamento"
                  value={form.formaPagamento}
                  onChange={(e) => updateField('formaPagamento', e.target.value)}
                  className={inputClass}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="referente">
                Referente a
              </label>
              <input
                id="referente"
                type="text"
                value={form.referente}
                onChange={(e) => updateField('referente', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="data">
                  Data*
                </label>
                <input
                  id="data"
                  type="date"
                  required
                  value={form.data}
                  onChange={(e) => updateField('data', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="cidade">
                  Cidade
                </label>
                <input
                  id="cidade"
                  type="text"
                  value={form.cidade}
                  onChange={(e) => updateField('cidade', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="observacoes">
                Observações
              </label>
              <textarea
                id="observacoes"
                rows={3}
                value={form.observacoes}
                onChange={(e) => updateField('observacoes', e.target.value)}
                placeholder="Observações adicionais (opcional)"
                className={inputClass}
              />
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Limpar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
            >
              <Eye className="w-4 h-4" /> Pré-visualizar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
            </button>
          </div>
        </form>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 print:static print:bg-transparent print:p-0 print:block"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-50 dark:bg-slate-900 p-5 shadow-2xl space-y-4 print:max-h-none print:overflow-visible print:bg-white print:p-0 print:shadow-none print:rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="print:hidden flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Pré-visualização do Recibo
              </h2>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ReceiptSheet data={form} receiptNumber={receiptNumber} />

            <div className="print:hidden flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
