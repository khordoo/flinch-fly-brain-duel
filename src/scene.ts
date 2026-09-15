import * as T from 'three';
import {dodgeX,type Trial,clamp} from './core';
function fly(color:number){
 const g=new T.Group(),body=new T.MeshPhysicalMaterial({color:0x465969,metalness:.55,roughness:.3,clearcoat:.65,clearcoatRoughness:.2});
 const mesh=(geo:T.BufferGeometry,mat:T.Material,scale:[number,number,number],pos:[number,number,number])=>{const m=new T.Mesh(geo,mat);m.scale.set(...scale);m.position.set(...pos);g.add(m);return m};
 const sphere=new T.SphereGeometry(1,24,16);
 mesh(sphere,body,[.0035,.0032,.007],[0,0,0]);mesh(sphere,body,[.004,.0036,.0035],[0,.001,.006]);
 const eye=new T.MeshPhysicalMaterial({color,emissive:color,emissiveIntensity:.25,roughness:.26,metalness:.2,clearcoat:.85,clearcoatRoughness:.12,flatShading:true});
 const eyeGeometry=new T.IcosahedronGeometry(1,3);
 for(const s of [-1,1]){mesh(eyeGeometry,eye,[.0018,.0021,.0021],[s*.003,.002,.007]);const wing=mesh(sphere,new T.MeshPhysicalMaterial({color:0xc8e5ed,transparent:true,opacity:.45,metalness:.35,roughness:.1,side:T.DoubleSide}),[.011,.00022,.0048],[s*.009,.003,0]);wing.rotation.y=s*-.45;wing.name='wing';for(let i=0;i<3;i++){const curve=new T.BufferGeometry().setFromPoints([new T.Vector3(s*.002,-.001,.004-i*.003),new T.Vector3(s*.006,-.004,.002-i*.003),new T.Vector3(s*.007,-.006,-i*.003)]);g.add(new T.Line(curve,new T.LineBasicMaterial({color:0x9bafbd})));}}
 return g;
}
export class Arena {
 renderer:T.WebGLRenderer; scenes:T.Scene[]=[]; cameras:T.PerspectiveCamera[]=[]; flies:T.Group[]=[]; rocks:T.Mesh[]=[]; rings:T.Mesh[]=[]; hosts:HTMLElement[];canvas:HTMLCanvasElement;
 constructor(host:HTMLElement,lanes:HTMLElement[]){this.hosts=lanes;this.renderer=new T.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x090d14,0);this.canvas=this.renderer.domElement;host.prepend(this.canvas);this.canvas.className='arena-canvas';this.renderer.setScissorTest(true);
 for(let i=0;i<2;i++){const color=i?0xffc578:0x66deff,s=new T.Scene();s.fog=new T.FogExp2(0x090d14,6);s.add(new T.HemisphereLight(0xdcefff,0x101519,3));const light=new T.DirectionalLight(0xffffff,4);light.position.set(-.1,.2,-.1);s.add(light);const accent=new T.PointLight(color,.6,1,1);accent.position.set(.04,.02,-.02);s.add(accent);
 // A cool rim and broad camera-side fill separate the shell from the dark runway.
 const rim=new T.DirectionalLight(0xb8ddff,2.4);rim.position.set(.08,.045,.07);s.add(rim);
 const fill=new T.DirectionalLight(0xd5e6f2,1.3);fill.position.set(.04,.025,-.1);s.add(fill);
 const camera=new T.PerspectiveCamera(49,1,.001,3);camera.position.set(0,.037,-.093);camera.lookAt(0,.008,.065);
 const grid=new T.GridHelper(1,40,0x62a5c9,0x294e69);grid.position.set(0,-.01,.35);s.add(grid);
 for(let x of [-.065,.065]){const line=new T.BufferGeometry().setFromPoints([new T.Vector3(x,-.009,-.03),new T.Vector3(x,-.009,.8)]);s.add(new T.Line(line,new T.LineBasicMaterial({color:0x70b8dc,transparent:true,opacity:.82})));}
 for(let z=.12;z<.9;z+=.14){const points=[new T.Vector3(-.085,-.01,z),new T.Vector3(-.085,.07,z),new T.Vector3(.085,.07,z),new T.Vector3(.085,-.01,z)];s.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0x477b9b,transparent:true,opacity:.72})));}
 const f=fly(color);s.add(f);const rock=new T.Mesh(new T.IcosahedronGeometry(.006,2),new T.MeshStandardMaterial({color:0x9fa8b2,metalness:.8,roughness:.32,flatShading:true}));s.add(rock);rock.visible=false;
 const ring=new T.Mesh(new T.RingGeometry(.008,.00815,64),new T.MeshBasicMaterial({color,transparent:true,opacity:.3,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.0095;s.add(ring);
 this.scenes.push(s);this.cameras.push(camera);this.flies.push(f);this.rocks.push(rock);this.rings.push(ring);}
 }
 draw(trial:Trial,t:number,actions:(number|null)[],visible:boolean,mutedRight:boolean,collisions:boolean[],now:number,recenter=0){const rect=this.canvas.parentElement!.getBoundingClientRect();const w=Math.round(rect.width),h=Math.round(rect.height);if(this.canvas.width!==Math.floor(w*this.renderer.getPixelRatio())||this.canvas.height!==Math.floor(h*this.renderer.getPixelRatio()))this.renderer.setSize(w,h,false);
 for(let i=0;i<2;i++){const r=this.hosts[i].getBoundingClientRect(),x=r.left-rect.left,y=rect.bottom-r.bottom;this.renderer.setViewport(x,y,r.width,r.height);this.renderer.setScissor(x,y,r.width,r.height);const cam=this.cameras[i];cam.aspect=r.width/r.height;cam.updateProjectionMatrix();const f=this.flies[i];f.position.x=dodgeX(trial,t,actions[i])*(1-recenter);f.rotation.z=-dodgeX(trial,t,actions[i])*5;f.position.y=0;f.visible=!(collisions[i]&&t>540);for(const wing of f.children.filter(c=>c.name==='wing'))wing.rotation.z=Math.sin(now*.07)*.13;
 const rock=this.rocks[i];rock.visible=visible&&t>=0;const p=trial.object.position,v=trial.object.velocity;rock.position.set(p[0]+v[0]*t/1000,p[1]+v[1]*t/1000,p[2]+v[2]*t/1000);rock.rotation.set(t*.0004,t*.0007,.3);this.rings[i].position.x=f.position.x;(this.rings[i].material as T.MeshBasicMaterial).opacity=collisions[i]&&t>540?.8:.22;this.renderer.render(this.scenes[i],cam);}
 this.hosts[1].classList.toggle('concealed',mutedRight);
 }
}
export class Anatomy {
 renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.PerspectiveCamera(30,1,.01,10);host:HTMLElement;
 constructor(host:HTMLElement,positions:Float32Array){this.host=host;this.renderer=new T.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.prepend(this.renderer.domElement);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));const points=new T.Points(geo,new T.PointsMaterial({color:0x829cac,size:.0015,transparent:true,opacity:.25,depthWrite:false}));points.rotation.x=Math.PI;this.scene.add(points);this.camera.position.set(0,0,1.6);this.camera.lookAt(0,0,0);this.draw();new ResizeObserver(()=>this.draw()).observe(host);}
 draw(){const r=this.host.getBoundingClientRect();this.renderer.setSize(r.width,r.height,false);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);}
}
