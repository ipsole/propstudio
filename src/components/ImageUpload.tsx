import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  width?: number;
  onWidthChange?: (width: number) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  value, 
  onChange, 
  className = '',
  width = 96,
  onWidthChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (value) {
    return (
      <div className={`relative group inline-block ${className}`}>
        <img 
          src={value} 
          alt="Logo" 
          style={{ width: `${width}px` }} 
          className="max-h-36 object-contain transition-all"
        />
        <button
          onClick={() => onChange(null)}
          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity no-print text-gray-500 hover:text-red-500 border border-gray-100 cursor-pointer"
          title="Remove image"
        >
          <X size={14} />
        </button>
        
        {onWidthChange && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded px-2 py-1 flex items-center gap-2 shadow-md no-print opacity-0 group-hover:opacity-100 transition-opacity z-20 w-44">
            <span className="text-[10px] text-gray-500 font-semibold shrink-0">Width:</span>
            <input 
              type="range" 
              min="40" 
              max="350" 
              value={width} 
              onChange={(e) => onWidthChange(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
            <span className="text-[9px] text-gray-400 font-bold shrink-0">{width}px</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`no-print ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-6 hover:border-gray-400 hover:bg-gray-50 transition-colors group cursor-pointer"
      >
        <div className="flex flex-col items-center text-gray-400 group-hover:text-gray-600">
          <Upload size={24} className="mb-2" />
          <span className="text-sm font-medium">Upload Logo</span>
        </div>
      </button>
    </div>
  );
};
