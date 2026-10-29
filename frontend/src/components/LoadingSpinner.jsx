import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading details...', size = 24, fullPage = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <Loader2 size={size} className="animate-spin text-brand-600" />
      {text && <p className="text-xs font-medium text-slate-500 animate-pulse">{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div className="min-h-[50vh] flex items-center justify-center">{content}</div>;
  }
  return content;
}
