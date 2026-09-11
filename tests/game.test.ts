import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clearance,dodgeX,shuffled,validate,latency,type Catalog} from '../src/core.ts';
const catalog=JSON.parse(fs.readFileSync('public/data/flinch/catalog.json','utf8')) as Catalog;
test('all validated hits collide when staying, survive a 400ms dodge, and collide on a late dodge',()=>{for(const p of catalog.pairs){assert.ok(clearance(p.trial,null)<=0);assert.ok(clearance(p.trial,400)>0);assert.ok(clearance(p.trial,600)<=0)}});
test('collision outcomes are independent of display frame rate',()=>{const p=catalog.pairs[0];for(const fps of [30,60,120,144]){for(let t=0;t<700;t+=1000/fps)dodgeX(p.trial,t,250);assert.ok(clearance(p.trial,250)>0)}});
test('paired provenance is valid, null escape is preserved, corruption is rejected',()=>{for(const p of catalog.pairs){const a=JSON.parse(fs.readFileSync('public/data/flinch/traces/'+p.files[0],'utf8')),b=JSON.parse(fs.readFileSync('public/data/flinch/traces/'+p.files[1],'utf8'));validate(a,p,catalog,false);validate(b,p,catalog,true);assert.equal(a.initialStateHash,b.initialStateHash);assert.equal(latency(b),null);assert.throws(()=>validate({...a,trialHash:'bad'},p,catalog,false));assert.throws(()=>validate({...a,escapeSimMs:NaN},p,catalog,false))}});
test('seeded order reproduces and fixed dodge never moves before input',()=>{assert.deepEqual(shuffled([1,2,3,4],42),shuffled([1,2,3,4],42));assert.equal(dodgeX(catalog.pairs[0].trial,99,100),0);assert.equal(dodgeX(catalog.pairs[0].trial,700,null),0)});
