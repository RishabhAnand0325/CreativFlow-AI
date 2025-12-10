import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ChevronLeft } from 'lucide-react';
import type { GeneratedAsset } from '../../types';
import { TextStyle } from '../../types/adjustImage';

// Add the TextInputDialog component
const TextInputDialog: React.FC<{
  open: boolean;
  initialText: string;
  onClose: () => void;
  onConfirm: (text: string) => void;
  style: TextStyle | null;
}> = ({ open, initialText, onClose, onConfirm, style }) => {
  const [text, setText] = useState(initialText);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-lg p-6 w-[400px]">
        <h3 className="text-lg font-semibold mb-4">Enter Your Text</h3>
        <div className="mb-4">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white"
            placeholder="Type your text here..."
            autoFocus
          />
          {style && (
            <div 
              className="mt-2 p-2 rounded bg-slate-700/50"
              style={{ 
                color: style.color,
                fontFamily: style.fontFamily,
                fontSize: '16px'
              }}
            >
              {text || 'Preview'}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => {
              onConfirm(text);
              onClose();
            }}
            disabled={!text.trim()}
          >
            Add Text
          </Button>
        </div>
      </div>
    </div>
  );
};

// Update the TextStylesView component
export const TextStylesView: React.FC<{
  currentAsset: GeneratedAsset | null;
  onAddTextOverlay: (overlay: any) => void;
  onBack: () => void;
}> = ({ currentAsset, onAddTextOverlay, onBack }) => {
  const [selectedStyle, setSelectedStyle] = useState<TextStyle | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleStyleSelect = (style: TextStyle) => {
    setSelectedStyle(style);
    setCustomText(style.title);
    setShowTextInput(true);
  };

  const handleAddText = (text: string) => {
    if (!selectedStyle || !currentAsset) return;

    const width = currentAsset.dimensions?.width || currentAsset.width || 800;
    const height = currentAsset.dimensions?.height || currentAsset.height || 600;

    const overlay = {
      id: `text-${Date.now()}`,
      text: text,
      x: width * 0.5,
      y: height * 0.5,
      fontSize: Math.max(12, Math.round(width * selectedStyle.sizePct)),
      color: selectedStyle.color,
      fontFamily: `${selectedStyle.fontFamily}, sans-serif`,
      opacity: 1
    };

    onAddTextOverlay(overlay);
  };

  const textStyles: TextStyle[] = [
    { id: 't1', title: 'Bold Title', subtitle: 'Large white', fontFamily: 'Arial', color: '#ffffff', sizePct: 0.08 },
    { id: 't2', title: 'Sub Title', subtitle: 'Medium gray', fontFamily: 'Georgia', color: '#e6e6e6', sizePct: 0.05 },
    { id: 't3', title: 'Caps Logo', subtitle: 'Small white', fontFamily: 'Impact', color: '#ffffff', sizePct: 0.06 },
    { id: 't4', title: 'Accent', subtitle: 'Blue', fontFamily: 'Tahoma', color: '#149ECA', sizePct: 0.045 },
    { id: 't5', title: 'Muted', subtitle: 'Light gray', fontFamily: 'Verdana', color: '#cfcfcf', sizePct: 0.05 },
    { id: 't6', title: 'Overlay', subtitle: 'Bold small', fontFamily: 'Helvetica', color: '#ffffff', sizePct: 0.04 },
  ];

  return (
    <>
      <div className="bg-[#243033] rounded-lg p-6 h-fit">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1 h-auto text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold text-white">Add Text</h3>
          </div>
          
          <p className="text-sm text-slate-400">
            Click on a text style to add it to your image.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {textStyles.map((style) => (
              <Card
                key={style.id}
                className="bg-[#2b3537] border-slate-600 hover:border-slate-400 cursor-pointer transition-colors"
                onClick={() => handleStyleSelect(style)}
              >
                <CardContent className="p-3">
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{ color: style.color, fontFamily: style.fontFamily }}
                  >
                    {style.title}
                  </div>
                  <div className="text-xs text-slate-400">{style.subtitle}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button 
            variant="outline" 
            className="w-full border-slate-600 text-slate-300 hover:text-white"
            onClick={() => {
              setSelectedStyle({
                id: 'custom',
                title: 'Custom',
                subtitle: 'Custom text',
                fontFamily: 'Arial',
                color: '#ffffff',
                sizePct: 0.05
              });
              setCustomText('');
              setShowTextInput(true);
            }}
          >
            Custom Text
          </Button>
        </div>
      </div>

      <TextInputDialog
        open={showTextInput}
        initialText={customText}
        onClose={() => {
          setShowTextInput(false);
          setSelectedStyle(null);
        }}
        onConfirm={(text) => {
          if (selectedStyle) {
            handleAddText(text);
          }
          setShowTextInput(false);
        }}
        style={selectedStyle}
      />
    </>
  );
};
