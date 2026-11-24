import {
  ClipboardList,
  Cpu,
  Database,
  FolderSync,
  Grid3x3,
  KeyRound,
  Lock,
  QrCode,
  Receipt,
  SearchCode,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import type { AppIconName } from '../../registry/types';

export function AppIcon({ name, className = 'w-5 h-5' }: { name: AppIconName; className?: string }) {
  switch (name) {
    case 'receipt':
      return <Receipt className={className} />;
    case 'qr-code':
      return <QrCode className={className} />;
    case 'key-round':
      return <KeyRound className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'shield-check':
      return <ShieldCheck className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'grid-3x3':
      return <Grid3x3 className={className} />;
    case 'terminal':
      return <Terminal className={className} />;
    case 'clipboard-list':
      return <ClipboardList className={className} />;
    case 'database':
      return <Database className={className} />;
    case 'folder-sync':
      return <FolderSync className={className} />;
    case 'search-code':
      return <SearchCode className={className} />;
  }
}
