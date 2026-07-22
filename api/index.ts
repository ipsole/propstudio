import 'dotenv/config';
import express from 'express';
import { JSONStorageProvider, SupabaseStorageProvider } from '../server/storage';

const app = express();

// Set USE_SUPABASE=true in environment variables to switch to Supabase storage
const useSupabase = process.env.USE_SUPABASE === 'true';
const db = useSupabase ? new SupabaseStorageProvider() : new JSONStorageProvider();

app.use(express.json({ limit: '50mb' }));

if (db instanceof JSONStorageProvider) {
  console.log("Using local JSON storage adapter (ephemeral on Vercel).");
  db.ensureDirectories().catch(err => {
    console.error("Failed to initialize storage directories:", err);
  });
} else {
  console.log("Supabase storage adapter connected successfully.");
}

// Helper for async endpoints
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// PROPOSALS
app.get('/api/proposals', asyncHandler(async (req: express.Request, res: express.Response) => {
  const proposals = await db.listProposals();
  res.json(proposals);
}));

app.get('/api/proposals/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const proposal = await db.getProposal(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }
  res.json(proposal);
}));

app.post('/api/proposals/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.saveProposal(req.params.id, req.body);
  res.json({ success: true });
}));

app.delete('/api/proposals/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.deleteProposal(req.params.id);
  res.json({ success: true });
}));

app.post('/api/proposals/:id/duplicate', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { newClientName, newCompanyName, newProjectName } = req.body;
  const newProposal = await db.duplicateProposal(req.params.id, newClientName, newCompanyName, newProjectName);
  res.json(newProposal);
}));

app.post('/api/proposals/:id/promote', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { name, description, industry } = req.body;
  const master = await db.promoteToMaster(req.params.id, name, description, industry);
  res.json(master);
}));

// HISTORY
app.get('/api/proposals/:id/history', asyncHandler(async (req: express.Request, res: express.Response) => {
  const history = await db.getVersionHistory(req.params.id);
  res.json(history);
}));

app.post('/api/proposals/:id/history', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.saveVersion(req.params.id, req.body);
  res.json({ success: true });
}));

app.delete('/api/proposals/:id/history/:versionId', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.deleteVersion(req.params.id, req.params.versionId);
  res.json({ success: true });
}));

// MASTER PROPOSALS
app.get('/api/masters', asyncHandler(async (req: express.Request, res: express.Response) => {
  const masters = await db.listMasterProposals();
  res.json(masters);
}));

app.get('/api/masters/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const master = await db.getMasterProposal(req.params.id);
  if (!master) {
    return res.status(404).json({ error: 'Master proposal template not found' });
  }
  res.json(master);
}));

app.post('/api/masters/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.saveMasterProposal(req.params.id, req.body);
  res.json({ success: true });
}));

app.delete('/api/masters/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.deleteMasterProposal(req.params.id);
  res.json({ success: true });
}));

// GLOBAL COMPONENTS
app.get('/api/components', asyncHandler(async (req: express.Request, res: express.Response) => {
  const components = await db.listGlobalComponents();
  res.json(components);
}));

app.post('/api/components', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.saveGlobalComponent(req.body);
  res.json({ success: true });
}));

app.delete('/api/components/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.deleteGlobalComponent(req.params.id);
  res.json({ success: true });
}));

// SETTINGS
app.get('/api/settings', asyncHandler(async (req: express.Request, res: express.Response) => {
  const settings = await db.getSettings();
  res.json(settings);
}));

app.post('/api/settings', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.saveSettings(req.body);
  res.json({ success: true });
}));

// TRASH
app.get('/api/trash', asyncHandler(async (req: express.Request, res: express.Response) => {
  const trash = await db.getTrash();
  res.json(trash);
}));

app.post('/api/trash/:id/restore', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.restoreFromTrash(req.params.id);
  res.json({ success: true });
}));

app.delete('/api/trash/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  await db.permanentlyDelete(req.params.id);
  res.json({ success: true });
}));

// DATABASE SIZE
app.get('/api/db-size', asyncHandler(async (req: express.Request, res: express.Response) => {
  const size = await db.getDatabaseSize();
  res.json({ sizeInBytes: size });
}));

app.get('/api/status', (req: express.Request, res: express.Response) => {
  res.json({ useSupabase });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("API Error:", err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
