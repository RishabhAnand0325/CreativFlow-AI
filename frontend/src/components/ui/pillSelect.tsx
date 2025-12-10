import React, { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { cn } from '@/lib/utils';

export type PillSelectOption = { label: string; value: string };

interface PillSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: PillSelectOption[];
  className?: string;
  menuClassName?: string;
  optionClassName?: string;
  placeholder?: string;
}

const PillSelect: React.FC<PillSelectProps> = ({
  value,
  onChange,
  options,
  className,
  menuClassName,
  optionClassName,
  placeholder
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current || !btnRef.current) return;
      if (!menuRef.current.contains(e.target as Node) && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'appearance-none rounded-[30px] bg-muted/20 border border-[#999999] text-foreground px-4 py-2 pr-8 inline-flex items-center gap-2',
          className
        )}
        aria-expanded={open}
      >
        <span className="text-sm">{selected?.label ?? placeholder ?? 'Select'}</span>
        <FiChevronDown className={cn('ml-auto transition-transform', open && 'rotate-180')} size={16} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={cn(
            'absolute z-50 mt-2 w-full rounded-xl border border-[#999999] bg-muted/20 backdrop-blur text-foreground shadow-lg overflow-hidden',
            menuClassName
          )}
        >
          <div role="listbox" className="max-h-64 overflow-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm hover:bg-primary/10 focus:bg-primary/10 outline-none transition-colors',
                  opt.value === value && 'bg-primary/10',
                  optionClassName
                )}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PillSelect;
