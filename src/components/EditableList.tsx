import React from 'react';
import { EditableText } from './EditableText';
import { Plus, Trash2 } from 'lucide-react';

interface EditableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  className?: string;
  itemClassName?: string;
  listId?: string;
  customStyles?: {
    itemPageBreaks: string[];
    fontSizes: Record<string, string>;
  };
  onToggleItemPageBreak?: (id: string) => void;
  onUpdateFontSize?: (id: string, size: string) => void;
}

export const EditableList: React.FC<EditableListProps> = ({
  items,
  onChange,
  placeholder = 'Add an item...',
  className = '',
  itemClassName = '',
  listId,
  customStyles,
  onToggleItemPageBreak,
  onUpdateFontSize
}) => {
  const handleItemChange = (index: number, newValue: string) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onChange(newItems);
  };

  const handleAddItem = () => {
    onChange([...items, '']);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => {
        const itemKey = listId ? `${listId}-${index}` : '';
        const fontSizeKey = listId ? `${listId}-item-${index}` : '';
        const hasPageBreak = itemKey && customStyles?.itemPageBreaks.includes(itemKey);
        
        return (
          <div key={index} className="w-full">
            {hasPageBreak && (
              <div className="relative my-6 flex items-center justify-center no-print">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-dashed border-indigo-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full">
                    📄 Page Break
                  </span>
                </div>
              </div>
            )}
            
            <div className={`flex items-start group relative ${hasPageBreak ? 'page-break' : 'print:page-break-before-avoid'}`}>
              <span className="mt-1.5 mr-3 w-1.5 h-1.5 rounded-full bg-black shrink-0" />
              <EditableText
                value={item}
                onChange={(val) => handleItemChange(index, val)}
                className={`flex-1 ${itemClassName}`}
                multiline
                placeholder={placeholder}
                fontSize={customStyles?.fontSizes?.[fontSizeKey]}
                onFontSizeChange={onUpdateFontSize ? (sz) => onUpdateFontSize(fontSizeKey, sz) : undefined}
              />
              
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-2 rounded no-print shrink-0 transition-opacity">
                {listId && onToggleItemPageBreak && (
                  <button
                    onClick={() => onToggleItemPageBreak(itemKey)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      hasPageBreak ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                    title={hasPageBreak ? "Remove page break before this item" : "Insert page break before this item"}
                  >
                    📄
                  </button>
                )}
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      <button
        onClick={handleAddItem}
        className="flex items-center text-sm text-gray-500 hover:text-black transition-colors mt-2 no-print cursor-pointer"
      >
        <Plus size={16} className="mr-1" /> Add Item
      </button>
    </div>
  );
};
