import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProposalEditor } from './components/ProposalEditor';
import { BlockProperties } from './components/BlockProperties';
import { ClientPortal } from './components/ClientPortal';
import { PresentationMode } from './components/PresentationMode';
import { CommentSystem } from './components/CommentSystem';
import { Dashboard } from './components/Dashboard';
import { DiffViewer } from './components/DiffViewer';
import { PrintSettingsModal } from './components/PrintSettingsModal';
import { storageClient } from './storageClient';
import { 
  defaultProposalData, 
  ProposalData, 
  Block, 
  Page, 
  Version, 
  BrandKit, 
  GlobalComponent,
  AppSettings,
  loadGoogleFont,
  loadCustomWebFont
} from './types';
import { 
  Play, 
  Eye, 
  Edit2, 
  RotateCcw, 
  RotateCw, 
  MessageSquare, 
  AlertCircle,
  FileCheck,
  ChevronLeft,
  RefreshCw,
  GitBranch,
  Download,
  Sliders,
  FileText
} from 'lucide-react';

const BLOCK_TEMPLATES: Record<string, Omit<Block, 'id'>> = {
  heading: {
    type: 'heading',
    layout: 'h2',
    title: 'New Section Heading',
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  text: {
    type: 'text',
    layout: 'default',
    title: 'Text Block',
    content: 'Type your paragraphs, welcome letters, or details here...',
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  'heading-text': {
    type: 'heading-text',
    layout: 'h2',
    title: 'Heading & Paragraph',
    content: 'Enter your section details and descriptive paragraphs here in one consolidated block...',
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  image: {
    type: 'image',
    layout: 'default',
    title: 'Image Showcase',
    metadata: {
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60',
      caption: 'Example illustration showing strategy analysis overview.'
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  video: {
    type: 'video',
    layout: 'default',
    title: 'Product Demo Video',
    metadata: {
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      caption: 'Overview walkthrough video.'
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  link: {
    type: 'link',
    layout: 'default',
    title: 'Visit Resource',
    metadata: {
      url: 'https://docdril.com',
      label: 'Open Docdril Portal'
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  file: {
    type: 'file',
    layout: 'default',
    title: 'Download Attachment',
    metadata: {
      url: '#',
      name: 'Project_Requirements_SOW.pdf',
      size: '2.4 MB'
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  welcome: {
    type: 'welcome',
    layout: 'default',
    title: 'Executive Summary',
    content: 'Enter introducing remarks, client context, and high-level project goals here...',
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  about: {
    type: 'about',
    layout: 'split',
    title: 'About Our Team',
    content: 'Introduce your agency background, credentials, and vision here.',
    metadata: {
      specialties: 'Design, Development, Strategy',
      industries: 'B2B SaaS, HealthTech',
      approach: 'Collaborative weekly reviews.'
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  services: {
    type: 'services',
    layout: 'cards',
    title: 'Scope of Services',
    subtitle: 'Services and deliverables outline',
    metadata: {
      services: [
        { id: 's-init', name: 'Product Branding', description: 'Logos, colors, typography rules.', deliverables: 'Brand Guidelines', revisions: '2 rounds', price: 3000 }
      ]
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  timeline: {
    type: 'timeline',
    layout: 'default',
    title: 'Project Roadmap',
    subtitle: 'Timeline milestones',
    metadata: {
      steps: [
        { title: 'Phase 1: Kickoff', duration: 'Week 1', details: 'Requirements alignment.' }
      ]
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  pricing: {
    type: 'pricing',
    layout: 'default',
    title: 'Investment Summary',
    subtitle: 'Pricing breakdown',
    metadata: {
      currency: '$',
      taxRate: 18,
      discount: 0,
      items: [
        { id: 'pi-init', name: 'Initial Design Setup', price: 3000, qty: 1, optional: false, included: true }
      ]
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  'payment-schedule': {
    type: 'payment-schedule',
    layout: 'default',
    title: 'Payment Milestones',
    metadata: {
      milestones: [
        { name: 'Upfront Deposit', trigger: 'Due on contract signing', percentage: 50 },
        { name: 'Final Handover', trigger: 'Due on project launch', percentage: 50 }
      ]
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  testimonial: {
    type: 'testimonial',
    layout: 'cards',
    title: 'Client Testimonials',
    metadata: {
      testimonials: [
        { quote: 'Working with this team was an exceptional experience.', author: 'John Doe, CTO', avatar: '' }
      ]
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  faq: {
    type: 'faq',
    layout: 'default',
    title: 'Frequently Asked Questions',
    metadata: {
      faqs: [
        { question: 'What is the standard onboarding process?', answer: 'We kickoff with a 1-hour alignment call.' }
      ]
    },
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  terms: {
    type: 'terms',
    layout: 'default',
    title: 'Terms & Conditions',
    listItems: [
      'Revision policy: Standard scope includes up to 2 review cycles.',
      'Late fees: A 5% penalty applies to invoices unpaid past 30 days.'
    ],
    conditional: { visibleTo: 'all', optional: false, included: true }
  },
  signature: {
    type: 'signature',
    layout: 'default',
    title: 'Signatures & Acceptance',
    subtitle: 'Sign below to activate project kickoff',
    conditional: { visibleTo: 'all', optional: false, included: true }
  }
};

export default function App() {
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [data, setData] = useState<ProposalData>(defaultProposalData);
  const [versions, setVersions] = useState<Version[]>([]);
  const [globalComponents, setGlobalComponents] = useState<GlobalComponent[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'editor' | 'client' | 'presentation' | 'diff' | 'dashboard'>('dashboard');
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [excludedPageIds, setExcludedPageIds] = useState<string[]>([]);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  useEffect(() => {
    if (selectedBlock) {
      setIsRightSidebarOpen(true);
    }
  }, [selectedBlock]);

  const handleSelectBlock = (block: Block | null) => {
    setSelectedBlock(block);
    if (block) {
      const page = data.pages.find(p => p.blocks.some(b => b.id === block.id));
      if (page) {
        setActivePageId(page.id);
      }
    }
  };

  // Undo / Redo History Stacks
  const historyStack = useRef<ProposalData[]>([]);
  const redoStack = useRef<ProposalData[]>([]);
  
  // Track checkpoint throttle time
  const lastCheckpointTime = useRef<number>(Date.now());

  // Update time save log
  useEffect(() => {
    const now = new Date();
    setTimeStr(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
  }, [data]);

  // Load all custom fonts and custom web font URLs on app startup
  useEffect(() => {
    try {
      const storedList = localStorage.getItem('docdril_custom_fonts');
      if (storedList) {
        const list = JSON.parse(storedList);
        list.forEach((f: string) => loadGoogleFont(f));
      }
    } catch {}

    try {
      const storedUrls = localStorage.getItem('docdril_custom_font_urls');
      if (storedUrls) {
        const urls = JSON.parse(storedUrls);
        Object.entries(urls).forEach(([name, url]) => {
          loadCustomWebFont(name, url as string);
        });
      }
    } catch {}
  }, []);

  // Load custom fonts dynamically from Google Fonts API or Custom URL storage
  useEffect(() => {
    if (data.brandKit?.fontHeading) {
      try {
        const storedUrls = localStorage.getItem('docdril_custom_font_urls');
        const urls = storedUrls ? JSON.parse(storedUrls) : {};
        if (urls[data.brandKit.fontHeading]) {
          loadCustomWebFont(data.brandKit.fontHeading, urls[data.brandKit.fontHeading]);
        } else {
          loadGoogleFont(data.brandKit.fontHeading);
        }
      } catch {
        loadGoogleFont(data.brandKit.fontHeading);
      }
    }
    if (data.brandKit?.fontBody) {
      try {
        const storedUrls = localStorage.getItem('docdril_custom_font_urls');
        const urls = storedUrls ? JSON.parse(storedUrls) : {};
        if (urls[data.brandKit.fontBody]) {
          loadCustomWebFont(data.brandKit.fontBody, urls[data.brandKit.fontBody]);
        } else {
          loadGoogleFont(data.brandKit.fontBody);
        }
      } catch {
        loadGoogleFont(data.brandKit.fontBody);
      }
    }
  }, [data.brandKit?.fontHeading, data.brandKit?.fontBody]);

  // Load active proposal from server JSON DB
  useEffect(() => {
    if (!activeProposalId) return;

    const loadProposal = async () => {
      try {
        setLoadingData(true);
        
        // Load global components
        const compList = await storageClient.listGlobalComponents();
        setGlobalComponents(compList);

        // Load proposal or master template
        let loaded: ProposalData | null;
        if (isEditingMaster) {
          loaded = await storageClient.getMasterProposal(activeProposalId);
        } else {
          loaded = await storageClient.getProposal(activeProposalId);
        }

        if (loaded) {
          // Initialize missing fields for backwards-compatibility
          if (!loaded.variables) {
            loaded.variables = [
              { key: "client_name", value: loaded.clientName || "", label: "Client Name", description: "Name of the client organization" },
              { key: "company_name", value: loaded.companyName || "", label: "Company Name", description: "Name of your creative studio" },
              { key: "project_name", value: loaded.projectName || "", label: "Project Name", description: "The title of this project" },
              { key: "date", value: loaded.date || "", label: "Date Issued", description: "The proposal issuing date" }
            ];
          }
          if (!loaded.activeBranch) loaded.activeBranch = 'main';
          if (!loaded.branches) loaded.branches = {};
          if (!loaded.branches.main) {
            loaded.branches.main = {
              projectName: loaded.projectName,
              pages: JSON.parse(JSON.stringify(loaded.pages)),
              brandKit: { ...loaded.brandKit },
              signatures: { ...loaded.signatures || {} },
              variables: [...loaded.variables]
            };
          }
          if (!loaded.checkpoints) loaded.checkpoints = [];
          if (!loaded.signatures) loaded.signatures = {};
          if (!loaded.reusableLibrary) loaded.reusableLibrary = [];
          if (!loaded.comments) loaded.comments = [];
          if (!loaded.status) loaded.status = 'draft';
          if (!loaded.brandKit) loaded.brandKit = defaultProposalData.brandKit;

          // Sync blocks with global components registry
          const syncedPages = loaded.pages.map(page => ({
            ...page,
            blocks: page.blocks.map(block => {
              if (block.globalComponentId) {
                const comp = compList.find(c => c.id === block.globalComponentId);
                if (comp) {
                  return {
                    ...block,
                    layout: comp.layout,
                    title: comp.title,
                    subtitle: comp.subtitle,
                    content: comp.content,
                    listItems: comp.listItems,
                    metadata: comp.metadata
                  };
                }
              }
              return block;
            })
          }));
          loaded.pages = syncedPages;

          setData(loaded);
          setActivePageId(loaded.pages[0]?.id || null);
          
          // Clear history stack on load
          historyStack.current = [];
          redoStack.current = [];

          // Load version history log
          const historyList = await storageClient.getVersionHistory(activeProposalId);
          setVersions(historyList);
        }
      } catch (err) {
        console.error("Error loading proposal:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadProposal();
  }, [activeProposalId, isEditingMaster]);

  // Autosave changes back to local JSON DB (debounced by 1s)
  useEffect(() => {
    if (!activeProposalId || loadingData) return;

    const debounceTimer = setTimeout(async () => {
      try {
        if (isEditingMaster) {
          await storageClient.saveMasterProposal(activeProposalId, data);
        } else {
          await storageClient.saveProposal(activeProposalId, data);
        }
      } catch (err) {
        console.error("Autosave error:", err);
      }
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [data, activeProposalId, isEditingMaster, loadingData]);

  // Autosave Checkpoints Throttling (30s interval of changes)
  useEffect(() => {
    if (!activeProposalId || loadingData || isEditingMaster) return;

    const now = Date.now();
    if (now - lastCheckpointTime.current > 30000) {
      const checkpoint = {
        id: `cp-${Math.random().toString(36).substr(2, 9)}`,
        name: 'Auto-save checkpoint',
        timestamp: new Date().toLocaleString(),
        pages: JSON.parse(JSON.stringify(data.pages)),
        brandKit: { ...data.brandKit },
        signatures: { ...data.signatures },
        variables: [...(data.variables || [])]
      };

      const updatedCheckpoints = [checkpoint, ...(data.checkpoints || [])].slice(0, 5); // max 5 checkpoints
      
      updateData({
        ...data,
        checkpoints: updatedCheckpoints
      }, true); // skip Undo stack

      lastCheckpointTime.current = now;
    }
  }, [data]);

  const updateData = (newData: ProposalData, skipHistory = false) => {
    if (!skipHistory) {
      historyStack.current.push(data);
      redoStack.current = []; // Clear redo
    }
    setData(newData);
  };

  const handleUndo = () => {
    if (historyStack.current.length === 0) return;
    const prev = historyStack.current.pop()!;
    redoStack.current.push(data);
    setData(prev);
  };

  const handleRedo = () => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    historyStack.current.push(data);
    setData(next);
  };

  // Keyboard listeners for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data]);

  const handlePrint = () => {
    setIsPrintSettingsOpen(true);
  };

  const handleConfirmPrint = (selectedPageIds: string[]) => {
    const excluded = data.pages
      .map(p => p.id)
      .filter(id => !selectedPageIds.includes(id));
    
    setExcludedPageIds(excluded);
    setIsPrintSettingsOpen(false);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setExcludedPageIds([]);
      }, 500);
    }, 150);
  };

  // 1. Outline Page Actions
  const handleAddPage = () => {
    const newPage: Page = {
      id: `page-${Math.random().toString(36).substr(2, 9)}`,
      title: `New Page`,
      blocks: []
    };
    updateData({ ...data, pages: [...data.pages, newPage] });
  };

  const handleRemovePage = (pageId: string) => {
    if (data.pages.length === 1) return;
    updateData({ ...data, pages: data.pages.filter(p => p.id !== pageId) });
  };

  const handleMovePage = (pageId: string, direction: 'up' | 'down') => {
    const index = data.pages.findIndex(p => p.id === pageId);
    if (index === -1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= data.pages.length) return;
    
    const pagesCopy = [...data.pages];
    const temp = pagesCopy[index];
    pagesCopy[index] = pagesCopy[targetIdx];
    pagesCopy[targetIdx] = temp;
    
    updateData({ ...data, pages: pagesCopy });
  };

  const handleDuplicatePage = (pageId: string) => {
    const index = data.pages.findIndex(p => p.id === pageId);
    if (index === -1) return;
    const original = data.pages[index];
    
    const clonedBlocks = original.blocks.map(b => ({
      ...b,
      id: `block-${Math.random().toString(36).substr(2, 9)}`
    }));

    const clone: Page = {
      id: `page-${Math.random().toString(36).substr(2, 9)}`,
      title: `${original.title} (Copy)`,
      blocks: clonedBlocks
    };

    const pagesCopy = [...data.pages];
    pagesCopy.splice(index + 1, 0, clone);
    updateData({ ...data, pages: pagesCopy });
  };

  const handleUpdatePage = (pageId: string, updatedFields: Partial<Page>) => {
    const updated = data.pages.map(p => {
      if (p.id !== pageId) return p;
      return { ...p, ...updatedFields };
    });
    updateData({ ...data, pages: updated });
  };

  // 2. Block Canvas Actions
  const handleAddBlock = (pageId: string, type: string) => {
    const template = BLOCK_TEMPLATES[type];
    if (!template) return;

    const newBlock: Block = {
      ...template,
      id: `block-${Math.random().toString(36).substr(2, 9)}`
    };

    const updated = data.pages.map(p => {
      if (p.id !== pageId) return p;
      return { ...p, blocks: [...p.blocks, newBlock] };
    });

    updateData({ ...data, pages: updated });
  };

  const handleInsertBlockAtPosition = (pageId: string, type: string, relativeBlockId: string, position: 'above' | 'below') => {
    const template = BLOCK_TEMPLATES[type];
    if (!template) return;

    const newBlock: Block = {
      ...template,
      id: `block-${Math.random().toString(36).substr(2, 9)}`
    };

    const updated = data.pages.map(p => {
      if (p.id !== pageId) return p;
      const index = p.blocks.findIndex(b => b.id === relativeBlockId);
      if (index === -1) {
        return { ...p, blocks: [...p.blocks, newBlock] };
      }
      const newBlocks = [...p.blocks];
      const insertIndex = position === 'above' ? index : index + 1;
      newBlocks.splice(insertIndex, 0, newBlock);
      return { ...p, blocks: newBlocks };
    });

    updateData({ ...data, pages: updated });
    setSelectedBlock(newBlock);
  };

  const handleRemoveBlock = (pageId: string, blockId: string) => {
    const updated = data.pages.map(p => {
      if (p.id !== pageId) return p;
      return { ...p, blocks: p.blocks.filter(b => b.id !== blockId) };
    });
    if (selectedBlock?.id === blockId) setSelectedBlock(null);
    updateData({ ...data, pages: updated });
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    let pageIdx = -1;
    let blockIdx = -1;

    for (let i = 0; i < data.pages.length; i++) {
      const idx = data.pages[i].blocks.findIndex(b => b.id === blockId);
      if (idx !== -1) {
        pageIdx = i;
        blockIdx = idx;
        break;
      }
    }

    if (pageIdx === -1 || blockIdx === -1) return;
    const page = data.pages[pageIdx];
    const targetIdx = direction === 'up' ? blockIdx - 1 : blockIdx + 1;

    if (targetIdx >= 0 && targetIdx < page.blocks.length) {
      const blocksCopy = [...page.blocks];
      const temp = blocksCopy[blockIdx];
      blocksCopy[blockIdx] = blocksCopy[targetIdx];
      blocksCopy[targetIdx] = temp;

      const updated = data.pages.map((p, idx) => idx === pageIdx ? { ...p, blocks: blocksCopy } : p);
      updateData({ ...data, pages: updated });
    }
  };

  const handleDuplicateBlock = (pageId: string, block: Block) => {
    const pageIdx = data.pages.findIndex(p => p.id === pageId);
    if (pageIdx === -1) return;
    const page = data.pages[pageIdx];
    const idx = page.blocks.findIndex(b => b.id === block.id);
    if (idx === -1) return;

    const clone: Block = {
      ...block,
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
      title: `${block.title} (Copy)`
    };

    const blocksCopy = [...page.blocks];
    blocksCopy.splice(idx + 1, 0, clone);

    const updated = data.pages.map((p, index) => index === pageIdx ? { ...p, blocks: blocksCopy } : p);
    updateData({ ...data, pages: updated });
  };

  const handleMoveBlockToPage = (currentPageId: string, blockId: string, targetPageId: string) => {
    const currentPage = data.pages.find(p => p.id === currentPageId);
    if (!currentPage) return;
    const block = currentPage.blocks.find(b => b.id === blockId);
    if (!block) return;

    const updatedPages = data.pages.map(page => {
      if (page.id === currentPageId) {
        return { ...page, blocks: page.blocks.filter(b => b.id !== blockId) };
      }
      if (page.id === targetPageId) {
        return { ...page, blocks: [...page.blocks, block] };
      }
      return page;
    });

    updateData({ ...data, pages: updatedPages });
    setActivePageId(targetPageId);

    setTimeout(() => {
      const el = document.getElementById(targetPageId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Reusable Content Library Actions
  const handleSaveToLibrary = (block: Block) => {
    const isAlreadySaved = data.reusableLibrary.some(b => b.id === block.id);
    if (isAlreadySaved) return;
    updateData({ ...data, reusableLibrary: [...data.reusableLibrary, { ...block }] });
  };

  const getTargetPageId = () => {
    if (activePageId && data.pages.some(p => p.id === activePageId)) {
      return activePageId;
    }
    if (selectedBlock) {
      const pageWithBlock = data.pages.find(p => p.blocks.some(b => b.id === selectedBlock.id));
      if (pageWithBlock) return pageWithBlock.id;
    }
    return data.pages[data.pages.length - 1]?.id || data.pages[0]?.id;
  };

  const handleImportBlock = (block: Block) => {
    const targetPageId = getTargetPageId();
    if (!targetPageId) return;

    const newBlock: Block = {
      ...block,
      id: `block-${Math.random().toString(36).substr(2, 9)}`
    };

    const updated = data.pages.map(p => {
      if (p.id !== targetPageId) return p;
      return { ...p, blocks: [...p.blocks, newBlock] };
    });

    updateData({ ...data, pages: updated });
  };

  // 3. Properties Panel Modifiers (with Component propagation)
  const handleUpdateBlockProperties = (blockId: string, updatedFields: Partial<Block>) => {
    let targetBlock: Block | null = null;
    for (const page of data.pages) {
      const b = page.blocks.find(x => x.id === blockId);
      if (b) {
        targetBlock = b;
        break;
      }
    }

    if (!targetBlock) return;
    const finalBlockState = { ...targetBlock, ...updatedFields };

    const updatedPages = data.pages.map(page => {
      const updatedBlocks = page.blocks.map(block => {
        if (block.id === blockId) {
          return finalBlockState;
        }
        // Component sync
        if (finalBlockState.globalComponentId && block.globalComponentId === finalBlockState.globalComponentId) {
          return {
            ...block,
            layout: finalBlockState.layout,
            title: finalBlockState.title,
            subtitle: finalBlockState.subtitle,
            content: finalBlockState.content,
            listItems: finalBlockState.listItems,
            metadata: finalBlockState.metadata
          };
        }
        return block;
      });
      return { ...page, blocks: updatedBlocks };
    });

    // Save global component database if it was edited
    if (finalBlockState.globalComponentId) {
      const updatedComp: GlobalComponent = {
        id: finalBlockState.globalComponentId,
        name: finalBlockState.componentName || 'Global Component',
        type: finalBlockState.type,
        layout: finalBlockState.layout,
        title: finalBlockState.title,
        subtitle: finalBlockState.subtitle,
        content: finalBlockState.content,
        listItems: finalBlockState.listItems,
        metadata: finalBlockState.metadata
      };
      
      storageClient.saveGlobalComponent(updatedComp).then(() => {
        storageClient.listGlobalComponents().then(setGlobalComponents);
      }).catch(err => console.error("Error saving global component:", err));
    }

    updateData({ ...data, pages: updatedPages });

    if (selectedBlock?.id === blockId) {
      setSelectedBlock(finalBlockState);
    }
  };

  const handleUpdateBrandKit = (updatedKit: Partial<BrandKit>) => {
    updateData({
      ...data,
      brandKit: { ...data.brandKit, ...updatedKit }
    });
  };

  // 4. Git Branching
  const handleCreateBranch = (branchName: string) => {
    const branchKey = branchName.toLowerCase().replace(/[^a-z0-9-]/g, '_');
    if (branchKey === 'main' || data.branches?.[branchKey]) {
      alert(`Branch "${branchName}" already exists.`);
      return;
    }

    const currentBranchState = {
      projectName: data.projectName,
      pages: JSON.parse(JSON.stringify(data.pages)),
      brandKit: { ...data.brandKit },
      signatures: { ...data.signatures },
      variables: [...data.variables]
    };

    const updatedBranches = {
      ...(data.branches || {}),
      [data.activeBranch]: currentBranchState
    };

    const newBranchState = {
      projectName: data.projectName,
      pages: JSON.parse(JSON.stringify(data.pages)),
      brandKit: { ...data.brandKit },
      signatures: {}, // reset signatures for new branch
      variables: [...data.variables]
    };

    updateData({
      ...data,
      branches: {
        ...updatedBranches,
        [branchKey]: newBranchState
      },
      activeBranch: branchKey
    });
  };

  const handleSwitchBranch = (targetBranch: string) => {
    if (targetBranch === data.activeBranch) return;

    // Save current branch head state first
    const currentBranchState = {
      projectName: data.projectName,
      pages: JSON.parse(JSON.stringify(data.pages)),
      brandKit: { ...data.brandKit },
      signatures: { ...data.signatures },
      variables: [...data.variables]
    };

    const updatedBranches = {
      ...(data.branches || {}),
      [data.activeBranch]: currentBranchState
    };

    const targetBranchState = updatedBranches[targetBranch];
    if (!targetBranchState) {
      alert(`Branch state for "${targetBranch}" not found.`);
      return;
    }

    const updatedProposal: ProposalData = {
      ...data,
      branches: updatedBranches,
      activeBranch: targetBranch,
      projectName: targetBranchState.projectName,
      pages: targetBranchState.pages,
      brandKit: targetBranchState.brandKit,
      signatures: targetBranchState.signatures,
      variables: targetBranchState.variables
    };

    updateData(updatedProposal);
  };

  // 5. Figma Reusable Components
  const handleConvertToGlobalComponent = async (block: Block, name: string) => {
    try {
      const compId = `comp-${Math.random().toString(36).substr(2, 9)}`;
      const newComp: GlobalComponent = {
        id: compId,
        name,
        type: block.type,
        layout: block.layout,
        title: block.title,
        subtitle: block.subtitle,
        content: block.content,
        listItems: block.listItems,
        metadata: block.metadata
      };

      await storageClient.saveGlobalComponent(newComp);

      handleUpdateBlockProperties(block.id, {
        globalComponentId: compId,
        componentName: name
      });

      const list = await storageClient.listGlobalComponents();
      setGlobalComponents(list);
    } catch (err) {
      alert("Error converting block: " + err);
    }
  };

  const handleInsertGlobalComponent = (comp: GlobalComponent) => {
    const targetPageId = getTargetPageId();
    if (!targetPageId) return;

    const newBlock: Block = {
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
      type: comp.type,
      layout: comp.layout,
      title: comp.title,
      subtitle: comp.subtitle,
      content: comp.content,
      listItems: comp.listItems,
      metadata: comp.metadata,
      globalComponentId: comp.id,
      componentName: comp.name,
      conditional: { visibleTo: 'all', optional: false, included: true }
    };

    updateData({
      ...data,
      pages: data.pages.map(p => p.id === targetPageId ? { ...p, blocks: [...p.blocks, newBlock] } : p)
    });
  };

  // 6. Snapshots
  const handleSaveVersion = async (name: string) => {
    if (!activeProposalId) return;
    const newVersion: Version = {
      id: `version-${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      pages: JSON.parse(JSON.stringify(data.pages)),
      brandKit: { ...data.brandKit },
      signatures: { ...data.signatures },
      variables: [...(data.variables || [])]
    };
    
    try {
      await storageClient.saveVersion(activeProposalId, newVersion);
      const list = await storageClient.getVersionHistory(activeProposalId);
      setVersions(list);
    } catch (err) {
      alert("Error saving snapshot: " + err);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!activeProposalId) return;
    try {
      await storageClient.deleteVersion(activeProposalId, versionId);
      const list = await storageClient.getVersionHistory(activeProposalId);
      setVersions(list);
    } catch (err) {
      console.error("Error deleting version snapshot:", err);
      alert("Failed to delete version snapshot.");
    }
  };

  const handleRestoreVersion = (ver: Version) => {
    updateData({
      ...data,
      pages: JSON.parse(JSON.stringify(ver.pages)),
      brandKit: { ...ver.brandKit },
      signatures: ver.signatures || {},
      variables: ver.variables || data.variables
    });
  };

  // 7. Promote to Master
  const handlePromoteToMaster = async () => {
    if (!activeProposalId) return;
    const name = prompt("Enter a template name for this Master Proposal:", data.projectName);
    if (!name) return;
    const desc = prompt("Enter description/purpose of this Master Blueprint:");
    const ind = prompt("Assign industry category (Technology, Fintech, SaaS, Creative, Healthcare, etc.):", "Technology");

    try {
      setLoadingData(true);
      await storageClient.promoteToMaster(activeProposalId, name, desc || '', ind || 'Technology');
      alert("Proposal successfully promoted to a Master Proposal! Stripped client fields are converted to smart variables.");
      setActiveView('dashboard');
    } catch (err) {
      alert("Promotion failed: " + err);
    } finally {
      setLoadingData(false);
    }
  };

  // Comments Actions
  const handleAddComment = (pageId: string, author: string, text: string) => {
    const newComment = {
      id: `comment-${Math.random().toString(36).substr(2, 9)}`,
      pageId,
      author,
      text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      resolved: false
    };
    updateData({ ...data, comments: [...data.comments, newComment] }, true);
  };

  const handleResolveComment = (commentId: string) => {
    const updated = data.comments.map(c => c.id === commentId ? { ...c, resolved: true } : c);
    updateData({ ...data, comments: updated }, true);
  };

  const handleDeleteComment = (commentId: string) => {
    updateData({ ...data, comments: data.comments.filter(c => c.id !== commentId) }, true);
  };

  const getStatusBadge = () => {
    switch (data.status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'sent':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'signed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const handleStatusChange = (status: ProposalData['status']) => {
    updateData({ ...data, status });
  };

  // RENDER VIEWS
  if (activeView === 'dashboard') {
    return (
      <Dashboard 
        onSelectProposal={(id, isMaster = false) => {
          setActiveProposalId(id);
          setIsEditingMaster(isMaster);
          setActiveView('editor');
        }}
        onCreateFromTemplate={(templateId) => {
          // handled inside the new proposal modal in Dashboard.tsx
        }}
      />
    );
  }

  if (activeView === 'diff' && activeProposalId) {
    return (
      <DiffViewer 
        proposalId={activeProposalId} 
        currentProposalData={data} 
        onExit={() => setActiveView('editor')}
      />
    );
  }

  if (activeView === 'client') {
    return (
      <ClientPortal
        data={data}
        onChange={(newData) => updateData(newData, true)}
        onPrint={handlePrint}
        excludedPageIds={excludedPageIds}
        onBackToEditor={() => setActiveView('editor')}
      />
    );
  }

  if (activeView === 'presentation') {
    return (
      <PresentationMode
        pages={data.pages}
        brandKit={data.brandKit}
        logoUrl={data.logoUrl}
        companyName={data.companyName}
        projectName={data.projectName}
        clientName={data.clientName}
        date={data.date}
        onExit={() => setActiveView('editor')}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f1f3f5] text-[#1a1a1a] font-sans overflow-hidden select-none">
      
      {/* Top designer control panel */}
      <nav className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-3 sm:px-5 md:px-8 shrink-0 shadow-sm no-print z-50">
        
        {/* Left Side Info */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-gray-600 hover:text-black flex items-center gap-1 shrink-0"
          >
            <ChevronLeft size={16} />
            <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">Studio</span>
          </button>
          
          <div className="h-6 w-px bg-gray-200"></div>
          
          <div className="flex flex-col text-left overflow-hidden">
            <h1 className="text-xs font-semibold tracking-tight text-gray-900 flex items-center gap-1">
              <span className="shrink-0">PropStudio</span>
              <span className="text-gray-400 font-normal shrink-0">/</span> 
              <input
                type="text"
                value={data.projectName}
                onChange={(e) => updateData({ ...data, projectName: e.target.value })}
                className="font-bold border-none p-0 focus:outline-none focus:ring-0 text-gray-800 w-20 sm:w-28 md:w-36 lg:w-44 xl:w-60 bg-transparent truncate"
              />
            </h1>
            <span className="hidden md:block text-[10px] text-gray-400 mt-0.5 truncate">
              Autosaved at {timeStr} • {isEditingMaster ? 'Master Blueprint' : `Branch: ${data.activeBranch}`}
            </span>
          </div>
        </div>

        {/* Middle Mode Toggles */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 border border-gray-200 rounded-xl p-0.5 shadow-inner shrink-0">
          <button
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'editor' ? 'bg-white text-black shadow-xs border border-gray-250/20' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Edit2 size={13} />
            <span className="hidden lg:inline">Editor</span>
          </button>
          <button
            onClick={() => setActiveView('client')}
            className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'client' ? 'bg-white text-black shadow-xs border border-gray-250/20' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Eye size={13} />
            <span className="hidden lg:inline">Client View</span>
          </button>
          <button
            onClick={() => setActiveView('presentation')}
            className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'presentation' ? 'bg-white text-black shadow-xs border border-gray-250/20' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Play size={13} />
            <span className="hidden lg:inline">Present</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          
          {/* Document Status Selector */}
          {!isEditingMaster && (
            <div className="flex items-center gap-1">
              <span className="hidden lg:inline text-[9px] font-bold text-gray-400 uppercase tracking-wider">Status:</span>
              <select
                value={data.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className={`px-2 py-1 sm:px-2.5 sm:py-1.5 border rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer ${getStatusBadge()}`}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="signed">Signed</option>
              </select>
            </div>
          )}

          <div className="hidden sm:block h-6 w-px bg-gray-200"></div>

          {/* Undo/Redo */}
          <div className="hidden sm:flex items-center bg-gray-50 border border-gray-150 rounded-xl p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyStack.current.length === 0}
              className="p-1 sm:p-1.5 hover:bg-white disabled:opacity-20 text-gray-500 rounded-lg transition-colors cursor-pointer"
              title="Undo (Cmd+Z)"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.current.length === 0}
              className="p-1 sm:p-1.5 hover:bg-white disabled:opacity-20 text-gray-500 rounded-lg transition-colors cursor-pointer"
              title="Redo (Cmd+Shift+Z)"
            >
              <RotateCw size={13} />
            </button>
          </div>

          {/* Comments Toggle */}
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer relative ${
              isCommentsOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare size={13} />
            <span className="hidden lg:inline">Comments</span>
            {data.comments.filter(c => !c.resolved).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                {data.comments.filter(c => !c.resolved).length}
              </span>
            )}
          </button>

          {/* Promote to master */}
          {!isEditingMaster && (
            <button
              onClick={handlePromoteToMaster}
              className="px-2 py-1.5 md:px-3 md:py-1.5 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Promote to Master"
            >
              <FileCheck size={13} />
              <span className="hidden xl:inline">Promote to Master</span>
              <span className="hidden lg:inline xl:hidden">Promote</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-2.5 py-1.5 md:px-5 md:py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-md cursor-pointer flex items-center gap-1"
            title="Export PDF"
          >
            <Download size={13} className="lg:hidden" />
            <span className="hidden lg:inline">Export PDF</span>
            <span className="hidden md:inline lg:hidden">Export</span>
          </button>
        </div>
      </nav>

      {/* Main Designer Layout Panels */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {loadingData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-[#f1f3f5]">
            <RefreshCw size={32} className="animate-spin mb-3 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-850">Syncing proposal data files...</h3>
          </div>
        ) : (
          <>
            {/* Backdrop overlay for mobile drawer states */}
            {(isLeftSidebarOpen || isRightSidebarOpen) && (
              <div 
                onClick={() => {
                  setIsLeftSidebarOpen(false);
                  setIsRightSidebarOpen(false);
                }}
                className="fixed inset-0 bg-black/25 backdrop-blur-xs z-35 lg:hidden animate-fade-in no-print"
              />
            )}

            {/* Left Sidebar Drawer Wrapper */}
            <div className={`fixed lg:relative top-16 lg:top-0 bottom-0 left-0 z-40 transition-transform duration-350 ease-out shrink-0 h-full no-print ${
              isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
              <Sidebar
                data={data}
                onChange={updateData}
                onAddPage={handleAddPage}
                onRemovePage={handleRemovePage}
                onMovePage={handleMovePage}
                onDuplicatePage={handleDuplicatePage}
                onImportBlock={handleImportBlock}
                versions={versions}
                onRestoreVersion={handleRestoreVersion}
                onSaveVersion={handleSaveVersion}
                onDeleteVersion={handleDeleteVersion}
                onGoToDashboard={() => setActiveView('dashboard')}
                globalComponents={globalComponents}
                onInsertGlobalComponent={handleInsertGlobalComponent}
                activePageId={activePageId}
                onSelectPage={setActivePageId}
              />
            </div>
            
            {/* Editor Viewport Canvas */}
            <section className="flex-1 bg-[#f1f3f5] flex flex-col items-center p-8 overflow-y-auto relative print:bg-white print:p-0 print:block">
              {data.pages.length === 0 ? (
                <div className="my-auto text-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-300 max-w-sm">
                  <AlertCircle size={32} className="mx-auto mb-2 text-indigo-500 stroke-1" />
                  <h3 className="font-semibold text-gray-800 text-xs">No pages in proposal</h3>
                  <p className="text-[10px] text-gray-400 mt-1 mb-4">You need at least one A4 canvas to start building a document.</p>
                  <button
                    onClick={handleAddPage}
                    className="px-4 py-2 bg-black text-white font-semibold rounded-lg text-[10px] uppercase tracking-wider cursor-pointer"
                  >
                    Create Canvas Page
                  </button>
                </div>
              ) : (
                <ProposalEditor
                  data={data}
                  onChange={updateData}
                  selectedBlock={selectedBlock}
                  onSelectBlock={handleSelectBlock}
                  onAddBlock={handleAddBlock}
                  onRemoveBlock={handleRemoveBlock}
                  onMoveBlock={handleMoveBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  onSelectPage={setActivePageId}
                  excludedPageIds={excludedPageIds}
                  onMoveBlockToPage={handleMoveBlockToPage}
                  onInsertBlockAtPosition={handleInsertBlockAtPosition}
                />
              )}
            </section>

            {/* Right Sidebar Drawer Wrapper (Theme Settings / Block Inspector) */}
            <div className={`fixed lg:relative top-16 lg:top-0 bottom-0 right-0 z-40 transition-transform duration-350 ease-out shrink-0 h-full no-print ${
              isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
            }`}>
              {isCommentsOpen ? (
                <CommentSystem
                  comments={data.comments}
                  onAddComment={handleAddComment}
                  onResolveComment={handleResolveComment}
                  onDeleteComment={handleDeleteComment}
                  pages={data.pages.map(p => ({ id: p.id, title: p.title }))}
                  isOpen={isCommentsOpen}
                  onClose={() => setIsCommentsOpen(false)}
                  defaultAuthor="Proposal Designer"
                />
              ) : (
                <BlockProperties
                  selectedBlock={selectedBlock}
                  onUpdateBlock={handleUpdateBlockProperties}
                  onSaveToLibrary={handleSaveToLibrary}
                  brandKit={data.brandKit}
                  onUpdateBrandKit={handleUpdateBrandKit}
                  onDeselect={() => setSelectedBlock(null)}
                  onConvertToGlobalComponent={handleConvertToGlobalComponent}
                  pages={data.pages}
                  activePageId={activePageId}
                  onUpdatePage={handleUpdatePage}
                />
              )}
            </div>

            {/* Mobile Drawer FAB Toggles */}
            <button
              onClick={() => {
                setIsLeftSidebarOpen(!isLeftSidebarOpen);
                setIsRightSidebarOpen(false);
              }}
              className={`fixed bottom-6 left-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-45 lg:hidden cursor-pointer transition-all border border-gray-100 ${
                isLeftSidebarOpen ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Document Outline"
            >
              <FileText size={18} />
            </button>
            
            <button
              onClick={() => {
                setIsRightSidebarOpen(!isRightSidebarOpen);
                setIsLeftSidebarOpen(false);
              }}
              className={`fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-45 lg:hidden cursor-pointer transition-all border border-gray-100 ${
                isRightSidebarOpen ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Design Settings"
            >
              <Sliders size={18} />
            </button>
          </>
        )}
      </main>

      {/* Print settings selection modal */}
      <PrintSettingsModal
        pages={data.pages}
        isOpen={isPrintSettingsOpen}
        onClose={() => setIsPrintSettingsOpen(false)}
        onConfirm={handleConfirmPrint}
      />
    </div>
  );
}
