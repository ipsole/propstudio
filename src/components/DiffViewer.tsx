import React, { useState, useEffect } from 'react';
import { ProposalData, Page, Block, Version } from '../types';
import { storageClient } from '../storageClient';
import { ArrowLeft, GitCompare, RefreshCw, AlertTriangle, Layers } from 'lucide-react';

interface DiffViewerProps {
  proposalId: string;
  currentProposalData: ProposalData;
  onExit: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  proposalId,
  currentProposalData,
  onExit
}) => {
  const [history, setHistory] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Versions select states
  const [versionAId, setVersionAId] = useState<string>('current');
  const [versionBId, setVersionBId] = useState<string>('');
  
  const [versionAData, setVersionAData] = useState<ProposalData | null>(null);
  const [versionBData, setVersionBData] = useState<ProposalData | null>(null);

  // Load history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const historyData = await storageClient.getVersionHistory(proposalId);
        setHistory(historyData);
        if (historyData.length > 0) {
          // Pre-select the first version in history for Column B comparison
          setVersionBId(historyData[0].id);
        }
      } catch (err) {
        console.error("Error fetching version history for diff:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [proposalId]);

  // Resolve ProposalData for selected versions
  useEffect(() => {
    const resolveData = () => {
      // Resolve Version A
      if (versionAId === 'current') {
        setVersionAData(currentProposalData);
      } else {
        const found = history.find(h => h.id === versionAId);
        if (found) {
          setVersionAData({
            ...currentProposalData,
            pages: found.pages,
            brandKit: found.brandKit,
            variables: found.variables || currentProposalData.variables,
            signatures: found.signatures || currentProposalData.signatures
          });
        }
      }

      // Resolve Version B
      if (versionBId === 'current') {
        setVersionBData(currentProposalData);
      } else {
        const found = history.find(h => h.id === versionBId);
        if (found) {
          setVersionBData({
            ...currentProposalData,
            pages: found.pages,
            brandKit: found.brandKit,
            variables: found.variables || currentProposalData.variables,
            signatures: found.signatures || currentProposalData.signatures
          });
        }
      }
    };

    if (history.length >= 0) {
      resolveData();
    }
  }, [versionAId, versionBId, history, currentProposalData]);

  // Diff comparison helpers
  const getBlockDiffState = (blockA: Block | undefined, blockB: Block | undefined): 'unchanged' | 'added' | 'deleted' | 'modified' => {
    if (blockA && !blockB) return 'deleted';
    if (!blockA && blockB) return 'added';
    if (!blockA && !blockB) return 'unchanged';
    
    // Both exist, compare values
    const diffTitle = blockA.title !== blockB.title;
    const diffSubtitle = (blockA.subtitle || '') !== (blockB.subtitle || '');
    const diffContent = (blockA.content || '') !== (blockB.content || '');
    const diffLayout = blockA.layout !== blockB.layout;
    
    // Compare listItems
    const diffList = JSON.stringify(blockA.listItems || []) !== JSON.stringify(blockB.listItems || []);
    
    // Compare metadata
    const diffMeta = JSON.stringify(blockA.metadata || {}) !== JSON.stringify(blockB.metadata || {});

    if (diffTitle || diffSubtitle || diffContent || diffLayout || diffList || diffMeta) {
      return 'modified';
    }
    return 'unchanged';
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
        <RefreshCw size={24} className="animate-spin mb-2" />
        <span className="text-xs font-semibold">Generating comparison models...</span>
      </div>
    );
  }

  // Max pages to align side-by-side
  const maxPages = Math.max(versionAData?.pages?.length || 0, versionBData?.pages?.length || 0);

  return (
    <div className="flex-1 bg-[#f3f4f6] flex flex-col h-full overflow-hidden w-full font-sans select-none">
      
      {/* Compare top nav bar */}
      <nav className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer text-gray-600 hover:text-black"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          <div className="flex items-center gap-2 text-gray-800">
            <GitCompare size={18} className="text-indigo-600" />
            <h1 className="text-xs font-bold uppercase tracking-widest">Version Visual Comparator</h1>
          </div>
        </div>

        {/* Version Selectors */}
        <div className="flex items-center gap-4 bg-gray-50 border border-gray-250 p-2 rounded-2xl">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Version A (Left)</span>
            <select
              value={versionAId}
              onChange={(e) => setVersionAId(e.target.value)}
              className="text-xs font-bold px-2 py-1 bg-white border border-gray-250 rounded-lg text-gray-800"
            >
              <option value="current">Current Editable Head</option>
              {history.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.timestamp.split(',')[0]})</option>
              ))}
            </select>
          </div>

          <span className="text-xs font-bold text-gray-400">vs</span>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Version B (Right)</span>
            <select
              value={versionBId}
              onChange={(e) => setVersionBId(e.target.value)}
              className="text-xs font-bold px-2 py-1 bg-white border border-gray-250 rounded-lg text-gray-800"
            >
              <option value="current">Current Editable Head</option>
              {history.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.timestamp.split(',')[0]})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Info Legend */}
        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded" />
            <span className="text-red-700">Deleted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-green-100 border border-green-300 rounded" />
            <span className="text-green-700">Added</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-100 border border-amber-300 rounded" />
            <span className="text-amber-700">Modified</span>
          </div>
        </div>
      </nav>

      {/* Main Diff Grid Container */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-12 items-center">
        
        {maxPages === 0 ? (
          <div className="my-auto bg-white border border-gray-150 p-8 rounded-2xl shadow-sm text-center max-w-sm text-gray-400">
            <AlertTriangle className="mx-auto mb-2 text-indigo-500 stroke-1" size={32} />
            <h3 className="font-semibold text-gray-800 text-xs">No pages to compare</h3>
          </div>
        ) : (
          Array.from({ length: maxPages }).map((_, pageIdx) => {
            const pageA = versionAData?.pages?.[pageIdx];
            const pageB = versionBData?.pages?.[pageIdx];
            
            return (
              <div key={pageIdx} className="flex gap-8 justify-center max-w-full">
                
                {/* COLUMN A (LEFT) */}
                <div className="w-[145mm] shrink-0">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex justify-between">
                    <span>Page {pageIdx + 1}: {pageA?.title || 'Blank / Missing'}</span>
                    {!pageA && <span className="text-green-600 font-semibold bg-green-50 px-1.5 rounded">Not Present</span>}
                  </div>
                  
                  <div 
                    className={`page-card-comparison border shadow-md relative p-8 transition-all overflow-hidden ${
                      !pageA ? 'bg-gray-100 border-dashed border-gray-200 min-h-[200mm]' : 'bg-white border-gray-200'
                    }`}
                    style={pageA ? {
                      fontFamily: versionAData?.brandKit?.fontBody,
                      backgroundColor: versionAData?.brandKit?.backgroundColor,
                      color: versionAData?.brandKit?.textColor
                    } : undefined}
                  >
                    {pageA && pageA.blocks.map((blockA, blockIdx) => {
                      // Find matched block in pageB
                      const blockB = pageB?.blocks?.[blockIdx];
                      const diffState = getBlockDiffState(blockA, blockB);
                      
                      return (
                        <DiffBlockWrapper 
                          key={blockA.id} 
                          block={blockA} 
                          diffState={diffState === 'added' ? 'unchanged' : diffState} 
                          brandKit={versionAData?.brandKit} 
                        />
                      );
                    })}
                  </div>
                </div>

                {/* COLUMN B (RIGHT) */}
                <div className="w-[145mm] shrink-0">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex justify-between">
                    <span>Page {pageIdx + 1}: {pageB?.title || 'Blank / Missing'}</span>
                    {!pageB && <span className="text-red-500 font-semibold bg-red-50 px-1.5 rounded">Deleted Page</span>}
                  </div>
                  
                  <div 
                    className={`page-card-comparison border shadow-md relative p-8 transition-all overflow-hidden ${
                      !pageB ? 'bg-gray-100 border-dashed border-gray-250 min-h-[200mm]' : 'bg-white border-gray-200'
                    }`}
                    style={pageB ? {
                      fontFamily: versionBData?.brandKit?.fontBody,
                      backgroundColor: versionBData?.brandKit?.backgroundColor,
                      color: versionBData?.brandKit?.textColor
                    } : undefined}
                  >
                    {pageB && pageB.blocks.map((blockB, blockIdx) => {
                      // Find matched block in pageA
                      const blockA = pageA?.blocks?.[blockIdx];
                      const diffState = getBlockDiffState(blockA, blockB);
                      
                      return (
                        <DiffBlockWrapper 
                          key={blockB.id} 
                          block={blockB} 
                          diffState={diffState === 'deleted' ? 'unchanged' : diffState} 
                          brandKit={versionBData?.brandKit} 
                        />
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        )}

      </div>
    </div>
  );
};

// Internal Block Wrapper with Diff Highlights
interface DiffBlockWrapperProps {
  block: Block;
  diffState: 'unchanged' | 'added' | 'deleted' | 'modified';
  brandKit: any;
}

const DiffBlockWrapper: React.FC<DiffBlockWrapperProps> = ({
  block,
  diffState,
  brandKit
}) => {
  const getBorderColor = () => {
    switch (diffState) {
      case 'added': return 'border-green-500 bg-green-50/5 ring-1 ring-green-150';
      case 'deleted': return 'border-red-400 bg-red-50/5 ring-1 ring-red-150';
      case 'modified': return 'border-amber-400 bg-amber-50/5 ring-1 ring-amber-150';
      default: return 'border-transparent';
    }
  };

  const getDiffBadge = () => {
    switch (diffState) {
      case 'added': return <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-1.5 py-0.5 rounded border border-green-200 z-10 shadow-sm">+ Added</span>;
      case 'deleted': return <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-200 z-10 shadow-sm">- Deleted</span>;
      case 'modified': return <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 z-10 shadow-sm">~ Modified</span>;
      default: return null;
    }
  };

  const headingStyle = { fontFamily: brandKit?.fontHeading, color: brandKit?.primaryColor };
  const bodyStyle = { fontFamily: brandKit?.fontBody, color: brandKit?.textColor };

  return (
    <div className={`relative p-4 border my-4 rounded-xl transition-all ${getBorderColor()}`}>
      {getDiffBadge()}
      
      {/* Simple Block Renderer */}
      <div className="text-left space-y-2">
        <h4 className="text-xs font-bold text-gray-800" style={headingStyle}>
          {block.title || `${block.type.toUpperCase()} BLOCK`}
        </h4>
        {block.subtitle && (
          <p className="text-[10px] text-gray-400 font-medium">{block.subtitle}</p>
        )}
        {block.content && (
          <p className="text-[10px] text-gray-500 leading-relaxed whitespace-pre-wrap mt-2" style={bodyStyle}>
            {block.content}
          </p>
        )}
        {block.listItems && (
          <ul className="list-disc list-inside text-[10px] text-gray-500 space-y-1 mt-2">
            {block.listItems.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        )}
        
        {/* Render simplified list metadata indicators for service/pricing tables */}
        {block.type === 'services' && block.metadata?.services && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {block.metadata.services.map((s: any, idx: number) => (
              <div key={idx} className="p-2 border border-gray-50 rounded bg-gray-50/50 text-[9px] text-gray-650">
                <span className="font-semibold text-gray-850 block">{s.name}</span>
                <span>{s.price ? `$${s.price}` : ''}</span>
              </div>
            ))}
          </div>
        )}
        {block.type === 'pricing' && block.metadata?.items && (
          <div className="mt-3 space-y-1.5 border-t border-gray-50 pt-2 text-[9px]">
            {block.metadata.items.map((i: any, idx: number) => (
              <div key={idx} className="flex justify-between text-gray-500">
                <span>{i.name}</span>
                <span className="font-bold text-black">${i.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
