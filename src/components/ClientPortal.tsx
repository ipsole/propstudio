import React, { useState, useEffect, useRef } from 'react';
import { ProposalData, Block, Page, resolveVariables, loadGoogleFont, sanitizeUrl, getPageBackgroundStyle } from '../types';
import { SignaturePad } from './SignaturePad';
import { CommentSystem } from './CommentSystem';
import { MarkdownRenderer } from './EditableText';
import { Eye, Download, MessageSquare, CheckCircle, ShieldAlert, ArrowLeft, Link, FileText, Play } from 'lucide-react';

interface ClientPortalProps {
  data: ProposalData;
  onChange: (newData: ProposalData) => void;
  onPrint: () => void;
  excludedPageIds?: string[];
  onBackToEditor?: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({ 
  data: rawData, 
  onChange, 
  onPrint,
  excludedPageIds = [],
  onBackToEditor
}) => {
  useEffect(() => {
    if (rawData.brandKit?.fontHeading) {
      loadGoogleFont(rawData.brandKit.fontHeading);
    }
    if (rawData.brandKit?.fontBody) {
      loadGoogleFont(rawData.brandKit.fontBody);
    }
  }, [rawData.brandKit?.fontHeading, rawData.brandKit?.fontBody]);

  const resolve = (val: string) => {
    if (!val || typeof val !== 'string') return val;
    return resolveVariables(val, rawData.variables || []);
  };

  const resolvedPages: Page[] = rawData.pages.map(page => ({
    ...page,
    title: resolve(page.title),
    blocks: page.blocks.map(block => {
      const resolvedMetadata = block.metadata ? JSON.parse(JSON.stringify(block.metadata)) : {};
      if (resolvedMetadata) {
        if (typeof resolvedMetadata.specialties === 'string') resolvedMetadata.specialties = resolve(resolvedMetadata.specialties);
        if (typeof resolvedMetadata.industries === 'string') resolvedMetadata.industries = resolve(resolvedMetadata.industries);
        if (typeof resolvedMetadata.approach === 'string') resolvedMetadata.approach = resolve(resolvedMetadata.approach);
        
        if (Array.isArray(resolvedMetadata.services)) {
          resolvedMetadata.services = resolvedMetadata.services.map((s: any) => ({
            ...s,
            name: resolve(s.name),
            description: resolve(s.description),
            deliverables: resolve(s.deliverables)
          }));
        }
        
        if (Array.isArray(resolvedMetadata.steps)) {
          resolvedMetadata.steps = resolvedMetadata.steps.map((step: any) => ({
            ...step,
            title: resolve(step.title),
            details: resolve(step.details),
            duration: resolve(step.duration)
          }));
        }
        
        if (Array.isArray(resolvedMetadata.items)) {
          resolvedMetadata.items = resolvedMetadata.items.map((item: any) => ({
            ...item,
            name: resolve(item.name)
          }));
        }
        
        if (Array.isArray(resolvedMetadata.milestones)) {
          resolvedMetadata.milestones = resolvedMetadata.milestones.map((m: any) => ({
            ...m,
            name: resolve(m.name),
            trigger: resolve(m.trigger)
          }));
        }
        
        if (Array.isArray(resolvedMetadata.testimonials)) {
          resolvedMetadata.testimonials = resolvedMetadata.testimonials.map((t: any) => ({
            ...t,
            quote: resolve(t.quote),
            author: resolve(t.author)
          }));
        }
        
        if (Array.isArray(resolvedMetadata.faqs)) {
          resolvedMetadata.faqs = resolvedMetadata.faqs.map((f: any) => ({
            ...f,
            question: resolve(f.question),
            answer: resolve(f.answer)
          }));
        }
      }

      return {
        ...block,
        title: resolve(block.title),
        subtitle: block.subtitle ? resolve(block.subtitle) : block.subtitle,
        content: block.content ? resolve(block.content) : block.content,
        listItems: block.listItems ? block.listItems.map(item => resolve(item)) : block.listItems,
        metadata: resolvedMetadata
      };
    })
  }));

  const data: ProposalData = {
    ...rawData,
    projectName: resolve(rawData.projectName),
    companyName: resolve(rawData.companyName),
    clientName: resolve(rawData.clientName),
    pages: resolvedPages
  };

  const [isSignPadOpen, setIsSignPadOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activePageId, setActivePageId] = useState(data.pages[0]?.id || '');

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateScale = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.getBoundingClientRect().width;
      if (width > 0) {
        // Page width is 210mm (~794px). Target 842px to include margins.
        const calculatedScale = Math.min(1, width / 842);
        setScale(calculatedScale);
      }
    };
    
    updateScale();
    const observer = new ResizeObserver(() => updateScale());
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Toggle client inclusion for optional pricing items
  const handleToggleOptionalItem = (blockId: string, itemId: string, checked: boolean) => {
    const updatedPages = rawData.pages.map(page => {
      const updatedBlocks = page.blocks.map(block => {
        if (block.id === blockId && block.type === 'pricing') {
          const items = (block.metadata?.items || []).map((item: any) => {
            if (item.id === itemId) {
              return { ...item, included: checked };
            }
            return item;
          });
          return { ...block, metadata: { ...block.metadata, items } };
        }
        return block;
      });
      return { ...page, blocks: updatedBlocks };
    });
    onChange({ ...rawData, pages: updatedPages });
  };

  const handleApplySignature = (sigData: string, signerName: string) => {
    const randomIp = `162.24.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    
    onChange({
      ...rawData,
      status: 'signed',
      signatures: {
        ...rawData.signatures,
        clientSignature: sigData,
        clientSignedName: signerName,
        clientSignedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        clientSignedIp: randomIp,
        designerSignature: "simulated-designer-sig",
        designerSignedName: rawData.companyName + " representative",
        designerSignedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      }
    });
    setIsSignPadOpen(false);
  };

  // Add Comment from Client
  const handleAddComment = (pageId: string, author: string, text: string) => {
    const newComment = {
      id: `comment-${Math.random().toString(36).substr(2, 9)}`,
      pageId,
      author,
      text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      resolved: false
    };
    onChange({ ...rawData, comments: [...(rawData.comments || []), newComment] });
  };

  const handleResolveComment = (commentId: string) => {
    const updated = (rawData.comments || []).map(c => c.id === commentId ? { ...c, resolved: true } : c);
    onChange({ ...rawData, comments: updated });
  };

  const handleDeleteComment = (commentId: string) => {
    onChange({ ...rawData, comments: (rawData.comments || []).filter(c => c.id !== commentId) });
  };

  // Block renders for Client View
  const renderClientBlock = (block: Block) => {
    if (block.conditional?.visibleTo === 'team-only') return null;

    const headingStyle = { fontFamily: data.brandKit.fontHeading, color: data.brandKit.primaryColor };
    const bodyStyle = { fontFamily: data.brandKit.fontBody, color: data.brandKit.textColor };

    switch (block.type) {
      case 'heading': {
        const Tag = block.layout === 'h1' ? 'h1' : block.layout === 'h3' ? 'h3' : 'h2';
        const sizeClass = Tag === 'h1' ? 'text-3xl' : Tag === 'h3' ? 'text-lg' : 'text-xl';
        return (
          <div className="w-full text-left">
            <Tag className={`${sizeClass} font-bold tracking-tight mb-2`} style={headingStyle}>
              {block.title}
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
              {block.title}
            </Tag>
            <div className="text-xs leading-relaxed mt-2 whitespace-pre-wrap" style={bodyStyle}>
              <MarkdownRenderer content={block.content || ''} variables={data.variables || []} />
            </div>
          </div>
        );
      }
      case 'text':
        return (
          <div className="w-full text-left text-xs leading-relaxed whitespace-pre-wrap" style={bodyStyle}>
            <MarkdownRenderer content={block.content || ''} variables={data.variables || []} />
          </div>
        );
      case 'image':
        return (
          <div className="w-full flex flex-col gap-1 py-2 text-left">
            <img 
              src={block.metadata?.url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60'} 
              alt={block.title} 
              className="w-full rounded-xl object-cover max-h-96 shadow-sm border border-gray-100" 
            />
            {block.metadata?.caption && (
              <p className="text-[10px] text-gray-400 mt-1 text-center italic">{block.metadata.caption}</p>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="w-full flex flex-col gap-1 py-2 text-left">
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
            {block.metadata?.caption && (
              <p className="text-[10px] text-gray-400 mt-1 text-center italic">{block.metadata.caption}</p>
            )}
          </div>
        );
      case 'link':
        return (
          <div className="w-full flex flex-col items-center justify-center py-2 gap-1 text-center">
            <a 
              href={sanitizeUrl(block.metadata?.url)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-6 py-2.5 bg-black hover:bg-gray-850 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer print:text-white print:no-underline"
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
          </div>
        );
      case 'file':
        return (
          <div className="w-full py-2 text-left">
            <a 
              href={block.metadata?.url || '#'} 
              download 
              className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl max-w-md mx-auto group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white border border-gray-100 rounded-lg text-indigo-500 shadow-sm">
                  <FileText size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-950 group-hover:text-indigo-600 transition-colors">{block.metadata?.name || 'attachment_file.pdf'}</p>
                  <span className="text-[9px] text-gray-400 block mt-0.5">{block.metadata?.size || '2.5 MB'} • File Attachment</span>
                </div>
              </div>
              <Download size={14} className="text-gray-450 group-hover:text-black transition-colors" />
            </a>
          </div>
        );
      case 'cover':
        return (
          <div className="min-h-[220mm] flex flex-col justify-center px-12 py-16 relative text-left">
            {data.logoUrl && (
              <img src={data.logoUrl} alt="Logo" className="max-h-24 w-max object-contain mb-12" />
            )}
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6 block">{data.companyName}</span>
            <div className="h-1.5 w-12 bg-black mb-8"></div>
            <h1 className="text-5xl font-bold tracking-tight mb-4 text-gray-900 leading-tight" style={headingStyle}>
              {block.title}
            </h1>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-12">
              Prepared specifically for the strategic expansion of <span className="font-semibold text-gray-900">{data.clientName}</span>.</p>
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
          <div className="py-8 px-16 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>{block.title}</h2>
            <div className="text-sm leading-relaxed text-gray-600 max-w-2xl" style={bodyStyle}>
              <MarkdownRenderer text={block.content || ''} />
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="py-8 px-16 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-4" style={headingStyle}>{block.title}</h2>
            <div className="text-sm leading-relaxed text-gray-600 mb-8 max-w-2xl" style={bodyStyle}>
              <MarkdownRenderer text={block.content || ''} />
            </div>
            <div className="grid grid-cols-3 gap-6">
              {block.metadata?.specialties && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Specialties</span>
                  <p className="text-xs text-gray-600 mt-2 font-medium leading-relaxed">{block.metadata.specialties}</p>
                </div>
              )}
              {block.metadata?.industries && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Industries</span>
                  <p className="text-xs text-gray-600 mt-2 font-medium leading-relaxed">{block.metadata.industries}</p>
                </div>
              )}
              {block.metadata?.approach && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">Our Approach</span>
                  <p className="text-xs text-gray-600 mt-2 font-medium leading-relaxed">{block.metadata.approach}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="py-8 px-16 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>{block.title}</h2>
            {block.subtitle && <p className="text-xs text-gray-400 font-medium mb-8">{block.subtitle}</p>}
            <div className="grid grid-cols-2 gap-6">
              {(block.metadata?.services || []).map((service: any) => (
                <div key={service.id} className="p-6 border border-gray-100 bg-white rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-6">{service.description}</p>
                  </div>
                  <div className="border-t border-gray-50 pt-4 flex justify-between items-start text-[10px] font-semibold text-gray-400">
                    <div className="flex-1 mr-4">
                      <span className="block text-[8px] uppercase tracking-wider text-gray-300">Deliverables</span>
                      <span className="text-gray-600 block mt-0.5 whitespace-pre-wrap leading-tight text-[10px] font-semibold">{service.deliverables}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] uppercase tracking-wider text-gray-300">Investment</span>
                      <span className="text-black font-bold mt-0.5 block">${service.price?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'timeline':
        const blockAccent = block.accentColor || data.brandKit.accentColor || '#6366f1';
        return (
          <div className="py-8 px-16 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>{block.title}</h2>
            {block.subtitle && <p className="text-xs text-gray-400 font-medium mb-8">{block.subtitle}</p>}
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
                    <h4 className="text-xs font-bold text-gray-900">{step.title}</h4>
                    <span 
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ color: blockAccent, backgroundColor: blockAccent.startsWith('#') ? blockAccent + '15' : blockAccent }}
                    >
                      {step.duration}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.details}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'pricing':
        const currency = block.metadata?.currency || '₹';
        const pricingItems = block.metadata?.items || [];
        const colVis = block.metadata?.columnVisibility || { price: true, qty: true, total: true };
        
        // Calculate totals dynamically based on client portal optional checkmarks
        const activeItems = pricingItems.filter((i: any) => i.included);
        const subtotal = activeItems.reduce((sum: number, item: any) => sum + (item.price * (item.qty || 1)), 0);
        const discountVal = (subtotal * (block.metadata?.discount || 0)) / 100;
        const taxVal = ((subtotal - discountVal) * (block.metadata?.taxRate || 0)) / 100;
        const total = subtotal - discountVal + taxVal;

        return (
          <div className="py-8 px-16 text-left flex flex-col justify-between min-h-[140mm]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>{block.title}</h2>
              {block.subtitle && <p className="text-xs text-gray-400 font-medium mb-8">{block.subtitle}</p>}
              
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3.5">Scope Item</th>
                      {colVis.price !== false && <th className="px-5 py-3.5 text-right">Price</th>}
                      {colVis.qty !== false && <th className="px-5 py-3.5 text-center">Qty</th>}
                      {colVis.total !== false && <th className="px-5 py-3.5 text-right">Total</th>}
                      <th className="px-5 py-3.5 text-center no-print">Optional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600">
                    {pricingItems.map((item: any) => (
                      <tr key={item.id} className={!item.included ? 'opacity-40 line-through bg-gray-50/50' : ''}>
                        <td className="px-5 py-4 font-medium text-gray-900">{item.name}</td>
                        {colVis.price !== false && <td className="px-5 py-4 text-right">{currency}{item.price?.toLocaleString()}</td>}
                        {colVis.qty !== false && <td className="px-5 py-4 text-center">{item.qty || 1}</td>}
                        {colVis.total !== false && <td className="px-5 py-4 text-right text-black font-semibold">{currency}{(item.price * (item.qty || 1))?.toLocaleString()}</td>}
                        <td className="px-5 py-4 text-center no-print">
                          {item.optional ? (
                            <input
                              type="checkbox"
                              checked={item.included}
                              onChange={(e) => handleToggleOptionalItem(block.id, item.id, e.target.checked)}
                              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer accent-black"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-300">Required</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <div className="w-72 bg-gray-50 p-5 border border-gray-100 rounded-2xl space-y-2.5 text-xs shadow-sm">
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
                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-sm text-gray-900">
                  <span>Final Investment</span>
                  <span>{currency}{total?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'payment-schedule':
        return (
          <div className="py-8 px-16 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>{block.title}</h2>
            <div className="space-y-4">
              {(block.metadata?.milestones || []).map((m: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900">{m.name}</h4>
                    <span className="text-[10px] text-gray-400 mt-1 block">{m.trigger}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {m.percentage}% Due
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonial':
        return (
          <div className="py-8 px-16 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>{block.title}</h2>
            <div className="grid grid-cols-2 gap-6">
              {(block.metadata?.testimonials || []).map((t: any, idx: number) => (
                <div key={idx} className="p-6 border border-gray-100 bg-gray-50/50 rounded-2xl relative flex flex-col justify-between">
                  <p className="text-xs text-gray-600 italic leading-relaxed mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-xs shrink-0 text-indigo-700">
                      {t.author.charAt(0)}
                    </span>
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-800">{t.author.split(',')[0]}</h4>
                      <span className="text-[9px] text-gray-400 block">{t.author.split(',').slice(1).join(',')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="py-8 px-16 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>{block.title}</h2>
            <div className="grid grid-cols-2 gap-6">
              {(block.metadata?.faqs || []).map((faq: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900">{faq.question}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="py-8 px-16 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>{block.title}</h2>
            <ul className="space-y-3.5">
              {(block.listItems || []).map((item, idx) => (
                <li key={idx} className="flex items-start text-xs text-gray-600 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-1.5 mr-3" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'signature':
        return (
          <div className="py-8 px-16 text-left min-h-[140mm] flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>{block.title}</h2>
              {block.subtitle && <p className="text-xs text-gray-400 font-medium mb-8">{block.subtitle}</p>}
            </div>

            <div className="grid grid-cols-2 gap-12 mt-12 border-t border-gray-100 pt-12">
              {/* Designer Signature */}
              <div className="flex flex-col justify-end text-center">
                <div className="h-16 border-b border-gray-200 flex items-center justify-center">
                  {data.signatures?.designerSignature ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-indigo-700 italic" style={{ fontFamily: 'Caveat, cursive' }}>
                        {data.signatures?.designerSignedName}
                      </span>
                      <span className="text-[8px] text-gray-400 mt-0.5">Digitally Verified Stamp</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Signature Pending</span>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider block mt-2">Prepared By Signature</span>
              </div>

              {/* Client Signature */}
              <div className="flex flex-col justify-end text-center">
                <div className="h-16 border-b border-gray-200 flex items-center justify-center">
                  {data.signatures?.clientSignature ? (
                    <div className="flex flex-col items-center">
                      {data.signatures?.clientSignature.startsWith('data:image') ? (
                        <img src={data.signatures?.clientSignature} alt="Client Signature" className="max-h-12 object-contain" />
                      ) : (
                        <span className="text-xs font-bold text-indigo-700 italic" style={{ fontFamily: 'Caveat, cursive' }}>
                          {data.signatures?.clientSignedName}
                        </span>
                      )}
                      <span className="text-[8px] text-gray-400 mt-0.5">IP: {data.signatures?.clientSignedIp}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsSignPadOpen(true)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer no-print"
                    >
                      Sign Document
                    </button>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider block mt-2">Client Acceptance Signature</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f1f3f5] overflow-hidden text-[#1a1a1a] relative select-none">
      
      {/* Top Banner Control Panel */}
      <nav className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 shrink-0 shadow-sm no-print z-10">
        <div className="flex items-center gap-4">
          {onBackToEditor && (
            <button
              onClick={onBackToEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-black rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer mr-1 no-print"
            >
              <ArrowLeft size={12} /> Back to Editor
            </button>
          )}
          <div className="w-9 h-9 bg-indigo-600 text-white rounded flex items-center justify-center font-bold text-sm shrink-0">
            C
          </div>
          <div className="flex flex-col">
            <h1 className="text-xs font-semibold text-gray-900">
              Interactive Client Review Portal
            </h1>
            <span className="text-[10px] text-gray-400 mt-0.5">
              Reviewing: {data.projectName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {data.status === 'signed' ? (
            <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle size={12} /> Verified Signed
            </span>
          ) : (
            <button
              onClick={() => setIsSignPadOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign & Accept
            </button>
          )}

          <button
            onClick={() => setIsCommentsOpen(true)}
            className="flex items-center gap-1 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer relative"
          >
            <MessageSquare size={14} />
            Comments
            {data.comments.filter(c => !c.resolved).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                {data.comments.filter(c => !c.resolved).length}
              </span>
            )}
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download size={14} /> Export PDF
          </button>
        </div>
      </nav>

      {/* Main Canvas view */}
      <div className="flex-1 flex overflow-hidden relative">
        <div ref={containerRef} className="flex-1 overflow-y-auto p-8 flex flex-col items-center print:bg-white print:p-0">
          
          {data.status === 'signed' && (
            <div className="w-full max-w-[210mm] bg-green-50 text-green-800 border border-green-200 rounded-2xl p-4 mb-6 text-xs font-semibold flex items-center gap-2 no-print shadow-sm">
              <CheckCircle size={16} />
              This proposal has been accepted, digitally verified, and sealed. Verification Stamp: {data.signatures?.clientSignedDate} from IP: {data.signatures?.clientSignedIp}.
            </div>
          )}

          {/* Render PDF style A4 pages */}
          {data.pages.map((page) => {
            const clientVisibleBlocks = page.blocks.filter(b => b.conditional?.visibleTo !== 'team-only');
            if (clientVisibleBlocks.length === 0) return null;
            const isExcluded = excludedPageIds?.includes(page.id);

            return (
              <div
                key={page.id}
                id={page.id}
                className={`page-wrapper ${isExcluded ? 'exclude-from-print' : ''}`}
                style={{ '--page-scale': scale } as React.CSSProperties}
              >
                <div
                  onClick={() => setActivePageId(page.id)}
                  className="page-card relative cursor-default"
                  style={{
                    fontFamily: data.brandKit.fontBody,
                    color: page.style?.textColor || data.brandKit.textColor,
                    ...getPageBackgroundStyle(page.style, data.brandKit.backgroundColor)
                  }}
                >
                  {page.blocks.map((block) => {
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

                    return (
                      <div 
                        key={block.id} 
                        className="relative"
                        style={block.type !== 'cover' ? customStyle : undefined}
                      >
                        {renderClientBlock(block)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible comment system panel */}
        <CommentSystem
          comments={data.comments}
          onAddComment={handleAddComment}
          onResolveComment={handleResolveComment}
          onDeleteComment={handleDeleteComment}
          pages={data.pages.map(p => ({ id: p.id, title: p.title }))}
          activePageId={activePageId}
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          defaultAuthor="Client Partner"
        />
      </div>

      {/* Digital Signature Pad Dialog */}
      <SignaturePad
        isOpen={isSignPadOpen}
        onClose={() => setIsSignPadOpen(false)}
        onConfirm={handleApplySignature}
        defaultName={data.clientName}
      />
    </div>
  );
};
