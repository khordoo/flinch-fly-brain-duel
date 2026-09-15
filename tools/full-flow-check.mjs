import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto('http://127.0.0.1:5173');await page.locator('#classic').click();await page.getByRole('button',{name:'Start playing'}).click();
await page.keyboard.press('Space');await page.getByRole('button',{name:'Retry this round'}).waitFor();
await page.getByRole('button',{name:'Retry this round'}).click();
const results=[];
for(let n=0;n<6;n++){
 await page.waitForFunction(()=>document.querySelector('#live-status').classList.contains('hidden')&&!document.querySelector('#dodge').classList.contains('hidden'));
 if(n!==2){await page.waitForTimeout(170);await page.keyboard.down('Space');await page.waitForTimeout(50);await page.keyboard.up('Space');}
 await page.locator('#next').waitFor({state:'visible'});
 if((await page.locator('#next').innerText()).includes('Retry'))throw Error('Frame validity failed during full flow');
 results.push({round:n,metric:await page.locator('#left-metric').innerText(),outcome:await page.locator('#left-result').innerText()});
 await page.locator('#next').click();
}
await page.getByRole('button',{name:'Play again',exact:true}).waitFor();
if(!results.some(r=>r.outcome==='ESCAPED')||results[2].outcome!=='COLLISION')throw Error('Keyboard/stay scoring failure');
const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Save result',exact:true}).click();const download=await downloadPromise;await download.saveAs('evidence/ui/automated-session.json');
await page.screenshot({path:'evidence/ui/summary.png'});await page.getByRole('button',{name:'Play again',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#stage-caption').textContent.includes('PRACTICE 1'));
await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.getByRole('button',{name:'Retry this round'}).waitFor();
await fs.writeFile('evidence/ui/full-flow.json',JSON.stringify({automatedInput:true,checks:['false start','Space input','held key','stay collision','two practices','four rounds','summary','download','repeat play','focus invalidation'],results},null,2));
await browser.close();console.log('Full flow passed. Inputs were automated, not human measurements.');
