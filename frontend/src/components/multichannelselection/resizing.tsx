// components/ResizingTab.tsx
import React from "react";
import Templates from "./templates";
import CustomDimensions from "./customDimensions";

interface TemplateItem {
  id: string;
  name: string;
  dimensions: string;
  ratio: string;
  iconRatio: string;
  width: number;
  height: number;
}

interface TemplateCategory {
  category: string;
  items: TemplateItem[];
}

interface Props {
  templateData: TemplateCategory[];
  selectedTemplates: string[];
  allTemplateIds: string[];
  handleCheckboxChange: (id: string) => void;
  handleSelectAll: () => void;
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

const Resizing: React.FC<Props> = ({
  templateData,
  selectedTemplates,
  allTemplateIds,
  handleCheckboxChange,
  handleSelectAll,
  customWidth,
  customHeight,
  customUnit,
  providers,
  selectedProvider,
  onWidthChange,
  onHeightChange,
  onUnitChange,
  onProviderChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
      {/* Templates (first column/row) */}
      <div className="min-w-0 order-1 md:order-none">
        <Templates
          templateData={templateData}
          selectedTemplates={selectedTemplates}
          allTemplateIds={allTemplateIds}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
        />
      </div>

      {/* Custom Dimensions (second column/row) */}
      <div className="min-w-0 w-full order-2 md:order-none">
        <CustomDimensions
          customWidth={customWidth}
          customHeight={customHeight}
          customUnit={customUnit}
          providers={providers}
          selectedProvider={selectedProvider}
          onWidthChange={onWidthChange}
          onHeightChange={onHeightChange}
          onUnitChange={onUnitChange}
          onProviderChange={onProviderChange}
        />
      </div>
    </div>
  );
};

export default Resizing;
