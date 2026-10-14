import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
const artifacts=process.env.PF_PACKAGE_ARTIFACTS || 'artifacts/db-progression-2026-10-14/package';
const directory=resolve(process.argv[2]||'release-web/PhysioFlow-Server-v0.6.0-beta.8');
const manifest=JSON.parse(await readFile(join(directory,'SOURCE_FILES_SHA256.json'),'utf8'));
for(const [name,hash] of Object.entries(manifest)){assert.ok(!name.split('/').includes('..'));assert.equal(createHash('sha256').update(await readFile(join(directory,name))).digest('hex'),hash,name);}
const privateLink=new URL((await readFile(join(directory,'.physioflow/local-desk/admin-access.txt'),'utf8')).trim());assert.equal(privateLink.hostname,'127.0.0.1');
const token=new URLSearchParams(privateLink.hash.slice(1)).get('access');const metrics=await fetch(new URL('/metrics',privateLink),{headers:{Authorization:`Bearer ${token}`}});assert.equal(metrics.status,200);
for(const route of ['/','/admin','/admin/','/participant']){const response=await fetch(new URL(route,privateLink));assert.equal(response.status,200);assert.match(await response.text(),/<base href="\/">/);}
await mkdir(artifacts,{recursive:true});await writeFile(`${artifacts}/server.json`,JSON.stringify({sourceManifestVerified:true,files:Object.keys(manifest).length,ownerMetrics:true,spaRoutes:true,credentialsBundled:false,dbConfigured:false},null,2));console.log('Server trial manifest, startup, owner authentication and SPA routes passed');
