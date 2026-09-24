import http from 'node:http';
import {appendFileSync} from 'node:fs';
const log='/tmp/physioflow-physiodb-qa-cancel.jsonl';
const stream={id:'11111111-1111-4111-8111-111111111111',experiment_id:'22222222-2222-4222-8222-222222222222',participant_id:'33333333-3333-4333-8333-333333333333',fields:[{name:'signal',type:'float',unit:'uV'},{name:'auxiliary',type:'float',unit:null}],deleted_at:null};
http.createServer(async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:5187');res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 if(req.headers.authorization!=='Bearer local-qa-token'){res.writeHead(401);res.end();return;}
 const path=`/api/v1/streams/${stream.id}`;
 if(req.method==='GET'&&req.url===path){appendFileSync(log,JSON.stringify({method:'GET',path:req.url})+'\n');res.setHeader('Content-Type','application/json');res.end(JSON.stringify(stream));return;}
 if(req.method==='POST'&&req.url===path+'/samples'){
  let text='';for await(const chunk of req)text+=chunk;
  const samples=JSON.parse(text);appendFileSync(log,JSON.stringify({method:'POST',count:samples.length,first:samples[0],last:samples.at(-1)})+'\n');setTimeout(()=>{res.writeHead(204);res.end();},60000);return;
 }
 res.writeHead(404);res.end();
}).listen(8876,'127.0.0.1',()=>console.log('Local contract test server on 8876'));
