import { 
  ProposalData, 
  ProposalMetadata, 
  GlobalComponent, 
  TrashItem, 
  AppSettings, 
  Version 
} from './types';

// Helper to make API requests
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const storageClient = {
  // PROPOSALS
  listProposals: () => 
    apiFetch<ProposalMetadata[]>('/api/proposals'),
    
  getProposal: (id: string) => 
    apiFetch<ProposalData>(`/api/proposals/${id}`),
    
  saveProposal: (id: string, data: ProposalData) => 
    apiFetch<{ success: boolean }>(`/api/proposals/${id}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  deleteProposal: (id: string) => 
    apiFetch<{ success: boolean }>(`/api/proposals/${id}`, {
      method: 'DELETE'
    }),
    
  duplicateProposal: (id: string, newClientName?: string, newCompanyName?: string, newProjectName?: string) => 
    apiFetch<ProposalData>(`/api/proposals/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ newClientName, newCompanyName, newProjectName })
    }),
    
  promoteToMaster: (proposalId: string, name: string, description: string, industry: string) => 
    apiFetch<ProposalData>(`/api/proposals/${proposalId}/promote`, {
      method: 'POST',
      body: JSON.stringify({ name, description, industry })
    }),

  // HISTORY
  getVersionHistory: (proposalId: string) => 
    apiFetch<Version[]>(`/api/proposals/${proposalId}/history`),
    
  saveVersion: (proposalId: string, version: Version) => 
    apiFetch<{ success: boolean }>(`/api/proposals/${proposalId}/history`, {
      method: 'POST',
      body: JSON.stringify(version)
    }),

  deleteVersion: (proposalId: string, versionId: string) => 
    apiFetch<{ success: boolean }>(`/api/proposals/${proposalId}/history/${versionId}`, {
      method: 'DELETE'
    }),

  // MASTER PROPOSALS
  listMasterProposals: () => 
    apiFetch<ProposalMetadata[]>('/api/masters'),
    
  getMasterProposal: (id: string) => 
    apiFetch<ProposalData>(`/api/masters/${id}`),
    
  saveMasterProposal: (id: string, data: ProposalData) => 
    apiFetch<{ success: boolean }>(`/api/masters/${id}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
  deleteMasterProposal: (id: string) => 
    apiFetch<{ success: boolean }>(`/api/masters/${id}`, {
      method: 'DELETE'
    }),

  // GLOBAL COMPONENTS
  listGlobalComponents: () => 
    apiFetch<GlobalComponent[]>('/api/components'),
    
  saveGlobalComponent: (component: GlobalComponent) => 
    apiFetch<{ success: boolean }>('/api/components', {
      method: 'POST',
      body: JSON.stringify(component)
    }),
    
  deleteGlobalComponent: (id: string) => 
    apiFetch<{ success: boolean }>(`/api/components/${id}`, {
      method: 'DELETE'
    }),

  // SETTINGS
  getSettings: () => 
    apiFetch<AppSettings>('/api/settings'),
    
  saveSettings: (settings: AppSettings) => 
    apiFetch<{ success: boolean }>('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    }),

  // TRASH
  getTrash: () => 
    apiFetch<TrashItem[]>('/api/trash'),
    
  restoreFromTrash: (id: string) => 
    apiFetch<{ success: boolean }>(`/api/trash/${id}/restore`, {
      method: 'POST'
    }),
    
  permanentlyDelete: (id: string) => 
    apiFetch<{ success: boolean }>(`/api/trash/${id}`, {
      method: 'DELETE'
    }),

  // DATABASE SIZE
  getDatabaseSize: () =>
    apiFetch<{ sizeInBytes: number }>('/api/db-size'),

  // STORAGE STATUS
  getStatus: () =>
    apiFetch<{ useSupabase: boolean }>('/api/status')
};
