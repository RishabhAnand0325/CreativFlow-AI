import React from 'react';
import { Button } from '../../components/ui/button';
import { Slider } from '../../components/ui/slider';
import { Card, CardContent } from '../../components/ui/card';
import { ImageAdjustments, CropBox } from '../../types';
import { AddContentDropdown } from './AddContentDropdown';
import { TextStylesView } from './TextStylesView';

interface AdjustmentsSidebarProps {
  adjustments: ImageAdjustments;
  showTextStylesView: boolean;
  currentAsset: any;
  onAdjustmentChange: (key: keyof ImageAdjustments, value: any) => void;
  onCropBoxChange: (cropBox: Partial<CropBox>) => void;
  onAddTextOverlay: (overlay: any) => void;
  onShowTextStylesView: (show: boolean) => void;
  onAddLogoOverlay: (file: File) => void;
  hasUnsavedChanges: boolean;
}

export const AdjustmentsSidebar: React.FC<AdjustmentsSidebarProps> = ({
  adjustments,
  showTextStylesView,
  currentAsset,
  onAdjustmentChange,
  onCropBoxChange,
  onAddTextOverlay,
  onShowTextStylesView,
  onAddLogoOverlay,
  hasUnsavedChanges,
}) => {
  const handleCropAreaChange = (value: number[]) => {
    const pct = value[0];
    if (currentAsset) {
      // Calculate crop size based on percentage of the shorter side
      const shorterSide = Math.min(currentAsset.dimensions.width, currentAsset.dimensions.height);
      const newSize = (shorterSide * pct) / 100;
      
      // Calculate position to keep crop centered
      const newX = (currentAsset.dimensions.width - newSize) / 2;
      const newY = (currentAsset.dimensions.height - newSize) / 2;
      
      onAdjustmentChange('cropArea', pct);
      onCropBoxChange({ 
        width: newSize, 
        height: newSize, 
        x: Math.max(0, newX), 
        y: Math.max(0, newY) 
      });
    } else {
      onAdjustmentChange('cropArea', pct);
    }
  };

  if (showTextStylesView) {
    return (
      <TextStylesView
        currentAsset={currentAsset}
        onAddTextOverlay={onAddTextOverlay}
        onBack={() => onShowTextStylesView(false)}
      />
    );
  }

  return (
    <div className="bg-[#243033] rounded-lg p-6 h-fit">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Adjust</h3>
          <p className="text-sm text-slate-400">
            Click & drag to crop image & reposition elements.
          </p>
        </div>

        <AddContentDropdown
          onAddText={() => onShowTextStylesView(true)}
          onAddLogo={onAddLogoOverlay}
        />

        <AdjustmentSection title="Manual Cropping">
          <SliderControl
            label="Crop Area"
            value={[adjustments.cropArea]}
            min={10}
            max={100}
            step={1}
            onValueChange={handleCropAreaChange}
            displayValue={`${adjustments.cropArea}%`}
          />
        </AdjustmentSection>

        <AdjustmentSection title="Color Saturation Adjustments">
          <SliderControl
            label="Color Saturation"
            value={[adjustments.colorSaturation]}
            min={-100}
            max={100}
            step={1}
            onValueChange={(value) => onAdjustmentChange('colorSaturation', value[0])}
            displayValue={adjustments.colorSaturation.toString()}
          />
        </AdjustmentSection>

        <AdjustmentSection title="Logo Adjustments">
          <SliderControl
            label="Logo Size"
            value={[50]}
            min={0}
            max={100}
            step={1}
            onValueChange={() => {}} // Implement logo size adjustment
            displayValue="50"
          />
        </AdjustmentSection>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-yellow-300 text-sm">You have unsaved changes</span>
          </div>
        )}
      </div>
    </div>
  );
};

const AdjustmentSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="space-y-4">
    <h4 className="font-medium text-white">{title}</h4>
    {children}
  </div>
);

const SliderControl: React.FC<{
  label: string;
  value: number[];
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number[]) => void;
  displayValue: string;
}> = ({ label, value, min, max, step, onValueChange, displayValue }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-sm text-slate-300">{label}</label>
      <span className="text-sm text-slate-400">{displayValue}</span>
    </div>
    <Slider
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={onValueChange}
      className="w-full"
    />
  </div>
);