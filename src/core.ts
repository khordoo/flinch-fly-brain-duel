export type Vec3 = [number,number,number];
export type Trial = {id:string;onsetMs:number;durationMs:number;object:{position:Vec3;velocity:Vec3;radius:number}};
export type Trace = {trialHash:string;initialStateHash:string;seed:number;parametersHash:string;datasetSha256:string;engineCommit:string;dataset:string;simulatedNeurons:number;visualizedNeurons:number;dtMs:number;telemetryBinMs:number;triggerResolutionMs:number;inputOnsetSimMs:number;escapeSimMs:number|null;simulatedDurationMs:number;intervention:null|{mechanism:string;neuronIds:string[]};populationEvents:{tMs:number;population:string;spikes:number}[]};
export type Pair = {id:string;seed:number;trial:Trial;trialHash:string;files:string[];sha256:string[];normal:Trace;silenced:Trace};
export type Catalog = {version:number;pairs:Pair[];parameters:{parametersSha256:string;engineCommit:string;datasetSha256:string};gameplay:{observerBodyRadiusM:number;dodge:{distanceM:number;durationMs:number}};soma:{count:number;sha256:string}};
export const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const latency=(t:Trace)=>t.escapeSimMs===null?null:t.escapeSimMs-t.inputOnsetSimMs;
export function dodgeX(trial:Trial,t:number,escape:number|null,distance=.03,duration=120){return escape===null?0:(trial.object.position[0]>0?-1:1)*distance*clamp((t-escape)/duration)}
export function clearance(trial:Trial,escape:number|null,body=.006,distance=.03,duration=120){
 const p=trial.object.position,v=trial.object.velocity,h=(trial.durationMs-trial.onsetMs)/1000;
 const start=escape===null?h:clamp(escape/1000,0,h),end=Math.min(h,start+duration/1000),speed=(p[0]>0?-1:1)*distance/(duration/1000);
 const segments:[number,number,number,number][]=[[0,start,0,0],[start,end,0,escape===null?0:speed],[end,h,escape===null?0:speed*(end-start),0]];
 let closest=Infinity;
 for(const [a,b,x,dx] of segments){if(b<a)continue;const q=[p[0]+v[0]*a-x,p[1]+v[1]*a,p[2]+v[2]*a],w=[v[0]-dx,v[1],v[2]],vv=w.reduce((s,n)=>s+n*n,0);const t=vv?clamp(-q.reduce((s,n,i)=>s+n*w[i],0)/vv,0,b-a):0;closest=Math.min(closest,Math.hypot(...q.map((n,i)=>n+w[i]*t)));}
 return closest-body-trial.object.radius;
}
export function shuffled<T>(items:T[],seed:number){const out=[...items];let s=seed>>>0;const rand=()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296};for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export async function digest(raw:BufferSource){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw))).map(n=>n.toString(16).padStart(2,'0')).join('')}
export function validate(t:Trace,p:Pair,c:Catalog,silenced:boolean){
 if(t.trialHash!==p.trialHash||t.seed!==p.seed||t.parametersHash!==c.parameters.parametersSha256||t.engineCommit!==c.parameters.engineCommit||t.datasetSha256!==c.parameters.datasetSha256)throw Error('Trace provenance mismatch');
 if(Boolean(t.intervention)!==silenced||t.inputOnsetSimMs!==p.trial.onsetMs||t.simulatedDurationMs!==p.trial.durationMs)throw Error('Trace condition or timing mismatch');
 for(const n of [t.dtMs,t.telemetryBinMs,t.triggerResolutionMs,t.simulatedNeurons,t.visualizedNeurons])if(!Number.isFinite(n)||n<=0)throw Error('Invalid trace metadata');
 if(t.escapeSimMs!==null&&(!Number.isFinite(t.escapeSimMs)||t.escapeSimMs<t.inputOnsetSimMs||t.escapeSimMs>t.simulatedDurationMs))throw Error('Invalid escape timestamp');
 let previous=-Infinity;for(const e of t.populationEvents){if(!Number.isFinite(e.tMs)||e.tMs<previous||e.tMs>t.simulatedDurationMs||!['LC4','LPLC2','DNp01'].includes(e.population)||!Number.isInteger(e.spikes)||e.spikes<0)throw Error('Invalid population events');previous=e.tMs;}
}
export async function load(onProgress:(n:number)=>void){
 const response=await fetch('/data/flinch/catalog.json');if(!response.ok)throw Error('Missing trace catalog');const catalog:Catalog=await response.json();let done=0;
 await Promise.all(catalog.pairs.map(async p=>{const ts=await Promise.all(p.files.map(async(file,i)=>{const r=await fetch('/data/flinch/traces/'+file);if(!r.ok)throw Error('Missing neural trace');const raw=await r.arrayBuffer();if(await digest(raw)!==p.sha256[i])throw Error('Neural trace checksum mismatch');const t=JSON.parse(new TextDecoder().decode(raw)) as Trace;validate(t,p,catalog,i===1);onProgress(++done/(catalog.pairs.length*2));return t;}));[p.normal,p.silenced]=ts;if(p.normal.initialStateHash!==p.silenced.initialStateHash)throw Error('Unmatched circuit initial states');}));
 return catalog;
}
