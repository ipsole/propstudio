export interface BrandKit {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  fontHeading: string;
  fontBody: string;
  spacing: 'compact' | 'comfortable' | 'spacious';
  borderRadius: 'sharp' | 'subtle' | 'medium' | 'pill';
}

export interface Block {
  id: string;
  type: string; // 'cover' | 'welcome' | 'about' | 'services' | 'pricing' | 'timeline' | 'grid' | 'testimonial' | 'gallery' | 'statistics' | 'faq' | 'comparison' | 'signature' | 'payment-schedule' | 'terms'
  layout: string; // Layout variation, e.g. 'default', 'cards', 'split', 'timeline', etc.
  title: string;
  subtitle?: string;
  content?: string;
  listItems?: string[];
  metadata?: any; // Dynamic block metadata (e.g. image URLs, service columns, pricing rows)
  conditional?: {
    visibleTo: 'all' | 'client-only' | 'team-only';
    optional: boolean;
    included: boolean; // Dynamic selection by client
  };
  globalComponentId?: string; // Reference to reusable global component
  componentName?: string;
  paddingTop?: number;
  paddingBottom?: number;
  marginTop?: number;
  marginBottom?: number;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: string;
  letterSpacing?: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
}

export interface Page {
  id: string;
  title: string;
  blocks: Block[];
  style?: {
    backgroundColor?: string;
    textColor?: string;
    backgroundType?: 'solid' | 'gradient' | 'image';
    backgroundGradient?: string;
    backgroundImageUrl?: string;
    glassmorphism?: boolean;
    glassBlur?: number;
    glassOpacity?: number;
    glassBorderColor?: string;
  };
}

export interface Comment {
  id: string;
  pageId: string;
  blockId?: string;
  author: string;
  text: string;
  timestamp: string;
  resolved: boolean;
}

export interface SmartVariable {
  key: string;
  value: string;
  label: string;
  description?: string;
}

export interface GlobalComponent {
  id: string;
  name: string;
  type: string;
  layout: string;
  title: string;
  subtitle?: string;
  content?: string;
  listItems?: string[];
  metadata?: any;
}

export interface TrashItem {
  id: string;
  name: string;
  type: 'proposal' | 'master';
  deletedAt: string;
}

export interface AppSettings {
  defaultMasterProposalId?: string;
  themeMode?: 'light' | 'dark';
  customIndustries?: string[];
}

export interface BranchState {
  projectName: string;
  pages: Page[];
  brandKit: BrandKit;
  signatures: any;
  variables: SmartVariable[];
}

export interface Checkpoint {
  id: string;
  name: string;
  timestamp: string;
  pages: Page[];
  brandKit: BrandKit;
  signatures: any;
  variables: SmartVariable[];
}

export interface Version {
  id: string;
  name: string;
  timestamp: string;
  pages: Page[];
  brandKit: BrandKit;
  signatures?: any;
  variables?: SmartVariable[];
}

export interface ProposalData {
  id: string;
  projectName: string;
  clientName: string;
  companyName: string;
  date: string;
  logoUrl: string | null;
  status: 'draft' | 'sent' | 'approved' | 'signed';
  brandKit: BrandKit;
  pages: Page[];
  comments: Comment[];
  signatures: {
    clientSignature?: string;
    clientSignedName?: string;
    clientSignedDate?: string;
    clientSignedIp?: string;
    designerSignature?: string;
    designerSignedName?: string;
    designerSignedDate?: string;
  };
  reusableLibrary: Block[];
  parentId?: string; // Parent proposal relationship
  industry?: string; // Proposal collection classification
  variables: SmartVariable[];
  activeBranch: string;
  branches: Record<string, BranchState>;
  checkpoints: Checkpoint[];
  isBlueprint?: boolean;
  blueprintDescription?: string;
  isPinnedDefault?: boolean;
  isDeleted?: boolean;
}

export interface ProposalMetadata {
  id: string;
  projectName: string;
  clientName: string;
  companyName: string;
  date: string;
  status: 'draft' | 'sent' | 'approved' | 'signed';
  industry?: string;
  parentId?: string;
  activeBranch: string;
  isBlueprint?: boolean;
  isPinnedDefault?: boolean;
  lastUpdated: string;
}


export const BRAND_KITS: BrandKit[] = [
  {
    name: "Obsidian & Ivory",
    primaryColor: "#000000",
    secondaryColor: "#4b5563",
    accentColor: "#10b981",
    textColor: "#111827",
    backgroundColor: "#ffffff",
    fontHeading: "Space Grotesk",
    fontBody: "Inter",
    spacing: "comfortable",
    borderRadius: "subtle"
  },
  {
    name: "Editorial Vogue",
    primaryColor: "#1c1917",
    secondaryColor: "#78716c",
    accentColor: "#d97706",
    textColor: "#1c1917",
    backgroundColor: "#fafaf9",
    fontHeading: "Playfair Display",
    fontBody: "Lora",
    spacing: "spacious",
    borderRadius: "sharp"
  },
  {
    name: "Nordic Minimal",
    primaryColor: "#2e3440",
    secondaryColor: "#4c566a",
    accentColor: "#88c0d0",
    textColor: "#2e3440",
    backgroundColor: "#f8fafc",
    fontHeading: "Outfit",
    fontBody: "Inter",
    spacing: "comfortable",
    borderRadius: "subtle"
  },
  {
    name: "Sahara Sand",
    primaryColor: "#451a03",
    secondaryColor: "#b45309",
    accentColor: "#14b8a6",
    textColor: "#27272a",
    backgroundColor: "#fdfbf7",
    fontHeading: "Syne",
    fontBody: "Manrope",
    spacing: "comfortable",
    borderRadius: "medium"
  },
  {
    name: "Midnight Royal",
    primaryColor: "#1e3a8a",
    secondaryColor: "#1d4ed8",
    accentColor: "#f59e0b",
    textColor: "#0f172a",
    backgroundColor: "#ffffff",
    fontHeading: "Space Grotesk",
    fontBody: "Inter",
    spacing: "comfortable",
    borderRadius: "medium"
  },
  {
    name: "Creative Blush",
    primaryColor: "#334155",
    secondaryColor: "#64748b",
    accentColor: "#db2777",
    textColor: "#1e293b",
    backgroundColor: "#fffbfb",
    fontHeading: "Space Grotesk",
    fontBody: "Open Sans",
    spacing: "compact",
    borderRadius: "pill"
  },
  {
    name: "Forest Emerald",
    primaryColor: "#064e3b",
    secondaryColor: "#047857",
    accentColor: "#fbbf24",
    textColor: "#062f21",
    backgroundColor: "#fafdfb",
    fontHeading: "Space Grotesk",
    fontBody: "Inter",
    spacing: "comfortable",
    borderRadius: "medium"
  },
  {
    name: "Swiss Neue",
    primaryColor: "#0f172a",
    secondaryColor: "#334155",
    accentColor: "#ef4444",
    textColor: "#0f172a",
    backgroundColor: "#fafafa",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    spacing: "comfortable",
    borderRadius: "subtle"
  },
  {
    name: "Classical Muse",
    primaryColor: "#2d1a47",
    secondaryColor: "#6b21a8",
    accentColor: "#eab308",
    textColor: "#1e1b4b",
    backgroundColor: "#fbfbfe",
    fontHeading: "Cinzel",
    fontBody: "Merriweather",
    spacing: "spacious",
    borderRadius: "subtle"
  },
  {
    name: "Terracotta Clay",
    primaryColor: "#7c2d12",
    secondaryColor: "#9a3412",
    accentColor: "#14b8a6",
    textColor: "#27272a",
    backgroundColor: "#fffdfa",
    fontHeading: "Space Grotesk",
    fontBody: "Inter",
    spacing: "comfortable",
    borderRadius: "sharp"
  },
  {
    name: "Cyber Punk",
    primaryColor: "#111827",
    secondaryColor: "#6b21a8",
    accentColor: "#06b6d4",
    textColor: "#f3f4f6",
    backgroundColor: "#030712",
    fontHeading: "Space Grotesk",
    fontBody: "Inter",
    spacing: "comfortable",
    borderRadius: "medium"
  }
];

export const defaultProposalData: ProposalData = {
  id: "default-proposal",
  projectName: "Strategic Brand Identity & Platform Design",
  clientName: "Acme Corporation",
  companyName: "Docdril Creative Studio",
  date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  logoUrl: null,
  status: "draft",
  brandKit: BRAND_KITS[0],
  comments: [],
  signatures: {},
  reusableLibrary: [],
  variables: [
    { key: "client_name", value: "Acme Corporation", label: "Client Name", description: "Name of the client organization" },
    { key: "company_name", value: "Docdril Creative Studio", label: "Company Name", description: "Name of your creative studio" },
    { key: "project_name", value: "Strategic Brand Identity & Platform Design", label: "Project Name", description: "The title of this project" },
    { key: "date", value: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), label: "Date Issued", description: "The proposal issuing date" }
  ],
  activeBranch: "main",
  branches: {},
  checkpoints: [],
  pages: [
    {
      id: "page-cover",
      title: "Cover Page",
      blocks: [
        {
          id: "block-cover",
          type: "cover",
          layout: "split",
          title: "Strategic Brand Identity",
          subtitle: "A comprehensive design proposal for {{client_name}}",
          content: "Prepared by {{company_name}}",
          conditional: { visibleTo: "all", optional: false, included: true }
        }
      ]
    },
    {
      id: "page-welcome",
      title: "Introduction",
      blocks: [
        {
          id: "block-welcome-text",
          type: "welcome",
          layout: "default",
          title: "Executive Summary",
          content: "Dear {{client_name}} Team,\n\nWe are absolutely thrilled to present this proposal for your upcoming brand expansion. Based on our preliminary discussions, we understand you are looking for a cohesive visual language and a robust platform build to support your growing market share.\n\nOur team has successfully executed dozens of similar projects, and we bring a research-driven, design-forward approach to every engagement. We look forward to partnering with you on this journey.\n\nWarmly,\nThe {{company_name}} Team",
          conditional: { visibleTo: "all", optional: false, included: true }
        },
        {
          id: "block-about",
          type: "about",
          layout: "split",
          title: "About {{company_name}}",
          content: "{{company_name}} is a premier creative and digital agency dedicated to elevating brands through innovative design and full-stack engineering.",
          metadata: {
            specialties: "Video Production, UI/UX Design, Full-Stack Engineering, Digital Marketing",
            industries: "Tech, Fintech, B2B SaaS, E-Commerce",
            approach: "User-centered, data-informed iterations with weekly milestone demos."
          },
          conditional: { visibleTo: "all", optional: false, included: true }
        }
      ]
    },
    {
      id: "page-services",
      title: "Our Services",
      blocks: [
        {
          id: "block-services-list",
          type: "services",
          layout: "cards",
          title: "Scope of Services",
          subtitle: "Tailored solutions for {{client_name}}'s visual and technical needs",
          metadata: {
            services: [
              {
                id: "s1",
                name: "Brand Strategy & Visual Identity",
                description: "Competitor research, brand guidelines, color palettes, logotype, and typeface guidelines.",
                deliverables: "Brand Book PDF, Vector Logo files, Social templates",
                revisions: "3 rounds",
                price: 5000
              },
              {
                id: "s2",
                name: "Custom Platform Development",
                description: "Next.js responsive website integration, customized CMS setup, analytics, and speed optimization.",
                deliverables: "Production codebase, CMS login, staging access",
                revisions: "2 rounds",
                price: 12500
              }
            ]
          },
          conditional: { visibleTo: "all", optional: false, included: true }
        }
      ]
    },
    {
      id: "page-timeline",
      title: "Project Roadmap",
      blocks: [
        {
          id: "block-timeline-steps",
          type: "timeline",
          layout: "default",
          title: "Milestone Roadmap",
          subtitle: "A step-by-step path to project completion",
          metadata: {
            steps: [
              { title: "Phase 1: Discovery & Strategy", duration: "Weeks 1-2", details: "Market research, typography selections, wireframing reviews." },
              { title: "Phase 2: Visual Execution", duration: "Weeks 3-5", details: "High-fidelity mockups, brand assets compilation, interactive prototypes." },
              { title: "Phase 3: Development & Integration", duration: "Weeks 6-9", details: "Core UI implementation, API setups, responsive testing." },
              { title: "Phase 4: QA & Deployment", duration: "Week 10", details: "SEO analysis, security checks, final site launch." }
            ]
          },
          conditional: { visibleTo: "all", optional: false, included: true }
        }
      ]
    },
    {
      id: "page-pricing",
      title: "Investment Detail",
      blocks: [
        {
          id: "block-pricing-table",
          type: "pricing",
          layout: "default",
          title: "Financial Investment",
          subtitle: "Transparent pricing breakdown with tax handling",
          metadata: {
            currency: "$",
            taxRate: 18, // 18% GST/VAT
            discount: 0, // No default discount
            items: [
              { id: "pi1", name: "Brand Identity Design", price: 5000, qty: 1, optional: false, included: true },
              { id: "pi2", name: "Full-Stack Development Package", price: 12500, qty: 1, optional: false, included: true },
              { id: "pi3", name: "Ongoing Monthly Maintenance", price: 1500, qty: 1, optional: true, included: false } // Optional service!
            ]
          },
          conditional: { visibleTo: "all", optional: false, included: true }
        },
        {
          id: "block-payment-schedule",
          type: "payment-schedule",
          layout: "default",
          title: "Payment Schedule",
          metadata: {
            milestones: [
              { name: "Upfront Deposit (50%)", trigger: "Due on proposal approval", percentage: 50 },
              { name: "Development Kickoff (25%)", trigger: "Upon design guidelines approval", percentage: 25 },
              { name: "Project Completion (25%)", trigger: "Prior to deployment & file handover", percentage: 25 }
            ]
          },
          conditional: { visibleTo: "all", optional: false, included: true }
        }
      ]
    },
    {
      id: "page-faq",
      title: "FAQ & Proof",
      blocks: [
        {
          id: "block-testimonials",
          type: "testimonial",
          layout: "cards",
          title: "What Our Clients Say",
          metadata: {
            testimonials: [
              { quote: "{{company_name}} completely revitalized our product branding. The feedback loop was fast and the design quality was world-class.", author: "Jane Miller, CEO at FinTech Solutions", avatar: "" },
              { quote: "Our site traffic increased by 65% within two months of releasing the new portal built by {{company_name}}.", author: "David Chen, VP of Marketing at CloudRetail", avatar: "" }
            ]
          },
          conditional: { visibleTo: "all", optional: false, included: true }
        },
        {
          id: "block-faq",
          type: "faq",
          layout: "default",
          title: "Frequently Asked Questions",
          metadata: {
            faqs: [
              { question: "What happens if we need more revisions?", answer: "Extra revisions are billed at our standard designer hourly rate of $100/hr, with advance approval." },
              { question: "Do we own the full intellectual property?", answer: "Yes, 100% intellectual property ownership transfers to you automatically upon receipt of the final payment." }
            ]
          },
          conditional: { visibleTo: "all", optional: false, included: true }
        }
      ]
    },
    {
      id: "page-signatures",
      title: "Signatures",
      blocks: [
        {
          id: "block-terms",
          type: "terms",
          layout: "default",
          title: "Terms & Conditions",
          listItems: [
            "Revision Policy: Additional revisions beyond the agreed scope will be billed hourly.",
            "Timeline: contingent upon timely feedback from the client team.",
            "Client Assets: Brand materials and copywriting copy must be delivered on schedule.",
            "Payment Policy: Late payments may incur a 5% monthly compounding fee."
          ],
          conditional: { visibleTo: "all", optional: false, included: true }
        },
        {
          id: "block-signature",
          type: "signature",
          layout: "default",
          title: "Acceptance of Proposal",
          subtitle: "Please review and complete signatures to initiate development.",
          conditional: { visibleTo: "all", optional: false, included: true }
        }
      ]
    }
  ]
};

export function resolveVariables(text: string, variables: SmartVariable[]): string {
  if (!text) return '';
  let result = text;
  for (const v of variables || []) {
    const escapedKey = v.key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'gi');
    result = result.replace(regex, v.value || '');
  }
  return result;
}

const escapeRegExp = (str: string): string => {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export function stripClientSpecificData(proposal: ProposalData): ProposalData {
  const stripped = JSON.parse(JSON.stringify(proposal)) as ProposalData;
  const clientName = proposal.clientName || 'Client';
  const companyName = proposal.companyName || 'Company';
  
  stripped.clientName = '{{client_name}}';
  stripped.companyName = '{{company_name}}';
  
  const escapedClient = escapeRegExp(clientName);
  const escapedCompany = escapeRegExp(companyName);

  stripped.projectName = proposal.projectName.replace(new RegExp(escapedClient, 'gi'), '{{client_name}}');
  stripped.date = '{{date}}';
  stripped.signatures = {};
  
  const vars: SmartVariable[] = [
    { key: "client_name", value: clientName, label: "Client Name", description: "Name of the client organization" },
    { key: "company_name", value: companyName, label: "Company Name", description: "Name of your creative studio" },
    { key: "project_name", value: proposal.projectName, label: "Project Name", description: "The title of this project" },
    { key: "date", value: proposal.date, label: "Date Issued", description: "The proposal issuing date" }
  ];
  
  stripped.variables = [...vars, ...(proposal.variables || []).filter(v => !['client_name', 'company_name', 'project_name', 'date'].includes(v.key))];
  
  const replaceStr = (str: string) => {
    if (!str) return str;
    let res = str;
    res = res.replace(new RegExp(escapedClient, 'gi'), '{{client_name}}');
    res = res.replace(new RegExp(escapedCompany, 'gi'), '{{company_name}}');
    return res;
  };
  
  stripped.pages = stripped.pages.map(page => ({
    ...page,
    title: replaceStr(page.title),
    blocks: page.blocks.map(block => {
      const b = { ...block };
      b.title = replaceStr(b.title);
      if (b.subtitle) b.subtitle = replaceStr(b.subtitle);
      if (b.content) b.content = replaceStr(b.content);
      if (b.listItems) b.listItems = b.listItems.map(item => replaceStr(item));
      
      if (b.metadata) {
        if (b.metadata.services) {
          b.metadata.services = b.metadata.services.map((s: any) => ({
            ...s,
            name: replaceStr(s.name),
            description: replaceStr(s.description),
            deliverables: replaceStr(s.deliverables)
          }));
        }
        if (b.metadata.items) {
          b.metadata.items = b.metadata.items.map((i: any) => ({
            ...i,
            name: replaceStr(i.name)
          }));
        }
        if (b.metadata.steps) {
          b.metadata.steps = b.metadata.steps.map((st: any) => ({
            ...st,
            title: replaceStr(st.title),
            details: replaceStr(st.details)
          }));
        }
        if (b.metadata.testimonials) {
          b.metadata.testimonials = b.metadata.testimonials.map((t: any) => ({
            ...t,
            quote: replaceStr(t.quote),
            author: replaceStr(t.author)
          }));
        }
        if (b.metadata.faqs) {
          b.metadata.faqs = b.metadata.faqs.map((f: any) => ({
            ...f,
            question: replaceStr(f.question),
            answer: replaceStr(f.answer)
          }));
        }
      }
      return b;
    })
  }));
  
  stripped.isBlueprint = true;
  return stripped;
}

export const loadGoogleFont = (fontName: string) => {
  if (typeof document === 'undefined') return;
  if (!fontName) return;
  const safeList = ['system-ui', 'Georgia', 'Arial', 'Times New Roman', 'Helvetica', 'sans-serif', 'serif', 'monospace', 'inherit'];
  if (safeList.includes(fontName)) return;

  const id = `gfont-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

export const loadCustomWebFont = (fontName: string, url: string) => {
  if (typeof document === 'undefined') return;
  if (!fontName || !url) return;

  const id = `customfont-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
};

export const sanitizeUrl = (url: string | undefined): string => {
  if (!url) return '#';
  const trimmed = url.trim();
  if (!trimmed) return '#';
  if (/^(f|ht)tps?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export function getPageBackgroundStyle(pageStyle: any, defaultBgColor: string): any {
  if (!pageStyle) return { backgroundColor: defaultBgColor };
  
  const styles: any = {};
  const type = pageStyle.backgroundType || 'solid';
  
  if (type === 'solid') {
    styles.backgroundColor = pageStyle.backgroundColor || defaultBgColor;
    styles.backgroundImage = 'none';
  } else if (type === 'gradient') {
    styles.backgroundImage = pageStyle.backgroundGradient || 'linear-gradient(135deg, #e0e7ff 0%, #ffffff 100%)';
  } else if (type === 'image') {
    if (pageStyle.backgroundImageUrl) {
      styles.backgroundImage = `url(${pageStyle.backgroundImageUrl})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    } else {
      styles.backgroundColor = defaultBgColor;
      styles.backgroundImage = 'none';
    }
  }
  
  // Glassmorphism effects
  if (pageStyle.glassmorphism) {
    const blurVal = pageStyle.glassBlur ?? 10;
    const opacityVal = (pageStyle.glassOpacity ?? 80) / 100;
    const borderCol = pageStyle.glassBorderColor || 'rgba(255,255,255,0.2)';
    
    if (type === 'solid') {
      const solidBg = pageStyle.backgroundColor || defaultBgColor;
      styles.backgroundColor = solidBg.startsWith('#') 
        ? hexToRgba(solidBg, opacityVal) 
        : `rgba(255, 255, 255, ${opacityVal})`;
    }
    
    styles.backdropFilter = `blur(${blurVal}px)`;
    styles.WebkitBackdropFilter = `blur(${blurVal}px)`;
    styles.border = `1px solid ${borderCol}`;
    styles.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.07)';
  }
  
  return styles;
}

function hexToRgba(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex.substring(0, 1) + cleanHex.substring(0, 1), 16) || 255;
    const g = parseInt(cleanHex.substring(1, 2) + cleanHex.substring(1, 2), 16) || 255;
    const b = parseInt(cleanHex.substring(2, 3) + cleanHex.substring(2, 3), 16) || 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

