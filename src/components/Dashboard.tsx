import React, { useState, useEffect } from 'react';
import { ProposalMetadata, TrashItem, AppSettings } from '../types';
import { storageClient } from '../storageClient';
import { 
  FileText, 
  Trash2, 
  Settings, 
  Plus, 
  Copy, 
  Pin, 
  Globe, 
  RefreshCw, 
  Layers, 
  Folder, 
  Search, 
  ArrowUpRight, 
  Calendar,
  AlertTriangle,
  FileCheck,
  Edit3
} from 'lucide-react';

interface DashboardProps {
  onSelectProposal: (id: string, isMaster?: boolean) => void;
  onCreateFromTemplate: (templateId: string | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onSelectProposal, 
  onCreateFromTemplate 
}) => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'masters' | 'trash' | 'settings'>('proposals');
  const [proposals, setProposals] = useState<ProposalMetadata[]>([]);
  const [masters, setMasters] = useState<ProposalMetadata[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [dbSize, setDbSize] = useState<number | null>(null);
  
  // Modals / Dialog States
  const [isNewPropOpen, setIsNewPropOpen] = useState(false);
  const [newPropData, setNewPropData] = useState({
    projectName: '',
    clientName: '',
    companyName: 'Docdril Creative Studio',
    industry: 'Technology',
    templateId: ''
  });
  
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [duplicateTargetId, setDuplicateTargetId] = useState('');
  const [duplicateData, setDuplicateData] = useState({
    clientName: '',
    companyName: 'Docdril Creative Studio',
    projectName: ''
  });

  const INDUSTRIES = ['All', 'Technology', 'Fintech', 'SaaS', 'Creative', 'Healthcare', 'Legal', 'Other'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [propsList, mastersList, trashList, appSettings, sizeRes] = await Promise.all([
        storageClient.listProposals(),
        storageClient.listMasterProposals(),
        storageClient.getTrash(),
        storageClient.getSettings(),
        storageClient.getDatabaseSize().catch(() => ({ sizeInBytes: 0 }))
      ]);
      setProposals(propsList);
      setMasters(mastersList);
      setTrash(trashList);
      setSettings(appSettings);
      setDbSize(sizeRes.sizeInBytes);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let createdProp;
      if (newPropData.templateId) {
        // Instantiate from blueprint template
        createdProp = await storageClient.duplicateProposal(
          newPropData.templateId,
          newPropData.clientName,
          newPropData.companyName,
          newPropData.projectName
        );
      } else {
        // Blank proposal
        const newId = `prop-${Math.random().toString(36).substr(2, 9)}`;
        const blankData = {
          id: newId,
          projectName: newPropData.projectName || 'New Strategic Proposal',
          clientName: newPropData.clientName || 'Client name',
          companyName: newPropData.companyName || 'Company name',
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          logoUrl: null,
          status: 'draft' as const,
          brandKit: {
            name: "Obsidian & Ivory",
            primaryColor: "#000000",
            secondaryColor: "#4b5563",
            accentColor: "#10b981",
            textColor: "#111827",
            backgroundColor: "#ffffff",
            fontHeading: "Space Grotesk",
            fontBody: "Inter",
            spacing: "comfortable" as const,
            borderRadius: "subtle" as const
          },
          pages: [
            {
              id: "page-cover",
              title: "Cover Page",
              blocks: [
                {
                  id: "block-cover",
                  type: "cover",
                  layout: "split",
                  title: newPropData.projectName || "Strategic Brand Identity",
                  subtitle: "A comprehensive design proposal for {{client_name}}",
                  content: "Prepared by {{company_name}}",
                  conditional: { visibleTo: "all" as const, optional: false, included: true }
                }
              ]
            }
          ],
          comments: [],
          signatures: {},
          reusableLibrary: [],
          variables: [
            { key: "client_name", value: newPropData.clientName || "Client name", label: "Client Name" },
            { key: "company_name", value: newPropData.companyName || "Company name", label: "Company Name" },
            { key: "project_name", value: newPropData.projectName || "New Strategic Proposal", label: "Project Name" },
            { key: "date", value: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), label: "Date Issued" }
          ],
          activeBranch: "main",
          branches: {},
          checkpoints: [],
          industry: newPropData.industry
        };
        await storageClient.saveProposal(newId, blankData);
        createdProp = blankData;
      }
      
      setIsNewPropOpen(false);
      onSelectProposal(createdProp.id);
    } catch (err) {
      alert("Error creating proposal: " + err);
    }
  };

  const handleDuplicateClick = (proposalId: string, projectName: string, clientName: string) => {
    setDuplicateTargetId(proposalId);
    setDuplicateData({
      clientName: `${clientName} (Copy)`,
      companyName: 'Docdril Creative Studio',
      projectName: `${projectName} (Clone)`
    });
    setIsDuplicateOpen(true);
  };

  const handleDuplicateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const duplicated = await storageClient.duplicateProposal(
        duplicateTargetId,
        duplicateData.clientName,
        duplicateData.companyName,
        duplicateData.projectName
      );
      setIsDuplicateOpen(false);
      loadData();
      onSelectProposal(duplicated.id);
    } catch (err) {
      alert("Error duplicating: " + err);
    }
  };

  const handleRenameProposal = async (id: string, isMaster = false) => {
    try {
      let proposalData;
      if (isMaster) {
        proposalData = await storageClient.getMasterProposal(id);
      } else {
        proposalData = await storageClient.getProposal(id);
      }
      if (!proposalData) return;
      
      const newName = prompt('Rename Proposal - Enter new project name:', proposalData.projectName);
      if (newName === null) return; // user cancelled
      if (!newName.trim()) {
        alert('Proposal name cannot be empty.');
        return;
      }
      
      if (isMaster) {
        await storageClient.saveMasterProposal(id, {
          ...proposalData,
          projectName: newName.trim()
        });
      } else {
        await storageClient.saveProposal(id, {
          ...proposalData,
          projectName: newName.trim()
        });
      }
      await loadData();
    } catch (err) {
      console.error("Error renaming proposal:", err);
      alert("Failed to rename proposal.");
    }
  };

  const handleDeleteProposal = async (id: string, isMaster = false) => {
    if (!confirm("Are you sure you want to move this document to Trash?")) return;
    try {
      if (isMaster) {
        await storageClient.deleteMasterProposal(id);
      } else {
        await storageClient.deleteProposal(id);
      }
      loadData();
    } catch (err) {
      alert("Error deleting: " + err);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await storageClient.restoreFromTrash(id);
      loadData();
    } catch (err) {
      alert("Error restoring: " + err);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("This will permanently delete this file and all its checkpoints. This action cannot be undone! Proceed?")) return;
    try {
      await storageClient.permanentlyDelete(id);
      loadData();
    } catch (err) {
      alert("Error deleting permanently: " + err);
    }
  };

  const handlePinDefault = async (masterId: string) => {
    try {
      const updatedSettings = { ...settings, defaultMasterProposalId: masterId };
      await storageClient.saveSettings(updatedSettings);
      
      // Update each master blueprint's isPinnedDefault locally and save
      const promises = masters.map(async (m) => {
        const fullMaster = await storageClient.getMasterProposal(m.id);
        if (fullMaster) {
          fullMaster.isPinnedDefault = m.id === masterId;
          await storageClient.saveMasterProposal(m.id, fullMaster);
        }
      });
      await Promise.all(promises);
      
      setSettings(updatedSettings);
      loadData();
    } catch (err) {
      alert("Error setting default blueprint: " + err);
    }
  };

  // Filter Logic
  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustry === 'All' || p.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  const filteredMasters = masters.filter(m => {
    const matchesSearch = m.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustry === 'All' || m.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  // Build Parent/Child relationships dictionary
  const childProposalsMap: Record<string, ProposalMetadata[]> = {};
  const rootProposals: ProposalMetadata[] = [];

  filteredProposals.forEach(p => {
    const parentIsProposal = proposals.some(pr => pr.id === p.parentId);
    if (p.parentId && parentIsProposal) {
      if (!childProposalsMap[p.parentId]) childProposalsMap[p.parentId] = [];
      childProposalsMap[p.parentId].push(p);
    } else {
      rootProposals.push(p);
    }
  });

  // Format project default target
  const defaultBlueprintName = masters.find(m => m.id === settings.defaultMasterProposalId)?.projectName || 'None';
  const sizeInMB = dbSize !== null ? (dbSize / (1024 * 1024)).toFixed(2) : '0.00';
  const percentUsed = dbSize !== null ? Math.min(100, Math.max(0.5, (dbSize / (500 * 1024 * 1024)) * 100)) : 0.5;

  return (
    <div className="flex-1 bg-[#f9fafb] flex flex-col h-screen overflow-hidden font-sans">
      
      {/* Top Banner Dashboard Nav */}
      <header className="bg-white border-b border-gray-200 py-4 px-4 sm:px-8 flex justify-between items-center shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PropStudio Logo" className="w-12 h-12 object-contain shrink-0" />
          <div>
            <h1 className="text-sm font-bold text-gray-900">PropStudio</h1>
            <p className="hidden sm:block text-[10px] text-gray-400 mt-0.5">Professional Git & Component Blueprint Engine</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setNewPropData({
                projectName: '',
                clientName: '',
                companyName: 'Docdril Creative Studio',
                industry: 'Technology',
                templateId: settings.defaultMasterProposalId || ''
              });
              setIsNewPropOpen(true);
            }}
            className="px-3.5 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={14} /> New Proposal
          </button>
        </div>
      </header>

      {/* Main Workspace Dashboard */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side Tab Navigation */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 bg-white p-2.5 md:p-4 flex flex-row md:flex-col justify-between shrink-0 select-none overflow-x-auto md:overflow-x-visible">
          <div className="flex flex-row md:flex-col gap-1 md:space-y-1 max-w-full md:w-full overflow-x-auto md:overflow-x-visible py-0.5 md:py-0 shrink-0">
            <button
              onClick={() => setActiveTab('proposals')}
              className={`flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === 'proposals' 
                  ? 'bg-black text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText size={16} />
              Proposals
              {proposals.length > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 md:ml-auto ${activeTab === 'proposals' ? 'bg-white text-black' : 'bg-gray-100 text-gray-600'}`}>
                  {proposals.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('masters')}
              className={`flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === 'masters' 
                  ? 'bg-black text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileCheck size={16} />
              Master Blueprints
              {masters.length > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 md:ml-auto ${activeTab === 'masters' ? 'bg-white text-black' : 'bg-gray-100 text-gray-600'}`}>
                  {masters.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('trash')}
              className={`flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === 'trash' 
                  ? 'bg-black text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Trash2 size={16} />
              Trash Can
              {trash.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-50 text-red-600 ml-1 md:ml-auto">
                  {trash.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === 'settings' 
                  ? 'bg-black text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Settings size={16} />
              Studio Settings
            </button>
          </div>

          {/* Quick Stats info */}
          <div className="hidden md:block p-4 bg-gray-50 border border-gray-150 rounded-2xl select-none text-left">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cloud Storage</h4>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">Supabase</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs font-semibold text-gray-800">
                <span>{sizeInMB} MB used</span>
                <span className="text-gray-400">500 MB limit</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-100 font-medium">
                <span>Status: Connected</span>
                <span>{((500 * 1024 * 1024 - (dbSize || 0)) / (1024 * 1024)).toFixed(1)} MB free</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Viewer Grid */}
        <main className="flex-1 flex flex-col overflow-hidden p-4 md:p-8">
          
          {/* Header search controls */}
          {activeTab !== 'settings' && (
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pb-4 md:pb-6 shrink-0 items-stretch sm:items-center">
              {/* Search */}
              <div className="relative w-full sm:max-w-sm flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files, client, or template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl text-xs bg-white text-gray-800"
                />
              </div>

              {/* Industry Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 border border-gray-200 rounded-xl overflow-x-auto max-w-full">
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind}
                    onClick={() => setSelectedIndustry(ind)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                      selectedIndustry === ind 
                        ? 'bg-white text-black shadow-sm' 
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Pages rendering */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw size={24} className="animate-spin mb-2" />
              <span className="text-xs font-medium">Querying local JSON storage...</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
              
              {/* 1. PROPOSALS TAB */}
              {activeTab === 'proposals' && (
                <div className="space-y-4">
                  {rootProposals.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 max-w-md mx-auto">
                      <Folder size={32} className="mx-auto mb-2 text-indigo-500 stroke-1" />
                      <h3 className="font-semibold text-gray-800 text-xs">No proposals in catalog</h3>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto">
                        Create a blank proposal canvas, duplicate an existing one, or instantiate one from a Master Blueprint.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {rootProposals.map(proposal => {
                        const children = childProposalsMap[proposal.id] || [];
                        return (
                          <div key={proposal.id} className="col-span-1 space-y-3">
                            <ProposalCard 
                              proposal={proposal} 
                              onOpen={() => onSelectProposal(proposal.id)}
                              onDuplicate={() => handleDuplicateClick(proposal.id, proposal.projectName, proposal.clientName)}
                              onDelete={() => handleDeleteProposal(proposal.id)}
                              onRename={() => handleRenameProposal(proposal.id)}
                            />
                            
                            {/* Children hierarchy rendering */}
                            {children.length > 0 && (
                              <div className="pl-6 border-l-2 border-dashed border-gray-200 space-y-3">
                                {children.map(child => (
                                  <ProposalCard 
                                    key={child.id}
                                    proposal={child} 
                                    isChild
                                    onOpen={() => onSelectProposal(child.id)}
                                    onDuplicate={() => handleDuplicateClick(child.id, child.projectName, child.clientName)}
                                    onDelete={() => handleDeleteProposal(child.id)}
                                    onRename={() => handleRenameProposal(child.id)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 2. MASTER PROPOSALS TAB */}
              {activeTab === 'masters' && (
                <div>
                  {filteredMasters.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 max-w-md mx-auto">
                      <Layers size={32} className="mx-auto mb-2 text-indigo-500 stroke-1" />
                      <h3 className="font-semibold text-gray-800 text-xs">No Master Templates saved</h3>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto">
                        Promote any finalized client proposal to a Master Template. Docdril will strip specific details into variable inputs.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredMasters.map(master => {
                        const isDefault = master.id === settings.defaultMasterProposalId;
                        return (
                          <div 
                            key={master.id}
                            className="bg-white border border-gray-200 hover:border-black rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group/master"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                  {master.industry || 'General'}
                                </span>
                                
                                <div className="flex items-center gap-1 opacity-0 group-hover/master:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handlePinDefault(master.id)}
                                    className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${isDefault ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                                    title={isDefault ? "Pinned Default starting point" : "Pin as default starting point"}
                                  >
                                    <Pin size={12} className={isDefault ? 'fill-amber-500' : ''} />
                                  </button>
                                  <button
                                    onClick={() => handleRenameProposal(master.id, true)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-colors cursor-pointer"
                                    title="Rename Master Proposal"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateClick(master.id, master.projectName, 'New Client')}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-black transition-colors cursor-pointer"
                                    title="Create Proposal from Master"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProposal(master.id, true)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                    title="Move Master to Trash"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              <h3 className="font-bold text-xs text-gray-900 mt-3 group-hover/master:text-indigo-600 transition-colors">
                                {master.projectName}
                              </h3>
                              <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                                Prepared originally for {master.clientName || 'Generic Client'}. Placeholder variables mapped.
                              </p>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mt-6 flex justify-between items-center text-[9px] text-gray-400">
                              <span>Saved {master.lastUpdated.split(',')[0]}</span>
                              <button
                                onClick={() => onSelectProposal(master.id, true)}
                                className="font-bold uppercase tracking-wider text-black hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
                              >
                                Edit Template <ArrowUpRight size={10} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. TRASH TAB */}
              {activeTab === 'trash' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-4xl mx-auto">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                    <h2 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Deleted Items Log</h2>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                      {trash.length} Items
                    </span>
                  </div>

                  {trash.length === 0 ? (
                    <div className="text-center py-12 text-gray-300">
                      <Trash2 size={28} className="mx-auto mb-1 stroke-1" />
                      <p className="text-xs font-semibold">Trash is empty</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {trash.map((item) => (
                        <div key={item.id} className="py-3.5 flex justify-between items-center group">
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{item.name}</h4>
                            <div className="flex gap-2 items-center text-[9px] text-gray-400 mt-1">
                              <span className="capitalize font-semibold bg-gray-100 px-1.5 py-0.2 rounded text-gray-600">
                                {item.type}
                              </span>
                              <span>Deleted {item.deletedAt}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-600 transition-all cursor-pointer"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(item.id)}
                              className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                              title="Delete Permanently"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm max-w-2xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest pb-2 border-b border-gray-100">
                      Studio Database & Engine Settings
                    </h2>
                  </div>

                  {/* Pin Default Blueprint settings */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Default starting template for future proposals
                    </label>
                    <select
                      value={settings.defaultMasterProposalId || ''}
                      onChange={(e) => handlePinDefault(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white"
                    >
                      <option value="">Blank Canvas (No default template)</option>
                      {masters.map(m => (
                        <option key={m.id} value={m.id}>{m.projectName} ({m.industry})</option>
                      ))}
                    </select>
                    <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">
                      If set, creating a new proposal will load the contents of this Master Proposal blueprint by default. You can pins any blueprint.
                    </p>
                  </div>

                  {/* Self-containment alert */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-amber-800">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold">Local File Persistence Active</h4>
                      <p className="text-[10px] mt-1 leading-relaxed">
                        All proposals are saved directly as structured JSON files inside `data-store/` within this project directory. You can easily back up, version control via Git, or copy the project folder to save your workspace.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* NEW PROPOSAL DIALOG */}
      {isNewPropOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 no-print">
          <form 
            onSubmit={handleCreateProposal} 
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-md animate-fade-in space-y-4"
          >
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500">Initiate Strategic Proposal</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Define core workspace fields. Places variables inside layout.</p>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Strategic Brand & Platform Integration"
                  value={newPropData.projectName}
                  onChange={(e) => setNewPropData({ ...newPropData, projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Client Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={newPropData.clientName}
                    onChange={(e) => setNewPropData({ ...newPropData, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Your Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Docdril Studio"
                    value={newPropData.companyName}
                    onChange={(e) => setNewPropData({ ...newPropData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Industry Tab</label>
                  <select
                    value={newPropData.industry}
                    onChange={(e) => setNewPropData({ ...newPropData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white"
                  >
                    {INDUSTRIES.filter(ind => ind !== 'All').map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Blueprint Source</label>
                  <select
                    value={newPropData.templateId}
                    onChange={(e) => setNewPropData({ ...newPropData, templateId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white"
                  >
                    <option value="">Blank Canvas (Empty cover)</option>
                    {masters.map(m => (
                      <option key={m.id} value={m.id}>{m.projectName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 justify-end border-t border-gray-50">
              <button
                type="button"
                onClick={() => setIsNewPropOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                Initialize Proposal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ONE-CLICK CLONE/DUPLICATE DIALOG */}
      {isDuplicateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 no-print">
          <form 
            onSubmit={handleDuplicateSubmit} 
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 w-full max-w-md animate-fade-in space-y-4"
          >
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500">Duplicate for New Client</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Clones proposal structure and overrides smart client variables in 1-click.</p>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Strategic Expansion SOW"
                  value={duplicateData.projectName}
                  onChange={(e) => setDuplicateData({ ...duplicateData, projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New Client Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Globex Inc"
                    value={duplicateData.clientName}
                    onChange={(e) => setDuplicateData({ ...duplicateData, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Company Name</label>
                  <input
                    type="text"
                    required
                    value={duplicateData.companyName}
                    onChange={(e) => setDuplicateData({ ...duplicateData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 justify-end border-t border-gray-50">
              <button
                type="button"
                onClick={() => setIsDuplicateOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-black hover:bg-gray-850 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                Generate Clone
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

// Internal Proposal Card Component
interface ProposalCardProps {
  proposal: ProposalMetadata;
  isChild?: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: () => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  isChild = false,
  onOpen,
  onDuplicate,
  onDelete,
  onRename
}) => {
  const getStatusColor = () => {
    switch (proposal.status) {
      case 'draft':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'sent':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'signed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between group relative ${isChild ? 'border-dashed border-indigo-100 bg-indigo-50/5' : 'border-gray-200'}`}>
      
      {/* Absolute Hover Control Overlay */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 z-10 transition-opacity bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black rounded-lg transition-colors cursor-pointer"
          title="Rename Proposal"
        >
          <Edit3 size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-black rounded-lg transition-colors cursor-pointer"
          title="Duplicate (1-Click Client Setup)"
        >
          <Copy size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
          title="Move to Trash"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
            {proposal.industry || 'General'}
          </span>
          <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-full ${getStatusColor()}`}>
            {proposal.status}
          </span>
        </div>

        <h3 className="font-bold text-xs text-gray-900 mt-3 group-hover:text-indigo-600 transition-colors truncate pr-14">
          {proposal.projectName}
        </h3>
        <p className="text-[10px] text-gray-400 mt-1">
          Client: <span className="font-medium text-gray-600">{proposal.clientName}</span>
        </p>

        {isChild && (
          <div className="mt-2.5 flex items-center gap-1 text-[8px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded w-max">
            <Layers size={9} /> Linked Statement of Work (SOW)
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4 mt-6 flex justify-between items-center text-[9px] text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar size={10} />
          {proposal.lastUpdated.split(',')[0]}
        </span>
        <button
          onClick={onOpen}
          className="font-bold uppercase tracking-wider text-black hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
        >
          Open Draft <ArrowUpRight size={10} />
        </button>
      </div>
    </div>
  );
};
