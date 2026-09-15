// Soft ambient wings; dodge feedback follows human input, never predicts a threat.
export class WingSound {
 private context?: AudioContext;
 private volume?: GainNode;
 private audible=false;
 enabled=true;
 unlock(){
  if(!this.enabled)return;
  try{
   if(!this.context){
    const ctx=new AudioContext();this.context=ctx;this.audible=false;
    const volume=ctx.createGain();volume.gain.value=0;volume.connect(ctx.destination);this.volume=volume;
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;filter.Q.value=.4;filter.connect(volume);
    for(const frequency of [187,193]){
     const wing=ctx.createOscillator();wing.type='triangle';wing.frequency.value=frequency;wing.connect(filter);wing.start();
     const flutter=ctx.createOscillator();flutter.frequency.value=frequency===187?6.3:7.1;
     const depth=ctx.createGain();depth.gain.value=3;flutter.connect(depth);depth.connect(wing.frequency);flutter.start();
    }
   }
   void this.context.resume().catch(()=>{});
  }catch{/* Audio availability must never prevent play. */}
 }
 dodge(){
  if(!this.enabled||!this.audible||!this.context||!this.volume)return;
  const now=this.context.currentTime,gain=this.volume.gain;
  gain.cancelAndHoldAtTime(now);
 gain.linearRampToValueAtTime(.07,now+.045);
 gain.setTargetAtTime(.025,now+.085,.09);
 }
 collision(){
  if(!this.enabled)return;
  this.unlock();
  if(!this.context)return;
  const now=this.context.currentTime,oscillator=this.context.createOscillator(),gain=this.context.createGain(),filter=this.context.createBiquadFilter();
  oscillator.type='triangle';oscillator.frequency.setValueAtTime(210,now);oscillator.frequency.exponentialRampToValueAtTime(82,now+.19);
  filter.type='lowpass';filter.frequency.value=950;gain.gain.setValueAtTime(.11,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.22);
  oscillator.connect(filter);filter.connect(gain);gain.connect(this.context.destination);oscillator.start(now);oscillator.stop(now+.23);
 }
 test(){
  if(!this.enabled)return;
  this.unlock();
  void this.context?.resume().then(()=>{
   if(!this.context||!this.volume)return;
   const now=this.context.currentTime,gain=this.volume.gain;
   gain.cancelAndHoldAtTime(now);
   gain.linearRampToValueAtTime(.075,now+.03);
   gain.setTargetAtTime(this.audible?.025:0,now+.22,.08);
  }).catch(()=>{});
 }
 update(active:boolean){
  const audible=this.enabled&&active&&!document.hidden;
  if(audible===this.audible)return;
  this.audible=audible;
  if(this.context&&this.volume){
   const now=this.context.currentTime;
   this.volume.gain.cancelAndHoldAtTime(now);
   this.volume.gain.setTargetAtTime(audible?.025:0,now,.12);
  }
 }
}
