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

    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Notify parent component of selection changes
    useEffect(() => {
        onSelectionChange?.(selectedItems);
    }, [selectedItems, onSelectionChange]);

    // Update selected items when initialSelection changes
    useEffect(() => {
        setSelectedItems(initialSelection);
    }, [initialSelection]);

    // Fetch formats on component mount
    useEffect(() => {
        const fetchFormats = async () => {
            setLoading(true);
            setError(null);
            try {
                const response: FormatsResponse = await generation.getFormats();

                // Group repurposing formats by platform
                const platformMap = new Map<string, AssetFormat[]>();

                response.repurposing?.forEach((format: AssetFormat) => {
                    const platformName = format.platformName || format.platform_name || 'Other';
                    if (!platformMap.has(platformName)) {
                        platformMap.set(platformName, []);
                    }
                    platformMap.get(platformName)?.push(format);
                });

                // Convert to array format and sort platforms
                const platformsData: PlatformData[] = Array.from(platformMap.entries())
                    .map(([platform, items]) => ({
                        platform,
                        items: items.sort((a, b) => a.name.localeCompare(b.name))
                    }))
                    .sort((a, b) => a.platform.localeCompare(b.platform));

                setRepurposingData(platformsData);
            } catch (err) {
                console.error('Failed to fetch formats:', err);
                setError('Failed to load formats. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchFormats();
    }, []); // Empty dependency array - only run once on mount

    // Generate a flat list of all possible item IDs for "Select All" functionality
    const allItemIds = useMemo(() =>
        repurposingData.flatMap(p => p.items.map(item => item.id)),
        [repurposingData]
    );

    // Handler to add/remove IDs from the array
    const handleCheckChange = (id: string) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Platform "Select All" functionality
    const handlePlatformSelectAll = (platformItems: AssetFormat[]) => {
        const platformIds = platformItems.map(item => item.id);
        const areAllChecked = platformIds.every(id => selectedItems.includes(id));

        if (areAllChecked) {
            // Deselect all for this platform by filtering them out
            setSelectedItems(prev => prev.filter(id => !platformIds.includes(id)));
        } else {
            // Select all for this platform by adding them (ensuring no duplicates)
            setSelectedItems(prev => [...new Set([...prev, ...platformIds])]);
        }
    };

    // Global "Select All" functionality
    const handleGlobalSelectAll = () => {
        if (selectedItems.length === allItemIds.length) {
            setSelectedItems([]); // Deselect all
        } else {
            setSelectedItems(allItemIds); // Select all
        }
    };

    // Check if all items are globally selected
    const isAllGloballySelected = useMemo(() =>
        allItemIds.length > 0 && selectedItems.length === allItemIds.length,
        [selectedItems, allItemIds]
    );

    // Loading state
    if (loading) {
        return (
            <div className="repurposing-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading formats...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="repurposing-container">
                <div className="error-state">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="retry-button"
                    >
                        <i className="fas fa-redo"></i> Retry
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (repurposingData.length === 0) {
        return (
            <div className="repurposing-container">
                <div className="empty-state">
                    <i className="fas fa-inbox"></i>
                    <p>No formats available. Please contact your administrator.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="repurposing-container">
            <label className="select-all-global-label">
                <input
                    type="checkbox"
                    onChange={handleGlobalSelectAll}
                    checked={isAllGloballySelected}
                />
                <span className="custom-checkbox"></span>
                Select All ({selectedItems.length} of {allItemIds.length} selected)
            </label>

            <div className="repurposing-grid">
                {repurposingData.map(({ platform, items }) => {
                    const platformIds = items.map(item => item.id);
                    const areAllPlatformItemsChecked = platformIds.every(id => selectedItems.includes(id));
                    const selectedCount = platformIds.filter(id => selectedItems.includes(id)).length;

                    return (
                        <div className="platform-card" key={platform}>
                            <div className="platform-header">
                                <h3>
                                    {platform}
                                    <span className="platform-count">
                                        ({selectedCount}/{items.length})
                                    </span>
                                </h3>
                                <button
                                    className="platform-select-all"
                                    onClick={() => handlePlatformSelectAll(items)}
                                >
                                    {areAllPlatformItemsChecked ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="platform-item-list">
                                {items.map(item => (
                                    <label key={item.id} className="platform-item">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => handleCheckChange(item.id)}
                                        />
                                        <span className="custom-checkbox"></span>
                                        <div className="item-details">
                                            <span className="item-name">{item.name}</span>
                                            <span className="format-dimensions">
                                                {item.width} × {item.height}
                                            </span>
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