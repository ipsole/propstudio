import React, { useRef, useEffect, useState } from 'react';
import { ProposalData, Block, Page, sanitizeUrl, getPageBackgroundStyle } from '../types';
import { EditableText, VariablesContext } from './EditableText';
import { EditableList } from './EditableList';
import { ImageUpload } from './ImageUpload';
import { Plus, Trash2, ArrowUp, ArrowDown, Copy, Layers, MessageSquare, Move, Link, FileText, Download, ExternalLink, Play, Type } from 'lucide-react';
import { motion } from 'motion/react';

interface ProposalEditorProps {
  data: ProposalData;
  onChange: (newData: ProposalData) => void;
  selectedBlock: Block | null;
  onSelectBlock: (block: Block | null) => void;
  onAddBlock: (pageId: string, type: string) => void;
  onRemoveBlock: (pageId: string, blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onDuplicateBlock: (pageId: string, block: Block) => void;
  onSelectPage?: (pageId: string) => void;
  excludedPageIds?: string[];
  onMoveBlockToPage: (currentPageId: string, blockId: string, targetPageId: string) => void;
  onInsertBlockAtPosition?: (pageId: string, type: string, relativeBlockId: string, position: 'above' | 'below') => void;
}

const PageCard: React.FC<{ 
  page: Page; 
  data: ProposalData; 
  onSelectPage?: (pageId: string) => void; 
  children: React.ReactNode 
}> = ({ page, data, onSelectPage, children }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      const el = cardRef.current;
      if (!el) return;

      const parentHeight = el.offsetHeight;
      let hasOverflow = false;
      
      const children = el.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        
        // Skip absolute overlays, edit controls, menus, or warning bubbles
        const style = window.getComputedStyle(child);
        if (
          child.classList.contains('absolute') || 
          child.classList.contains('no-print') || 
          style.position === 'absolute'
        ) {
          continue;
        }

        const bottomPos = child.offsetTop + child.offsetHeight;
        // Check if the bottom edge of this content block extends past the page height
        // We use a 4px subpixel rounding tolerance buffer
        if (bottomPos > parentHeight + 4) {
          hasOverflow = true;
          break;
        }
      }

      setIsOverflowing(hasOverflow);
    };
    
    checkHeight();
    const observer = new ResizeObserver(() => checkHeight());
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [page, data]);

  return (
    <div
      ref={cardRef}
      onClick={() => onSelectPage?.(page.id)}
      className={`page-card relative select-text cursor-text border transition-all duration-300 ${
        isOverflowing ? 'ring-2 ring-red-400 ring-offset-2' : 'border-gray-200'
      }`}
      style={{
        fontFamily: data.brandKit.fontBody,
        color: page.style?.textColor || data.brandKit.textColor,
        ...getPageBackgroundStyle(page.style, data.brandKit.backgroundColor)
      }}
    >
      {children}
      {isOverflowing && (
        <div className="absolute bottom-4 right-4 bg-red-50 text-red-700 px-3 py-1 text-[10px] font-bold rounded-lg border border-red-200 shadow-md no-print z-50 flex items-center gap-1.5 animate-pulse text-left">
          ⚠️ Content Page Overflow (exceeds A4 height)
        </div>
      )}
    </div>
  );
};

export const ProposalEditor: React.FC<ProposalEditorProps> = ({
  data,
  onChange,
  selectedBlock,
  onSelectBlock,
  onAddBlock,
  onRemoveBlock,
  onMoveBlock,
  onDuplicateBlock,
  onSelectPage,
  excludedPageIds = [],
  onMoveBlockToPage,
  onInsertBlockAtPosition
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateScale = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.getBoundingClientRect().width;
      if (width > 0) {
        // Page width is 210mm (~794px). We target 842px to include margins.
        const calculatedScale = Math.min(1, width / 842);
        setScale(calculatedScale);
      }
    };
    
    updateScale();
    const observer = new ResizeObserver(() => updateScale());
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  const [activeMenuPageId, setActiveMenuPageId] = useState<string | null>(null);
  const [activeMoveMenuBlockId, setActiveMoveMenuBlockId] = useState<string | null>(null);
  const [insertMenuState, setInsertMenuState] = useState<{
    pageId: string;
    relativeBlockId: string;
    position: 'above' | 'below';
  } | null>(null);

  const [dragState, setDragState] = useState<{
    blockId: string;
    edge: 'top' | 'bottom';
    startY: number;
    startPadding: number;
  } | null>(null);

  const handleUpdateBlockPadding = (blockId: string, edge: 'top' | 'bottom', value: number) => {
    const updatedPages = data.pages.map(page => ({
      ...page,
      blocks: page.blocks.map(block => {
        if (block.id === blockId) {
          return {
            ...block,
            [edge === 'top' ? 'paddingTop' : 'paddingBottom']: value
          };
        }
        return block;
      })
    }));
    onChange({ ...data, pages: updatedPages });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragState.startY;
      const newPadding = Math.max(0, Math.min(240, dragState.startPadding + deltaY));
      handleUpdateBlockPadding(dragState.blockId, dragState.edge, Math.round(newPadding));
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  // Direct editing of block fields
  const handleUpdateBlockField = (pageId: string, blockId: string, updatedFields: Partial<Block>) => {
    const updatedPages = data.pages.map(page => {
      if (page.id !== pageId) return page;
      const updatedBlocks = page.blocks.map(block => {
        if (block.id !== blockId) return block;
        return { ...block, ...updatedFields };
      });
      return { ...page, blocks: updatedBlocks };
    });
    onChange({ ...data, pages: updatedPages });
  };

  const handleUpdateMetadata = (pageId: string, blockId: string, updatedMeta: any) => {
    const page = data.pages.find(p => p.id === pageId);
    if (!page) return;
    const block = page.blocks.find(b => b.id === blockId);
    if (!block) return;
    handleUpdateBlockField(pageId, blockId, {
      metadata: { ...block.metadata, ...updatedMeta }
    });
  };

  // Add line item directly in editor
  const handleAddPricingItem = (pageId: string, blockId: string, items: any[]) => {
    const newItem = {
      id: `pi-${Math.random().toString(36).substr(2, 9)}`,
      name: "New Line Item",
      price: 500,
      qty: 1,
      optional: false,
      included: true
    };
    handleUpdateMetadata(pageId, blockId, { items: [...items, newItem] });
  };


  const renderInsertDropdownMenu = () => {
    if (!insertMenuState) return null;
    const { pageId, relativeBlockId, position } = insertMenuState;
    return (
      <div className="absolute top-7 bg-white border border-gray-250 rounded-2xl shadow-xl p-3 z-50 grid grid-cols-2 gap-1.5 w-80 text-left animate-fade-in no-print">
        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest col-span-2 pb-1 border-b border-gray-150 flex justify-between items-center">
          <span>Insert block {position}</span>
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); setInsertMenuState(null); }}
            className="text-[9px] text-gray-400 hover:text-black font-semibold underline cursor-pointer"
          >
            Close
          </button>
        </div>
        {[
          { type: 'heading', label: 'Heading Title', desc: 'H1, H2, or H3 section title' },
          { type: 'text', label: 'Text Paragraph', desc: 'Standard rich text details copy' },
          { type: 'heading-text', label: 'Heading & Paragraph', desc: 'Title and details combined' },
          { type: 'image', label: 'Image Block', desc: 'Dynamic showcase photo/illustration' },
          { type: 'video', label: 'Video Showcase', desc: 'MP4 player demo video embed' },
          { type: 'link', label: 'Link Card (CTA)', desc: 'Call to Action web redirect card' },
          { type: 'file', label: 'Attachment File', desc: 'Attachment download link pill' },
          { type: 'welcome', label: 'Executive Summary', desc: 'Introductory welcome block' },
          { type: 'about', label: 'About Us Team', desc: 'About company profile metadata' },
          { type: 'services', label: 'Services Scope', desc: 'Interactive scope & deliverables' },
          { type: 'timeline', label: 'Roadmap Timeline', desc: 'Milestones & duration steps' },
          { type: 'pricing', label: 'Pricing Table', desc: 'Columns toggle pricing list' },
          { type: 'payment-schedule', label: 'Payment Schedule', desc: 'Payment percentages list' },
          { type: 'testimonial', label: 'Testimonial Slider', desc: 'Client quotes showcase card' },
          { type: 'faq', label: 'FAQ Accordion', desc: 'Common queries and answers' },
          { type: 'terms', label: 'Terms & Conditions', desc: 'Legal and contract notes list' },
          { type: 'signature', label: 'Signature Acceptance', desc: 'Digital drawing sign board' }
        ].map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInsertBlockAtPosition?.(pageId, item.type, relativeBlockId, position);
              setInsertMenuState(null);
            }}
            className="flex flex-col p-1.5 rounded-lg border border-gray-50 hover:border-indigo-150 hover:bg-indigo-50/20 text-left transition-all cursor-pointer"
          >
            <span className="text-[10px] font-bold text-gray-800">{item.label}</span>
            <span className="text-[8px] text-gray-400 mt-0.5 line-clamp-1">{item.desc}</span>
          </button>
        ))}
      </div>
    );
  };

  // Render specific blocks inside the canvas
  const renderCanvasBlock = (pageId: string, block: Block) => {
    const isSelected = selectedBlock?.id === block.id;
    const spacingClass =
      data.brandKit.spacing === 'compact' ? 'my-2' : data.brandKit.spacing === 'spacious' ? 'my-10' : 'my-6';

    const borderRadiusClass =
      data.brandKit.borderRadius === 'sharp'
        ? 'rounded-none'
        : data.brandKit.borderRadius === 'medium'
        ? 'rounded-xl'
        : data.brandKit.borderRadius === 'pill'
        ? 'rounded-3xl'
        : 'rounded-lg';

    const headingStyle = { fontFamily: data.brandKit.fontHeading, color: data.brandKit.primaryColor };
    const bodyStyle = { fontFamily: data.brandKit.fontBody, color: data.brandKit.textColor };

    const defaultPaddingPx = data.brandKit.spacing === 'compact' ? 16 : data.brandKit.spacing === 'spacious' ? 48 : 32;
    const pTop = block.paddingTop !== undefined ? block.paddingTop : defaultPaddingPx;
    const pBottom = block.paddingBottom !== undefined ? block.paddingBottom : defaultPaddingPx;

    const customStyle: React.CSSProperties = {
      paddingTop: `${pTop}px`,
      paddingBottom: `${pBottom}px`,
      paddingLeft: `${defaultPaddingPx}px`,
      paddingRight: `${defaultPaddingPx}px`,
      marginTop: block.marginTop !== undefined ? `${block.marginTop}px` : undefined,
      marginBottom: block.marginBottom !== undefined ? `${block.marginBottom}px` : undefined,
      backgroundColor: block.backgroundColor || undefined,
      color: block.textColor || undefined,
      textAlign: block.textAlign || undefined,
      lineHeight: block.lineHeight || undefined,
      letterSpacing: block.letterSpacing || undefined,
      fontWeight: block.fontWeight || undefined,
      fontStyle: block.fontStyle || undefined
    };

    const wrapperClass = `group relative border transition-all ${spacingClass} ${borderRadiusClass} ${
      isSelected ? 'border-indigo-600 bg-indigo-50/10 ring-1 ring-indigo-100' : 'border-transparent hover:bg-gray-50/40 hover:border-gray-100'
    } ${block.conditional?.visibleTo === 'team-only' ? 'opacity-50 border-dashed border-gray-300 bg-gray-50' : ''}`;

    const renderInnerBlock = () => {
      switch (block.type) {
         case 'heading': {
          const Tag = block.layout === 'h1' ? 'h1' : block.layout === 'h3' ? 'h3' : 'h2';
          const sizeClass = Tag === 'h1' ? 'text-3xl' : Tag === 'h3' ? 'text-lg' : 'text-xl';
          return (
            <div className="w-full text-left">
              <Tag className={`${sizeClass} font-bold tracking-tight mb-2`} style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </Tag>
            </div>
          );
        }
        case 'heading-text': {
          const Tag = block.layout === 'h1' ? 'h1' : block.layout === 'h3' ? 'h3' : 'h2';
          const sizeClass = Tag === 'h1' ? 'text-3xl' : Tag === 'h3' ? 'text-lg' : 'text-xl';
          return (
            <div className="w-full text-left">
              <Tag className={`${sizeClass} font-bold tracking-tight mb-2`} style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </Tag>
              <div className="text-xs leading-relaxed mt-2" style={bodyStyle}>
                <EditableText
                  value={block.content || ''}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { content: val })}
                  multiline
                />
              </div>
            </div>
          );
        }
        case 'text':
          return (
            <div className="w-full text-left text-xs leading-relaxed" style={bodyStyle}>
              <EditableText
                value={block.content || ''}
                onChange={(val) => handleUpdateBlockField(pageId, block.id, { content: val })}
                multiline
              />
            </div>
          );
        case 'image':
          return (
            <div className="w-full flex flex-col gap-2 py-2 text-left">
              <img 
                src={block.metadata?.url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60'} 
                alt={block.title} 
                className="w-full rounded-xl object-cover max-h-96 shadow-sm border border-gray-100" 
              />
              <input
                type="text"
                value={block.metadata?.url || ''}
                onChange={(e) => {
                  const meta = { ...block.metadata, url: e.target.value };
                  handleUpdateBlockField(pageId, block.id, { metadata: meta });
                }}
                placeholder="Paste Image URL here..."
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[10px] w-full mt-1 focus:outline-none focus:ring-1 focus:ring-black no-print"
              />
              <div className="text-[10px] text-gray-400 mt-1 text-center italic">
                <EditableText
                  value={block.metadata?.caption || 'Image Caption'}
                  onChange={(val) => {
                    const meta = { ...block.metadata, caption: val };
                    handleUpdateBlockField(pageId, block.id, { metadata: meta });
                  }}
                />
              </div>
            </div>
          );
        case 'video':
          return (
            <div className="w-full flex flex-col gap-2 py-2 text-left">
              <video 
                src={block.metadata?.url || 'https://www.w3schools.com/html/mov_bbb.mp4'} 
                controls 
                className="w-full rounded-xl bg-black max-h-96 shadow-sm no-print" 
              />
              <div className="absolute w-0 h-0 opacity-0 overflow-hidden pointer-events-none print:relative print:w-full print:h-96 print:aspect-video print:opacity-100 print:pointer-events-auto print:bg-black print:rounded-xl print:shadow-sm print:block print:overflow-hidden text-center">
                <a 
                  href={sanitizeUrl(block.metadata?.url)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 text-white gap-2"
                  style={{
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                    textDecoration: 'none'
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border border-white/40 shadow-md">
                    <Play size={28} className="text-white fill-white ml-1" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-black/40 px-3 py-1 rounded-full text-white/90">
                    Click to Watch Video online
                  </span>
                  <span className="text-[8px] text-white/50 lowercase mt-1 block">
                    {block.metadata?.url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                  </span>
                </a>
              </div>
              <div className="flex flex-col gap-0.5 text-left mt-1.5 no-print">
                <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider font-semibold">Video Link / URL (MP4)</span>
                <input
                  type="text"
                  value={block.metadata?.url || ''}
                  onChange={(e) => {
                    const meta = { ...block.metadata, url: e.target.value };
                    handleUpdateBlockField(pageId, block.id, { metadata: meta });
                  }}
                  placeholder="Paste direct MP4 video link..."
                  className="px-2.5 py-1.5 border border-indigo-200 focus:border-black rounded-lg text-[9px] w-full focus:outline-none focus:ring-1 focus:ring-black bg-white text-indigo-900 font-medium"
                />
              </div>
              <div className="text-[10px] text-gray-400 mt-1 text-center italic">
                <EditableText
                  value={block.metadata?.caption || 'Video Caption'}
                  onChange={(val) => {
                    const meta = { ...block.metadata, caption: val };
                    handleUpdateBlockField(pageId, block.id, { metadata: meta });
                  }}
                />
              </div>
            </div>
          );
        case 'link':
          return (
            <div className="w-full flex flex-col items-center justify-center py-2 gap-2 text-center">
              <a 
                href={sanitizeUrl(block.metadata?.url)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-6 py-2.5 bg-black hover:bg-gray-850 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer animate-fade-in print:text-white print:no-underline"
                style={{ 
                  fontFamily: data.brandKit.fontBody,
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                  color: '#ffffff',
                  textDecoration: 'none'
                }}
              >
                <Link size={12} /> {block.metadata?.label || block.title || 'Open Link'}
              </a>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-3.5 no-print animate-fade-in">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Button Label</span>
                  <input
                    type="text"
                    value={block.metadata?.label || ''}
                    onChange={(e) => {
                      const meta = { ...block.metadata, label: e.target.value };
                      handleUpdateBlockField(pageId, block.id, { metadata: meta });
                    }}
                    placeholder="e.g. Open Portal"
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[9px] w-full focus:outline-none focus:ring-1 focus:ring-black bg-white"
                  />
                </div>
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider font-semibold">Redirect Link / URL</span>
                  <input
                    type="text"
                    value={block.metadata?.url || ''}
                    onChange={(e) => {
                      const meta = { ...block.metadata, url: e.target.value };
                      handleUpdateBlockField(pageId, block.id, { metadata: meta });
                    }}
                    placeholder="e.g. https://google.com"
                    className="px-2.5 py-1.5 border border-indigo-200 focus:border-black rounded-lg text-[9px] w-full focus:outline-none focus:ring-1 focus:ring-black bg-white text-indigo-900 font-medium"
                  />
                </div>
              </div>
            </div>
          );
        case 'file':
          return (
            <div className="w-full py-2 text-left animate-fade-in">
              <a 
                href={sanitizeUrl(block.metadata?.url)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl max-w-md mx-auto group cursor-pointer transition-all print:text-black print:no-underline"
                style={{ textDecoration: 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white border border-gray-100 rounded-lg text-indigo-500 shadow-sm">
                    <FileText size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900">{block.metadata?.name || 'attachment_file.pdf'}</p>
                    <span className="text-[9px] text-gray-400 block mt-0.5">{block.metadata?.size || '2.5 MB'} • File Attachment</span>
                  </div>
                </div>
                <Download size={14} className="text-gray-400 group-hover:text-black transition-colors" />
              </a>
              <div className="grid grid-cols-3 gap-2 w-full max-w-md mx-auto mt-3.5 no-print animate-fade-in">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">File Name</span>
                  <input
                    type="text"
                    value={block.metadata?.name || ''}
                    onChange={(e) => {
                      const meta = { ...block.metadata, name: e.target.value };
                      handleUpdateBlockField(pageId, block.id, { metadata: meta });
                    }}
                    placeholder="e.g. Specs_Sheet.pdf"
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[9px] w-full focus:outline-none focus:ring-1 focus:ring-black bg-white"
                  />
                </div>
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">File Size</span>
                  <input
                    type="text"
                    value={block.metadata?.size || ''}
                    onChange={(e) => {
                      const meta = { ...block.metadata, size: e.target.value };
                      handleUpdateBlockField(pageId, block.id, { metadata: meta });
                    }}
                    placeholder="e.g. 2.4 MB"
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[9px] w-full focus:outline-none focus:ring-1 focus:ring-black bg-white"
                  />
                </div>
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider font-semibold">Download Link / URL</span>
                  <input
                    type="text"
                    value={block.metadata?.url || ''}
                    onChange={(e) => {
                      const meta = { ...block.metadata, url: e.target.value };
                      handleUpdateBlockField(pageId, block.id, { metadata: meta });
                    }}
                    placeholder="Paste link/address..."
                    className="px-2.5 py-1.5 border border-indigo-200 focus:border-black rounded-lg text-[9px] w-full focus:outline-none focus:ring-1 focus:ring-black bg-white text-indigo-900 font-medium"
                  />
                </div>
                <p className="text-[8px] text-gray-400 col-span-3 text-center mt-2.5 leading-relaxed">
                  💡 <strong>How it works:</strong> Paste any shareable link (e.g. Google Drive, Dropbox, Notion, or your website URL) in the <strong>Download Link</strong> box. When clients view the portal or the exported PDF, clicking the download button will instantly open that file/link in their browser!
                </p>
              </div>
            </div>
          );
        case 'cover':
          return (
            <div className="min-h-[220mm] flex flex-col justify-center px-12 py-16 relative text-left">
              <div className="mb-12">
                <ImageUpload
                  value={data.logoUrl}
                  onChange={(url) => onChange({ ...data, logoUrl: url })}
                  width={120}
                />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6 block">
                <EditableText
                  value={data.companyName}
                  onChange={(val) => onChange({ ...data, companyName: val })}
                />
              </span>
              <div className="h-1.5 w-12 bg-black mb-8"></div>
              <h1 className="text-5xl font-bold tracking-tight mb-4 text-gray-900 leading-tight" style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </h1>
              <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-12">
                Prepared specifically for the strategic expansion of{' '}
                <EditableText
                  value={data.clientName}
                  onChange={(val) => onChange({ ...data, clientName: val })}
                  className="font-semibold text-gray-900 inline"
                />.
              </p>
              
              <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-8 mt-12 max-w-md">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-widest">Presented By</span>
                  <span className="text-xs font-semibold text-gray-800 block mt-1">{data.companyName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-widest">Date Issued</span>
                  <span className="text-xs font-semibold text-gray-800 block mt-1">{data.date}</span>
                </div>
              </div>
            </div>
          );

        case 'welcome':
          return (
            <div className="py-6 px-10 text-left">
              <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </h2>
              <EditableText
                value={block.content || ''}
                onChange={(val) => handleUpdateBlockField(pageId, block.id, { content: val })}
                className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap max-w-2xl"
                multiline
              />
            </div>
          );

        case 'about':
          return (
            <div className="py-6 px-10 text-left">
              <h2 className="text-3xl font-bold tracking-tight mb-4" style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </h2>
              <EditableText
                value={block.content || ''}
                onChange={(val) => handleUpdateBlockField(pageId, block.id, { content: val })}
                className="text-sm leading-relaxed text-gray-600 mb-8 max-w-2xl"
                multiline
              />
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Specialties</span>
                  <EditableText
                    value={block.metadata?.specialties || ''}
                    onChange={(val) => handleUpdateMetadata(pageId, block.id, { specialties: val })}
                    className="text-xs text-gray-600 mt-2 font-medium leading-relaxed"
                    multiline
                  />
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Industries</span>
                  <EditableText
                    value={block.metadata?.industries || ''}
                    onChange={(val) => handleUpdateMetadata(pageId, block.id, { industries: val })}
                    className="text-xs text-gray-600 mt-2 font-medium leading-relaxed"
                    multiline
                  />
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Our Approach</span>
                  <EditableText
                    value={block.metadata?.approach || ''}
                    onChange={(val) => handleUpdateMetadata(pageId, block.id, { approach: val })}
                    className="text-xs text-gray-600 mt-2 font-medium leading-relaxed"
                    multiline
                  />
                </div>
              </div>
            </div>
          );

        case 'services':
          const servicesList = block.metadata?.services || [];
          return (
            <div className="py-6 px-10 text-left">
              <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </h2>
              <EditableText
                value={block.subtitle || ''}
                onChange={(val) => handleUpdateBlockField(pageId, block.id, { subtitle: val })}
                className="text-xs text-gray-400 font-medium mb-8"
              />
              <div className="grid grid-cols-2 gap-6">
                {servicesList.map((service: any, index: number) => (
                  <div key={service.id} className="p-6 border border-gray-100 bg-white rounded-2xl shadow-sm flex flex-col justify-between relative group/service">
                    <button
                      onClick={() => handleUpdateMetadata(pageId, block.id, {
                        services: servicesList.filter((s: any) => s.id !== service.id)
                      })}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 rounded p-1 opacity-0 group-hover/service:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => {
                          const updated = [...servicesList];
                          updated[index] = { ...service, name: e.target.value };
                          handleUpdateMetadata(pageId, block.id, { services: updated });
                        }}
                        className="font-bold text-sm text-gray-900 mb-2 focus:outline-none w-full border-none p-0"
                      />
                      <textarea
                        value={service.description}
                        onChange={(e) => {
                          const updated = [...servicesList];
                          updated[index] = { ...service, description: e.target.value };
                          handleUpdateMetadata(pageId, block.id, { services: updated });
                        }}
                        className="text-xs text-gray-500 leading-relaxed mb-6 focus:outline-none w-full border-none p-0 resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="border-t border-gray-50 pt-4 flex justify-between items-start text-[10px] font-semibold text-gray-400">
                      <div className="flex-1 mr-4">
                        <span className="block text-[8px] uppercase tracking-wider text-gray-300">Deliverables</span>
                        <textarea
                          value={service.deliverables}
                          onChange={(e) => {
                            const updated = [...servicesList];
                            updated[index] = { ...service, deliverables: e.target.value };
                            handleUpdateMetadata(pageId, block.id, { services: updated });
                          }}
                          rows={2}
                          className="text-gray-600 focus:outline-none border-none p-0 bg-transparent w-full text-[10px] font-semibold resize-none leading-tight"
                        />
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] uppercase tracking-wider text-gray-300">Investment</span>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => {
                            const updated = [...servicesList];
                            updated[index] = { ...service, price: parseFloat(e.target.value) || 0 };
                            handleUpdateMetadata(pageId, block.id, { services: updated });
                          }}
                          className="text-black font-bold focus:outline-none border-none p-0 bg-transparent text-right w-14"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const newService = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: "New Service Element",
                    description: "Describe the scope of design or technology integration here.",
                    deliverables: "Codebase, Vector files",
                    revisions: "Unlimited revisions",
                    price: 2500
                  };
                  handleUpdateMetadata(pageId, block.id, { services: [...servicesList, newService] });
                }}
                className="mt-6 w-full py-3 border border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 text-xs font-semibold flex items-center justify-center gap-1 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <Plus size={14} /> Add Service Card
              </button>
            </div>
          );

        case 'timeline':
          const blockAccent = block.accentColor || data.brandKit.accentColor || '#6366f1';
          return (
            <div className="py-6 px-10 text-left">
              <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </h2>
              <EditableText
                value={block.subtitle || ''}
                onChange={(val) => handleUpdateBlockField(pageId, block.id, { subtitle: val })}
                className="text-xs text-gray-400 font-medium mb-8"
              />
              <div className="relative pl-6 ml-2 space-y-6">
                {/* Vertical Accent Timeline Line */}
                <div className="absolute left-0 top-2 bottom-2 w-0.5" style={{ backgroundColor: blockAccent, opacity: 0.2 }} />
                {(block.metadata?.steps || []).map((step: any, idx: number) => (
                  <div key={idx} className="relative">
                    <span 
                      className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm shrink-0" 
                      style={{ backgroundColor: blockAccent }}
                    />
                    <div className="flex items-center gap-3">
                      <h4 className="text-xs font-bold text-gray-900">
                        <EditableText
                          value={step.title}
                          onChange={(val) => {
                            const steps = [...(block.metadata?.steps || [])];
                            steps[idx] = { ...step, title: val };
                            handleUpdateMetadata(pageId, block.id, { steps });
                          }}
                        />
                      </h4>
                      <span 
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: blockAccent, backgroundColor: blockAccent.startsWith('#') ? blockAccent + '15' : blockAccent }}
                      >
                        <EditableText
                          value={step.duration}
                          onChange={(val) => {
                            const steps = [...(block.metadata?.steps || [])];
                            steps[idx] = { ...step, duration: val };
                            handleUpdateMetadata(pageId, block.id, { steps });
                          }}
                        />
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                      <EditableText
                        value={step.details}
                        onChange={(val) => {
                          const steps = [...(block.metadata?.steps || [])];
                          steps[idx] = { ...step, details: val };
                          handleUpdateMetadata(pageId, block.id, { steps });
                        }}
                        multiline
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

        case 'pricing':
          const currency = block.metadata?.currency || '₹';
          const items = block.metadata?.items || [];
          const colVis = block.metadata?.columnVisibility || { price: true, qty: true, total: true };
          
          const subtotal = items.filter((i: any) => i.included).reduce((sum: number, item: any) => sum + (item.price * (item.qty || 1)), 0);
          const discountVal = (subtotal * (block.metadata?.discount || 0)) / 100;
          const taxVal = ((subtotal - discountVal) * (block.metadata?.taxRate || 0)) / 100;
          const total = subtotal - discountVal + taxVal;

          return (
            <div className="py-6 px-10 text-left flex flex-col justify-between min-h-[140mm]">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>
                      <EditableText
                        value={block.title}
                        onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                      />
                    </h2>
                    <EditableText
                      value={block.subtitle || ''}
                      onChange={(val) => handleUpdateBlockField(pageId, block.id, { subtitle: val })}
                      className="text-xs text-gray-400 font-medium"
                    />
                  </div>
                  
                  {/* Currency selector */}
                  <div className="flex items-center gap-1.5 no-print">
                    <span className="text-[9px] font-bold uppercase text-gray-400">Currency:</span>
                    <select
                      value={currency}
                      onChange={(e) => handleUpdateMetadata(pageId, block.id, { currency: e.target.value })}
                      className="bg-white border border-gray-200 rounded-lg text-[10px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer font-medium text-gray-700"
                    >
                      <option value="₹">INR (₹)</option>
                      <option value="$">USD ($)</option>
                      <option value="€">EUR (€)</option>
                      <option value="£">GBP (£)</option>
                      <option value="¥">JPY (¥)</option>
                    </select>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="px-5 py-3">Description</th>
                        {colVis.price !== false && <th className="px-5 py-3 text-right">Price</th>}
                        {colVis.qty !== false && <th className="px-5 py-3 text-center">Qty</th>}
                        {colVis.total !== false && <th className="px-5 py-3 text-right">Total</th>}
                        <th className="px-5 py-3 text-center no-print w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-600">
                      {items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-5 py-2 font-medium text-gray-900">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const updated = items.map((i: any) => i.id === item.id ? { ...i, name: e.target.value } : i);
                                handleUpdateMetadata(pageId, block.id, { items: updated });
                              }}
                              className="w-full bg-transparent border-none p-0 focus:ring-0 font-medium text-gray-900 text-xs focus:outline-none"
                              placeholder="Line item description"
                            />
                          </td>
                          {colVis.price !== false && (
                            <td className="px-5 py-2 text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                <span className="text-gray-400 text-[10px]">{currency}</span>
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = items.map((i: any) => i.id === item.id ? { ...i, price: val } : i);
                                    handleUpdateMetadata(pageId, block.id, { items: updated });
                                  }}
                                  className="bg-transparent border-none p-0 focus:ring-0 text-right w-16 text-xs focus:outline-none font-medium text-gray-700"
                                />
                              </div>
                            </td>
                          )}
                          {colVis.qty !== false && (
                            <td className="px-5 py-2 text-center">
                              <input
                                type="number"
                                value={item.qty || 1}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  const updated = items.map((i: any) => i.id === item.id ? { ...i, qty: val } : i);
                                  handleUpdateMetadata(pageId, block.id, { items: updated });
                                }}
                                className="bg-transparent border-none p-0 focus:ring-0 text-center w-10 text-xs focus:outline-none font-medium text-gray-700"
                              />
                            </td>
                          )}
                          {colVis.total !== false && (
                            <td className="px-5 py-2 text-right text-black font-semibold">
                              {currency}{(item.price * (item.qty || 1))?.toLocaleString()}
                            </td>
                          )}
                          <td className="px-5 py-2 text-center no-print">
                            <button
                              onClick={() => {
                                const updated = items.filter((i: any) => i.id !== item.id);
                                handleUpdateMetadata(pageId, block.id, { items: updated });
                              }}
                              className="text-gray-300 hover:text-red-500 rounded p-1 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() => handleAddPricingItem(pageId, block.id, items)}
                  className="mt-4 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors cursor-pointer"
                >
                  + Add Line Item
                </button>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-64 bg-gray-50 p-4 border border-gray-100 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-semibold">{currency}{subtotal?.toLocaleString()}</span>
                  </div>
                  {block.metadata?.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({block.metadata.discount}%)</span>
                      <span className="font-semibold">-{currency}{discountVal?.toLocaleString()}</span>
                    </div>
                  )}
                  {block.metadata?.taxRate > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Tax/GST ({block.metadata.taxRate}%)</span>
                      <span className="font-semibold">+{currency}{taxVal?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
                    <span>Total Due</span>
                    <span>{currency}{total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'payment-schedule':
          return (
            <div className="py-6 px-10 text-left">
              <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </h2>
              <div className="space-y-4">
                {(block.metadata?.milestones || []).map((m: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900">
                        <EditableText
                          value={m.name}
                          onChange={(val) => {
                            const milestones = [...(block.metadata?.milestones || [])];
                            milestones[idx] = { ...m, name: val };
                            handleUpdateMetadata(pageId, block.id, { milestones });
                          }}
                        />
                      </h4>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        <EditableText
                          value={m.trigger}
                          onChange={(val) => {
                            const milestones = [...(block.metadata?.milestones || [])];
                            milestones[idx] = { ...m, trigger: val };
                            handleUpdateMetadata(pageId, block.id, { milestones });
                          }}
                        />
                      </span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-0.5">
                      <input
                        type="number"
                        value={m.percentage}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          const milestones = [...(block.metadata?.milestones || [])];
                          milestones[idx] = { ...m, percentage: val };
                          handleUpdateMetadata(pageId, block.id, { milestones });
                        }}
                        className="w-8 text-right bg-transparent border-none p-0 focus:ring-0 focus:outline-none font-bold text-xs"
                      />
                      <span>% Due</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );

        case 'testimonial':
          return (
            <div className="py-6 px-10 text-left">
              <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {(block.metadata?.testimonials || []).map((t: any, idx: number) => (
                  <div key={idx} className="p-5 border border-gray-100 bg-gray-50/50 rounded-2xl relative">
                    <p className="text-xs text-gray-600 italic leading-relaxed mb-4">
                      <EditableText
                        value={t.quote}
                        onChange={(val) => {
                          const testimonials = [...(block.metadata?.testimonials || [])];
                          testimonials[idx] = { ...t, quote: val };
                          handleUpdateMetadata(pageId, block.id, { testimonials });
                        }}
                        multiline
                      />
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-xs shrink-0 text-indigo-700">
                        {t.author.charAt(0)}
                      </span>
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-800">
                          <EditableText
                            value={t.author}
                            onChange={(val) => {
                              const testimonials = [...(block.metadata?.testimonials || [])];
                              testimonials[idx] = { ...t, author: val };
                              handleUpdateMetadata(pageId, block.id, { testimonials });
                            }}
                          />
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

        case 'faq':
          return (
            <div className="py-6 px-10 text-left">
              <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {(block.metadata?.faqs || []).map((faq: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-900">
                      <EditableText
                        value={faq.question}
                        onChange={(val) => {
                          const faqs = [...(block.metadata?.faqs || [])];
                          faqs[idx] = { ...faq, question: val };
                          handleUpdateMetadata(pageId, block.id, { faqs });
                        }}
                      />
                    </h4>
                    <div className="text-xs text-gray-500 leading-relaxed">
                      <EditableText
                        value={faq.answer}
                        onChange={(val) => {
                          const faqs = [...(block.metadata?.faqs || [])];
                          faqs[idx] = { ...faq, answer: val };
                          handleUpdateMetadata(pageId, block.id, { faqs });
                        }}
                        multiline
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

        case 'terms':
          return (
            <div className="py-6 px-10 text-left">
              <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>
                <EditableText
                  value={block.title}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                />
              </h2>
              <EditableList
                items={block.listItems || []}
                onChange={(val) => handleUpdateBlockField(pageId, block.id, { listItems: val })}
                itemClassName="text-xs text-gray-600 leading-relaxed"
              />
            </div>
          );

        case 'signature':
          return (
            <div className="py-6 px-10 text-left min-h-[140mm] flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>
                  <EditableText
                    value={block.title}
                    onChange={(val) => handleUpdateBlockField(pageId, block.id, { title: val })}
                  />
                </h2>
                <EditableText
                  value={block.subtitle || ''}
                  onChange={(val) => handleUpdateBlockField(pageId, block.id, { subtitle: val })}
                  className="text-xs text-gray-400 font-medium mb-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-12 mt-12 border-t border-gray-100 pt-12">
                <div className="flex flex-col justify-end text-center">
                  <div className="h-16 border-b border-gray-200 flex items-center justify-center">
                    {data.signatures?.designerSignature ? (
                      <span className="text-xs font-bold text-indigo-700 italic" style={{ fontFamily: 'Caveat, cursive' }}>
                        {data.signatures?.designerSignedName}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Signature Pending</span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider block mt-2">Prepared By Signature</span>
                </div>
                <div className="flex flex-col justify-end text-center">
                  <div className="h-16 border-b border-gray-200 flex items-center justify-center">
                    {data.signatures?.clientSignature ? (
                      <span className="text-xs font-bold text-indigo-700 italic" style={{ fontFamily: 'Caveat, cursive' }}>
                        {data.signatures?.clientSignedName}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Awaiting Client Signature</span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider block mt-2">Client Signature</span>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    const startDrag = (e: React.MouseEvent, blockId: string, edge: 'top' | 'bottom', currentPadding: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState({
        blockId,
        edge,
        startY: e.clientY,
        startPadding: currentPadding
      });
    };

    return (
      <div key={block.id} className="relative group/block-wrapper w-full">
        {/* Top hover insert point */}
        <div className="absolute -top-3.5 left-0 right-0 h-7 flex items-center justify-center opacity-0 group-hover/block-wrapper:opacity-100 focus-within:opacity-100 transition-all z-40 no-print">
          <div className="w-full border-t border-dashed border-indigo-250 absolute inset-0 my-auto"></div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInsertMenuState({ pageId, relativeBlockId: block.id, position: 'above' });
            }}
            className="relative z-50 px-2.5 py-1 bg-white border border-indigo-250 hover:border-indigo-400 rounded-full shadow-sm text-[8px] font-bold uppercase tracking-wider text-indigo-650 hover:text-indigo-850 flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
          >
            <Plus size={8} /> Add Block Above
          </button>

          {insertMenuState?.relativeBlockId === block.id && insertMenuState.position === 'above' && (
            renderInsertDropdownMenu()
          )}
        </div>

        {/* Bottom hover insert point */}
        <div className="absolute -bottom-3.5 left-0 right-0 h-7 flex items-center justify-center opacity-0 group-hover/block-wrapper:opacity-100 focus-within:opacity-100 transition-all z-40 no-print">
          <div className="w-full border-t border-dashed border-indigo-250 absolute inset-0 my-auto"></div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInsertMenuState({ pageId, relativeBlockId: block.id, position: 'below' });
            }}
            className="relative z-50 px-2.5 py-1 bg-white border border-indigo-250 hover:border-indigo-400 rounded-full shadow-sm text-[8px] font-bold uppercase tracking-wider text-indigo-650 hover:text-indigo-850 flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
          >
            <Plus size={8} /> Add Block Below
          </button>

          {insertMenuState?.relativeBlockId === block.id && insertMenuState.position === 'below' && (
            renderInsertDropdownMenu()
          )}
        </div>

        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectBlock(block);
          }}
          className={wrapperClass}
          style={customStyle}
        >
        {/* Top Padding Drag Handle */}
        {isSelected && (
          <div 
            className="absolute top-0 left-0 right-0 h-3 cursor-row-resize z-40 flex items-center justify-center group/handle no-print select-none bg-indigo-500/0 hover:bg-indigo-500/10 transition-colors"
            onMouseDown={(e) => startDrag(e, block.id, 'top', pTop)}
          >
            <div className="w-12 h-1 bg-indigo-500 rounded-full opacity-30 group-hover/handle:opacity-100 transition-opacity" />
            {dragState?.blockId === block.id && dragState?.edge === 'top' && (
              <div className="absolute top-4 bg-indigo-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-50 animate-fade-in">
                {pTop}px
              </div>
            )}
          </div>
        )}

        {/* Bottom Padding Drag Handle */}
        {isSelected && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-3 cursor-row-resize z-40 flex items-center justify-center group/handle no-print select-none bg-indigo-500/0 hover:bg-indigo-500/10 transition-colors"
            onMouseDown={(e) => startDrag(e, block.id, 'bottom', pBottom)}
          >
            <div className="w-12 h-1 bg-indigo-500 rounded-full opacity-30 group-hover/handle:opacity-100 transition-opacity" />
            {dragState?.blockId === block.id && dragState?.edge === 'bottom' && (
              <div className="absolute bottom-4 bg-indigo-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-50 animate-fade-in">
                {pBottom}px
              </div>
            )}
          </div>
        )}
        {/* Floating Actions overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1 shadow-md z-30 no-print transition-all">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveBlock(block.id, 'up');
            }}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black rounded-lg transition-colors cursor-pointer"
            title="Move Block Up"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveBlock(block.id, 'down');
            }}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black rounded-lg transition-colors cursor-pointer"
            title="Move Block Down"
          >
            <ArrowDown size={13} />
          </button>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMoveMenuBlockId(activeMoveMenuBlockId === block.id ? null : block.id);
              }}
              className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer relative ${
                activeMoveMenuBlockId === block.id ? 'bg-indigo-50 text-indigo-650' : 'text-gray-400 hover:text-black'
              }`}
              title="Move to another page"
            >
              <Move size={13} />
            </button>
            {activeMoveMenuBlockId === block.id && (
              <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1 w-48 animate-fade-in text-left">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2.5 py-1.5 border-b border-gray-50">Move to Page</div>
                {data.pages.map((p, idx) => {
                  const isCurrent = p.id === pageId;
                  return (
                    <button
                      key={p.id}
                      disabled={isCurrent}
                      onClick={(evt) => {
                        evt.stopPropagation();
                        onMoveBlockToPage(pageId, block.id, p.id);
                        setActiveMoveMenuBlockId(null);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer truncate ${
                        isCurrent 
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                          : 'hover:bg-indigo-50 hover:text-indigo-650 text-gray-700'
                      }`}
                    >
                      Page {idx + 1}: {p.title || 'Untitled Page'}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateBlock(pageId, block);
            }}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black rounded-lg transition-colors cursor-pointer"
            title="Duplicate Block"
          >
            <Copy size={13} />
          </button>
          <div className="h-4 w-px bg-gray-100 mx-0.5"></div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveBlock(pageId, block.id);
            }}
            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
            title="Delete Block"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Render Inner specific fields */}
        {renderInnerBlock()}

        {block.conditional?.visibleTo !== 'all' && (
          <div className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm select-none pointer-events-none no-print">
            <Layers size={9} />
            {block.conditional.visibleTo} Visibility
          </div>
        )}
      </div>
    </div>
  );
};

  return (
    <VariablesContext.Provider value={data.variables || []}>
      <div 
        ref={containerRef}
        className="w-full bg-transparent flex flex-col gap-8 items-center print:gap-0 select-none"
      >
        {data.pages.map((page) => {
          const isExcluded = excludedPageIds.includes(page.id);
          return (
            <React.Fragment key={page.id}>
              <div 
                id={page.id}
                className={`page-wrapper ${isExcluded ? 'exclude-from-print' : ''}`}
                style={{ '--page-scale': scale } as React.CSSProperties}
              >
                <PageCard page={page} data={data} onSelectPage={onSelectPage}>
                  {page.blocks.length === 0 ? (
                    <div className="h-[270mm] flex flex-col items-center justify-center p-8 select-none bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-150 m-4">
                      <div className="text-center max-w-sm mb-8">
                        <h4 className="text-sm font-bold text-gray-900 tracking-tight">Design this page</h4>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Click any layout block below to build this page. You can add more blocks, drag them around, or customize colors.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                        {[
                          { type: 'welcome', label: 'Executive Summary', desc: 'Welcome intro letter', icon: <FileText size={16} className="text-indigo-500" /> },
                          { type: 'heading-text', label: 'Heading & Paragraph', desc: 'Title & details section', icon: <Type size={16} className="text-violet-500" /> },
                          { type: 'services', label: 'Services Scope', desc: 'Detail deliverables', icon: <ExternalLink size={16} className="text-emerald-500" /> },
                          { type: 'pricing', label: 'Pricing Table', desc: 'Tiers, rates, or flat fees', icon: <Layers size={16} className="text-purple-500" /> },
                          { type: 'timeline', label: 'Roadmap Timeline', desc: 'Project milestones', icon: <Play size={16} className="text-sky-500" /> },
                          { type: 'testimonial', label: 'Testimonials', desc: 'Client quotes & reviews', icon: <MessageSquare size={16} className="text-amber-500" /> },
                          { type: 'signature', label: 'Signatures block', desc: 'Sign-offs & dates', icon: <Download size={16} className="text-rose-500" /> },
                          { type: 'text', label: 'Plain Paragraph', desc: 'Standard text block copy', icon: <FileText size={16} className="text-gray-400" /> }
                        ].map(item => (
                          <button
                            key={item.type}
                            onClick={() => onAddBlock(page.id, item.type)}
                            className="flex items-start gap-3 p-3 bg-white hover:bg-indigo-50/45 border border-gray-200 hover:border-indigo-200 rounded-xl shadow-sm text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
                          >
                            <div className="p-2 bg-gray-50 group-hover:bg-white rounded-lg border border-gray-100 shrink-0 transition-colors">
                              {item.icon}
                            </div>
                            <div className="overflow-hidden">
                              <h5 className="text-xs font-bold text-gray-800 tracking-tight">{item.label}</h5>
                              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{item.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Dropdown helper */}
                      <p className="text-[10px] text-gray-400 font-medium mt-8 flex items-center gap-1">
                        <Plus size={10} className="text-indigo-400 animate-pulse" /> More templates (FAQs, payment schedules) can be added via page margins.
                      </p>
                    </div>
                  ) : (
                    page.blocks.map((block) => renderCanvasBlock(page.id, block))
                  )}
                </PageCard>
              </div>

              {/* Action insert menu between/under A4 pages */}
              <div 
                className="relative h-8 group/insert flex items-center justify-center no-print transition-all"
                style={{ width: `calc(210mm * ${scale})` }}
              >
                <div className="w-full border-t border-dashed border-gray-200 group-hover/insert:border-indigo-300 absolute inset-0 my-auto"></div>
                
                <div className="relative z-10">
                  <button
                    onClick={() => setActiveMenuPageId(activeMenuPageId === page.id ? null : page.id)}
                    className="px-4 py-1 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-full shadow-sm text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus size={10} /> Insert Page Block
                  </button>

                  {activeMenuPageId === page.id && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-50 grid grid-cols-2 gap-1.5 w-80 animate-fade-in text-left">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest col-span-2 pb-1 border-b border-gray-50">Select block type</div>
                      {[
                        { type: 'welcome', label: 'Executive Summary' },
                        { type: 'about', label: 'About Us' },
                        { type: 'services', label: 'Services scope' },
                        { type: 'timeline', label: 'Roadmap Timeline' },
                        { type: 'pricing', label: 'Pricing Table' },
                        { type: 'payment-schedule', label: 'Payment Milestones' },
                        { type: 'testimonial', label: 'Testimonials' },
                        { type: 'faq', label: 'FAQ Block' },
                        { type: 'terms', label: 'Terms & legal' },
                        { type: 'signature', label: 'Signatures block' }
                      ].map((item) => (
                        <button
                          key={item.type}
                          onClick={() => {
                            onAddBlock(page.id, item.type);
                            setActiveMenuPageId(null);
                          }}
                          className="px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-semibold text-gray-700 text-left transition-colors cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </VariablesContext.Provider>
  );
};
