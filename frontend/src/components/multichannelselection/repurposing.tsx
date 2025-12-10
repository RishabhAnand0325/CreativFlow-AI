import React, { useState, useMemo, useEffect } from 'react';
import { generation } from '../../services/generation';
import type { AssetFormat, FormatsResponse } from '../../types';

interface PlatformData {
  platform: string;
  items: AssetFormat[];
}

interface RepurposingGridProps {
  onSelectionChange?: (selectedFormatIds: string[]) => void;
  initialSelection?: string[];
}

const RepurposingGrid: React.FC<RepurposingGridProps> = ({
  onSelectionChange,
  initialSelection = []
}) => {
  const [repurposingData, setRepurposingData] = useState<PlatformData[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>(initialSelection);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onSelectionChange?.(selectedItems);
  }, [selectedItems, onSelectionChange]);

  useEffect(() => {
    setSelectedItems(initialSelection);
  }, [initialSelection]);

  useEffect(() => {
    const fetchFormats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response: FormatsResponse = await generation.getFormats();
        const platformMap = new Map<string, AssetFormat[]>();

        response.repurposing?.forEach((format: AssetFormat) => {
          const platformName = format.platformName || format.platform_name || 'Other';
          if (!platformMap.has(platformName)) platformMap.set(platformName, []);
          platformMap.get(platformName)?.push(format);
        });

        const platformsData: PlatformData[] = Array.from(platformMap.entries())
          .map(([platform, items]) => ({
            platform,
            items: items.sort((a, b) => a.name.localeCompare(b.name)),
          }))
          .sort((a, b) => a.platform.localeCompare(b.platform));

        setRepurposingData(platformsData);
      } catch (err) {
        setError('Failed to load formats. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFormats();
  }, []);

  const allItemIds = useMemo(
    () => repurposingData.flatMap(p => p.items.map(item => item.id)),
    [repurposingData]
  );

  const handleCheckChange = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handlePlatformSelectAll = (platformItems: AssetFormat[]) => {
    const platformIds = platformItems.map(item => item.id);
    const areAllChecked = platformIds.every(id => selectedItems.includes(id));
    if (areAllChecked)
      setSelectedItems(prev => prev.filter(id => !platformIds.includes(id)));
    else
      setSelectedItems(prev => [...new Set([...prev, ...platformIds])]);
  };

  const handleGlobalSelectAll = () => {
    if (selectedItems.length === allItemIds.length) setSelectedItems([]);
    else setSelectedItems(allItemIds);
  };

  const isAllGloballySelected = useMemo(
    () => allItemIds.length > 0 && selectedItems.length === allItemIds.length,
    [selectedItems, allItemIds]
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center bg-[#2a3337] rounded shadow">
        <div>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-300 mt-2">Loading formats...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-56 bg-[#2a3337] rounded shadow">
        <div className="text-red-400 text-2xl mb-2">⚠️</div>
        <p className="mb-4 text-gray-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (repurposingData.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 bg-[#2a3337] rounded shadow">
        <div className="text-center">
          <div className="text-2xl text-gray-500 mb-2">📭</div>
          <p className="text-gray-300">No formats available. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  // Main grid
  return (
    <div className="min-h-screen w-full p-8 transition-all bg-[#2a3337]">
      <label className="flex items-center mb-6 font-semibold cursor-pointer select-none text-gray-100">
        <input
          type="checkbox"
          className="accent-blue-600 w-5 h-5 mr-2"
          onChange={handleGlobalSelectAll}
          checked={isAllGloballySelected}
        />
        Select All <span className="ml-2 text-gray-400 font-normal">({selectedItems.length} of {allItemIds.length} selected)</span>
      </label>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {repurposingData.map(({ platform, items }) => {
          const platformIds = items.map(item => item.id);
          const areAllPlatformItemsChecked = platformIds.every(id => selectedItems.includes(id));
          const selectedCount = platformIds.filter(id => selectedItems.includes(id)).length;

          return (
            <div
              className="bg-[#3a4449] rounded-lg shadow p-4 flex flex-col transition-all"
              key={platform}
            >
              <div className="flex items-center justify-between mb-2 border-b border-gray-600 pb-1">
                <h3 className="font-bold text-lg text-gray-100">
                  {platform}
                  <span className="ml-2 text-gray-400 font-normal text-base">
                    ({selectedCount}/{items.length})
                  </span>
                </h3>
                <button
                  className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded  transition"
                  onClick={() => handlePlatformSelectAll(items)}
                  type="button"
                >
                  {areAllPlatformItemsChecked ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {items.map(item => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-700 transition"
                  >
                    <input
                      type="checkbox"
                      className="accent-gray-600 w-4 h-4"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleCheckChange(item.id)}
                    />
                    <div>
                      <div className="font-medium text-gray-100">{item.name}</div>
                      <div className="text-xs text-gray-400">
                        {item.width} × {item.height}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RepurposingGrid;