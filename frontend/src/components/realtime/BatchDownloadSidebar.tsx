import React from 'react';

export type DownloadFormat = 'JPEG' | 'PNG' | 'PSD';
export type ImageQuality = 'High' | 'Medium' | 'Low';
export type DownloadOption = 'Batch' | 'Individual' | 'Category';

interface BatchDownloadSidebarProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  selectedAssetNames: string[];
  downloadFormat: DownloadFormat;
  setDownloadFormat: (v: DownloadFormat) => void;
  imageQuality: ImageQuality;
  setImageQuality: (v: ImageQuality) => void;
  downloadOption: DownloadOption;
  setDownloadOption: (v: DownloadOption) => void;
  onDownload: () => void;
}

const BatchDownloadSidebar: React.FC<BatchDownloadSidebarProps> = ({
  open,
  onClose,
  selectedCount,
  selectedAssetNames,
  downloadFormat,
  setDownloadFormat,
  imageQuality,
  setImageQuality,
  downloadOption,
  setDownloadOption,
  onDownload,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-[400px] flex-col border-l border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-lg font-semibold">Batch Download</h3>
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground/90">File Formats</h4>
            <select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value as DownloadFormat)}
              className="w-full rounded-md border border-border bg-muted/10 p-3 text-sm outline-none"
            >
              <option value="JPEG">JPEG</option>
              <option value="PNG">PNG</option>
              <option value="PSD">PSD</option>
            </select>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground/90">Image Quality (PPI)</h4>
            <select
              value={imageQuality}
              onChange={(e) => setImageQuality(e.target.value as ImageQuality)}
              className="w-full rounded-md border border-border bg-muted/10 p-3 text-sm outline-none"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground/90">Download Options</h4>
            <select
              value={downloadOption}
              onChange={(e) => setDownloadOption(e.target.value as DownloadOption)}
              className="w-full rounded-md border border-border bg-muted/10 p-3 text-sm outline-none"
            >
              <option value="Individual">Individual</option>
              <option value="Batch">Batch</option>
              <option value="Category">Category</option>
            </select>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground/90">Selected Assets ({selectedCount})</h4>
            <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/10 p-4 text-sm text-foreground/90">
              {selectedAssetNames.length > 0 ? (
                <ul className="space-y-2">
                  {selectedAssetNames.map((name, index) => (
                    <li key={index} className="truncate">- {name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No assets selected.</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onDownload}
          disabled={selectedCount === 0}
          className={`mt-4 w-full rounded-md px-4 py-3 text-sm font-semibold text-white transition ${
            selectedCount === 0
              ? 'cursor-not-allowed bg-muted-foreground/40'
              : 'bg-primary hover:opacity-90'
          }`}
        >
          Download
        </button>
      </div>
    </div>
  );
};

export default BatchDownloadSidebar;
