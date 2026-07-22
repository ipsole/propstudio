import React, { useState, useEffect } from 'react';
import { ProposalData, Block, Version, GlobalComponent } from '../types';
import { VariablesManager } from './VariablesManager';
import { storageClient } from '../storageClient';
import { 
  FileText, 
  Bookmark, 
  History, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Sliders, 
  Home, 
  Layers, 
  Database,
  Code
} from 'lucide-react';

interface SidebarProps {
  data: ProposalData;
  onChange: (newData: ProposalData) => void;
  onAddPage: () => void;
  onRemovePage: (pageId: string) => void;
  onMovePage: (pageId: string, direction: 'up' | 'down') => void;
  onDuplicatePage: (pageId: string) => void;
  onImportBlock: (block: Block) => void;
  versions: Version[];
  onRestoreVersion: (version: Version) => void;
  onSaveVersion: (name: string) => void;
  onDeleteVersion?: (versionId: string) => void;
  
  // Storage & Branching
  onGoToDashboard: () => void;
  onCreateBranch: (name: string) => void;
  onSwitchBranch: (name: string) => void;
  onCompareVersions: () => void;
  globalComponents: GlobalComponent[];
  onInsertGlobalComponent: (comp: GlobalComponent) => void;
  activePageId?: string;
  onSelectPage?: (pageId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  data,
  onChange,
  onAddPage,
  onRemovePage,
  onMovePage,
  onDuplicatePage,
  onImportBlock,
  versions,
  onRestoreVersion,
  onSaveVersion,
  onDeleteVersion,
  onGoToDashboard,
  onCreateBranch,
  onSwitchBranch,
  onCompareVersions,
  globalComponents,
  onInsertGlobalComponent,
  activePageId,
  onSelectPage
}) => {
  const [activeTab, setActiveTab] = useState<'outline' | 'components' | 'git' | 'variables'>('outline');
  const [newVersionName, setNewVersionName] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [useSupabase, setUseSupabase] = useState<boolean | null>(null);

  useEffect(() => {
    storageClient.getStatus()
      .then(res => setUseSupabase(res.useSupabase))
      .catch(() => setUseSupabase(false));
  }, []);

  const scrollToPage = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    onSelectPage?.(id);
  };

  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionName.trim()) return;
    onSaveVersion(newVersionName.trim());
    setNewVersionName('');
  };

  const handleCreateBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    onCreateBranch(newBranchName.trim());
    setNewBranchName('');
  };

  // Get available branches list (main + keys of data.branches)
  const branchesList = ['main', ...Object.keys(data.branches || {})];

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-full shrink-0 no-print z-10 select-none">
      
      {/* Return to Dashboard Nav Button */}
      <div className="p-3 border-b border-gray-150 bg-gray-50/50 flex items-center justify-between shrink-0">
        <button
          onClick={onGoToDashboard}
          className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-150 text-xs font-bold text-gray-700 hover:text-black rounded-lg transition-all cursor-pointer"
        >
          <Home size={14} /> Dashboard
        </button>
        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
          {data.isBlueprint ? 'MASTER TEMPLATE' : 'CLIENT DRAFT'}
        </span>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-gray-100 bg-gray-50/20 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('outline')}
          className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'outline'
              ? 'bg-white shadow-xs text-black font-bold border border-gray-100'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
          }`}
          title="Document Outline"
        >
          <FileText size={14} />
          <span className="text-[8px] mt-1 uppercase tracking-wider font-bold">Outline</span>
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'components'
              ? 'bg-white shadow-xs text-black font-bold border border-gray-100'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
          }`}
          title="Global Components & Library"
        >
          <Layers size={14} />
          <span className="text-[8px] mt-1 uppercase tracking-wider font-bold">Globals</span>
        </button>
        <button
          onClick={() => setActiveTab('git')}
          className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'git'
              ? 'bg-white shadow-xs text-black font-bold border border-gray-100'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
          }`}
          title="Version History"
        >
          <History size={14} />
          <span className="text-[8px] mt-1 uppercase tracking-wider font-bold">Version</span>
        </button>
        <button
          onClick={() => setActiveTab('variables')}
          className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'variables'
              ? 'bg-white shadow-xs text-black font-bold border border-gray-100'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
          }`}
          title="Smart Placeholders"
        >
          <Sliders size={14} />
          <span className="text-[8px] mt-1 uppercase tracking-wider font-bold">Vars</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4">
        
        {/* OUTLINE TAB */}
        {activeTab === 'outline' && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-gray-55">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Document Structure</span>
              <span className="text-[10px] text-indigo-650 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                {data.pages.length} Pages
              </span>
            </div>

            <div className="space-y-2">
              {data.pages.map((page, index) => (
                <div
                  key={page.id}
                  onClick={() => scrollToPage(page.id)}
                  className={`p-3 border rounded-xl shadow-xs cursor-pointer flex flex-col gap-2 group/page transition-all ${
                    page.id === activePageId 
                      ? 'border-indigo-250 bg-indigo-50/20 ring-1 ring-indigo-100/30 shadow-sm' 
                      : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-mono text-gray-300">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <input
                        type="text"
                        value={page.title}
                        onChange={(e) => {
                          const updated = data.pages.map(p => p.id === page.id ? { ...p, title: e.target.value } : p);
                          onChange({ ...data, pages: updated });
                        }}
                        className="text-xs font-semibold text-gray-800 focus:outline-none border-none bg-transparent w-32 p-0 truncate cursor-text"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="opacity-0 group-hover/page:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMovePage(page.id, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 disabled:opacity-20 text-gray-400 hover:text-black rounded transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMovePage(page.id, 'down');
                        }}
                        disabled={index === data.pages.length - 1}
                        className="p-1 hover:bg-gray-200 disabled:opacity-20 text-gray-400 hover:text-black rounded transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-1">
                    <span className="text-[9px] text-gray-400">
                      {page.blocks.length} content block{page.blocks.length !== 1 ? 's' : ''}
                    </span>
                    <div className="opacity-0 group-hover/page:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicatePage(page.id);
                        }}
                        className="p-1 hover:bg-gray-200 text-gray-400 hover:text-indigo-650 rounded transition-colors cursor-pointer"
                        title="Duplicate Page"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePage(page.id);
                        }}
                        disabled={data.pages.length === 1}
                        className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded disabled:opacity-20 transition-colors cursor-pointer"
                        title="Delete Page"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onAddPage}
              className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-gray-200 hover:border-black rounded-xl text-xs font-semibold text-gray-400 hover:text-black transition-all bg-white hover:bg-gray-50 cursor-pointer"
            >
              <Plus size={14} /> Add Blank Page
            </button>
          </div>
        )}

        {/* COMPONENTS TAB */}
        {activeTab === 'components' && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-gray-50">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-sans">Global Components</span>
              <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-1 rounded">Shared Sync</span>
            </div>

            <p className="text-[9px] text-gray-400 leading-relaxed">
              Global components are reusable blocks (like signatures or footers) saved across all proposals. Updates to a global component propagate everywhere it is used.
            </p>

            {globalComponents.length === 0 ? (
              <div className="text-center py-10 text-gray-300">
                <Bookmark size={20} className="mx-auto mb-1 stroke-1" />
                <p className="text-[10px] font-semibold">No global components defined</p>
                <p className="text-[8px] text-gray-400 mt-0.5">Select a block on canvas and click 'Convert to Global Component' in the inspector.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {globalComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3 border border-indigo-100 rounded-xl bg-indigo-50/5 hover:bg-indigo-50/10 shadow-xs flex flex-col justify-between group/comp transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 truncate">{comp.name}</h4>
                      <div className="flex gap-1.5 items-center mt-1">
                        <span className="text-[8px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded uppercase tracking-wider">
                          {comp.type}
                        </span>
                        <span className="text-[8px] text-gray-400">Global Registry</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-indigo-50/40">
                      <button
                        onClick={() => onInsertGlobalComponent(comp)}
                        className="text-[9px] font-bold uppercase tracking-wider text-indigo-650 hover:text-indigo-800 cursor-pointer"
                      >
                        + Insert Component
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Traditional saved blocks library */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Local Content Library</span>
              {data.reusableLibrary.length === 0 ? (
                <p className="text-[8px] text-gray-400 italic">No saved local blocks in this proposal.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.reusableLibrary.map((block) => (
                    <div key={block.id} className="p-2 border border-gray-100 rounded-lg flex justify-between items-center bg-gray-50/30">
                      <span className="text-[10px] text-gray-700 font-medium truncate max-w-[120px]">{block.title}</span>
                      <button
                        onClick={() => onImportBlock(block)}
                        className="text-[8px] font-bold text-indigo-650 hover:underline cursor-pointer"
                      >
                        Insert
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENT VERSION HISTORY TAB */}
        {activeTab === 'git' && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-gray-50">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Version History</span>
              <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-1.5 rounded">Enabled</span>
            </div>

            {/* SNAPSHOTS AND CHECKPOINTS */}
            <div className="space-y-3 pt-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Save named snapshot</span>
              
              <form onSubmit={handleCreateVersion} className="flex gap-1">
                <input
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="e.g. V1 Design Proposal"
                  className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-black text-gray-850 bg-white"
                  required
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 bg-black hover:bg-gray-850 text-white rounded-lg text-[10px] font-semibold shrink-0 cursor-pointer"
                >
                  Save
                </button>
              </form>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {versions.length === 0 ? (
                  <p className="text-[8px] text-gray-400 italic">No named snapshots saved yet.</p>
                ) : (
                  versions.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-2 border border-gray-100 bg-gray-50/50 hover:bg-white rounded-lg shadow-xs flex flex-col justify-between transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-900 leading-tight">{ver.name}</h4>
                          <span className="text-[8px] text-gray-400 block mt-0.5">{ver.timestamp}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to permanently delete the snapshot "${ver.name}"?`)) {
                              onDeleteVersion?.(ver.id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-all cursor-pointer shrink-0"
                          title="Delete Snapshot permanently"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <div className="flex justify-between mt-2 pt-1 border-t border-gray-50">
                        <button
                          onClick={() => onRestoreVersion(ver)}
                          className="text-[8px] font-bold text-indigo-650 hover:underline cursor-pointer"
                        >
                          Restore State
                        </button>
                        <span className="text-[8px] text-gray-400">{ver.pages.length} Pages</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Checkpoints list */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Autosave Checkpoints (Latest 5)</span>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {(!data.checkpoints || data.checkpoints.length === 0) ? (
                  <p className="text-[8px] text-gray-400 italic">No autosaves recorded yet.</p>
                ) : (
                  data.checkpoints.slice(0, 5).map((cp) => (
                    <div key={cp.id} className="p-2 border border-gray-50 rounded-lg flex justify-between items-center bg-gray-50/30">
                      <div className="text-[9px]">
                        <span className="text-gray-800 font-medium block">Checkpoint</span>
                        <span className="text-[8px] text-gray-400">{cp.timestamp.split(',')[1] || cp.timestamp}</span>
                      </div>
                      <button
                        onClick={() => onRestoreVersion({
                          id: cp.id,
                          name: 'Autosave Checkpoint',
                          timestamp: cp.timestamp,
                          pages: cp.pages,
                          brandKit: cp.brandKit,
                          variables: cp.variables,
                          signatures: cp.signatures
                        })}
                        className="text-[8px] font-bold text-indigo-650 hover:underline cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* SMART VARIABLES TAB */}
        {activeTab === 'variables' && (
          <VariablesManager data={data} onChange={onChange} />
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-auto p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[8px] text-gray-400 select-none shrink-0">
        <span className="font-semibold flex items-center gap-1 text-gray-700">
          {useSupabase ? (
            <>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              ☁️ Cloud Storage Active
            </>
          ) : (
            <>
              <Database size={10} /> Local JSON active
            </>
          )}
        </span>
        <span>v2.1 Engine</span>
      </div>
    </aside>
  );
};
