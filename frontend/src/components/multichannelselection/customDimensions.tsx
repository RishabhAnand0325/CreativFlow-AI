import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface Props {
  customWidth: number;
  customHeight: number;
  customUnit: string;
  providers: string[];
  selectedProvider: string;
  onWidthChange: (w: number) => void;
  onHeightChange: (h: number) => void;
  onUnitChange: (unit: string) => void;
  onProviderChange: (provider: string) => void;
}

const PillNumber: React.FC<{
  label: "W" | "H";
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => {
  const inc = () => onChange(Math.max(1, value + 1));
  const dec = () => onChange(Math.max(1, value - 1));

  return (
    <div className="inline-flex items-center rounded-[30px] bg-muted/20 border-[1px] border-[#999999] px-2 py-3">
      <span className="px-2 text-sm text-muted-foreground">{label}</span>
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^0-9]/g, ""));
            onChange(Number.isFinite(n) && n > 0 ? n : 1);
          }}
          className="w-16 bg-transparent outline-none text-foreground text-sm pr-7"
        />
        <div className="absolute right-0 inset-y-0 flex flex-col justify-center">
          <button
            type="button"
            onClick={inc}
            className="p-0.5 text-muted-foreground hover:text-foreground"
          >
            <FiChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={dec}
            className="p-0.5 text-muted-foreground hover:text-foreground"
          >
            <FiChevronDown size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};


// 🔽 Custom Select (for Unit and Provider)
const CustomSelect: React.FC<{
  value: string;
  options: string[];
  onChange: (val: string) => void;
}> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block w-44">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center rounded-[30px] bg-muted/20 border border-[#999999] text-foreground px-4 py-2"
      >
        <span className="capitalize text-sm">{value}</span>
        {open ? (
          <FiChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <FiChevronDown size={16} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full bg-[#1a1a1a] border border-[#999999] rounded-xl shadow-lg overflow-hidden">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer capitalize hover:bg-[#2a2a2a] transition ${
                value === opt ? "bg-[#2f2f2f] text-blue-400" : "text-gray-300"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomDimensions: React.FC<Props> = ({
  customWidth,
  customHeight,
  customUnit,
  providers,
  selectedProvider,
  onWidthChange,
  onHeightChange,
  onUnitChange,
  onProviderChange,
}) => (
  <div className="custom-column space-y-4">
    <div className="column-header">
      <h3 className="text-lg font-semibold text-foreground">Custom</h3>
    </div>

    <div className="custom-form rounded-[30px] p-5">
      {/* Width & Height */}
      <div className="form-group">
        <label className="block mb-2 text-sm text-muted-foreground">Sizes</label>
        <div className="text-xs text-muted-foreground mb-2">
          Width &amp; Height
        </div>
        <div className="flex items-center gap-3">
          <PillNumber label="W" value={customWidth} onChange={onWidthChange} />
          <PillNumber label="H" value={customHeight} onChange={onHeightChange} />
        </div>
      </div>

      {/* Unit */}
      <div className="form-group mt-6">
        <label className="block mb-2 text-sm text-muted-foreground">Unit</label>
        <CustomSelect
          value={customUnit}
          options={["pixels", "inches", "centimeters"]}
          onChange={onUnitChange}
        />
      </div>

      {/* Provider */}
      <div className="form-group mt-6">
        <label className="block mb-2 text-sm text-muted-foreground">
          AI Provider
        </label>
        <CustomSelect
          value={selectedProvider}
          options={providers}
          onChange={onProviderChange}
        />
      </div>
    </div>
  </div>
);

export default CustomDimensions;
