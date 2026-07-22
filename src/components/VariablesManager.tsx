import React, { useState } from 'react';
import { SmartVariable, ProposalData } from '../types';
import { Plus, Trash2, Copy, Check, Info } from 'lucide-react';

interface VariablesManagerProps {
  data: ProposalData;
  onChange: (newData: ProposalData) => void;
}

export const VariablesManager: React.FC<VariablesManagerProps> = ({
  data,
  onChange
}) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    // Convert key to snake_case or lowercase
    const formattedKey = newKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    // Check if key already exists
    const exists = data.variables.some(v => v.key === formattedKey);
    if (exists) {
      alert(`Variable {{${formattedKey}}} already exists!`);
      return;
    }

    const newVar: SmartVariable = {
      key: formattedKey,
      value: newValue.trim(),
      label: newLabel.trim() || newKey.trim(),
      description: 'Custom defined variable'
    };

    onChange({
      ...data,
      variables: [...(data.variables || []), newVar]
    });

    setNewKey('');
    setNewValue('');
    setNewLabel('');
  };

  const handleUpdateValue = (key: string, val: string) => {
    const updated = data.variables.map(v => {
      if (v.key === key) {
        return { ...v, value: val };
      }
      return v;
    });

    // Sync clientName, companyName, projectName directly if they were updated via variables
    let clientName = data.clientName;
    let companyName = data.companyName;
    let projectName = data.projectName;
    let date = data.date;

    if (key === 'client_name') clientName = val;
    if (key === 'company_name') companyName = val;
    if (key === 'project_name') projectName = val;
    if (key === 'date') date = val;

    onChange({
      ...data,
      variables: updated,
      clientName,
      companyName,
      projectName,
      date
    });
  };

  const handleRemoveVariable = (key: string) => {
    // Prevent removing system variables
    if (['client_name', 'company_name', 'project_name', 'date'].includes(key)) {
      alert("System variables cannot be deleted.");
      return;
    }

    const updated = data.variables.filter(v => v.key !== key);
    onChange({
      ...data,
      variables: updated
    });
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-6 select-text text-left">
      
      <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Smart Variables</span>
        <span className="text-[10px] text-gray-450 font-bold bg-gray-50 px-1.5 py-0.5 rounded-md">
          {data.variables?.length || 0} defined
        </span>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex gap-2">
        <Info size={14} className="shrink-0 mt-0.5 text-indigo-500" />
        <span>
          Enter placeholders like <b>{"{{client_name}}"}</b> in block fields. They will resolve to their actual values in client view.
        </span>
      </p>

      {/* Variables Table List */}
      <div className="space-y-3">
        {(data.variables || []).map((v) => {
          const isSystem = ['client_name', 'company_name', 'project_name', 'date'].includes(v.key);
          const isCopied = copiedKey === v.key;
          
          return (
            <div 
              key={v.key} 
              className="p-3 border border-gray-100 rounded-xl bg-white shadow-xs space-y-2 group relative"
            >
              <div className="flex justify-between items-center gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-950 block">{v.label}</span>
                  <code className="text-[9px] text-indigo-600 font-mono font-bold">
                    {"{{"}{v.key}{"}}"}
                  </code>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(v.key)}
                    className="p-1 hover:bg-gray-150 rounded text-gray-400 hover:text-black transition-colors cursor-pointer"
                    title="Copy token to clipboard"
                  >
                    {isCopied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                  </button>
                  {!isSystem && (
                    <button
                      onClick={() => handleRemoveVariable(v.key)}
                      className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete variable"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={v.value}
                  onChange={(e) => handleUpdateValue(v.key, e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-150 focus:border-black focus:ring-1 focus:ring-black rounded-lg text-xs bg-white text-gray-800"
                  placeholder={`Value for ${v.label}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Define New Custom Variable Form */}
      <form onSubmit={handleAddVariable} className="border border-dashed border-gray-250 p-4 rounded-xl space-y-3 bg-gray-50/50">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
          <Plus size={10} /> Define Custom Variable
        </h4>

        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Variable Label</label>
              <input
                type="text"
                required
                placeholder="e.g. Revision Fee"
                value={newLabel}
                onChange={(e) => {
                  setNewLabel(e.target.value);
                  // Auto-generate key from label if key is empty
                  if (!newKey) {
                    setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                  }
                }}
                className="w-full px-2 py-1 border border-gray-200 rounded-lg text-[10px] text-gray-800 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Token Key</label>
              <input
                type="text"
                required
                placeholder="e.g. revision_fee"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="w-full px-2 py-1 border border-gray-200 rounded-lg text-[10px] text-gray-800 bg-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Variable Value</label>
            <input
              type="text"
              required
              placeholder="e.g. $150/hour"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full px-2 py-1 border border-gray-200 rounded-lg text-[10px] text-gray-800 bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-1.5 bg-black hover:bg-gray-850 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Add Variable
        </button>
      </form>

    </div>
  );
};
