import React, { useState, useEffect } from 'react';
import { Block, BrandKit, BRAND_KITS, Page, loadGoogleFont, loadCustomWebFont } from '../types';
import { Settings, Eye, Bookmark, Layout, Plus, Trash, Globe, Shield, RefreshCw, X, Trash2 } from 'lucide-react';

interface BlockPropertiesProps {
  selectedBlock: Block | null;
  onUpdateBlock: (blockId: string, updatedFields: Partial<Block>) => void;
  onSaveToLibrary: (block: Block) => void;
  brandKit: BrandKit;
  onUpdateBrandKit: (kit: Partial<BrandKit>) => void;
  onDeselect: () => void;
  onConvertToGlobalComponent?: (block: Block, name: string) => void;
  pages?: Page[];
  activePageId?: string;
  onUpdatePage?: (pageId: string, updatedFields: Partial<Page>) => void;
}

const FONTS_HEADING = [
  'Space Grotesk', 'Playfair Display', 'Lora', 'Outfit', 'Inter', 
  'Montserrat', 'Syne', 'Cinzel', 'Manrope', 'Plus Jakarta Sans', 
  'Cormorant Garamond', 'Poppins', 'Lexend', 'Cabin', 'Arvo', 
  'Merriweather', 'Oswald', 'Raleway', 'Kanit', 'Quicksand'
];
const FONTS_BODY = [
  'Inter', 'Lora', 'Roboto', 'system-ui', 'Open Sans', 
  'Plus Jakarta Sans', 'Work Sans', 'Merriweather', 'PT Serif', 
  'Poppins', 'Manrope', 'Raleway', 'Nunito', 'Ubuntu'
];

const POPULAR_GOOGLE_FONTS = [
  'Poppins', 'Montserrat', 'Roboto', 'Inter', 'Lora', 'Playfair Display', 
  'Outfit', 'Space Grotesk', 'Syne', 'Cinzel', 'Manrope', 'Plus Jakarta Sans', 
  'Cormorant Garamond', 'Lexend', 'Cabin', 'Arvo', 'Merriweather', 'Oswald', 
  'Raleway', 'Kanit', 'Quicksand', 'Lato', 'Open Sans', 'Slabo 27px', 
  'Roboto Condensed', 'Source Sans Pro', 'PT Sans', 'Prompt', 'Nunito', 
  'Ubuntu', 'Roboto Mono', 'Muli', 'Rubik', 'Work Sans', 'Fira Sans', 
  'Heebo', 'DM Sans', 'Cabinet Grotesk', 'Fredoka', 'Dancing Script', 
  'Caveat', 'Great Vibes', 'Pacifico', 'Abril Fatface', 'Cinzel Decorative',
  'Sacramento', 'Satisfy', 'Amatic SC', 'Josefin Sans', 'Comfortaa'
];

export const BlockProperties: React.FC<BlockPropertiesProps> = ({
  selectedBlock,
  onUpdateBlock,
  onSaveToLibrary,
  brandKit,
  onUpdateBrandKit,
  onDeselect,
  onConvertToGlobalComponent,
  pages = [],
  activePageId,
  onUpdatePage
}) => {
  const [customBrandKits, setCustomBrandKits] = useState<BrandKit[]>(() => {
    try {
      const stored = localStorage.getItem('docdril_custom_brand_kits');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const handleSaveBrandKit = () => {
    const presetName = prompt('Enter a name for your custom brand kit:', `Custom Theme ${customBrandKits.length + 1}`);
    if (!presetName) return;
    
    if (customBrandKits.some(k => k.name.toLowerCase() === presetName.toLowerCase()) || BRAND_KITS.some(k => k.name.toLowerCase() === presetName.toLowerCase())) {
      alert('A Brand Kit with this name already exists!');
      return;
    }

    const newKit: BrandKit = {
      ...brandKit,
      name: presetName
    };

    const updated = [...customBrandKits, newKit];
    setCustomBrandKits(updated);
    localStorage.setItem('docdril_custom_brand_kits', JSON.stringify(updated));
    onUpdateBrandKit(newKit);
  };

  const handleRemoveCustomKit = (e: React.MouseEvent, kitName: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete the custom brand kit "${kitName}"?`)) return;
    const updated = customBrandKits.filter(k => k.name !== kitName);
    setCustomBrandKits(updated);
    localStorage.setItem('docdril_custom_brand_kits', JSON.stringify(updated));
  };

  const [customFontsList, setCustomFontsList] = useState<string[]>(() => {
    const defaultAll = [...FONTS_HEADING, ...FONTS_BODY];
    const custom: string[] = [];
    if (brandKit.fontHeading && !defaultAll.includes(brandKit.fontHeading)) {
      custom.push(brandKit.fontHeading);
    }
    if (brandKit.fontBody && !defaultAll.includes(brandKit.fontBody)) {
      custom.push(brandKit.fontBody);
    }
    try {
      const stored = localStorage.getItem('docdril_custom_fonts');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach((f: string) => {
          if (!custom.includes(f)) custom.push(f);
        });
      }
    } catch (e) {}
    return custom;
  });

  // Font Manager states
  const [isFontManagerOpen, setIsFontManagerOpen] = useState(false);
  const [fontTab, setFontTab] = useState<'google' | 'custom' | 'system'>('google');
  const [googleFontInput, setGoogleFontInput] = useState('');
  const [googleSuggestions, setGoogleSuggestions] = useState<string[]>([]);
  const [customFontName, setCustomFontName] = useState('');
  const [customFontUrl, setCustomFontUrl] = useState('');
  const [systemFontInput, setSystemFontInput] = useState('');

  // Load custom URLs mapping
  const [customUrlsMap, setCustomUrlsMap] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('docdril_custom_font_urls');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Handle Google Font Input Auto-suggestions
  useEffect(() => {
    const trimmed = googleFontInput.trim().toLowerCase();
    if (!trimmed) {
      setGoogleSuggestions([]);
      return;
    }
    const defaultAll = [...FONTS_HEADING, ...FONTS_BODY];
    const filtered = POPULAR_GOOGLE_FONTS.filter(font => 
      font.toLowerCase().includes(trimmed) && 
      !customFontsList.includes(font) && 
      !defaultAll.includes(font)
    ).slice(0, 5);
    setGoogleSuggestions(filtered);
  }, [googleFontInput, customFontsList]);

  // Google Font Add Handler
  const handleAddGoogleFont = () => {
    const trimmed = googleFontInput.trim();
    if (!trimmed) return;

    const defaultAll = [...FONTS_HEADING, ...FONTS_BODY];
    if (defaultAll.includes(trimmed) || customFontsList.includes(trimmed)) {
      alert('This font is already available in the selection list!');
      return;
    }

    loadGoogleFont(trimmed);

    const updated = [...customFontsList, trimmed];
    setCustomFontsList(updated);
    localStorage.setItem('docdril_custom_fonts', JSON.stringify(updated));
    setGoogleFontInput('');
    setGoogleSuggestions([]);
  };

  // Custom Web Font URL Add Handler
  const handleAddCustomWebFont = () => {
    const name = customFontName.trim();
    const url = customFontUrl.trim();
    if (!name || !url) {
      alert('Please enter both a Font Name and a CSS Stylesheet URL!');
      return;
    }

    const defaultAll = [...FONTS_HEADING, ...FONTS_BODY];
    if (defaultAll.includes(name) || customFontsList.includes(name)) {
      alert('This font name is already in use!');
      return;
    }

    try {
      loadCustomWebFont(name, url);
    } catch (e) {
      alert('Failed to load font from URL. Please check the URL.');
      return;
    }

    // Save URL mapping
    const updatedUrls = { ...customUrlsMap, [name]: url };
    setCustomUrlsMap(updatedUrls);
    localStorage.setItem('docdril_custom_font_urls', JSON.stringify(updatedUrls));

    // Add to font list
    const updatedFonts = [...customFontsList, name];
    setCustomFontsList(updatedFonts);
    localStorage.setItem('docdril_custom_fonts', JSON.stringify(updatedFonts));

    setCustomFontName('');
    setCustomFontUrl('');
  };

  // System Font Add Handler
  const handleAddSystemFont = () => {
    const trimmed = systemFontInput.trim();
    if (!trimmed) return;

    const defaultAll = [...FONTS_HEADING, ...FONTS_BODY];
    if (defaultAll.includes(trimmed) || customFontsList.includes(trimmed)) {
      alert('This font name is already in use!');
      return;
    }

    const updated = [...customFontsList, trimmed];
    setCustomFontsList(updated);
    localStorage.setItem('docdril_custom_fonts', JSON.stringify(updated));
    setSystemFontInput('');
  };

  // Remove Font Handler
  const handleRemoveCustomFont = (fontToRemove: string) => {
    if (!confirm(`Are you sure you want to remove "${fontToRemove}" from your custom fonts?`)) return;

    const updated = customFontsList.filter(f => f !== fontToRemove);
    setCustomFontsList(updated);
    localStorage.setItem('docdril_custom_fonts', JSON.stringify(updated));

    // Remove from URL mapping if present
    const updatedUrls = { ...customUrlsMap };
    delete updatedUrls[fontToRemove];
    setCustomUrlsMap(updatedUrls);
    localStorage.setItem('docdril_custom_font_urls', JSON.stringify(updatedUrls));

    // Fallbacks if Heading or Body were using the removed font
    if (brandKit.fontHeading === fontToRemove) {
      onUpdateBrandKit({ fontHeading: 'Inter' });
    }
    if (brandKit.fontBody === fontToRemove) {
      onUpdateBrandKit({ fontBody: 'Inter' });
    }
  };
  
  const handleUpdateMetadata = (updatedMeta: any) => {
    if (!selectedBlock) return;
    onUpdateBlock(selectedBlock.id, {
      metadata: { ...selectedBlock.metadata, ...updatedMeta }
    });
  };

  const addPricingItem = () => {
    if (!selectedBlock) return;
    const currentItems = selectedBlock.metadata?.items || [];
    const newItem = {
      id: `pi-${Math.random().toString(36).substr(2, 9)}`,
      name: "New Project Item",
      price: 1000,
      qty: 1,
      optional: false,
      included: true
    };
    handleUpdateMetadata({ items: [...currentItems, newItem] });
  };

  const removePricingItem = (id: string) => {
    if (!selectedBlock) return;
    const currentItems = selectedBlock.metadata?.items || [];
    handleUpdateMetadata({ items: currentItems.filter((i: any) => i.id !== id) });
  };

  const updatePricingItemField = (id: string, field: string, value: any) => {
    if (!selectedBlock) return;
    const currentItems = selectedBlock.metadata?.items || [];
    const updated = currentItems.map((i: any) => {
      if (i.id === id) {
        return { ...i, [field]: value };
      }
      return i;
    });
    handleUpdateMetadata({ items: updated });
  };

  const addTimelineStep = () => {
    if (!selectedBlock) return;
    const currentSteps = selectedBlock.metadata?.steps || [];
    const newStep = {
      title: "New Stage",
      duration: "Weeks 1-2",
      details: "Describe milestones and deliverables here."
    };
    handleUpdateMetadata({ steps: [...currentSteps, newStep] });
  };

  const removeTimelineStep = (index: number) => {
    if (!selectedBlock) return;
    const currentSteps = selectedBlock.metadata?.steps || [];
    handleUpdateMetadata({ steps: currentSteps.filter((_: any, i: number) => i !== index) });
  };

  const updateTimelineStepField = (index: number, field: string, value: string) => {
    if (!selectedBlock) return;
    const currentSteps = selectedBlock.metadata?.steps || [];
    const updated = currentSteps.map((s: any, i: number) => {
      if (i === index) {
        return { ...s, [field]: value };
      }
      return s;
    });
    handleUpdateMetadata({ steps: updated });
  };

  const addFAQItem = () => {
    if (!selectedBlock) return;
    const currentFaqs = selectedBlock.metadata?.faqs || [];
    const newFaq = { question: "Q: New Question?", answer: "Answer content goes here." };
    handleUpdateMetadata({ faqs: [...currentFaqs, newFaq] });
  };

  const removeFAQItem = (index: number) => {
    if (!selectedBlock) return;
    const currentFaqs = selectedBlock.metadata?.faqs || [];
    handleUpdateMetadata({ faqs: currentFaqs.filter((_: any, i: number) => i !== index) });
  };

  const updateFAQItemField = (index: number, field: string, value: string) => {
    if (!selectedBlock) return;
    const currentFaqs = selectedBlock.metadata?.faqs || [];
    const updated = currentFaqs.map((f: any, i: number) => {
      if (i === index) {
        return { ...f, [field]: value };
      }
      return f;
    });
    handleUpdateMetadata({ faqs: updated });
  };

  const addTestimonialItem = () => {
    if (!selectedBlock) return;
    const currentItems = selectedBlock.metadata?.testimonials || [];
    const newItem = {
      quote: "Write client testimonial review here.",
      author: "Client Name, Title at Company",
      avatar: ""
    };
    handleUpdateMetadata({ testimonials: [...currentItems, newItem] });
  };

  const removeTestimonialItem = (index: number) => {
    if (!selectedBlock) return;
    const currentItems = selectedBlock.metadata?.testimonials || [];
    handleUpdateMetadata({ testimonials: currentItems.filter((_: any, i: number) => i !== index) });
  };

  const updateTestimonialItemField = (index: number, field: string, value: string) => {
    if (!selectedBlock) return;
    const currentItems = selectedBlock.metadata?.testimonials || [];
    const updated = currentItems.map((t: any, i: number) => {
      if (i === index) {
        return { ...t, [field]: value };
      }
      return t;
    });
    handleUpdateMetadata({ testimonials: updated });
  };

  return (
    <>
      <aside className="w-80 border-l border-gray-200 bg-white flex flex-col h-full shrink-0 z-40 no-print">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2 text-gray-800">
          <Settings size={16} />
          <h3 className="font-semibold text-sm tracking-tight">
            {selectedBlock ? `Block: ${selectedBlock.type.toUpperCase()}` : "Design Inspector"}
          </h3>
        </div>
        {selectedBlock && (
          <button
            onClick={onDeselect}
            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider cursor-pointer"
          >
            Clear Selection
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {selectedBlock ? (
          <>
            {/* 1. Layout Variations */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layout size={12} />
                Layout Variation
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {selectedBlock.type === 'cover' && (
                  <>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'split' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'split' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Split Layout
                    </button>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'center' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'center' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Minimal Center
                    </button>
                  </>
                )}
                {selectedBlock.type === 'heading' && (
                  <>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'h1' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'h1' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Large (H1)
                    </button>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'h2' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'h2' || !selectedBlock.layout ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Medium (H2)
                    </button>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'h3' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'h3' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Small (H3)
                    </button>
                  </>
                )}
                {selectedBlock.type === 'about' && (
                  <>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'split' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'split' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Split Layout
                    </button>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'cards' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'cards' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Vertical Grid
                    </button>
                  </>
                )}
                {selectedBlock.type === 'services' && (
                  <>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'cards' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'cards' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Sleek Cards
                    </button>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'list' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'list' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Standard List
                    </button>
                  </>
                )}
                {selectedBlock.type === 'pricing' && (
                  <>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'default' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'default' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Classic Table
                    </button>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'split' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'split' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Summary Card
                    </button>
                  </>
                )}
                {selectedBlock.type === 'testimonial' && (
                  <>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'cards' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'cards' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Card Grid
                    </button>
                    <button
                      onClick={() => onUpdateBlock(selectedBlock.id, { layout: 'single' })}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedBlock.layout === 'single' ? 'border-black bg-black text-white shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Single Hero
                    </button>
                  </>
                )}
              </div>
              {!['cover', 'about', 'services', 'pricing', 'testimonial'].includes(selectedBlock.type) && (
                <p className="text-[10px] text-gray-400 italic">This block does not have layout variations.</p>
              )}
            </div>

            {/* 2. Block Visibility Rules */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Eye size={12} />
                Visibility & Logic
              </label>
              
              <div className="space-y-2.5">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-gray-600">Visible To</span>
                  <select
                    value={selectedBlock.conditional?.visibleTo || 'all'}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, {
                      conditional: {
                        ...(selectedBlock.conditional || { optional: false, included: true }),
                        visibleTo: e.target.value as any
                      }
                    })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer bg-white"
                  >
                    <option value="all">Everyone (Client & Designer)</option>
                    <option value="client-only">Clients Only</option>
                    <option value="team-only">Internal Team Only</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-1 bg-gray-50/50 rounded-lg px-2 border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-gray-700">Optional Section</span>
                    <span className="text-[9px] text-gray-400">Client can toggle in portal</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedBlock.conditional?.optional || false}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, {
                      conditional: {
                        ...(selectedBlock.conditional || { visibleTo: 'all', included: true }),
                        optional: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer accent-black"
                  />
                </div>
              </div>
            </div>

            {/* 3. Block Specific Content Inspector */}
            <div className="space-y-4 pt-3 border-t border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Settings size={12} />
                Content Elements
              </label>

              {/* Image Content */}
              {selectedBlock.type === 'image' && (
                <div className="space-y-3 text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Image URL</span>
                    <input
                      type="text"
                      value={selectedBlock.metadata?.url || ''}
                      onChange={(e) => handleUpdateMetadata({ url: e.target.value })}
                      placeholder="Paste image address..."
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Caption</span>
                    <input
                      type="text"
                      value={selectedBlock.metadata?.caption || ''}
                      onChange={(e) => handleUpdateMetadata({ caption: e.target.value })}
                      placeholder="Describe image..."
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800"
                    />
                  </div>
                </div>
              )}

              {/* Video Content */}
              {selectedBlock.type === 'video' && (
                <div className="space-y-3 text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Video URL (MP4)</span>
                    <input
                      type="text"
                      value={selectedBlock.metadata?.url || ''}
                      onChange={(e) => handleUpdateMetadata({ url: e.target.value })}
                      placeholder="Paste mp4 link..."
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Caption</span>
                    <input
                      type="text"
                      value={selectedBlock.metadata?.caption || ''}
                      onChange={(e) => handleUpdateMetadata({ caption: e.target.value })}
                      placeholder="Describe video..."
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800"
                    />
                  </div>
                </div>
              )}

              {/* Link Content */}
              {selectedBlock.type === 'link' && (
                <div className="space-y-3 text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Button URL</span>
                    <input
                      type="text"
                      value={selectedBlock.metadata?.url || ''}
                      onChange={(e) => handleUpdateMetadata({ url: e.target.value })}
                      placeholder="Redirect URL (https://...)"
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Button Label</span>
                    <input
                      type="text"
                      value={selectedBlock.metadata?.label || ''}
                      onChange={(e) => handleUpdateMetadata({ label: e.target.value })}
                      placeholder="e.g. Open Document"
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800"
                    />
                  </div>
                </div>
              )}

              {/* File Content */}
              {selectedBlock.type === 'file' && (
                <div className="space-y-3 text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">File Name</span>
                    <input
                      type="text"
                      value={selectedBlock.metadata?.name || ''}
                      onChange={(e) => handleUpdateMetadata({ name: e.target.value })}
                      placeholder="e.g. project_requirements.pdf"
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">File Size</span>
                    <input
                      type="text"
                      value={selectedBlock.metadata?.size || ''}
                      onChange={(e) => handleUpdateMetadata({ size: e.target.value })}
                      placeholder="e.g. 2.4 MB"
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">File Link / URL</span>
                    <input
                      type="text"
                      value={selectedBlock.metadata?.url || ''}
                      onChange={(e) => handleUpdateMetadata({ url: e.target.value })}
                      placeholder="Download link URL..."
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800"
                    />
                  </div>
                </div>
              )}

              {/* Pricing Content */}
              {selectedBlock.type === 'pricing' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Currency</span>
                      <select
                        value={selectedBlock.metadata?.currency || '₹'}
                        onChange={(e) => handleUpdateMetadata({ currency: e.target.value })}
                        className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-black bg-white cursor-pointer font-medium text-gray-700"
                      >
                        <option value="₹">INR (₹)</option>
                        <option value="$">USD ($)</option>
                        <option value="€">EUR (€)</option>
                        <option value="£">GBP (£)</option>
                        <option value="¥">JPY (¥)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Tax Rate (%)</span>
                      <input
                        type="number"
                        value={selectedBlock.metadata?.taxRate || 0}
                        onChange={(e) => handleUpdateMetadata({ taxRate: parseFloat(e.target.value) || 0 })}
                        className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-black bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Discount (%)</span>
                    <input
                      type="number"
                      value={selectedBlock.metadata?.discount || 0}
                      onChange={(e) => handleUpdateMetadata({ discount: parseFloat(e.target.value) || 0 })}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-black bg-white"
                    />
                  </div>

                  {/* Column Visibility Checkboxes */}
                  <div className="space-y-1.5 bg-gray-50/50 p-2.5 rounded-xl border border-gray-150 mt-2">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block text-left">Show Columns</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 text-[10px] text-gray-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBlock.metadata?.columnVisibility?.price !== false}
                          onChange={(e) => handleUpdateMetadata({
                            columnVisibility: {
                              ...(selectedBlock.metadata?.columnVisibility || { price: true, qty: true, total: true }),
                              price: e.target.checked
                            }
                          })}
                          className="w-3.5 h-3.5 cursor-pointer accent-black"
                        />
                        Price
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-gray-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBlock.metadata?.columnVisibility?.qty !== false}
                          onChange={(e) => handleUpdateMetadata({
                            columnVisibility: {
                              ...(selectedBlock.metadata?.columnVisibility || { price: true, qty: true, total: true }),
                              qty: e.target.checked
                            }
                          })}
                          className="w-3.5 h-3.5 cursor-pointer accent-black"
                        />
                        Qty
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-gray-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBlock.metadata?.columnVisibility?.total !== false}
                          onChange={(e) => handleUpdateMetadata({
                            columnVisibility: {
                              ...(selectedBlock.metadata?.columnVisibility || { price: true, qty: true, total: true }),
                              total: e.target.checked
                            }
                          })}
                          className="w-3.5 h-3.5 cursor-pointer accent-black"
                        />
                        Total
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Line Items</span>
                      <button
                        onClick={addPricingItem}
                        className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:text-indigo-800 transition-colors"
                      >
                        <Plus size={10} /> Add Item
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                      {(selectedBlock.metadata?.items || []).map((item: any) => (
                        <div key={item.id} className="bg-white p-2 border border-gray-100 rounded-lg shadow-sm flex flex-col gap-1.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updatePricingItemField(item.id, 'name', e.target.value)}
                            placeholder="Item Name"
                            className="w-full text-xs font-semibold focus:outline-none text-gray-800 border-none bg-transparent"
                          />
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-gray-400 font-medium">Price:</span>
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => updatePricingItemField(item.id, 'price', parseFloat(e.target.value) || 0)}
                                className="w-14 px-1 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-black text-gray-800 bg-white"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-[9px] text-gray-400 font-medium">
                                Optional:
                                <input
                                  type="checkbox"
                                  checked={item.optional || false}
                                  onChange={(e) => updatePricingItemField(item.id, 'optional', e.target.checked)}
                                  className="w-3.5 h-3.5 cursor-pointer accent-black"
                                />
                              </label>
                              <button
                                onClick={() => removePricingItem(item.id)}
                                className="p-0.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline Content */}
              {selectedBlock.type === 'timeline' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Timeline Nodes</span>
                    <button
                      onClick={addTimelineStep}
                      className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:text-indigo-800 transition-colors"
                    >
                      <Plus size={10} /> Add Node
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                    {(selectedBlock.metadata?.steps || []).map((step: any, idx: number) => (
                      <div key={idx} className="bg-white p-2.5 border border-gray-100 rounded-lg shadow-sm flex flex-col gap-1.5 relative group">
                        <button
                          onClick={() => removeTimelineStep(idx)}
                          className="absolute top-1.5 right-1.5 text-gray-300 hover:text-red-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash size={12} />
                        </button>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateTimelineStepField(idx, 'title', e.target.value)}
                          placeholder="Stage Title"
                          className="w-full text-xs font-semibold text-gray-800 border-none bg-transparent focus:outline-none"
                        />
                        <input
                          type="text"
                          value={step.duration}
                          onChange={(e) => updateTimelineStepField(idx, 'duration', e.target.value)}
                          placeholder="e.g. Weeks 1-2"
                          className="w-full text-[10px] font-bold text-indigo-500 border-none bg-transparent focus:outline-none"
                        />
                        <textarea
                          value={step.details}
                          onChange={(e) => updateTimelineStepField(idx, 'details', e.target.value)}
                          placeholder="Details"
                          rows={2}
                          className="w-full text-[10px] text-gray-500 border-none bg-transparent focus:outline-none resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ Content */}
              {selectedBlock.type === 'faq' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">FAQ Questions</span>
                    <button
                      onClick={addFAQItem}
                      className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:text-indigo-800"
                    >
                      <Plus size={10} /> Add Q&A
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                    {(selectedBlock.metadata?.faqs || []).map((faq: any, idx: number) => (
                      <div key={idx} className="bg-white p-2 border border-gray-100 rounded-lg shadow-sm flex flex-col gap-1.5 relative group">
                        <button
                          onClick={() => removeFAQItem(idx)}
                          className="absolute top-1 right-1 text-gray-300 hover:text-red-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash size={12} />
                        </button>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFAQItemField(idx, 'question', e.target.value)}
                          placeholder="Question"
                          className="w-full text-xs font-semibold text-gray-800 border-none bg-transparent focus:outline-none"
                        />
                        <textarea
                          value={faq.answer}
                          onChange={(e) => updateFAQItemField(idx, 'answer', e.target.value)}
                          placeholder="Answer"
                          rows={2}
                          className="w-full text-[10px] text-gray-500 border-none bg-transparent focus:outline-none resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Testimonial Content */}
              {selectedBlock.type === 'testimonial' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Testimonials</span>
                    <button
                      onClick={addTestimonialItem}
                      className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 hover:text-indigo-800"
                    >
                      <Plus size={10} /> Add Quote
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                    {(selectedBlock.metadata?.testimonials || []).map((t: any, idx: number) => (
                      <div key={idx} className="bg-white p-2 border border-gray-100 rounded-lg shadow-sm flex flex-col gap-1.5 relative group">
                        <button
                          onClick={() => removeTestimonialItem(idx)}
                          className="absolute top-1 right-1 text-gray-300 hover:text-red-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash size={12} />
                        </button>
                        <textarea
                          value={t.quote}
                          onChange={(e) => updateTestimonialItemField(idx, 'quote', e.target.value)}
                          placeholder="Quote"
                          rows={2}
                          className="w-full text-[10px] text-gray-600 italic border-none bg-transparent focus:outline-none resize-none"
                        />
                        <input
                          type="text"
                          value={t.author}
                          onChange={(e) => updateTestimonialItemField(idx, 'author', e.target.value)}
                          placeholder="Author & Co"
                          className="w-full text-[9px] font-semibold text-gray-400 border-none bg-transparent focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!['pricing', 'timeline', 'faq', 'testimonial'].includes(selectedBlock.type) && (
                <p className="text-[10px] text-gray-400 italic">This block type uses on-page inline editors.</p>
              )}
            </div>

            {/* Block Styling & Layout Overrides */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <Settings size={12} className="text-indigo-500" />
                Block-Level Styling
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Background</span>
                  <div className="flex items-center gap-1 font-sans">
                    <input
                      type="color"
                      value={selectedBlock.backgroundColor || '#ffffff'}
                      onChange={(e) => onUpdateBlock(selectedBlock.id, { backgroundColor: e.target.value })}
                      className="w-6 h-6 border border-gray-200 rounded cursor-pointer shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateBlock(selectedBlock.id, { backgroundColor: undefined })}
                      className="text-[9px] text-indigo-650 hover:text-indigo-850 cursor-pointer font-semibold underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Text Color</span>
                  <div className="flex items-center gap-1 font-sans">
                    <input
                      type="color"
                      value={selectedBlock.textColor || '#000000'}
                      onChange={(e) => onUpdateBlock(selectedBlock.id, { textColor: e.target.value })}
                      className="w-6 h-6 border border-gray-200 rounded cursor-pointer shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateBlock(selectedBlock.id, { textColor: undefined })}
                      className="text-[9px] text-indigo-650 hover:text-indigo-850 cursor-pointer font-semibold underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase font-sans">Accent/Dots</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={selectedBlock.accentColor || brandKit.accentColor || '#6366f1'}
                      onChange={(e) => onUpdateBlock(selectedBlock.id, { accentColor: e.target.value })}
                      className="w-6 h-6 border border-gray-200 rounded cursor-pointer shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateBlock(selectedBlock.id, { accentColor: undefined })}
                      className="text-[9px] text-indigo-655 hover:text-indigo-855 cursor-pointer font-semibold underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase">Text Alignment</span>
                <div className="flex gap-1 bg-gray-50 p-1 rounded-xl border border-gray-150">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => onUpdateBlock(selectedBlock.id, { textAlign: align })}
                      className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        selectedBlock.textAlign === align || (!selectedBlock.textAlign && align === 'left')
                          ? 'bg-white text-black shadow-xs font-bold'
                          : 'text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Line Height</span>
                  <select
                    value={selectedBlock.lineHeight || 'normal'}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, { lineHeight: e.target.value })}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 cursor-pointer font-semibold focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="1.2">Compact (1.2)</option>
                    <option value="1.5">Classic (1.5)</option>
                    <option value="1.8">Spacious (1.8)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Letter Spacing</span>
                  <select
                    value={selectedBlock.letterSpacing || 'normal'}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, { letterSpacing: e.target.value })}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 cursor-pointer font-semibold focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="-0.02em">Tight (-0.02em)</option>
                    <option value="0.05em">Loose (0.05em)</option>
                    <option value="0.1em">Wide (0.1em)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Font Weight</span>
                  <select
                    value={selectedBlock.fontWeight || 'normal'}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, { fontWeight: e.target.value })}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 cursor-pointer font-semibold focus:outline-none"
                  >
                    <option value="normal">Normal (400)</option>
                    <option value="100">Thin (100)</option>
                    <option value="300">Light (300)</option>
                    <option value="500">Medium (500)</option>
                    <option value="700">Bold (700)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Font Style</span>
                  <select
                    value={selectedBlock.fontStyle || 'normal'}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, { fontStyle: e.target.value as any })}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 cursor-pointer font-semibold focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                  </select>
                </div>
              </div>

              {/* Vertical Positioning Nudge */}
              <div className="space-y-2 pt-2 border-t border-gray-50 text-left">
                <span className="text-[9px] font-bold text-gray-500 uppercase block">Vertical Adjust (Nudge Offset)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedBlock.marginTop !== undefined ? selectedBlock.marginTop : 0;
                      onUpdateBlock(selectedBlock.id, { marginTop: cur - 5 });
                    }}
                    className="flex-1 py-1 bg-gray-50 hover:bg-gray-150 border border-gray-200 hover:border-gray-300 rounded-lg text-[10px] font-bold text-gray-700 transition-all cursor-pointer text-center"
                    title="Nudge Upwards"
                  >
                    ↑ Nudge Up (-5px)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedBlock.marginTop !== undefined ? selectedBlock.marginTop : 0;
                      onUpdateBlock(selectedBlock.id, { marginTop: cur + 5 });
                    }}
                    className="flex-1 py-1 bg-gray-50 hover:bg-gray-150 border border-gray-200 hover:border-gray-300 rounded-lg text-[10px] font-bold text-gray-700 transition-all cursor-pointer text-center"
                    title="Nudge Downwards"
                  >
                    ↓ Nudge Down (+5px)
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Top Offset ({selectedBlock.marginTop !== undefined ? selectedBlock.marginTop : 0}px)</span>
                      <button
                        type="button"
                        onClick={() => onUpdateBlock(selectedBlock.id, { marginTop: undefined })}
                        className="text-[8px] text-indigo-600 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                    <input
                      type="range"
                      min="-80"
                      max="100"
                      value={selectedBlock.marginTop !== undefined ? selectedBlock.marginTop : 0}
                      onChange={(e) => onUpdateBlock(selectedBlock.id, { marginTop: parseInt(e.target.value) })}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Bottom Offset ({selectedBlock.marginBottom !== undefined ? selectedBlock.marginBottom : 0}px)</span>
                      <button
                        type="button"
                        onClick={() => onUpdateBlock(selectedBlock.id, { marginBottom: undefined })}
                        className="text-[8px] text-indigo-600 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                    <input
                      type="range"
                      min="-80"
                      max="100"
                      value={selectedBlock.marginBottom !== undefined ? selectedBlock.marginBottom : 0}
                      onChange={(e) => onUpdateBlock(selectedBlock.id, { marginBottom: parseInt(e.target.value) })}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save to Library */}
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <button
                onClick={() => onSaveToLibrary(selectedBlock)}
                className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
              >
                <Bookmark size={14} className="text-gray-400" />
                Save Block to Library
              </button>
              
              {selectedBlock.globalComponentId ? (
                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-[10px] text-indigo-750 font-semibold leading-relaxed mt-1">
                  📢 Linked to Global Component. Edits made to this block will instantly sync across all document instances.
                </div>
              ) : (
                <button
                  onClick={() => {
                    const name = prompt("Enter a name for this global component:", `${selectedBlock.type.toUpperCase()} Component`);
                    if (name) {
                      onConvertToGlobalComponent?.(selectedBlock, name);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-indigo-250 bg-indigo-50/10 hover:bg-indigo-50/20 rounded-xl text-xs font-semibold text-indigo-700 transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} className="animate-spin-slow" />
                  Convert to Global Component
                </button>
              )}
            </div>
          </>
        ) : (
          // Global Design Inspector
          <>
            {/* Active Page Settings Override */}
            {pages.length > 0 && (
              <div className="space-y-3 pb-3 border-b border-gray-150">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                    <Settings size={12} className="text-indigo-500" />
                    Page Theme Settings
                  </label>
                  <span className="text-[8px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                    Active Override
                  </span>
                </div>
                
                {/* Active page selection dropdown */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Selected Page</span>
                  <select
                    value={activePageId || pages[0]?.id || ''}
                    onChange={(e) => {
                      const targetEl = document.getElementById(e.target.value);
                      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800 cursor-pointer focus:outline-none"
                  >
                    {pages.map((p, idx) => (
                      <option key={p.id} value={p.id}>Page {idx + 1}: {p.title || 'Untitled Page'}</option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const targetPageId = activePageId || pages[0]?.id;
                  const activePage = pages.find(p => p.id === targetPageId);
                  if (!activePage) return null;

                  return (
                    <div className="flex flex-col gap-2.5 bg-gray-50/50 p-3 rounded-2xl border border-gray-150 font-sans">
                      {/* Text Color Override */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-500 uppercase">Text Color Override</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={activePage.style?.textColor || brandKit.textColor}
                            onChange={(e) => onUpdatePage?.(activePage.id, {
                              style: { ...activePage.style, textColor: e.target.value }
                            })}
                            className="w-5 h-5 border border-gray-200 rounded cursor-pointer shrink-0"
                          />
                          <button
                            type="button"
                            onClick={() => onUpdatePage?.(activePage.id, {
                              style: { ...activePage.style, textColor: undefined }
                            })}
                            className="text-[9px] text-indigo-650 hover:text-indigo-850 cursor-pointer font-semibold underline"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Background Type */}
                      <div className="flex flex-col gap-1 border-t border-gray-105 pt-2">
                        <span className="text-[9px] font-bold text-gray-500 uppercase">Bg Type</span>
                        <div className="grid grid-cols-3 gap-1 bg-white p-0.5 rounded-lg border border-gray-200">
                          {(['solid', 'gradient', 'image'] as const).map((bgT) => (
                            <button
                              key={bgT}
                              type="button"
                              onClick={() => onUpdatePage?.(activePage.id, {
                                style: { ...activePage.style, backgroundType: bgT }
                              })}
                              className={`py-1 text-[9px] font-bold rounded-md capitalize cursor-pointer transition-colors ${
                                (activePage.style?.backgroundType || 'solid') === bgT
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {bgT}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Solid Bg Picker */}
                      {(activePage.style?.backgroundType || 'solid') === 'solid' && (
                        <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Bg Color</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={activePage.style?.backgroundColor || brandKit.backgroundColor}
                              onChange={(e) => onUpdatePage?.(activePage.id, {
                                style: { ...activePage.style, backgroundColor: e.target.value }
                              })}
                              className="w-5 h-5 border border-gray-200 rounded cursor-pointer shrink-0"
                            />
                            <button
                              type="button"
                              onClick={() => onUpdatePage?.(activePage.id, {
                                style: { ...activePage.style, backgroundColor: undefined }
                              })}
                              className="text-[9px] text-indigo-650 hover:text-indigo-850 cursor-pointer font-semibold underline"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Gradient Selector */}
                      {activePage.style?.backgroundType === 'gradient' && (
                        <div className="flex flex-col gap-1.5 bg-white p-2 rounded-xl border border-gray-100">
                          <span className="text-[9px] font-bold text-gray-500 uppercase font-sans">Presets</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { name: 'Sunset Glow', value: 'linear-gradient(135deg, #fef08a 0%, #fca5a5 100%)' },
                              { name: 'Aurora', value: 'linear-gradient(135deg, #a7f3d0 0%, #c7d2fe 100%)' },
                              { name: 'Ocean Breeze', value: 'linear-gradient(135deg, #bae6fd 0%, #e0e7ff 100%)' },
                              { name: 'Soft Silk', value: 'linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 100%)' }
                            ].map((grad) => (
                              <button
                                key={grad.name}
                                type="button"
                                onClick={() => onUpdatePage?.(activePage.id, {
                                  style: { ...activePage.style, backgroundGradient: grad.value }
                                })}
                                className="flex flex-col items-center p-1.5 rounded-lg border border-gray-100 hover:border-indigo-300 transition-all cursor-pointer text-center"
                              >
                                <div className="w-full h-4 rounded-md border border-gray-100 mb-1" style={{ backgroundImage: grad.value }} />
                                <span className="text-[8px] font-bold text-gray-600">{grad.name}</span>
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-col gap-1 mt-1.5">
                            <span className="text-[8px] font-bold text-gray-400 uppercase">Custom CSS Gradient</span>
                            <input
                              type="text"
                              value={activePage.style?.backgroundGradient || ''}
                              onChange={(e) => onUpdatePage?.(activePage.id, {
                                style: { ...activePage.style, backgroundGradient: e.target.value }
                              })}
                              placeholder="linear-gradient(...)"
                              className="w-full px-2 py-1 border border-gray-200 rounded text-[9px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Image Input */}
                      {activePage.style?.backgroundType === 'image' && (
                        <div className="flex flex-col gap-1.5 bg-white p-2 rounded-xl border border-gray-100">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Image URL</span>
                          <input
                            type="text"
                            value={activePage.style?.backgroundImageUrl || ''}
                            onChange={(e) => onUpdatePage?.(activePage.id, {
                              style: { ...activePage.style, backgroundImageUrl: e.target.value }
                            })}
                            placeholder="https://example.com/bg.jpg"
                            className="w-full px-2 py-1 border border-gray-200 rounded text-[9px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      )}

                      {/* Glassmorphism Controls */}
                      <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Glassmorphism Overlay</span>
                          <input
                            type="checkbox"
                            checked={!!activePage.style?.glassmorphism}
                            onChange={(e) => onUpdatePage?.(activePage.id, {
                              style: { ...activePage.style, glassmorphism: e.target.checked }
                            })}
                            className="w-3.5 h-3.5 text-indigo-650 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>

                        {activePage.style?.glassmorphism && (
                          <div className="flex flex-col gap-2 mt-1 bg-white p-2 rounded-xl border border-gray-100">
                            {/* Blur Amount */}
                            <div className="flex flex-col gap-0.5">
                              <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase">
                                <span>Backdrop Blur</span>
                                <span>{activePage.style?.glassBlur ?? 10}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="40"
                                value={activePage.style?.glassBlur ?? 10}
                                onChange={(e) => onUpdatePage?.(activePage.id, {
                                  style: { ...activePage.style, glassBlur: parseInt(e.target.value) }
                                })}
                                className="w-full accent-indigo-600 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            {/* Opacity */}
                            <div className="flex flex-col gap-0.5">
                              <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase">
                                <span>Opacity</span>
                                <span>{activePage.style?.glassOpacity ?? 80}%</span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="100"
                                value={activePage.style?.glassOpacity ?? 80}
                                onChange={(e) => onUpdatePage?.(activePage.id, {
                                  style: { ...activePage.style, glassOpacity: parseInt(e.target.value) }
                                })}
                                className="w-full accent-indigo-650 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            {/* Border Color */}
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[8px] font-bold text-gray-500 uppercase">Glass Border</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={activePage.style?.glassBorderColor || '#ffffff'}
                                  onChange={(e) => onUpdatePage?.(activePage.id, {
                                    style: { ...activePage.style, glassBorderColor: e.target.value }
                                  })}
                                  className="w-4 h-4 border border-gray-200 rounded cursor-pointer shrink-0"
                                />
                                <button
                                  type="button"
                                  onClick={() => onUpdatePage?.(activePage.id, {
                                    style: { ...activePage.style, glassBorderColor: undefined }
                                  })}
                                  className="text-[8px] text-indigo-650 hover:text-indigo-850 cursor-pointer font-semibold underline"
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Curated Brand Kits */}
            <div className="space-y-3 mt-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Globe size={12} />
                Global Brand Kits
              </label>
              
              <div className="space-y-2">
                {[...BRAND_KITS, ...customBrandKits].map((kit) => (
                  <button
                    key={kit.name}
                    onClick={() => onUpdateBrandKit(kit)}
                    className={`w-full p-3 border rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      brandKit.name === kit.name ? 'border-black bg-black/5 shadow-sm font-semibold' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-900">{kit.name}</span>
                      <span className="text-[9px] text-gray-400 font-medium">Typography: {kit.fontHeading}</span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <div className="flex gap-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm shrink-0" style={{ backgroundColor: kit.primaryColor }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm shrink-0" style={{ backgroundColor: kit.secondaryColor }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm shrink-0" style={{ backgroundColor: kit.backgroundColor }} />
                      </div>
                      {customBrandKits.some(k => k.name === kit.name) && (
                        <button
                          onClick={(e) => handleRemoveCustomKit(e, kit.name)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors shrink-0 cursor-pointer"
                          title="Delete Custom Kit"
                        >
                          <Trash size={10} />
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Pairings */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                Typography Options
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Headings</span>
                  <select
                    value={brandKit.fontHeading}
                    onChange={(e) => onUpdateBrandKit({ fontHeading: e.target.value })}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white focus:outline-none cursor-pointer"
                  >
                    {[...FONTS_HEADING, ...customFontsList].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Body Copy</span>
                  <select
                    value={brandKit.fontBody}
                    onChange={(e) => onUpdateBrandKit({ fontBody: e.target.value })}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white focus:outline-none cursor-pointer"
                  >
                    {[...FONTS_BODY, ...customFontsList].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFontManagerOpen(true)}
                className="w-full py-1.5 border border-dashed border-gray-300 hover:border-black rounded-lg text-[10px] font-semibold text-gray-500 hover:text-black transition-all bg-white hover:bg-gray-55/50 cursor-pointer flex items-center justify-center gap-1 no-print"
              >
                <Plus size={11} /> Manage & Add Fonts
              </button>
            </div>

            {/* Spacing & Borders */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Spacing & Details
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Spacing Scale</span>
                  <select
                    value={brandKit.spacing}
                    onChange={(e) => onUpdateBrandKit({ spacing: e.target.value as any })}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="compact">Compact</option>
                    <option value="comfortable">Comfortable</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Border Corners</span>
                  <select
                    value={brandKit.borderRadius}
                    onChange={(e) => onUpdateBrandKit({ borderRadius: e.target.value as any })}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="sharp">Sharp (0px)</option>
                    <option value="subtle">Subtle (4px)</option>
                    <option value="medium">Medium (8px)</option>
                    <option value="pill">Pill (999px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Brand Color Modifiers */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Shield size={12} />
                Custom Brand Colors
              </label>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">Primary Theme Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brandKit.primaryColor}
                      onChange={(e) => onUpdateBrandKit({ primaryColor: e.target.value })}
                      className="w-16 px-1.5 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none text-right font-mono"
                    />
                    <input
                      type="color"
                      value={brandKit.primaryColor}
                      onChange={(e) => onUpdateBrandKit({ primaryColor: e.target.value })}
                      className="w-6 h-6 border border-gray-200 rounded cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">Secondary Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brandKit.secondaryColor}
                      onChange={(e) => onUpdateBrandKit({ secondaryColor: e.target.value })}
                      className="w-16 px-1.5 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none text-right font-mono"
                    />
                    <input
                      type="color"
                      value={brandKit.secondaryColor}
                      onChange={(e) => onUpdateBrandKit({ secondaryColor: e.target.value })}
                      className="w-6 h-6 border border-gray-200 rounded cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">Accent Highlight</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brandKit.accentColor}
                      onChange={(e) => onUpdateBrandKit({ accentColor: e.target.value })}
                      className="w-16 px-1.5 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none text-right font-mono"
                    />
                    <input
                      type="color"
                      value={brandKit.accentColor}
                      onChange={(e) => onUpdateBrandKit({ accentColor: e.target.value })}
                      className="w-6 h-6 border border-gray-200 rounded cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">Page Background</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brandKit.backgroundColor}
                      onChange={(e) => onUpdateBrandKit({ backgroundColor: e.target.value })}
                      className="w-16 px-1.5 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none text-right font-mono"
                    />
                    <input
                      type="color"
                      value={brandKit.backgroundColor}
                      onChange={(e) => onUpdateBrandKit({ backgroundColor: e.target.value })}
                      className="w-6 h-6 border border-gray-200 rounded cursor-pointer shrink-0"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveBrandKit}
                  className="w-full mt-4 py-2 border border-dashed border-gray-300 hover:border-black rounded-xl text-xs font-semibold text-gray-500 hover:text-black transition-all bg-white hover:bg-gray-50/50 cursor-pointer flex items-center justify-center gap-1.5 no-print"
                >
                  <Plus size={12} /> Save Current Brand Kit
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>

    {/* RENDER FONT MANAGER DIALOG MODAL */}
    {isFontManagerOpen && (
      <div className="fixed inset-0 bg-black/45 z-99 flex items-center justify-center p-4 backdrop-blur-xs select-none">
        <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Font Manager</h3>
            <button 
              onClick={() => setIsFontManagerOpen(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab select */}
          <div className="flex border-b border-gray-150 mt-4 text-[10px] font-bold uppercase shrink-0">
            <button
              onClick={() => setFontTab('google')}
              className={`flex-1 pb-2 border-b-2 text-center transition-all cursor-pointer ${fontTab === 'google' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              Google Fonts
            </button>
            <button
              onClick={() => setFontTab('custom')}
              className={`flex-1 pb-2 border-b-2 text-center transition-all cursor-pointer ${fontTab === 'custom' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              Custom Web Font
            </button>
            <button
              onClick={() => setFontTab('system')}
              className={`flex-1 pb-2 border-b-2 text-center transition-all cursor-pointer ${fontTab === 'system' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              System Font
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0 text-left">
            {fontTab === 'google' && (
              <div className="space-y-3 relative">
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Search Google Font</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Fredoka, DM Sans, Pacifico..."
                      value={googleFontInput}
                      onChange={(e) => setGoogleFontInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-250 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black"
                    />
                    <button
                      onClick={handleAddGoogleFont}
                      className="px-3.5 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-all"
                    >
                      Add
                    </button>
                  </div>

                  {/* Google Font Auto-complete Suggestions */}
                  {googleSuggestions.length > 0 && (
                    <div className="absolute top-[52px] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-gray-50">
                      {googleSuggestions.map(sug => (
                        <button
                          key={sug}
                          onClick={() => {
                            setGoogleFontInput(sug);
                            setGoogleSuggestions([]);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-all font-medium cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 font-medium">
                  Google Fonts are loaded dynamically over HTTPS from the Google Fonts CDN.
                </p>
              </div>
            )}

            {fontTab === 'custom' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Font Name</label>
                  <input
                    type="text"
                    placeholder="e.g. My Custom Font"
                    value={customFontName}
                    onChange={(e) => setCustomFontName(e.target.value)}
                    className="px-3 py-2 border border-gray-250 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">CSS Stylesheet URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://fonts.cdnfonts.com/css/my-custom-font"
                    value={customFontUrl}
                    onChange={(e) => setCustomFontUrl(e.target.value)}
                    className="px-3 py-2 border border-gray-250 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-black"
                  />
                </div>
                <button
                  onClick={handleAddCustomWebFont}
                  className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Register & Load Web Font
                </button>
                <p className="text-[9px] text-gray-400 font-medium">
                  Enter the URL of any CSS stylesheet containing `@font-face` declarations.
                </p>
              </div>
            )}

            {fontTab === 'system' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">System Font Family</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Segoe UI, SF Pro Display, Georgia..."
                      value={systemFontInput}
                      onChange={(e) => setSystemFontInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-250 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-black"
                    />
                    <button
                      onClick={handleAddSystemFont}
                      className="px-3.5 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 font-medium">
                  System fonts must be installed locally on your client device's OS to render correctly.
                </p>
              </div>
            )}

            {/* Installed Custom Fonts List */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Custom Fonts in Project</h4>
              {customFontsList.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic">No custom fonts added yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {customFontsList.map(font => {
                    const isHeadingActive = brandKit.fontHeading === font;
                    const isBodyActive = brandKit.fontBody === font;
                    const hasUrl = customUrlsMap[font] !== undefined;

                    return (
                      <div key={font} className="flex justify-between items-center bg-gray-50 hover:bg-gray-100/70 p-2 rounded-xl border border-gray-150 transition-all">
                        <div>
                          <span className="text-xs font-bold text-gray-800" style={{ fontFamily: font }}>{font}</span>
                          <div className="flex gap-1.5 mt-0.5">
                            {hasUrl ? (
                              <span className="text-[8px] font-bold px-1 bg-blue-50 text-blue-600 rounded">Web URL</span>
                            ) : (
                              <span className="text-[8px] font-bold px-1 bg-emerald-50 text-emerald-600 rounded">Google / System</span>
                            )}
                            {isHeadingActive && <span className="text-[8px] font-bold px-1 bg-purple-50 text-purple-600 rounded font-sans">Headings</span>}
                            {isBodyActive && <span className="text-[8px] font-bold px-1 bg-orange-50 text-orange-600 rounded font-sans">Body</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCustomFont(font)}
                          className="p-1 hover:bg-gray-200 text-gray-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                          title="Uninstall Font"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-2 shrink-0">
            <button
              onClick={() => setIsFontManagerOpen(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
