import React from 'react';
import { AuthenticatedImage } from '@/components/AuthenticatedImage';
import { getFullImageUrl } from '@/utils/url';

export interface Dimensions {
  width: number;
  height: number;
}

export interface GeneratedAssetMini {
  id: string;
  assetUrl: string;
  formatName: string;
  dimensions: Dimensions;
}

interface ImageComparisonPanelProps {
  selectedAsset: GeneratedAssetMini | null;
  originalAsset: GeneratedAssetMini | null;
  resolution: number;
  onResolutionChange: (value: number) => void;
}

const formatDimensions = (d: Dimensions) => `${d.width} × ${d.height}`;

const ImageComparisonPanel: React.FC<ImageComparisonPanelProps> = ({
  selectedAsset,
  originalAsset,
  resolution,
  onResolutionChange,
}) => {
  return (
    <aside className="w-[380px] shrink-0 border-l border-[#404a53] bg-[#2B3537] p-6 flex flex-col h-full">
      <h3 className="mb-6 text-[18px] font-semibold text-white">Adjust</h3>

      <div className="flex-grow grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <label className="text-sm text-[#e0e0e0]">New</label>
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#404a53]">
            {selectedAsset ? (
              <AuthenticatedImage
                src={getFullImageUrl(selectedAsset.assetUrl)}
                alt="New version"
                className="h-full w-full object-contain"
                placeholder={
                  <div className="flex h-full w-full items-center justify-center text-[#8A939C]">
                    <i className="fas fa-image" />
                  </div>
                }
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#8A939C]">
                <i className="fas fa-image" />
                <span className="text-xs">Select an asset to preview</span>
              </div>
            )}
          </div>
          {selectedAsset && (
            <div className="text-xs text-[#e0e0e0]">
              {formatDimensions(selectedAsset.dimensions)}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[#e0e0e0]">Original</label>
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#404a53]">
            {originalAsset ? (
              <AuthenticatedImage
                src={getFullImageUrl(originalAsset.assetUrl)}
                alt="Original version"
                className="h-full w-full object-contain"
                placeholder={
                  <div className="flex h-full w-full items-center justify-center text-[#8A939C]">
                    <i className="fas fa-image" />
                  </div>
                }
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#8A939C]">
                <i className="fas fa-image" />
                <span className="text-xs">Original image</span>
              </div>
            )}
          </div>
          {originalAsset && (
            <div className="text-xs text-[#e0e0e0]">
              {formatDimensions(originalAsset.dimensions)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3 border-t border-[#404a53] pt-6">
        <h4 className="text-sm font-medium text-[#e0e0e0]">Scroll to Adjust</h4>
        <div className="space-y-2">
          <label className="text-xs text-[#8A939C]">Resolution</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={30}
              max={600}
              value={resolution}
              onChange={(e) => onResolutionChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded bg-[#404a53] accent-[#149ECA]"
            />
            <span className="w-16 text-right text-xs text-[#e0e0e0]">{resolution} DPI</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ImageComparisonPanel;