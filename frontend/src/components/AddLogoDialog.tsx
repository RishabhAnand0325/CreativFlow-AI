import React from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
}

const AddLogoDialog: React.FC<Props> = ({ open, onClose, onFileSelected }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-slate-800 text-slate-100 rounded-lg shadow-lg p-6 w-[420px] z-50">
        <h3 className="text-lg font-semibold mb-3">Add Logo</h3>
        <input
          className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-slate-100 mb-3"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
          }}
        />
        <div className="flex justify-end">
          <button onClick={onClose} className="px-3 py-1 rounded bg-slate-700">Close</button>
        </div>
      </div>
    </div>
  );
};

export default AddLogoDialog;
