import React, { useRef } from 'react';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Plus, Type, Upload } from 'lucide-react';

interface AddContentDropdownProps {
  onAddText: () => void;
  onAddLogo: (file: File) => void;
}

export const AddContentDropdown: React.FC<AddContentDropdownProps> = ({
  onAddText,
  onAddLogo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAddLogo(file);
    }
    // Reset input
    event.target.value = '';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full bg-[#149ECA] hover:bg-[#149ECA]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Text or Logo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-[#2b3537] border-slate-600">
          <DropdownMenuItem
            className="text-white hover:bg-slate-600 cursor-pointer"
            onClick={onAddText}
          >
            <Type className="w-4 h-4 mr-2" />
            Add Text
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-white hover:bg-slate-600 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import from Computer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoUpload}
      />
    </>
  );
};