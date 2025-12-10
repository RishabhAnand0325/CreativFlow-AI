import React, { useState } from 'react';
import { AuthenticatedImage } from '@/components/AuthenticatedImage';
import { getFullImageUrl } from '@/utils/url';

export interface Dimensions {
  width: number;
  height: number;
}

export interface GeneratedAsset {
  id: string;
  originalAssetId: string;
  filename: string;
  assetUrl: string;
  platformName?: string;
  formatName: string;
  dimensions: Dimensions;
  isNsfw: boolean;
}

export type GroupBy = 'platform' | 'type' | 'original';

interface AssetsSectionProps {
  title: string;
  assets: GeneratedAsset[];
  groupBy: GroupBy;
  setGroupBy: (groupBy: GroupBy) => void;
  selectedAssets: string[];
  onToggleSelectAll: () => void;
  onToggleSelectCategory: (ids: string[]) => void;
  onToggleSelectOne: (id: string) => void;
  onClickAsset: (asset: GeneratedAsset) => void;
}

const formatDimensions = (d: Dimensions) => `${d.width} × ${d.height}`;

const groupAssets = (assets: GeneratedAsset[], groupBy: GroupBy) => {
  const grouped: Record<string, GeneratedAsset[]> = {};
  assets.forEach((asset) => {
    let key = '';
    if (groupBy === 'platform') key = asset.platformName || 'Other';
    else if (groupBy === 'type')
      key = (asset.filename.split('.').pop() || asset.formatName || 'Unknown').toUpperCase();
    else key = asset.originalAssetId || 'Unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(asset);
  });
  return grouped;
};

const AssetsSection: React.FC<AssetsSectionProps> = ({
  title,
  assets,
  groupBy,
  setGroupBy,
  selectedAssets,
  onToggleSelectAll,
  onToggleSelectCategory,
  onToggleSelectOne,
  onClickAsset,
}) => {
  const grouped = groupAssets(assets, groupBy);
  const allSelected = assets.length > 0 && selectedAssets.length === assets.length;
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  return (
    <section className="flex flex-col bg-sidebar/10 p-4 md:p-6 h-full overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3 flex-wrap gap-4">
        <h2 className="text-base font-semibold md:text-lg">{title}</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              className="h-4 w-4 accent-primary"
            />
            Select All
          </label>
          <div className="flex items-center border border-[#149ECA] rounded-[30px] p-3 gap-2 text-sm text-foreground/80">
            <span>Group by</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="bg-transparent text-foreground/90 border-none outline-none cursor-pointer"
            >
              <option value="platform">Platform</option>
              <option value="type">Type</option>
              <option value="original">Original</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className="w-full overflow-y-auto">
        {assets.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
            No assets yet.
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            {Object.entries(grouped).map(([categoryName, catAssets]) => {
              const categoryIds = catAssets.map((a) => a.id);
              const categoryAllSelected = categoryIds.every((id) => selectedAssets.includes(id));

              return (
                <div key={categoryName} className="rounded-xl border border-border bg-card p-4 w-full">
                  <div
                    className="mb-4 flex items-center justify-between border-b border-border pb-2 cursor-pointer"
                    onClick={() => toggleCategory(categoryName)}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold md:text-base">
                        {categoryName} ({catAssets.length} {catAssets.length === 1 ? 'file' : 'files'})
                      </h3>
                      <i className={`fas fa-chevron-down transition-transform ${openCategories[categoryName] ? 'rotate-180' : ''}`}></i>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={categoryAllSelected}
                        onChange={() => onToggleSelectCategory(categoryIds)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      Select All
                    </label>
                  </div>

                  {openCategories[categoryName] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                      {catAssets.map((asset) => {
                        const isSelected = selectedAssets.includes(asset.id);
                        return (
                          <div
                            key={asset.id}
                            onClick={() => onClickAsset(asset)}
                            className={`group relative cursor-pointer rounded-xl border p-3 transition-all duration-150 w-full ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border bg-muted/10 hover:border-primary/50'
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <label
                                className="flex items-center gap-2 text-xs flex-1 truncate"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => onToggleSelectOne(asset.id)}
                                  className="h-4 w-4 accent-primary flex-shrink-0"
                                />
                                <span className="truncate text-foreground/90">{asset.filename}</span>
                              </label>
                            </div>

                            {!asset.isNsfw ? (
                              <div className="relative w-full aspect-square overflow-hidden rounded-md bg-muted/20 flex items-center justify-center">
                                <AuthenticatedImage
                                  src={getFullImageUrl(asset.assetUrl)}
                                  alt={asset.formatName}
                                  className="h-full w-full object-contain"
                                  placeholder={
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                      <i className="fas fa-image text-lg" />
                                    </div>
                                  }
                                />
                              </div>
                            ) : (
                              <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md bg-warning/10 text-warning">
                                <i className="fas fa-eye-slash" />
                                <p className="text-xs">NSFW Content!</p>
                                <button className="rounded bg-warning px-2 py-1 text-xs text-warning-foreground">
                                  Show
                                </button>
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {asset.formatName} ({formatDimensions(asset.dimensions)})
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/adjust-image?assetId=${asset.id}`;
                                }}
                                className="rounded border border-border px-2 py-1 text-[10px] hover:bg-muted/20"
                              >
                                Edit More
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AssetsSection;