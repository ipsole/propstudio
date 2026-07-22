import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const dataStoreDir = path.resolve('data-store');

async function syncProposals() {
  const proposalsDir = path.join(dataStoreDir, 'proposals');
  try {
    const files = await fs.readdir(proposalsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('._'));
    
    console.log(`Syncing ${jsonFiles.length} proposals to Supabase...`);
    for (const file of jsonFiles) {
      const data = JSON.parse(await fs.readFile(path.join(proposalsDir, file), 'utf8'));
      
      const row = {
        id: data.id,
        project_name: data.projectName,
        client_name: data.clientName || null,
        company_name: data.companyName || null,
        date: data.date || null,
        logo_url: data.logoUrl || null,
        status: data.status || 'draft',
        brand_kit: data.brandKit || {},
        pages: data.pages || [],
        comments: data.comments || [],
        signatures: data.signatures || {},
        reusable_library: data.reusableLibrary || [],
        parent_id: data.parentId || null,
        industry: data.industry || null,
        variables: data.variables || [],
        active_branch: data.activeBranch || 'main',
        branches: data.branches || {},
        checkpoints: data.checkpoints || [],
        is_blueprint: false,
        is_pinned_default: false,
        is_deleted: false,
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase.from('proposals').upsert(row);
      if (error) {
        console.error(`❌ Failed to sync proposal ${data.id}:`, error.message);
      } else {
        console.log(`✅ Synced proposal: "${data.projectName}" (${data.id})`);
      }
    }
  } catch (err: any) {
    console.error('Error reading proposals folder:', err.message);
  }
}

async function syncMasters() {
  const mastersDir = path.join(dataStoreDir, 'masters');
  try {
    const files = await fs.readdir(mastersDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('._'));
    
    console.log(`Syncing ${jsonFiles.length} master templates to Supabase...`);
    for (const file of jsonFiles) {
      const data = JSON.parse(await fs.readFile(path.join(mastersDir, file), 'utf8'));
      
      const row = {
        id: data.id,
        project_name: data.projectName,
        client_name: data.clientName || null,
        company_name: data.companyName || null,
        date: data.date || null,
        logo_url: data.logoUrl || null,
        status: data.status || 'draft',
        brand_kit: data.brandKit || {},
        pages: data.pages || [],
        comments: data.comments || [],
        signatures: data.signatures || {},
        reusable_library: data.reusableLibrary || [],
        parent_id: data.parentId || null,
        industry: data.industry || null,
        variables: data.variables || [],
        active_branch: data.activeBranch || 'main',
        branches: data.branches || {},
        checkpoints: data.checkpoints || [],
        is_blueprint: true,
        blueprint_description: data.blueprintDescription || null,
        is_pinned_default: data.isPinnedDefault || false,
        is_deleted: false,
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase.from('proposals').upsert(row);
      if (error) {
        console.error(`❌ Failed to sync master ${data.id}:`, error.message);
      } else {
        console.log(`✅ Synced master template: "${data.projectName}" (${data.id})`);
      }
    }
  } catch (err: any) {
    console.error('Error reading masters folder:', err.message);
  }
}

async function syncSettings() {
  const settingsFile = path.join(dataStoreDir, 'settings.json');
  try {
    const data = JSON.parse(await fs.readFile(settingsFile, 'utf8'));
    console.log('Syncing settings to Supabase...');
    const { error } = await supabase.from('settings').upsert({
      id: 'default',
      default_master_proposal_id: data.defaultMasterProposalId || null,
      updated_at: new Date().toISOString()
    });
    if (error) {
      console.error('❌ Failed to sync settings:', error.message);
    } else {
      console.log('✅ Synced settings.');
    }
  } catch (err: any) {
    console.log('No settings file found or failed to read. Skipping.');
  }
}

async function run() {
  console.log('🚀 Starting Cloud Sync from Local Storage to Supabase...');
  await syncProposals();
  await syncMasters();
  await syncSettings();
  console.log('🎉 Cloud Sync completed successfully!');
}

run();
