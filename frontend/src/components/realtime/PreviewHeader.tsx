import React from 'react';

export type TabKey = 'resizing' | 'repurposing';

interface PreviewHeaderProps {
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
  onPreview: () => void;
  onBatchDownload: () => void;
  canBatchDownload: boolean;
}

const PreviewHeader: React.FC<PreviewHeaderProps> = ({
  activeTab,
  onTabChange,
  onPreview,
  onBatchDownload,
  canBatchDownload,
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-border/60 bg-background/80 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-10">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-semibold md:text-2xl">Real-Time AI Preview</h1>
        <div className="flex gap-6">
          <button
            className={`pb-2 text-sm font-medium transition-colors md:text-base ${
              activeTab === 'resizing'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onTabChange('resizing')}
          >
            Resizing
          </button>
          <button
            className={`pb-2 text-sm font-medium transition-colors md:text-base ${
              activeTab === 'repurposing'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onTabChange('repurposing')}
          >
            Repurposing
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onPreview}
          className="inline-flex min-w-28 items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-primary/10"
        >
          Preview
        </button>
        <button
          onClick={onBatchDownload}
          disabled={!canBatchDownload}
          className={`inline-flex min-w-28 items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition ${
            canBatchDownload
              ? 'border-primary text-primary hover:bg-primary/10'
              : 'cursor-not-allowed border-muted text-muted-foreground opacity-60'
          }`}
        >
          Batch Download
        </button>
      </div>
    </div>
  );
};

export default PreviewHeader;
