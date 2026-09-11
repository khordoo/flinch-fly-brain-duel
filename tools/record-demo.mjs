// External browser capture of real circuit traces; no fabricated human input or score.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('evidence/demo',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1600,height:1000},recordVideo:{dir:'evidence/demo',size:{width:1600,height:1000}}});
const page=await context.newPage();await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'Inspect circuit',exact:true}).waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('#inspect').disabled);
await page.waitForTimeout(3000);await page.getByRole('button',{name:'Inspect circuit',exact:true}).click();await page.waitForTimeout(5200);
await page.getByRole('button',{name:'Silence looming inputs',exact:true}).click();await page.waitForTimeout(7000);
await page.getByRole('button',{name:'Replay ↻',exact:true}).click();await page.waitForTimeout(4200);
await page.getByRole('button',{name:'Restore outputs',exact:true}).click();await page.waitForTimeout(6000);
await page.screenshot({path:'evidence/demo/restore.png'});const video=page.video();await context.close();await video.saveAs('evidence/demo/flinch-circuit-demo.webm');await browser.close();console.log('Saved evidence/demo/flinch-circuit-demo.webm');
