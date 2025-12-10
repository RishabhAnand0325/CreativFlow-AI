import React from 'react';

interface Props {
  open: boolean;
  initialText: string;
  color: string;
  onClose: () => void;
  onChangeText: (v: string) => void;
  onChangeColor: (c: string) => void;
  onAdd: () => void;
}

const AddTextDialog: React.FC<Props> = ({ open, initialText, color, onClose, onChangeText, onChangeColor, onAdd }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-slate-800 text-slate-100 rounded-lg shadow-lg p-6 w-[420px] z-50">
        <h3 className="text-lg font-semibold mb-3">Add Text</h3>
        <input
          className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-slate-100 mb-3"
          type="text"
          placeholder="Enter your text..."
          value={initialText}
          onChange={(e) => onChangeText(e.target.value)}
          autoFocus
        />
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm">Text Color:</label>
          <input type="color" value={color} onChange={(e) => onChangeColor(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded bg-slate-700">Cancel</button>
          <button onClick={onAdd} className="px-3 py-1 rounded bg-cyan-500 text-white">Add Text</button>
        </div>
      </div>
    </div>
  );
};

export default AddTextDialog;
