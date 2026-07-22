import React, { useState } from 'react';
import { Page } from '../types';
import { X, FileText, CheckSquare, Square, Printer } from 'lucide-react';

interface PrintSettingsModalProps {
  pages: Page[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedPageIds: string[]) => void;
}

export const PrintSettingsModal: React.FC<PrintSettingsModalProps> = ({
  pages,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => pages.map(p => p.id));

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(pages.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handlePrintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert("Please select at least one page to export.");
      return;
    }
    onConfirm(selectedIds);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-9999 animate-fade-in no-print">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">PDF Export Settings</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Select pages to include in the exported document</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-150 text-gray-400 hover:text-black rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Selection Helpers */}
        <div className="px-5 py-3 border-b border-gray-100 bg-white flex justify-between items-center text-[10px]">
          <span className="text-gray-500 font-medium">
            {selectedIds.length} of {pages.length} pages selected
          </span>
          <div className="flex gap-2.5">
            <button
              onClick={handleSelectAll}
              className="text-indigo-650 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
            >
              Select All
            </button>
            <span className="text-gray-250">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-gray-500 hover:text-black font-bold hover:underline cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Pages Checklist */}
        <form onSubmit={handlePrintSubmit} className="flex-1 overflow-y-auto p-5 space-y-2">
          {pages.map((page, idx) => {
            const isChecked = selectedIds.includes(page.id);
            return (
              <div
                key={page.id}
                onClick={() => handleToggle(page.id)}
                className={`p-3 border rounded-xl flex items-center gap-3 transition-all cursor-pointer select-none ${
                  isChecked 
                    ? 'border-indigo-250 bg-indigo-50/10 hover:bg-indigo-50/20' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <button
                  type="button"
                  className={`shrink-0 transition-colors ${isChecked ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                  {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">
                    Page {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="h-4 w-px bg-gray-250 shrink-0" />
                  <span className="text-xs font-semibold text-gray-800 truncate">
                    {page.title || 'Untitled Page'}
                  </span>
                </div>
              </div>
            );
          })}
        </form>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:text-black transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrintSubmit}
            className="flex-1 py-2.5 bg-black hover:bg-gray-850 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Printer size={13} />
            Generate PDF
          </button>
        </div>

      </div>
    </div>
  );
};
