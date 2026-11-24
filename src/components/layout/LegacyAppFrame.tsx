import { ExternalLink, Printer } from 'lucide-react';
import { useRef } from 'react';

interface LegacyAppFrameProps {
  src: string;
  title: string;
  printFriendly?: boolean;
}

export function LegacyAppFrame({ src, title, printFriendly }: LegacyAppFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    try {
      iframeRef.current?.contentWindow?.print();
    } catch {
      window.open(src, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full bg-slate-100 dark:bg-slate-950">
      <div className="print:hidden flex items-center justify-between px-4 py-1.5 text-xs bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/70 dark:border-amber-900/50 text-amber-800 dark:text-amber-200">
        <span>Modo compatibilidade (standalone HTML integrado ao Portal)</span>
        <div className="flex items-center gap-3">
          {printFriendly && (
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 font-medium hover:underline cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
          )}
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium hover:underline"
          >
            Tela cheia <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="flex-1 w-full border-0 bg-white"
      />
    </div>
  );
}
