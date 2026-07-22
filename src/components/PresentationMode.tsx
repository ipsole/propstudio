import React, { useState, useEffect } from 'react';
import { Page, BrandKit, Block } from '../types';
import { ArrowLeft, ArrowRight, X, Play, RotateCcw } from 'lucide-react';

interface PresentationModeProps {
  pages: Page[];
  brandKit: BrandKit;
  logoUrl: string | null;
  companyName: string;
  projectName: string;
  clientName: string;
  date: string;
  onExit: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  pages,
  brandKit,
  logoUrl,
  companyName,
  projectName,
  clientName,
  date,
  onExit
}) => {
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Filter pages to display only pages that have visible content (e.g. at least one non-hidden block)
  const visiblePages = pages.filter(p => p.blocks.some(b => b.conditional?.visibleTo !== 'team-only'));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        setCurrentSlideIdx(prev => Math.min(prev + 1, visiblePages.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        setCurrentSlideIdx(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visiblePages.length, onExit]);

  const activePage = visiblePages[currentSlideIdx];

  // Helper to render block in presentation layout
  const renderPresentationBlock = (block: Block) => {
    if (block.conditional?.visibleTo === 'team-only') return null;

    const headingStyle = { fontFamily: brandKit.fontHeading, color: brandKit.primaryColor };
    const bodyStyle = { fontFamily: brandKit.fontBody, color: brandKit.textColor };

    switch (block.type) {
      case 'cover':
        return (
          <div className="h-full flex flex-col justify-center px-12 py-16 relative text-left">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="max-h-16 w-max object-contain mb-12" />
            )}
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 block">{companyName}</span>
            <div className="h-0.5 w-12 bg-black mb-6"></div>
            <h1 className="text-5xl font-bold tracking-tight mb-4 text-gray-900 leading-tight" style={headingStyle}>
              {projectName}
            </h1>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-8">
              Prepared for the strategic expansion of <span className="font-semibold text-black">{clientName}</span>.
            </p>
            <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-6 mt-6 max-w-sm">
              <div>
                <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-widest">Presented By</span>
                <span className="text-xs font-semibold text-gray-800 block mt-1">{companyName}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-widest">Date Issued</span>
                <span className="text-xs font-semibold text-gray-800 block mt-1">{date}</span>
              </div>
            </div>
          </div>
        );

      case 'welcome':
        return (
          <div className="py-6 px-10 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>{block.title}</h2>
            <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap max-w-2xl" style={bodyStyle}>
              {block.content}
            </p>
          </div>
        );

      case 'about':
        return (
          <div className="py-6 px-10 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-4" style={headingStyle}>{block.title}</h2>
            <p className="text-sm leading-relaxed text-gray-600 mb-6" style={bodyStyle}>{block.content}</p>
            <div className="grid grid-cols-3 gap-6 mt-6">
              {block.metadata?.specialties && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-wider">Specialties</span>
                  <p className="text-xs text-gray-600 mt-2 font-medium leading-relaxed">{block.metadata.specialties}</p>
                </div>
              )}
              {block.metadata?.industries && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-wider">Industries</span>
                  <p className="text-xs text-gray-600 mt-2 font-medium leading-relaxed">{block.metadata.industries}</p>
                </div>
              )}
              {block.metadata?.approach && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-wider">Our Approach</span>
                  <p className="text-xs text-gray-600 mt-2 font-medium leading-relaxed">{block.metadata.approach}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="py-6 px-10 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>{block.title}</h2>
            {block.subtitle && <p className="text-xs text-gray-400 font-medium mb-6">{block.subtitle}</p>}
            <div className="grid grid-cols-2 gap-6">
              {(block.metadata?.services || []).map((service: any) => (
                <div key={service.id} className="p-5 border border-gray-100 bg-white rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{service.description}</p>
                  </div>
                  <div className="border-t border-gray-50 pt-3 flex justify-between items-center text-[10px] font-semibold text-gray-400">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-gray-300">Deliverables</span>
                      <span className="text-gray-600 truncate max-w-[120px] block mt-0.5">{service.deliverables}</span>
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
        return (
          <div className="py-6 px-10 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>{block.title}</h2>
            {block.subtitle && <p className="text-xs text-gray-400 font-medium mb-6">{block.subtitle}</p>}
            <div className="relative pl-6 border-l-2 border-indigo-100 ml-2 space-y-6">
              {(block.metadata?.steps || []).map((step: any, idx: number) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-indigo-600 shadow-sm shrink-0" />
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-bold text-gray-900">{step.title}</h4>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{step.duration}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{step.details}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'pricing':
        const currency = block.metadata?.currency || '$';
        const pricingItems = block.metadata?.items || [];
        const activeItems = pricingItems.filter((i: any) => i.included);
        
        const subtotal = activeItems.reduce((sum: number, item: any) => sum + (item.price * (item.qty || 1)), 0);
        const discountVal = (subtotal * (block.metadata?.discount || 0)) / 100;
        const taxVal = ((subtotal - discountVal) * (block.metadata?.taxRate || 0)) / 100;
        const total = subtotal - discountVal + taxVal;

        return (
          <div className="py-6 px-10 text-left flex flex-col justify-between h-full">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>{block.title}</h2>
              {block.subtitle && <p className="text-xs text-gray-400 font-medium mb-6">{block.subtitle}</p>}
              
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600">
                    {activeItems.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3.5 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3.5 text-right">{currency}{item.price?.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-center">{item.qty || 1}</td>
                        <td className="px-4 py-3.5 text-right text-black font-semibold">{currency}{(item.price * (item.qty || 1))?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                    <span>Tax ({block.metadata.taxRate}%)</span>
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

      case 'testimonial':
        return (
          <div className="py-6 px-10 text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-6" style={headingStyle}>{block.title}</h2>
            <div className="grid grid-cols-2 gap-6">
              {(block.metadata?.testimonials || []).map((t: any, idx: number) => (
                <div key={idx} className="p-5 border border-gray-100 bg-gray-50/50 rounded-2xl relative">
                  <p className="text-xs text-gray-600 italic leading-relaxed mb-4">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center font-bold text-xs shrink-0 text-indigo-700">
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
          <div className="py-6 px-10 text-left">
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
          <div className="py-6 px-10 text-left">
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
          <div className="py-6 px-10 text-left h-full flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2" style={headingStyle}>{block.title}</h2>
              {block.subtitle && <p className="text-xs text-gray-400 font-medium mb-8">{block.subtitle}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-12 mt-12 border-t border-gray-100 pt-12">
              <div className="flex flex-col justify-end">
                <div className="h-14 border-b border-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-400 italic">Author Authorized Signatory</span>
                </div>
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider block mt-2 text-center">Presenter Signature</span>
              </div>
              <div className="flex flex-col justify-end">
                <div className="h-14 border-b border-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-400 italic">Awaiting Client Signature</span>
                </div>
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider block mt-2 text-center">Client Signature</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (visiblePages.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-[999] text-white">
        <p className="text-sm text-gray-400 mb-4">No visible pages available for presentation.</p>
        <button onClick={onExit} className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-xs">
          Exit Mode
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col z-[9999] text-white no-print">
      {/* Top Header Panel */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-gray-900 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white rounded text-black font-bold flex items-center justify-center text-xs">P</div>
          <span className="text-xs font-medium text-gray-400">
            {projectName} / <span className="text-white">Presentation Mode</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Slide {currentSlideIdx + 1} of {visiblePages.length}
          </span>
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <X size={12} /> Exit
          </button>
        </div>
      </div>

      {/* Main Slide Deck Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative bg-gradient-to-b from-gray-900 to-gray-950">
        
        {/* Left Nav Button */}
        <button
          onClick={() => setCurrentSlideIdx(prev => Math.max(prev - 1, 0))}
          disabled={currentSlideIdx === 0}
          className="absolute left-6 w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/5 disabled:opacity-20 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all cursor-pointer z-20 text-white"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Scaled Slide Canvas container */}
        <div className="w-[210mm] h-[297mm] bg-white text-gray-900 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden relative border border-gray-100 select-none transition-all duration-300 transform scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.9] xl:scale-[0.8]">
          {/* Header block details */}
          <div className="pt-8 px-12 flex justify-between items-center text-[9px] text-gray-400 tracking-wider uppercase border-b border-gray-50/50 pb-4">
            <span>{projectName}</span>
            <span>Slide {currentSlideIdx + 1}</span>
          </div>

          {/* Slide Content */}
          <div className="flex-1 flex flex-col justify-center px-4 py-8 overflow-y-auto">
            {activePage?.blocks.map((block) => (
              <div key={block.id} className="relative">
                {renderPresentationBlock(block)}
              </div>
            ))}
          </div>

          {/* Slide Footer */}
          <div className="pb-8 px-12 flex justify-between items-center text-[9px] text-gray-400 tracking-wider uppercase border-t border-gray-50/50 pt-4">
            <span>{companyName}</span>
            <span>{date}</span>
          </div>
        </div>

        {/* Right Nav Button */}
        <button
          onClick={() => setCurrentSlideIdx(prev => Math.min(prev + 1, visiblePages.length - 1))}
          disabled={currentSlideIdx === visiblePages.length - 1}
          className="absolute right-6 w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/5 disabled:opacity-20 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all cursor-pointer z-20 text-white"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Bottom Progress Bar */}
      <div className="h-1 bg-white/10 w-full shrink-0 relative select-none">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${((currentSlideIdx + 1) / visiblePages.length) * 100}%` }}
        />
      </div>
    </div>
  );
};
