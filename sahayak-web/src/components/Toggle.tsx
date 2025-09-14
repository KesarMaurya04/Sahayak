'use client';
import { useState } from 'react';


export default function Toggle({
  checked,
  onChange,
  label,
}: {
  checked?: boolean;
  onChange?: (v: boolean) => void;
  label?: string;
}) {
  const [local, setLocal] = useState(!!checked);
  const isOn = checked ?? local;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={() => {
        const v = !isOn;
        setLocal(v);
        onChange?.(v);
      }}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition',
        isOn ? 'bg-brand-600' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition',
          isOn ? 'translate-x-5' : 'translate-x-1'
        )}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
}

// quick tiny helper
function clsx(...s: (string | undefined | false)[]) { return s.filter(Boolean).join(' '); }
export const cn = clsx;
