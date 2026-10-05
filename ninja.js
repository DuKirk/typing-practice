/* Keyboard Ninja + the game picker on the Game page. Wrapped so it cannot clash with other scripts.
   The ninja only listens, draws and moves while the Game page is open AND Keyboard Ninja is selected. */
(function(){
const section=document.getElementById('game');if(!section)return;
const on=()=>section.classList.contains('active-page')&&section.dataset.game==='ninja';
const c=document.getElementById('njCanvas'),g=c.getContext('2d'),W=900,H=500;
const FR=['🍌','🍎','🍉','🍊','🍍','🍐','🍓','🥝','🍇','🍒','🍑','🥭','🍋','🍈','🥥','🍏'];
let fruits,parts,sparks,score,lives,over,started=false,shock=0,flash=0,waveT,spawnQ,cause='',mode=0,last=0,splats=[],slashes=[],A=null;
const CF=[{g:.13,bomb:.1,st:0,gap:s=>Math.max(950,1600-s*10),n:s=>1},
{g:.16,bomb:.15,st:350,gap:s=>Math.max(1150,2000-s*8),n:s=>{const r=Math.random();return r<.2?1:r<.8?2:(s>40&&r>.92?4:3)}},
{g:.25,bomb:.28,st:190,gap:s=>Math.max(850,1650-s*8),n:s=>4+(Math.random()*(s>20?4:3)|0)}];
const FC={'🍌':'#ffe135','🍎':'#e02424','🍉':'#ff3b5c','🍊':'#ff9800','🍍':'#ffd23f','🍐':'#b5d33d','🍓':'#e0143c','🥝':'#7ac142','🍇':'#7b2d8e','🍒':'#c2002f','🍑':'#ffab76','🥭':'#ffb300','🍋':'#fff44f','🍈':'#9be36b','🥥':'#f1e7d0','🍏':'#8bd02f'};
const lvl=()=>mode<3?mode:score<25?0:score<60?1:2;
// pre-render wood background
const bg=document.createElement('canvas');bg.width=W;bg.height=H;
(function(){const b=bg.getContext('2d');let x=0,i=0;
while(x<W){const w=110+((i*37)%50);const gr=b.createLinearGradient(x,0,x+w,0);
const l=40+((i*13)%10);gr.addColorStop(0,`hsl(15,55%,${l-8}%)`);gr.addColorStop(.5,`hsl(18,60%,${l}%)`);gr.addColorStop(1,`hsl(15,55%,${l-10}%)`);
b.fillStyle=gr;b.fillRect(x,0,w,H);b.strokeStyle='rgba(60,20,10,.22)';b.lineWidth=1.5;
for(let k=0;k<5;k++){b.beginPath();const gx=x+10+((k*29+i*17)%(w-20));b.moveTo(gx,0);b.bezierCurveTo(gx+10,H*.3,gx-10,H*.6,gx+4,H);b.stroke();}
b.fillStyle='rgba(30,10,5,.6)';b.fillRect(x+w-3,0,3,H);x+=w;i++;}
const v=b.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.65);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');b.fillStyle=v;b.fillRect(0,0,W,H);})();

function reset(){fruits=[];parts=[];sparks=[];score=0;lives=3;over=false;splats=[];slashes=[];spawnQ=[];waveT=500;cause='';shock=0;flash=0}
reset();
function spawn(l){
  const C=CF[l],used=fruits.map(f=>f.l),pool='abcdefghijklmnopqrstuvwxyz'.split('').filter(q=>!used.includes(q));
  if(!pool.length)return;
  const bomb=(score>=3||l==2)&&Math.random()<C.bomb,h=290+Math.random()*130,x=120+Math.random()*(W-240);
  fruits.push({l:pool[Math.random()*pool.length|0],bomb,e:bomb?'💣':FR[Math.random()*FR.length|0],x,y:H+40,g:C.g,
    vx:(W/2-x)/180+(Math.random()-.5)*1.2,vy:-Math.sqrt(2*C.g*h),rot:0,vr:(Math.random()-.5)*.08});
}
function initAudio(){if(!A){try{A=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(A&&A.state==='suspended')A.resume()}
function noise(dur,type,f0,f1,vol){const n=A.createBufferSource(),b=A.createBuffer(1,A.sampleRate*dur|0,A.sampleRate),d=b.getChannelData(0),t=A.currentTime;
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=b;const fl=A.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f0,t);fl.frequency.exponentialRampToValueAtTime(f1,t+dur);
  const gn=A.createGain();gn.gain.setValueAtTime(vol,t);gn.gain.exponentialRampToValueAtTime(.001,t+dur);n.connect(fl);fl.connect(gn);gn.connect(A.destination);n.start()}
function tone(f0,f1,dur,vol,type='sine'){const o=A.createOscillator(),gn=A.createGain(),t=A.currentTime;o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  gn.gain.setValueAtTime(vol,t);gn.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(gn);gn.connect(A.destination);o.start();o.stop(t+dur)}
const sndSlice=()=>{if(A){noise(.16,'bandpass',2500,7000,.5);tone(520,180,.1,.15,'triangle')}};
const sndBomb=()=>{if(A){noise(.6,'lowpass',900,60,1);tone(140,35,.5,.6)}};
const sndMiss=()=>{if(A)tone(240,110,.22,.25,'sawtooth')};
function addSplat(x,y,col,k){const bl=[{x,y,r:26*k}];for(let i=0;i<10;i++){const a=Math.random()*6.28,d=Math.random()*60*k;bl.push({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,r:(4+Math.random()*14)*k*(1-d/(110*k))})}
  splats.push({col,bl,life:260});if(splats.length>30)splats.shift()}
function burst(x,y,n,col){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=1+Math.random()*4;
  sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:30+Math.random()*25,col})}}
function loseLife(){lives--;shock=60;if(lives<=0)over=true}
function slice(f){
  parts.push({e:f.e,x:f.x,y:f.y,vx:f.vx-2,vy:f.vy,rot:f.rot,vr:-.08,half:0},
             {e:f.e,x:f.x,y:f.y,vx:f.vx+2,vy:f.vy,rot:f.rot,vr:.08,half:1});
  const col=FC[f.e]||'#ffc933';burst(f.x,f.y,26,col);burst(f.x,f.y,8,'#fff');addSplat(f.x,f.y,col,1);slashes.push({x:f.x,y:f.y,a:-.9+Math.random()*1.8,life:14});sndSlice();
}
addEventListener('keydown',e=>{
  if(!on()||/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;
  if(e.metaKey||e.ctrlKey||e.altKey)return;initAudio();
  if(!started){const n=parseInt(e.key);if(n>=1&&n<=4){mode=n-1;started=true;reset()}return}
  if(over){const n=parseInt(e.key);if(n>=1&&n<=4){mode=n-1;reset()}else if(e.key==='Enter')reset();else if(e.key.toLowerCase()==='m')started=false;return}
  const k=e.key.toLowerCase();if(!/^[a-z]$/.test(k))return;
  const m=fruits.filter(f=>f.l===k).sort((a,b)=>b.y-a.y)[0];if(!m)return;
  fruits.splice(fruits.indexOf(m),1);
  if(m.bomb){burst(m.x,m.y,60,'#ff5a1f');burst(m.x,m.y,25,'#a259ff');sndBomb();addSplat(m.x,m.y,'#1c0b2e',1.6);flash=20;score=Math.max(-99,score-1);if(lvl()==2){lives=0;over=true;shock=60;cause='💥 You hit a bomb!'}else loseLife()}
  else{slice(m);score++}
});
c.addEventListener('click',e=>{initAudio();const r=c.getBoundingClientRect(),y=(e.clientY-r.top)*H/r.height;
  if(!started||over){const i=pick(e);if(i>=0){mode=i;started=true;reset()}}});

function step(dt){
  const l=lvl(),C=CF[l];waveT-=dt*16.7;
  if(waveT<=0){const n=C.n(score);for(let i=0;i<n;i++)spawnQ.push(i*C.st*(.7+Math.random()*.6));waveT=C.gap(score)}
  spawnQ=spawnQ.map(t=>t-dt*16.7).filter(t=>{if(t<=0){spawn(l);return false}return true});
  for(const f of fruits){f.vy+=f.g*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.rot+=f.vr*dt}
  for(let i=fruits.length-1;i>=0;i--){const f=fruits[i];
    if(f.y>H+50&&f.vy>0){fruits.splice(i,1);if(!f.bomb){sndMiss();loseLife()}}}
  for(const p of parts){p.vy+=.2*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt}
  parts=parts.filter(p=>p.y<H+80);
  for(const s of sparks){s.vy+=.05*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt}
  sparks=sparks.filter(s=>s.life>0);
  if(shock>0)shock-=dt;if(flash>0)flash-=dt;for(const q of splats)q.life-=dt;splats=splats.filter(q=>q.life>0);for(const q of slashes)q.life-=dt;slashes=slashes.filter(q=>q.life>0);
}
function outline(t,x,y,size,col,al='center'){g.font=`900 ${size}px "Arial Black",Arial,sans-serif`;g.textAlign=al;g.textBaseline='middle';
  g.lineJoin='round';g.lineWidth=size/4.5;g.strokeStyle='#000';g.strokeText(t,x,y);g.fillStyle=col;g.fillText(t,x,y)}
const CARDS=[['Easy','🍌','#3fbf5f'],['Medium','🍉','#f0a020'],['Beast','🔥','#e8372b'],['Journey','🚀','#8e5ce6']];
let hov=-1;const hs=[0,0,0,0];
const card=i=>({x:40+i*210,y:190,w:190,h:150});
function pick(e){const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
  for(let i=0;i<4;i++){const k=card(i);if(x>=k.x&&x<=k.x+k.w&&y>=k.y&&y<=k.y+k.h)return i}return -1}
c.addEventListener('mousemove',e=>{hov=(!started||over)?pick(e):-1;c.style.cursor=hov>=0?'pointer':'default'});
c.addEventListener('mouseleave',()=>{hov=-1});
function drawBtns(){
  CARDS.forEach(([n,em,col],i)=>{hs[i]+=((hov===i?1:0)-hs[i])*.2;const k=card(i),sc=1+.08*hs[i];
    g.save();g.translate(k.x+k.w/2,k.y+k.h/2);g.scale(sc,sc);
    g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=14+10*hs[i];g.shadowOffsetY=6;
    g.fillStyle=col;g.beginPath();g.roundRect(-k.w/2,-k.h/2,k.w,k.h,18);g.fill();g.shadowColor='transparent';
    g.fillStyle=`rgba(255,255,255,${.12+.2*hs[i]})`;g.beginPath();g.roundRect(-k.w/2,-k.h/2,k.w,k.h/2,18);g.fill();
    g.lineWidth=3;g.strokeStyle='rgba(255,255,255,.8)';g.beginPath();g.roundRect(-k.w/2,-k.h/2,k.w,k.h,18);g.stroke();
    g.font='54px serif';g.textAlign='center';g.textBaseline='middle';g.rotate(hs[i]*.12*Math.sin(performance.now()/120));g.fillText(em,0,-22);g.rotate(0);
    g.restore();g.save();g.translate(k.x+k.w/2,k.y+k.h/2);g.scale(sc,sc);outline(n,0,40,28,'#fff');
    g.font='700 14px Arial';g.fillStyle='rgba(255,255,255,.85)';g.textAlign='left';g.fillText(i+1,-k.w/2+12,-k.h/2+16);g.restore()});
}
function drawBomb(f){const R=46;g.save();g.translate(f.x,f.y);
  g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=14;g.shadowOffsetY=6;
  const gr=g.createRadialGradient(-14,-16,4,0,0,R);gr.addColorStop(0,'#7a45b0');gr.addColorStop(.3,'#2b1245');gr.addColorStop(1,'#040206');
  g.fillStyle=gr;g.beginPath();g.arc(0,0,R,0,6.28);g.fill();g.shadowColor='transparent';
  g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.ellipse(-16,-20,10,6,-.7,0,6.28);g.fill();
  g.fillStyle='#1a1226';g.fillRect(-9,-R-6,18,12);
  g.strokeStyle='#8a6a3a';g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(0,-R-6);g.quadraticCurveTo(10,-R-20,20,-R-16);g.stroke();
  const fl=6+Math.random()*5;g.fillStyle='#ffd23f';g.beginPath();g.arc(21,-R-17,fl,0,6.28);g.fill();g.fillStyle='#ff6a1f';g.beginPath();g.arc(21,-R-17,fl*.5,0,6.28);g.fill();g.restore()}
function draw(){
  g.drawImage(bg,0,0);
  for(const sp of splats){g.globalAlpha=Math.min(1,sp.life/90)*.65;g.fillStyle=sp.col;for(const b of sp.bl){g.beginPath();g.arc(b.x,b.y,Math.max(1,b.r),0,6.28);g.fill()}}g.globalAlpha=1;
  for(const f of fruits){
    if(f.bomb){drawBomb(f);outline(f.l,f.x,f.y-76,52,'#d946ef')}
    else{g.save();g.translate(f.x,f.y);g.rotate(f.rot);g.font='70px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(f.e,0,0);g.restore();
      outline(f.l,f.x,f.y-48,46,'#ffb300')}
  }
  for(const p of parts){g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.beginPath();
    g.rect(p.half?0:-50,-50,50,100);g.clip();g.font='70px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(p.e,0,0);g.restore()}
  for(const s of sparks){g.globalAlpha=Math.min(1,s.life/25);g.fillStyle=s.col;g.beginPath();g.arc(s.x,s.y,2.2,0,6.28);g.fill()}
  g.globalAlpha=1;
  for(const l of slashes){const a=l.life/14,dx=Math.cos(l.a)*110,dy=Math.sin(l.a)*110;g.lineCap='round';g.strokeStyle=`rgba(255,255,255,${a})`;g.lineWidth=8*a;g.beginPath();g.moveTo(l.x-dx,l.y-dy);g.lineTo(l.x+dx,l.y+dy);g.stroke()}
  if(flash>0){g.fillStyle=`rgba(255,200,120,${flash/30})`;g.fillRect(0,0,W,H)}
  g.font='62px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('🥷',58+(shock>0?Math.sin(performance.now()/30)*5:0),46);
  outline('Score: '+score,W-20,40,36,'#fff','right');
  for(let i=0;i<3;i++)outline('✖',128+i*40,46,32,i>=lives?'#e8200f':'#3a2a22');
  if(started)outline(['EASY','MEDIUM','BEAST'][lvl()],W/2,28,24,['#7CFC00','#ffb300','#ff4040'][lvl()]);
  if(!started){g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,W,H);
    outline('Keyboard Ninja',W/2,85,54,'#ffb300');outline('Choose your mode',W/2,140,24,'#fff');
    drawBtns()}
  else if(over){g.fillStyle='rgba(0,0,0,.65)';g.fillRect(0,0,W,H);
    outline('Game Over',W/2,45,48,'#ffb300');if(cause)outline(cause,W/2,88,22,'#ff8a5c');
    outline('Final score: '+score,W/2,120,26,'#fff');outline('Play again?',W/2,158,22,'#fff');drawBtns();outline('Enter = retry same mode',W/2,385,16,'#fff')}
}
function loop(t){if(!on()){last=t;requestAnimationFrame(loop);return}const dt=Math.min(3,(t-last)/16.7||1);last=t;if(started&&!over)step(dt);else{for(const s of sparks){s.x+=s.vx;s.y+=s.vy;s.life--}sparks=sparks.filter(s=>s.life>0)}draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
})();

/* ---- game picker ---- */
(function(){
  const section=document.getElementById('game');if(!section)return;
  const KEY='typingmaster-game',btns=[...section.querySelectorAll('[data-game-pick]')];
  function wordGameRunning(){return [...section.querySelectorAll('#wrStart,#wrPauseScreen,#wrOver')].every(el=>el.classList.contains('hidden'))}
  function select(name){
    if(name!=='words'&&name!=='ninja')name='words';
    if(name==='ninja'&&wordGameRunning()){const p=document.getElementById('wrPause');if(p)p.click()}  // pause Word Rain
    section.dataset.game=name;
    btns.forEach(b=>{const o=b.dataset.gamePick===name;b.classList.toggle('on',o);b.setAttribute('aria-selected',String(o))});
    try{localStorage.setItem(KEY,name)}catch(e){}
  }
  btns.forEach(b=>b.addEventListener('click',()=>{select(b.dataset.gamePick);b.blur()}));
  let saved='words';try{saved=localStorage.getItem(KEY)||saved}catch(e){}
  select(saved);
})();
