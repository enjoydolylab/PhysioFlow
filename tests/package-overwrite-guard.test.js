import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
for(const kind of ['Web','Server'])test(`${kind} packaging refuses an existing archive before modifying it`,t=>{
 if(kind==='Server'&&spawnSync('python3',['--version']).status!==0){t.skip('Python 3 unavailable');return;}
 const root=mkdtempSync(join(tmpdir(),'pf-package-guard-'));
 try{
  mkdirSync(join(root,'release-web'));writeFileSync(join(root,'package.json'),JSON.stringify({version:'0.6.0-beta.99'}));
  const zip=join(root,'release-web',`PhysioFlow-${kind}-v0.6.0-beta.99.zip`);writeFileSync(zip,'preserve-existing-archive');
  let command,args;
  if(kind==='Web'){copyFileSync('build-web.cjs',join(root,'build-web.cjs'));command=process.execPath;args=['build-web.cjs'];}
  else{mkdirSync(join(root,'scripts'));copyFileSync('scripts/package-server-trial.py',join(root,'scripts/package-server-trial.py'));command='python3';args=['scripts/package-server-trial.py'];}
  const env={...process.env};delete env.PF_REPLACE_EXISTING_PACKAGE;
  const result=spawnSync(command,args,{cwd:root,env,encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/Package already exists/);assert.equal(readFileSync(zip,'utf8'),'preserve-existing-archive');
 }finally{rmSync(root,{recursive:true,force:true});}
});
