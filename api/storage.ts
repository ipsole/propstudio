import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { 
  ProposalData, 
  ProposalMetadata, 
  GlobalComponent, 
  TrashItem, 
  AppSettings, 
  Version,
  defaultProposalData,
  stripClientSpecificData
} from './types.ts';

export interface StorageProvider {
  listProposals(): Promise<ProposalMetadata[]>;
  getProposal(id: string): Promise<ProposalData | null>;
  saveProposal(id: string, data: ProposalData): Promise<void>;
  deleteProposal(id: string): Promise<void>;
  duplicateProposal(id: string, newClientName?: string, newCompanyName?: string, newProjectName?: string): Promise<ProposalData>;
  
  getVersionHistory(proposalId: string): Promise<Version[]>;
  saveVersion(proposalId: string, version: Version): Promise<void>;
  deleteVersion(proposalId: string, versionId: string): Promise<void>;
  
  listMasterProposals(): Promise<ProposalMetadata[]>;
  getMasterProposal(id: string): Promise<ProposalData | null>;
  saveMasterProposal(id: string, data: ProposalData): Promise<void>;
  deleteMasterProposal(id: string): Promise<void>;
  promoteToMaster(proposalId: string, name: string, description: string, industry: string): Promise<ProposalData>;
  
  listGlobalComponents(): Promise<GlobalComponent[]>;
  saveGlobalComponent(component: GlobalComponent): Promise<void>;
  deleteGlobalComponent(id: string): Promise<void>;
  
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  
  getTrash(): Promise<TrashItem[]>;
  restoreFromTrash(id: string): Promise<void>;
  permanentlyDelete(id: string): Promise<void>;
  getDatabaseSize(): Promise<number>;
}

export class JSONStorageProvider implements StorageProvider {
  private baseDir: string;
  private proposalsDir: string;
  private mastersDir: string;
  private historyDir: string;
  private trashDir: string;
  private componentsFile: string;
  private settingsFile: string;
  private trashLogFile: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'data-store');
    this.proposalsDir = path.join(this.baseDir, 'proposals');
    this.mastersDir = path.join(this.baseDir, 'masters');
    this.historyDir = path.join(this.baseDir, 'history');
    this.trashDir = path.join(this.baseDir, 'trash');
    this.componentsFile = path.join(this.baseDir, 'global-components.json');
    this.settingsFile = path.join(this.baseDir, 'settings.json');
    this.trashLogFile = path.join(this.baseDir, 'trash.json');
  }

  public async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.mkdir(this.proposalsDir, { recursive: true });
    await fs.mkdir(this.mastersDir, { recursive: true });
    await fs.mkdir(this.historyDir, { recursive: true });
    await fs.mkdir(this.trashDir, { recursive: true });
    
    // Create empty array/object files if they don't exist
    await this.initFile(this.componentsFile, '[]');
    await this.initFile(this.settingsFile, '{}');
    await this.initFile(this.trashLogFile, '[]');

    // Seed default proposal if catalog is empty
    try {
      const proposalFiles = await fs.readdir(this.proposalsDir);
      if (proposalFiles.filter(f => f.endsWith('.json')).length === 0) {
        const defaultCopy = { ...defaultProposalData };
        defaultCopy.id = 'default-proposal';
        defaultCopy.industry = 'Technology';
        await this.writeJSON(path.join(this.proposalsDir, 'default-proposal.json'), defaultCopy);
      }
    } catch (e) {
      console.error("Failed to seed default proposal:", e);
    }

    // Seed default master proposal blueprints if missing
    try {
      await this.seedMasterTemplates();
    } catch (e) {
      console.error("Failed to seed master proposals:", e);
    }
  }

  private async seedMasterTemplates(): Promise<void> {
    const fintechBlueprint: ProposalData = {
      id: "master-fintech",
      projectName: "Merchant Payment Rails & Compliance Setup",
      clientName: "{{client_name}}",
      companyName: "{{company_name}}",
      date: "{{date}}",
      logoUrl: null,
      status: "draft",
      brandKit: {
        name: "Midnight Royal",
        primaryColor: "#1e1b4b",
        secondaryColor: "#4b5563",
        accentColor: "#10b981",
        textColor: "#111827",
        backgroundColor: "#ffffff",
        fontHeading: "Outfit",
        fontBody: "Inter",
        spacing: "comfortable",
        borderRadius: "subtle"
      },
      pages: [
        {
          id: "page-f1",
          title: "Cover Page",
          blocks: [
            {
              id: "block-f-cover",
              type: "cover",
              layout: "split",
              title: "Merchant Payment Rails & Compliance Setup",
              subtitle: "Fintech integration proposal for {{client_name}}",
              content: "Prepared by {{company_name}}",
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        },
        {
          id: "page-f2",
          title: "Executive Summary",
          blocks: [
            {
              id: "block-f-welcome",
              type: "welcome",
              layout: "default",
              title: "Executive Overview",
              content: "Dear {{client_name}} Team,\n\nIn transaction systems, compliance and uptime are critical. This proposal outlines the roadmap to implement secure, PCI-compliant merchant gateway integrations and settlement rails designed for high transaction volumes.",
              conditional: { visibleTo: "all", optional: false, included: true }
            },
            {
              id: "block-f-services",
              type: "services",
              layout: "cards",
              title: "Merchant Settlement Services",
              subtitle: "Scope of Fintech engineering & audits",
              metadata: {
                services: [
                  { id: 's-f1', name: 'Gateway Integration', description: 'API linkage for settlement channels.', deliverables: 'API Endpoints', revisions: '2 rounds', price: 15000 },
                  { id: 's-f2', name: 'PCI-DSS Compliance Audit', description: 'Security verification and reports.', deliverables: 'Audit Reports', revisions: '1 round', price: 10000 },
                  { id: 's-f3', name: 'Custom Ledger Sync', description: 'Double-entry books synchronization.', deliverables: 'Sync Script', revisions: '2 rounds', price: 8000 }
                ]
              },
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        },
        {
          id: "page-f3",
          title: "Roadmap & Investment",
          blocks: [
            {
              id: "block-f-timeline",
              type: "timeline",
              layout: "default",
              title: "Implementation Roadmap",
              subtitle: "Project timeline phases",
              metadata: {
                steps: [
                  { title: "Phase 1: Sandboxed gateway setup", duration: "Weeks 1-2", details: "Initial API gateway configurations." },
                  { title: "Phase 2: Ledger integration", duration: "Weeks 3-4", details: "Double-entry books sync code." },
                  { title: "Phase 3: Production launch", duration: "Week 5", details: "Gateway validation & live checks." }
                ]
              },
              conditional: { visibleTo: "all", optional: false, included: true }
            },
            {
              id: "block-f-pricing",
              type: "pricing",
              layout: "default",
              title: "Project Pricing Breakdown",
              subtitle: "Investment totals",
              metadata: {
                currency: "₹",
                taxRate: 15,
                items: [
                  { id: "f-p1", name: "Gateway integration", price: 15000, qty: 1, optional: false, included: true },
                  { id: "f-p2", name: "PCI-DSS compliance audit", price: 10000, qty: 1, optional: false, included: true },
                  { id: "f-p3", name: "Custom Ledger sync integration", price: 8000, qty: 1, optional: false, included: true }
                ]
              },
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        },
        {
          id: "page-f4",
          title: "Signatures",
          blocks: [
            {
              id: "block-f-sign",
              type: "signature",
              layout: "default",
              title: "Fintech integration agreement",
              subtitle: "Sign below to begin integration",
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        }
      ],
      comments: [],
      signatures: {},
      reusableLibrary: [],
      variables: [
        { key: "client_name", value: "Client name", label: "Client Name", description: "Name of the client organization" },
        { key: "company_name", value: "Docdril Creative Studio", label: "Company Name", description: "Name of your creative studio" },
        { key: "project_name", value: "Merchant Payment Rails & Compliance Setup", label: "Project Name", description: "The title of this project" },
        { key: "date", value: "July 19, 2026", label: "Date Issued", description: "The proposal issuing date" }
      ],
      activeBranch: "main",
      branches: {},
      checkpoints: [],
      isBlueprint: true,
      blueprintDescription: "Enterprise integration blueprint for merchant gateways, PCI-DSS compliance audits, and custom ledger pipelines.",
      industry: "Fintech"
    };

    const saasBlueprint: ProposalData = {
      id: "master-saas",
      projectName: "Enterprise SaaS Application Build & Roadmap",
      clientName: "{{client_name}}",
      companyName: "{{company_name}}",
      date: "{{date}}",
      logoUrl: null,
      status: "draft",
      brandKit: {
        name: "Midnight Royal",
        primaryColor: "#0f172a",
        secondaryColor: "#4b5563",
        accentColor: "#3b82f6",
        textColor: "#111827",
        backgroundColor: "#ffffff",
        fontHeading: "Space Grotesk",
        fontBody: "Inter",
        spacing: "comfortable",
        borderRadius: "subtle"
      },
      pages: [
        {
          id: "page-s1",
          title: "Cover Page",
          blocks: [
            {
              id: "block-s-cover",
              type: "cover",
              layout: "split",
              title: "Enterprise SaaS Platform Development",
              subtitle: "Multi-tenant scalability roadmap for {{client_name}}",
              content: "Prepared by {{company_name}}",
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        },
        {
          id: "page-s2",
          title: "Architecture & Scope",
          blocks: [
            {
              id: "block-s-welcome",
              type: "welcome",
              layout: "default",
              title: "SaaS Overview",
              content: "Dear {{client_name}} Team,\n\nBuilding a SaaS application requires strong foundations in API gateways, multi-tenant databases, and seamless onboarding flows. This proposal outlines our architectural approach to deliver a secure and highly scalable platform.",
              conditional: { visibleTo: "all", optional: false, included: true }
            },
            {
              id: "block-s-services",
              type: "services",
              layout: "cards",
              title: "Development Scope",
              subtitle: "SaaS engineering phases",
              metadata: {
                services: [
                  { id: 's-s1', name: 'Database & Multi-tenancy', description: 'PostgreSQL schema with tenant row-level security.', deliverables: 'Db Schemas', revisions: '1 round', price: 12000 },
                  { id: 's-s2', name: 'API Gateway & Services', description: 'RESTful API infrastructure with OAuth2.', deliverables: 'Core APIs', revisions: '2 rounds', price: 15000 },
                  { id: 's-s3', name: 'Frontend Dashboards', description: 'React-based admin and customer panels.', deliverables: 'Admin Panels', revisions: '2 rounds', price: 18000 }
                ]
              },
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        },
        {
          id: "page-s3",
          title: "Roadmap & Signatures",
          blocks: [
            {
              id: "block-s-timeline",
              type: "timeline",
              layout: "default",
              title: "Platform Roadmap",
              subtitle: "Sprint milestones",
              metadata: {
                steps: [
                  { title: "Sprint 1-2: Core Backend Architecture", duration: "Weeks 1-4", details: "Database setups & authentication." },
                  { title: "Sprint 3-4: Feature Development", duration: "Weeks 5-8", details: "Tenant dashboards & API setups." },
                  { title: "Sprint 5: Staging Verification", duration: "Week 9-10", details: "Staging launch and performance audits." }
                ]
              },
              conditional: { visibleTo: "all", optional: false, included: true }
            },
            {
              id: "block-s-sign",
              type: "signature",
              layout: "default",
              title: "Agreement & Execution",
              subtitle: "Sign to initiate platform build",
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        }
      ],
      comments: [],
      signatures: {},
      reusableLibrary: [],
      variables: [
        { key: "client_name", value: "Client name", label: "Client Name", description: "Name of the client organization" },
        { key: "company_name", value: "Docdril Creative Studio", label: "Company Name", description: "Name of your creative studio" },
        { key: "project_name", value: "Enterprise SaaS Application Build & Roadmap", label: "Project Name", description: "The title of this project" },
        { key: "date", value: "July 19, 2026", label: "Date Issued", description: "The proposal issuing date" }
      ],
      activeBranch: "main",
      branches: {},
      checkpoints: [],
      isBlueprint: true,
      blueprintDescription: "Enterprise scale application development blueprint covering API architectures, multi-tenant database designs, and SaaS roadmap.",
      industry: "SaaS"
    };

    const creativeBlueprint: ProposalData = {
      id: "master-creative",
      projectName: "Visual Brand Identity & Collaterals Design",
      clientName: "{{client_name}}",
      companyName: "{{company_name}}",
      date: "{{date}}",
      logoUrl: null,
      status: "draft",
      brandKit: {
        name: "Terra Cotta",
        primaryColor: "#c2410c",
        secondaryColor: "#4b5563",
        accentColor: "#fb923c",
        textColor: "#111827",
        backgroundColor: "#ffffff",
        fontHeading: "Playfair Display",
        fontBody: "Inter",
        spacing: "comfortable",
        borderRadius: "subtle"
      },
      pages: [
        {
          id: "page-c1",
          title: "Cover Page",
          blocks: [
            {
              id: "block-c-cover",
              type: "cover",
              layout: "split",
              title: "Visual Brand Identity & Art Direction",
              subtitle: "Brand refresh and style design for {{client_name}}",
              content: "Prepared by {{company_name}}",
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        },
        {
          id: "page-c2",
          title: "Brand Strategy & Scope",
          blocks: [
            {
              id: "block-c-welcome",
              type: "welcome",
              layout: "default",
              title: "Creative Strategy",
              content: "Dear {{client_name}} Team,\n\nA brand is more than a logo; it is the sum of emotional experiences and visual guidelines that define consumer interaction. This proposal covers art direction, typography guidelines, and marketing collateral design to elevate your brand presence.",
              conditional: { visibleTo: "all", optional: false, included: true }
            },
            {
              id: "block-c-services",
              type: "services",
              layout: "cards",
              title: "Visual Scope of Services",
              subtitle: "Brand identity deliverables",
              metadata: {
                services: [
                  { id: 's-c1', name: 'Logo Redesign', description: 'Modern, high-fidelity vector logo options.', deliverables: 'Vector Files', revisions: '3 rounds', price: 5000 },
                  { id: 's-c2', name: 'Brand Style Guide', description: 'Typography rules, color schemes, asset templates.', deliverables: 'Brand Book PDF', revisions: '2 rounds', price: 3000 },
                  { id: 's-c3', name: 'Social Media Assets', description: 'Custom canvas templates and profiles.', deliverables: 'Figma templates', revisions: '2 rounds', price: 2000 }
                ]
              },
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        },
        {
          id: "page-c3",
          title: "Investment & Approval",
          blocks: [
            {
              id: "block-c-pricing",
              type: "pricing",
              layout: "default",
              title: "Creative Investment Summary",
              subtitle: "Project costs",
              metadata: {
                currency: "₹",
                taxRate: 18,
                items: [
                  { id: "c-p1", name: "Logo Redesign", price: 5000, qty: 1, optional: false, included: true },
                  { id: "c-p2", name: "Brand Style Guide", price: 3000, qty: 1, optional: false, included: true },
                  { id: "c-p3", name: "Social Media templates", price: 2000, qty: 1, optional: false, included: true }
                ]
              },
              conditional: { visibleTo: "all", optional: false, included: true }
            },
            {
              id: "block-c-sign",
              type: "signature",
              layout: "default",
              title: "Signatures and Acceptance",
              subtitle: "Sign below to launch visual design phase",
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        }
      ],
      comments: [],
      signatures: {},
      reusableLibrary: [],
      variables: [
        { key: "client_name", value: "Client name", label: "Client Name", description: "Name of the client organization" },
        { key: "company_name", value: "Docdril Creative Studio", label: "Company Name", description: "Name of your creative studio" },
        { key: "project_name", value: "Visual Brand Identity & Collaterals Design", label: "Project Name", description: "The title of this project" },
        { key: "date", value: "July 19, 2026", label: "Date Issued", description: "The proposal issuing date" }
      ],
      activeBranch: "main",
      branches: {},
      checkpoints: [],
      isBlueprint: true,
      blueprintDescription: "High-fidelity brand strategy, brand book development, assets redesign, and collateral creation proposal.",
      industry: "Creative"
    };

    const healthcareBlueprint: ProposalData = {
      id: "master-healthcare",
      projectName: "HIPAA-Compliant EHR & Clinic System Integration",
      clientName: "{{client_name}}",
      companyName: "{{company_name}}",
      date: "{{date}}",
      logoUrl: null,
      status: "draft",
      brandKit: {
        name: "Serene Bamboo",
        primaryColor: "#0d9488",
        secondaryColor: "#4b5563",
        accentColor: "#14b8a6",
        textColor: "#111827",
        backgroundColor: "#ffffff",
        fontHeading: "Lora",
        fontBody: "system-ui",
        spacing: "comfortable",
        borderRadius: "subtle"
      },
      pages: [
        {
          id: "page-h1",
          title: "Cover Page",
          blocks: [
            {
              id: "block-h-cover",
              type: "cover",
              layout: "split",
              title: "HIPAA-Compliant EHR Integration",
              subtitle: "HL7 messaging and data integration for {{client_name}}",
              content: "Prepared by {{company_name}}",
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        },
        {
          id: "page-h2",
          title: "Compliance & Integration Scope",
          blocks: [
            {
              id: "block-h-welcome",
              type: "welcome",
              layout: "default",
              title: "Healthcare Integration Overview",
              content: "Dear {{client_name}} Team,\n\nEHR syncing, HL7 messaging feeds, and medical record databases require absolute security, high uptime, and strict HIPAA compliance. This proposal details our secure data sync framework and integration engineering milestones.",
              conditional: { visibleTo: "all", optional: false, included: true }
            },
            {
              id: "block-h-services",
              type: "services",
              layout: "cards",
              title: "Core Medical Integrations",
              subtitle: "Healthcare development deliverables",
              metadata: {
                services: [
                  { id: 's-h1', name: 'HL7 Messaging Engine', description: 'Custom pipelines to parse HL7 patient feeds.', deliverables: 'HL7 Sync Service', revisions: '2 rounds', price: 18000 },
                  { id: 's-h2', name: 'HIPAA Audits & Security', description: 'Log auditing, TLS encryption, and secure database parameters.', deliverables: 'Compliance Certificate', revisions: '1 round', price: 12000 }
                ]
              },
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        },
        {
          id: "page-h3",
          title: "Regulatory Terms & Execution",
          blocks: [
            {
              id: "block-h-terms",
              type: "terms",
              layout: "default",
              title: "HIPAA Operations & Terms",
              listItems: [
                "All medical patient transmission records must log detailed audit trails.",
                "Client owns all clinical data; integration provider implements zero-knowledge caches.",
                "Integration services include a 12-month post-launch maintenance SLA."
              ],
              conditional: { visibleTo: "all", optional: false, included: true }
            },
            {
              id: "block-h-sign",
              type: "signature",
              layout: "default",
              title: "Healthcare Integration Agreement",
              subtitle: "Sign to authorize HIPAA data linkage",
              conditional: { visibleTo: "all", optional: false, included: true }
            }
          ]
        }
      ],
      comments: [],
      signatures: {},
      reusableLibrary: [],
      variables: [
        { key: "client_name", value: "Client name", label: "Client Name", description: "Name of the client organization" },
        { key: "company_name", value: "Docdril Creative Studio", label: "Company Name", description: "Name of your creative studio" },
        { key: "project_name", value: "HIPAA-Compliant EHR & Clinic System Integration", label: "Project Name", description: "The title of this project" },
        { key: "date", value: "July 19, 2026", label: "Date Issued", description: "The proposal issuing date" }
      ],
      activeBranch: "main",
      branches: {},
      checkpoints: [],
      isBlueprint: true,
      blueprintDescription: "HIPAA-compliant system integration proposal for clinic management systems, HL7 feeds, and medical record databases.",
      industry: "Healthcare"
    };

    // Default Tech Master Blueprint
    const stripped = stripClientSpecificData(defaultProposalData);
    stripped.id = 'master-default';
    stripped.projectName = 'Strategic Brand & Identity Template';
    stripped.blueprintDescription = 'A professional Obsidian & Ivory design blueprint with placeholder tokens.';
    stripped.industry = 'Technology';
    stripped.isBlueprint = true;
    stripped.isPinnedDefault = true;

    const templates = [stripped, fintechBlueprint, saasBlueprint, creativeBlueprint, healthcareBlueprint];

    for (const t of templates) {
      const filePath = path.join(this.mastersDir, `${t.id}.json`);
      try {
        await fs.access(filePath);
      } catch {
        await this.writeJSON(filePath, t);
      }
    }

    // Seed default setting if missing
    try {
      await fs.access(this.settingsFile);
      const settingsContent = await fs.readFile(this.settingsFile, 'utf-8');
      if (settingsContent.trim() === '{}' || settingsContent.trim() === '') {
        const settings = { defaultMasterProposalId: 'master-default' };
        await this.writeJSON(this.settingsFile, settings);
      }
    } catch {
      const settings = { defaultMasterProposalId: 'master-default' };
      await this.writeJSON(this.settingsFile, settings);
    }
  }

  private async initFile(filepath: string, defaultContent: string): Promise<void> {
    try {
      await fs.access(filepath);
    } catch {
      await fs.writeFile(filepath, defaultContent, 'utf-8');
    }
  }

  // Helper to read JSON safely
  private async readJSON<T>(filepath: string): Promise<T> {
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data) as T;
  }

  // Helper to write JSON safely
  private async writeJSON<T>(filepath: string, content: T): Promise<void> {
    await fs.writeFile(filepath, JSON.stringify(content, null, 2), 'utf-8');
  }

  // PROPOSALS
  public async listProposals(): Promise<ProposalMetadata[]> {
    await this.ensureDirectories();
    const files = await fs.readdir(this.proposalsDir);
    const list: ProposalMetadata[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const filePath = path.join(this.proposalsDir, file);
        const data = await this.readJSON<ProposalData>(filePath);
        const stat = await fs.stat(filePath);
        list.push({
          id: data.id,
          projectName: data.projectName,
          clientName: data.clientName,
          companyName: data.companyName,
          date: data.date,
          status: data.status,
          industry: data.industry,
          parentId: data.parentId,
          activeBranch: data.activeBranch,
          isBlueprint: false,
          lastUpdated: stat.mtime.toLocaleString()
        });
      } catch (err) {
        console.error(`Error reading proposal file ${file}:`, err);
      }
    }
    return list;
  }

  public async getProposal(id: string): Promise<ProposalData | null> {
    await this.ensureDirectories();
    const filePath = path.join(this.proposalsDir, `${id}.json`);
    try {
      await fs.access(filePath);
      return await this.readJSON<ProposalData>(filePath);
    } catch {
      return null;
    }
  }

  public async saveProposal(id: string, data: ProposalData): Promise<void> {
    await this.ensureDirectories();
    const filePath = path.join(this.proposalsDir, `${id}.json`);
    await this.writeJSON(filePath, data);
  }

  public async deleteProposal(id: string): Promise<void> {
    await this.ensureDirectories();
    const proposal = await this.getProposal(id);
    if (!proposal) return;

    // Log in trash
    const trash = await this.readJSON<TrashItem[]>(this.trashLogFile);
    trash.push({
      id,
      name: proposal.projectName || `Proposal ${id}`,
      type: 'proposal',
      deletedAt: new Date().toLocaleString()
    });
    await this.writeJSON(this.trashLogFile, trash);

    // Move file to trash directory
    const srcPath = path.join(this.proposalsDir, `${id}.json`);
    const destPath = path.join(this.trashDir, `${id}.json`);
    await fs.rename(srcPath, destPath);
  }

  public async duplicateProposal(
    id: string, 
    newClientName?: string, 
    newCompanyName?: string, 
    newProjectName?: string
  ): Promise<ProposalData> {
    await this.ensureDirectories();
    // Try in proposals first
    let proposal = await this.getProposal(id);
    
    // If not found in proposals, check in master-proposals (templates)
    if (!proposal) {
      proposal = await this.getMasterProposal(id);
    }
    
    if (!proposal) {
      throw new Error(`Proposal or Master Template with ID ${id} not found.`);
    }

    const newId = `prop-${Math.random().toString(36).substr(2, 9)}`;
    const copy = JSON.parse(JSON.stringify(proposal)) as ProposalData;
    copy.id = newId;
    copy.isBlueprint = false;
    copy.parentId = proposal.id; // Link parent relationship
    
    // Set status to draft
    copy.status = 'draft';
    copy.signatures = {};

    // Override variables if client details are supplied
    if (newClientName || newCompanyName || newProjectName) {
      if (newClientName) copy.clientName = newClientName;
      if (newCompanyName) copy.companyName = newCompanyName;
      if (newProjectName) copy.projectName = newProjectName;
      
      // Update variables array
      copy.variables = (copy.variables || []).map(v => {
        if (v.key === 'client_name' && newClientName) return { ...v, value: newClientName };
        if (v.key === 'company_name' && newCompanyName) return { ...v, value: newCompanyName };
        if (v.key === 'project_name' && newProjectName) return { ...v, value: newProjectName };
        return v;
      });
    }

    const destPath = path.join(this.proposalsDir, `${newId}.json`);
    await this.writeJSON(destPath, copy);
    return copy;
  }

  // VERSIONS / HISTORY
  public async getVersionHistory(proposalId: string): Promise<Version[]> {
    await this.ensureDirectories();
    const filePath = path.join(this.historyDir, `${proposalId}-history.json`);
    try {
      await fs.access(filePath);
      return await this.readJSON<Version[]>(filePath);
    } catch {
      return [];
    }
  }

  public async saveVersion(proposalId: string, version: Version): Promise<void> {
    await this.ensureDirectories();
    const filePath = path.join(this.historyDir, `${proposalId}-history.json`);
    let history: Version[] = [];
    try {
      await fs.access(filePath);
      history = await this.readJSON<Version[]>(filePath);
    } catch {}
    
    history.unshift(version); // add to top
    // Limit checkpoints to 50
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    await this.writeJSON(filePath, history);
  }

  public async deleteVersion(proposalId: string, versionId: string): Promise<void> {
    await this.ensureDirectories();
    const filePath = path.join(this.historyDir, `${proposalId}-history.json`);
    try {
      await fs.access(filePath);
      let history = await this.readJSON<Version[]>(filePath);
      history = history.filter(v => v.id !== versionId);
      await this.writeJSON(filePath, history);
    } catch {}
  }

  // MASTER PROPOSALS (BLUEPRINTS)
  public async listMasterProposals(): Promise<ProposalMetadata[]> {
    await this.ensureDirectories();
    const files = await fs.readdir(this.mastersDir);
    const list: ProposalMetadata[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const filePath = path.join(this.mastersDir, file);
        const data = await this.readJSON<ProposalData>(filePath);
        const stat = await fs.stat(filePath);
        list.push({
          id: data.id,
          projectName: data.projectName,
          clientName: data.clientName,
          companyName: data.companyName,
          date: data.date,
          status: data.status,
          industry: data.industry,
          parentId: data.parentId,
          activeBranch: data.activeBranch,
          isBlueprint: true,
          isPinnedDefault: data.isPinnedDefault,
          lastUpdated: stat.mtime.toLocaleString()
        });
      } catch (err) {
        console.error(`Error reading master proposal ${file}:`, err);
      }
    }
    return list;
  }

  public async getMasterProposal(id: string): Promise<ProposalData | null> {
    await this.ensureDirectories();
    const filePath = path.join(this.mastersDir, `${id}.json`);
    try {
      await fs.access(filePath);
      return await this.readJSON<ProposalData>(filePath);
    } catch {
      return null;
    }
  }

  public async saveMasterProposal(id: string, data: ProposalData): Promise<void> {
    await this.ensureDirectories();
    const filePath = path.join(this.mastersDir, `${id}.json`);
    await this.writeJSON(filePath, data);
  }

  public async deleteMasterProposal(id: string): Promise<void> {
    await this.ensureDirectories();
    const master = await this.getMasterProposal(id);
    if (!master) return;

    // Log in trash
    const trash = await this.readJSON<TrashItem[]>(this.trashLogFile);
    trash.push({
      id,
      name: master.projectName || `Master Proposal ${id}`,
      type: 'master',
      deletedAt: new Date().toLocaleString()
    });
    await this.writeJSON(this.trashLogFile, trash);

    // Move file to trash directory
    const srcPath = path.join(this.mastersDir, `${id}.json`);
    const destPath = path.join(this.trashDir, `${id}.json`);
    await fs.rename(srcPath, destPath);
  }

  public async promoteToMaster(
    proposalId: string, 
    name: string, 
    description: string, 
    industry: string
  ): Promise<ProposalData> {
    await this.ensureDirectories();
    const proposal = await this.getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found.`);
    }

    // Convert proposal to a Master Blueprint template using the helper
    const stripped = stripClientSpecificData(proposal);
    stripped.id = `master-${Math.random().toString(36).substr(2, 9)}`;
    stripped.projectName = name;
    stripped.blueprintDescription = description;
    stripped.industry = industry;
    stripped.isBlueprint = true;
    
    // Save to master folder
    const filePath = path.join(this.mastersDir, `${stripped.id}.json`);
    await this.writeJSON(filePath, stripped);
    return stripped;
  }

  // GLOBAL COMPONENTS / REUSABLE BLOCKS
  public async listGlobalComponents(): Promise<GlobalComponent[]> {
    await this.ensureDirectories();
    return await this.readJSON<GlobalComponent[]>(this.componentsFile);
  }

  public async saveGlobalComponent(component: GlobalComponent): Promise<void> {
    await this.ensureDirectories();
    const list = await this.listGlobalComponents();
    const index = list.findIndex(c => c.id === component.id);
    if (index !== -1) {
      list[index] = component;
    } else {
      list.push(component);
    }
    await this.writeJSON(this.componentsFile, list);
  }

  public async deleteGlobalComponent(id: string): Promise<void> {
    await this.ensureDirectories();
    const list = await this.listGlobalComponents();
    const updated = list.filter(c => c.id !== id);
    await this.writeJSON(this.componentsFile, updated);
  }

  // SETTINGS
  public async getSettings(): Promise<AppSettings> {
    await this.ensureDirectories();
    return await this.readJSON<AppSettings>(this.settingsFile);
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    await this.ensureDirectories();
    await this.writeJSON(this.settingsFile, settings);
  }

  // TRASH MANAGEMENT
  public async getTrash(): Promise<TrashItem[]> {
    await this.ensureDirectories();
    return await this.readJSON<TrashItem[]>(this.trashLogFile);
  }

  public async restoreFromTrash(id: string): Promise<void> {
    await this.ensureDirectories();
    const trash = await this.getTrash();
    const item = trash.find(t => t.id === id);
    if (!item) return;

    const srcPath = path.join(this.trashDir, `${id}.json`);
    const destDir = item.type === 'proposal' ? this.proposalsDir : this.mastersDir;
    const destPath = path.join(destDir, `${id}.json`);
    
    try {
      await fs.rename(srcPath, destPath);
    } catch (e) {
      console.error(`Error moving restored file:`, e);
      throw e;
    }

    // Remove from log
    const updatedLog = trash.filter(t => t.id !== id);
    await this.writeJSON(this.trashLogFile, updatedLog);
  }

  public async permanentlyDelete(id: string): Promise<void> {
    await this.ensureDirectories();
    const trash = await this.getTrash();
    
    const srcPath = path.join(this.trashDir, `${id}.json`);
    try {
      await fs.unlink(srcPath);
    } catch (e) {
      // Ignore if file doesn't exist
    }

    // Try deleting history as well
    const historyPath = path.join(this.historyDir, `${id}-history.json`);
    try {
      await fs.unlink(historyPath);
    } catch {}

    const updatedLog = trash.filter(t => t.id !== id);
    await this.writeJSON(this.trashLogFile, updatedLog);
  }

  public async getDatabaseSize(): Promise<number> {
    try {
      const getDirSize = async (dir: string): Promise<number> => {
        try {
          const files = await fs.readdir(dir);
          const stats = await Promise.all(
            files.map(f => fs.stat(path.join(dir, f)).then(s => s.size).catch(() => 0))
          );
          return stats.reduce((acc, curr) => acc + curr, 0);
        } catch {
          return 0;
        }
      };

      const proposalsSize = await getDirSize(this.proposalsDir);
      const mastersSize = await getDirSize(this.mastersDir);
      const historySize = await getDirSize(this.historyDir);
      const trashSize = await getDirSize(this.trashDir);

      const componentsStat = await fs.stat(this.componentsFile).then(s => s.size).catch(() => 0);
      const settingsStat = await fs.stat(this.settingsFile).then(s => s.size).catch(() => 0);
      const trashLogStat = await fs.stat(this.trashLogFile).then(s => s.size).catch(() => 0);

      return proposalsSize + mastersSize + historySize + trashSize + componentsStat + settingsStat + trashLogStat;
    } catch {
      return 1048576; // fallback 1MB
    }
  }
}

export class SupabaseStorageProvider implements StorageProvider {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  // helper to convert DB row to ProposalMetadata
  private mapRowToMetadata(row: any): ProposalMetadata {
    return {
      id: row.id,
      projectName: row.project_name,
      clientName: row.client_name || '',
      companyName: row.company_name || '',
      date: row.date || '',
      status: row.status,
      industry: row.industry || undefined,
      parentId: row.parent_id || undefined,
      activeBranch: row.active_branch || 'main',
      isBlueprint: row.is_blueprint || false,
      isPinnedDefault: row.is_pinned_default || false,
      lastUpdated: new Date(row.last_updated).toLocaleString()
    };
  }

  // helper to convert DB row to ProposalData
  private mapRowToProposalData(row: any): ProposalData {
    return {
      id: row.id,
      projectName: row.project_name,
      clientName: row.client_name || '',
      companyName: row.company_name || '',
      date: row.date || '',
      logoUrl: row.logo_url || null,
      status: row.status,
      brandKit: row.brand_kit,
      pages: row.pages || [],
      comments: row.comments || [],
      signatures: row.signatures || {},
      reusableLibrary: row.reusable_library || [],
      parentId: row.parent_id || undefined,
      industry: row.industry || undefined,
      variables: row.variables || [],
      activeBranch: row.active_branch || 'main',
      branches: row.branches || {},
      checkpoints: row.checkpoints || [],
      isBlueprint: row.is_blueprint || false,
      blueprintDescription: row.blueprint_description || undefined,
      isPinnedDefault: row.is_pinned_default || false,
      isDeleted: row.is_deleted || false
    };
  }

  public async listProposals(): Promise<ProposalMetadata[]> {
    const { data, error } = await this.supabase
      .from('proposals')
      .select('id, project_name, client_name, company_name, date, status, industry, parent_id, active_branch, is_blueprint, is_pinned_default, last_updated')
      .eq('is_blueprint', false)
      .eq('is_deleted', false)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching proposals from Supabase:', error);
      return [];
    }

    return (data || []).map((row: any) => this.mapRowToMetadata(row));
  }

  public async getProposal(id: string): Promise<ProposalData | null> {
    const { data, error } = await this.supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('is_blueprint', false)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching proposal ${id} from Supabase:`, error);
      return null;
    }

    return data ? this.mapRowToProposalData(data) : null;
  }

  public async saveProposal(id: string, data: ProposalData): Promise<void> {
    const { error } = await this.supabase
      .from('proposals')
      .upsert({
        id,
        project_name: data.projectName,
        client_name: data.clientName,
        company_name: data.companyName,
        date: data.date,
        logo_url: data.logoUrl,
        status: data.status,
        brand_kit: data.brandKit,
        pages: data.pages,
        comments: data.comments,
        signatures: data.signatures,
        reusable_library: data.reusableLibrary,
        parent_id: data.parentId || null,
        industry: data.industry || null,
        variables: data.variables,
        active_branch: data.activeBranch,
        branches: data.branches,
        checkpoints: data.checkpoints,
        is_blueprint: false,
        blueprint_description: null,
        is_pinned_default: data.isPinnedDefault || false,
        is_deleted: false,
        last_updated: new Date().toISOString()
      });

    if (error) {
      console.error(`Error saving proposal ${id} to Supabase:`, error);
      throw error;
    }
  }

  public async deleteProposal(id: string): Promise<void> {
    const proposal = await this.getProposal(id);
    if (!proposal) return;

    // Log in trash
    const { error: trashError } = await this.supabase
      .from('trash')
      .insert({
        id,
        name: proposal.projectName || `Proposal ${id}`,
        type: 'proposal',
        deleted_at: new Date().toLocaleString(),
        data: proposal
      });

    if (trashError) {
      console.error(`Error logging proposal ${id} to trash:`, trashError);
    }

    // Delete from proposals (cascades to versions)
    const { error: deleteError } = await this.supabase
      .from('proposals')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error(`Error deleting proposal ${id} from Supabase:`, deleteError);
      throw deleteError;
    }
  }

  public async duplicateProposal(
    id: string,
    newClientName?: string,
    newCompanyName?: string,
    newProjectName?: string
  ): Promise<ProposalData> {
    const original = await this.getProposal(id);
    if (!original) {
      throw new Error(`Original proposal ${id} not found.`);
    }

    const newId = `prop-${Math.random().toString(36).substr(2, 9)}`;
    const copy: ProposalData = {
      ...original,
      id: newId,
      projectName: newProjectName || `${original.projectName} (Copy)`,
      clientName: newClientName || original.clientName,
      companyName: newCompanyName || original.companyName,
      date: new Date().toLocaleDateString(),
      signatures: {},
      comments: [],
      checkpoints: original.checkpoints || [],
      branches: original.branches || {},
      activeBranch: original.activeBranch || 'main'
    };

    await this.saveProposal(newId, copy);
    return copy;
  }

  // VERSIONS / HISTORY
  public async getVersionHistory(proposalId: string): Promise<Version[]> {
    const { data, error } = await this.supabase
      .from('versions')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error getting versions for proposal ${proposalId}:`, error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      timestamp: row.timestamp,
      pages: row.pages || [],
      brandKit: row.brand_kit || {},
      signatures: row.signatures || {},
      variables: row.variables || []
    }));
  }

  public async saveVersion(proposalId: string, version: Version): Promise<void> {
    const { error } = await this.supabase
      .from('versions')
      .insert({
        id: version.id,
        proposal_id: proposalId,
        name: version.name,
        timestamp: version.timestamp,
        pages: version.pages,
        brand_kit: version.brandKit,
        signatures: version.signatures || null,
        variables: version.variables || null
      });

    if (error) {
      console.error(`Error saving version ${version.id} for proposal ${proposalId}:`, error);
      throw error;
    }

    // Limit checkpoints to 50
    const history = await this.getVersionHistory(proposalId);
    if (history.length > 50) {
      const oldest = history.slice(50);
      const oldestIds = oldest.map(v => v.id);
      await this.supabase
        .from('versions')
        .delete()
        .in('id', oldestIds);
    }
  }

  public async deleteVersion(proposalId: string, versionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('versions')
      .delete()
      .eq('id', versionId)
      .eq('proposal_id', proposalId);

    if (error) {
      console.error(`Error deleting version ${versionId}:`, error);
      throw error;
    }
  }

  // MASTER PROPOSALS (BLUEPRINTS)
  public async listMasterProposals(): Promise<ProposalMetadata[]> {
    const { data, error } = await this.supabase
      .from('proposals')
      .select('id, project_name, client_name, company_name, date, status, industry, parent_id, active_branch, is_blueprint, is_pinned_default, last_updated')
      .eq('is_blueprint', true)
      .eq('is_deleted', false)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching masters from Supabase:', error);
      return [];
    }

    return (data || []).map((row: any) => this.mapRowToMetadata(row));
  }

  public async getMasterProposal(id: string): Promise<ProposalData | null> {
    const { data, error } = await this.supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('is_blueprint', true)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching master proposal ${id} from Supabase:`, error);
      return null;
    }

    return data ? this.mapRowToProposalData(data) : null;
  }

  public async saveMasterProposal(id: string, data: ProposalData): Promise<void> {
    const { error } = await this.supabase
      .from('proposals')
      .upsert({
        id,
        project_name: data.projectName,
        client_name: data.clientName,
        company_name: data.companyName,
        date: data.date,
        logo_url: data.logoUrl,
        status: data.status,
        brand_kit: data.brandKit,
        pages: data.pages,
        comments: data.comments,
        signatures: data.signatures,
        reusable_library: data.reusableLibrary,
        parent_id: data.parentId || null,
        industry: data.industry || null,
        variables: data.variables,
        active_branch: data.activeBranch,
        branches: data.branches,
        checkpoints: data.checkpoints,
        is_blueprint: true,
        blueprint_description: data.blueprintDescription || null,
        is_pinned_default: data.isPinnedDefault || false,
        is_deleted: false,
        last_updated: new Date().toISOString()
      });

    if (error) {
      console.error(`Error saving master proposal ${id} to Supabase:`, error);
      throw error;
    }
  }

  public async deleteMasterProposal(id: string): Promise<void> {
    const master = await this.getMasterProposal(id);
    if (!master) return;

    // Log in trash
    const { error: trashError } = await this.supabase
      .from('trash')
      .insert({
        id,
        name: master.projectName || `Master Proposal ${id}`,
        type: 'master',
        deleted_at: new Date().toLocaleString(),
        data: master
      });

    if (trashError) {
      console.error(`Error logging master ${id} to trash:`, trashError);
    }

    // Delete from proposals
    const { error: deleteError } = await this.supabase
      .from('proposals')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error(`Error deleting master ${id} from Supabase:`, deleteError);
      throw deleteError;
    }
  }

  public async promoteToMaster(
    proposalId: string,
    name: string,
    description: string,
    industry: string
  ): Promise<ProposalData> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found.`);
    }

    const stripped = stripClientSpecificData(proposal);
    stripped.id = `master-${Math.random().toString(36).substr(2, 9)}`;
    stripped.projectName = name;
    stripped.blueprintDescription = description;
    stripped.industry = industry;
    stripped.isBlueprint = true;

    await this.saveMasterProposal(stripped.id, stripped);
    return stripped;
  }

  // GLOBAL COMPONENTS / REUSABLE BLOCKS
  public async listGlobalComponents(): Promise<GlobalComponent[]> {
    const { data, error } = await this.supabase
      .from('global_components')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching global components:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      layout: row.layout,
      title: row.title,
      subtitle: row.subtitle || undefined,
      content: row.content || undefined,
      listItems: row.list_items || undefined,
      metadata: row.metadata || undefined
    }));
  }

  public async saveGlobalComponent(component: GlobalComponent): Promise<void> {
    const { error } = await this.supabase
      .from('global_components')
      .upsert({
        id: component.id,
        name: component.name,
        type: component.type,
        layout: component.layout || '',
        title: component.title || '',
        subtitle: component.subtitle || null,
        content: component.content || null,
        list_items: component.listItems || [],
        metadata: component.metadata || {},
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error(`Error saving global component ${component.id}:`, error);
      throw error;
    }
  }

  public async deleteGlobalComponent(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('global_components')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting global component ${id}:`, error);
      throw error;
    }
  }

  // SETTINGS
  public async getSettings(): Promise<AppSettings> {
    const { data, error } = await this.supabase
      .from('settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error('Error getting settings from Supabase:', error);
      return {};
    }

    return data ? { defaultMasterProposalId: data.default_master_proposal_id } : {};
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    const { error } = await this.supabase
      .from('settings')
      .upsert({
        id: 'default',
        default_master_proposal_id: settings.defaultMasterProposalId || null,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving settings to Supabase:', error);
      throw error;
    }
  }

  // TRASH MANAGEMENT
  public async getTrash(): Promise<TrashItem[]> {
    const { data, error } = await this.supabase
      .from('trash')
      .select('id, name, type, deleted_at')
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Error getting trash list:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      deletedAt: row.deleted_at
    }));
  }

  public async restoreFromTrash(id: string): Promise<void> {
    const { data: trashItem, error: fetchError } = await this.supabase
      .from('trash')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !trashItem) {
      console.error(`Error fetching trash item ${id}:`, fetchError);
      throw new Error(`Trash item ${id} not found.`);
    }

    const proposalData = trashItem.data as ProposalData;

    if (trashItem.type === 'proposal') {
      await this.saveProposal(id, proposalData);
    } else {
      await this.saveMasterProposal(id, proposalData);
    }

    const { error: deleteError } = await this.supabase
      .from('trash')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error(`Error deleting trash item ${id} after restore:`, deleteError);
    }
  }

  public async permanentlyDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('trash')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error permanently deleting trash item ${id}:`, error);
      throw error;
    }
  }

  public async getDatabaseSize(): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('get_db_size');
      if (error || data === null) {
        const { count: proposalsCount } = await this.supabase.from('proposals').select('*', { count: 'exact', head: true });
        const { count: versionsCount } = await this.supabase.from('versions').select('*', { count: 'exact', head: true });
        const { count: componentsCount } = await this.supabase.from('global_components').select('*', { count: 'exact', head: true });
        const { count: trashCount } = await this.supabase.from('trash').select('*', { count: 'exact', head: true });

        const sizeEstimate = 
          ((proposalsCount || 0) * 150 * 1024) +
          ((versionsCount || 0) * 100 * 1024) +
          ((componentsCount || 0) * 20 * 1024) +
          ((trashCount || 0) * 100 * 1024) +
          1048576;
        return sizeEstimate;
      }
      return Number(data);
    } catch {
      return 1048576;
    }
  }
}
