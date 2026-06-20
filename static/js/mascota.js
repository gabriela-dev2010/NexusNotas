// Nexus - Mascota NexusNotas
const C = document.getElementById('nexusCanvas');
const X = C.getContext('2d');
const W = 280, H = 480;

// Colores
const BR='#8B5A2B', BRD='#6B4320', BRL='#A67040', BRM='#7A4F22';
const CR='#F5DEB3', CRD='#E8C990';
const NS='#3E2723';
const BL='#1E90FF', BLD='#1570CC', BLL='#5AB4FF', BLVL='#82C8FF';
const WH='#FFFFFF', BK='#111111';
const PNK='rgba(255,150,170,0.38)';

// Estado
let pose=2, playing=true, timer=null;
let hov=false, clicked=false;
let t=0, blinkT=0, blinking=false, blinkP=0;
let sparks=[], bbT=null;

// Poses y mensajes
const POSES = [
  {eyec:'open',gl:'down',bl:0,ar:'side'},     // 0 = Normal
  {eyec:'down',gl:'down',bl:.25,ar:'side'},   // 1 = Pensando  
  {eyec:'open',gl:'down',bl:.12,ar:'wave'},   // 2 = Bienvenida saludando
  {eyec:'open',gl:'up',bl:.35,ar:'up'},       // 3 = Feliz
  {eyec:'down',gl:'down',bl:.1,ar:'point'}    // 4 = Explicando
];

const MSGS={
  'index':'¡Bienvenida a NexusNotas!',
  'login':'¿Lista para tus notas?',
  'registro':'¡Únete a Nexus!',
  'dashboard':'Revisa tus materias',
  'nota_alta':'¡Excelente trabajo!',
  'nota_baja':'A mejorar esta materia',
  'error_clave':'¿Olvidaste tu clave?',
  'hover':'¿Te ayudo?',
  'click':'¡Tú puedes!'
};

// Funciones base
function el(x,y,rx,ry,rot=0){
  X.save(); X.translate(x,y); X.rotate(rot);
  X.beginPath(); X.ellipse(0,0,rx,ry,0,0,Math.PI*2); X.restore();
}

function rr(x,y,w,h,r){
  X.beginPath();
  X.moveTo(x+r,y); X.arcTo(x+w,y,x+w,y+h,r);
  X.arcTo(x+w,y+h,x,y+h,r); X.arcTo(x,y+h,x,y,r);
  X.arcTo(x,y,x+w,y,r); X.closePath();
}

// Burbuja de texto
function showBubble(txt,ms=3000){
  const bbl=document.getElementById('nexusBubble');
  bbl.textContent=txt;
  bbl.classList.add('show');
  clearTimeout(bbT);
  bbT=setTimeout(()=>bbl.classList.remove('show'),ms);
}

// Cambio de pose
function goTo(i){
  pose=((i%5)+5)%5;
  //if(playing) schedule();
  addSparks(140+(Math.random()-.5)*40,90+Math.random()*50,5,[BL,'#FFD700','#fff']);
}

// Mood segun pagina
function setMood(ctx){
  let pose=2;
  if(ctx==='index') pose=2;
  if(ctx==='login') pose=3;
  if(ctx==='registro') pose=0;
  if(ctx==='dashboard') pose=4;
  if(ctx==='nota_alta') pose=4;
  if(ctx==='nota_baja') pose=3;
  if(ctx==='error_clave') pose=3;

  goTo(pose);
  setTimeout(()=>showBubble(MSGS[ctx]||'¡Hola! Soy Nexus',4000),500);
}

// Feedback por nota
function nexusFeedback(nota){
  if(nota>=4.5) setMood('nota_alta');
  else if(nota>=3.0){
    goTo(2);
    showBubble('Vas bien, sigue así',3000);
  } else setMood('nota_baja');
}

// Dibujo Nexus
function draw(){
  X.clearRect(0,0,W,H);
  const cx=140, by=358+Math.sin(t*.04)*4;
  const sq=clicked?1.07:(hov?1.03:1), sqy=clicked?.94:(hov?.97:1);

  X.save(); X.translate(cx,by); X.scale(sq,sqy); X.translate(-cx,-by);

  // Sombra
  X.fillStyle=`rgba(100,55,15,${0.10+Math.sin(t*.04)*.01})`;
  el(cx,by+2,52,8); X.fill();

  drawTail(cx,by);
  drawBody(cx,by);
  drawLegs(cx,by);
  drawShirt(cx,by);
  drawArms(cx,by);
  drawHead(cx,by);

  X.restore();
  drawSparks();
}

function drawTail(cx,by){
  const wag=pose===4?Math.sin(t*.18)*14:Math.sin(t*.04)*5;
  X.save(); X.translate(cx+48,by-65); X.rotate(wag*Math.PI/180);
  X.fillStyle=BRD; el(0,0,29,21); X.fill();
  X.fillStyle=BR; el(-2,-2,22,15); X.fill();
  X.fillStyle=BRL; el(-5,-6,10,8); X.fill();
  X.restore();
}

function drawBody(cx,by){
  const bY=by-85;
  X.fillStyle=BRD; el(cx,bY+5,67,78); X.fill();
  X.fillStyle=BR; el(cx,bY,64,75); X.fill();
  X.fillStyle=BRL; el(cx-20,bY-30,17,24); X.fill();
  X.fillStyle='rgba(255,255,255,.1)'; el(cx-22,bY-38,9,14); X.fill();
}

function drawShirt(cx,by){
  const bY=by-85;
  const sTop=bY-65;
  const sBot=by-18;
  const sW=80;

  // Base oscura
  X.beginPath();
  X.moveTo(cx-sW+4,sTop+18);
  X.quadraticCurveTo(cx-sW-2,sTop+30,cx-sW,sTop+50);
  X.lineTo(cx-sW+6,sBot);
  X.quadraticCurveTo(cx,sBot+10,cx+sW-6,sBot);
  X.lineTo(cx+sW,sTop+50);
  X.quadraticCurveTo(cx+sW+2,sTop+30,cx+sW-4,sTop+18);
  X.quadraticCurveTo(cx+sW-10,sTop+8,cx+26,sTop+2);
  X.quadraticCurveTo(cx+16,sTop-4,cx+10,sTop);
  X.quadraticCurveTo(cx+4,sTop+4,cx,sTop+6);
  X.quadraticCurveTo(cx-4,sTop+4,cx-10,sTop);
  X.quadraticCurveTo(cx-16,sTop-4,cx-26,sTop+2);
  X.quadraticCurveTo(cx-sW+10,sTop+8,cx-sW+4,sTop+18);
  X.closePath();
  X.fillStyle=BLD; X.fill();

  // Base clara
  X.beginPath();
  X.moveTo(cx-sW+6,sTop+20);
  X.quadraticCurveTo(cx-sW,sTop+32,cx-sW+2,sTop+52);
  X.lineTo(cx-sW+8,sBot-2);
  X.quadraticCurveTo(cx,sBot+8,cx+sW-8,sBot-2);
  X.lineTo(cx+sW-2,sTop+52);
  X.quadraticCurveTo(cx+sW,sTop+32,cx+sW-6,sTop+20);
  X.quadraticCurveTo(cx+sW-12,sTop+10,cx+25,sTop+3);
  X.quadraticCurveTo(cx+15,sTop-3,cx+9,sTop+1);
  X.quadraticCurveTo(cx+3,sTop+5,cx,sTop+7);
  X.quadraticCurveTo(cx-3,sTop+5,cx-9,sTop+1);
  X.quadraticCurveTo(cx-15,sTop-3,cx-25,sTop+3);
  X.quadraticCurveTo(cx-sW+12,sTop+10,cx-sW+6,sTop+20);
  X.closePath();
  X.fillStyle=BL; X.fill();

  // Highlight
  X.fillStyle=BLVL;
  el(cx-22,sTop+28,13,18,-0.15); X.fill();
  X.fillStyle='rgba(255,255,255,.12)';
  el(cx-18,sTop+18,7,12,-0.1); X.fill();

  // Cuello
  X.beginPath(); X.ellipse(cx,sTop+4,22,10,0,0,Math.PI*2);
  X.fillStyle=BLD; X.fill();
  X.beginPath(); X.ellipse(cx,sTop+3,20,9,0,0,Math.PI*2);
  X.fillStyle=BL; X.fill();
  X.beginPath(); X.ellipse(cx-5,sTop+1,9,4,-0.1,0,Math.PI*2);
  X.fillStyle=BLVL; X.fill();

  // Pliegues
  X.strokeStyle='rgba(21,112,204,0.55)'; X.lineWidth=1.5; X.lineCap='round';
  X.beginPath(); X.moveTo(cx-8,sTop+12); X.quadraticCurveTo(cx-10,sTop+40,cx-8,sBot-18); X.stroke();
  X.beginPath(); X.moveTo(cx+5,sTop+12); X.quadraticCurveTo(cx+8,sTop+42,cx+5,sBot-22); X.stroke();
  X.beginPath(); X.moveTo(cx-28,sTop+38); X.quadraticCurveTo(cx-26,sTop+58,cx-24,sBot-28); X.stroke();

  // Mangas
  const sleeveY=sTop+14;
  [-1,1].forEach(side=>{
    const sx=cx+side*(sW-4);
    X.save(); X.translate(sx,sleeveY); X.rotate(side*0.12);
    X.beginPath();
    X.moveTo(0,0); X.quadraticCurveTo(side*10,6,side*16,38);
    X.quadraticCurveTo(side*8,43,side*2,40);
    X.quadraticCurveTo(-side*6,36,-side*8,28);
    X.quadraticCurveTo(-side*8,6,0,0);
    X.closePath(); X.fillStyle=BLD; X.fill();

    X.beginPath();
    X.moveTo(-side*2,1); X.quadraticCurveTo(side*8,6,side*14,37);
    X.quadraticCurveTo(side*6,42,side*0,39);
    X.quadraticCurveTo(-side*6,35,-side*7,26);
    X.quadraticCurveTo(-side*7,5,-side*2,1);
    X.closePath(); X.fillStyle=BL; X.fill();

    X.fillStyle=BLL; el(-side*2,10,5,8,side*0.2); X.fill();
    X.strokeStyle=BLD; X.lineWidth=2;
    X.beginPath(); X.moveTo(side*14,37); X.quadraticCurveTo(side*6,43,side*0,40); X.stroke();
    X.restore();
  });

  // Dobladillo
  X.strokeStyle=BLD; X.lineWidth=2;
  X.beginPath(); X.moveTo(cx-sW+8,sBot-2); X.quadraticCurveTo(cx,sBot+8,cx+sW-8,sBot-2); X.stroke();
}

function drawLegs(cx,by){
  const lb=Math.sin(t*.04)*1.5, sp=pose===4?5:0;
  [[-22-sp,1],[22+sp,-1]].forEach(([ox,fl])=>{
    X.fillStyle=BRD; el(cx+ox+fl,by-12,17,21); X.fill();
    X.fillStyle=BR; el(cx+ox,by-14+lb,15,19); X.fill();
    X.fillStyle=BRL; el(cx+ox-4*fl,by-22+lb,7,10); X.fill();
    X.fillStyle=BRD; el(cx+ox+fl*2,by+1,19,12); X.fill();
    X.fillStyle=BR; el(cx+ox,by,17,10); X.fill();
    X.fillStyle=BRL; el(cx+ox-fl*3,by-3,6,5); X.fill();
  });
}

function drawArms(cx,by){
  const bY=by-85;
  function armShape(side=1){
    X.fillStyle=BRD; el(0,-20,17,28); X.fill();
    X.fillStyle=BR; el(0,-22,15,26); X.fill();
    X.fillStyle=BRL; el(-4*side,-30,6,12); X.fill();
    X.fillStyle=BR; el(0,-46,13,12); X.fill();
  }

  if(pose===0){
    X.save(); X.translate(cx-46,bY-8); X.rotate(-0.28); armShape(-1); X.restore();
    X.save(); X.translate(cx+46,bY-26);
    const jig=Math.sin(t*.12)*5;
    X.rotate((-78+jig)*Math.PI/180);
    X.fillStyle=BRD; el(0,-20,17,28); X.fill();
    X.fillStyle=BR; el(0,-22,15,26); X.fill();
    X.fillStyle=BRL; el(-4,-30,6,12); X.fill();
    X.fillStyle=BR; el(0,-44,12,11); X.fill();
    X.fillStyle=BR; X.fillRect(-4,-66,8,26);
    X.beginPath(); X.arc(0,-66,4,0,Math.PI*2); X.fill();
    X.fillStyle=BRD; X.fillRect(-10,-50,8,14); X.fillRect(2,-50,8,14);
    X.restore();
  } else if(pose===1){
    X.save(); X.translate(cx-46,bY-8); X.rotate(-0.2); armShape(-1); X.restore();
    X.save(); X.translate(cx+47,bY-18); X.rotate(-62*Math.PI/180); armShape(1); X.restore();
  } else if(pose===2){
    X.save(); X.translate(cx-42,bY+4); X.rotate(56*Math.PI/180); armShape(-1); X.restore();
    X.save(); X.translate(cx+42,bY+4); X.rotate(-56*Math.PI/180); armShape(1); X.restore();
    X.fillStyle=BR; el(cx,bY+45,22,13); X.fill();
    X.fillStyle=BRL; el(cx-6,bY+41,8,7); X.fill();
  } else if(pose===3){
    X.save(); X.translate(cx-46,bY-8); X.rotate(-0.1); armShape(-1); X.restore();
    X.save(); X.translate(cx+47,bY+12); X.rotate(26*Math.PI/180);
    X.fillStyle=BRD; el(0,-20,17,28); X.fill();
    X.fillStyle=BR; el(0,-22,15,26); X.fill();
    X.fillStyle=BRL; el(-4,-30,6,12); X.fill();
    X.fillStyle=BR; el(4,-48,14,12); X.fill();
    X.restore();
  } else if(pose===4){
    const jig=Math.sin(t*.2)*8;
    X.save(); X.translate(cx-46,bY-26); X.rotate((-66+jig)*Math.PI/180);
    armShape(-1);
    X.fillStyle=BRM; X.beginPath(); X.roundRect(-10,-54,20,16,6); X.fill();
    X.fillStyle=BRL; el(-4,-52,5,4); X.fill();
    X.restore();
    X.save(); X.translate(cx+46,bY-26); X.rotate((66-jig)*Math.PI/180);
    armShape(1);
    X.fillStyle=BRM; X.beginPath(); X.roundRect(-10,-54,20,16,6); X.fill();
    X.fillStyle=BRL; el(4,-52,5,4); X.fill();
    X.restore();
  } else {
    X.save(); X.translate(cx-46,bY-8); X.rotate(-0.28); armShape(-1); X.restore();
    X.save(); X.translate(cx+46,bY-8); X.rotate(0.28); armShape(1); X.restore();
  }
}

function drawHead(cx,by){
  const hY=by-155;tilt=pose===3?5:0;
  const e=POSES[pose];
  X.save(); X.translate(cx,hY+Math.sin(t*.04)*2);
  if(tilt) X.rotate(tilt*Math.PI/180);

  X.fillStyle=BRD; el(0,4,80,79); X.fill();
  X.fillStyle=BR; el(0,0,77,76); X.fill();
  X.fillStyle=BRL; el(-24,-30,22,28); X.fill();
  X.fillStyle='rgba(180,120,60,.2)'; el(-18,-38,11,16); X.fill();

  [-66,66].forEach(ex=>{
    X.fillStyle=BRD; el(ex,-58,17,16); X.fill();
    X.fillStyle=BR; el(ex,-58,14,13); X.fill();
    X.fillStyle='#A0693A'; el(ex,-57,8,7); X.fill();
  });

  X.fillStyle=CRD; el(0,30,42,33); X.fill();
  X.fillStyle=CR; el(0,28,39,31); X.fill();
  X.fillStyle='rgba(255,255,255,.22)'; el(-10,16,12,14); X.fill();

  drawFace();
  X.restore();
}

function drawFace(){
  const e=POSES[pose];
  const lx=-30, rx=30, ey=-14;
  const blink=blinking;
  let px=0, py=0;
  if(pose===3){px=3;py=-4;} else if(pose===0||pose===4){py=-5;}

  // Ojos
  X.fillStyle=WH; el(lx,ey,22,22); X.fill(); el(rx,ey,22,22); X.fill();
  X.fillStyle='rgba(200,200,200,.2)'; el(lx+2,ey+3,20,20); X.fill(); el(rx+2,ey+3,20,20); X.fill();
  X.fillStyle=WH; el(lx,ey,20,20); X.fill(); el(rx,ey,20,20); X.fill();

  if(!blink){
    X.fillStyle=BK; el(lx+px,ey+py,11,11); X.fill(); el(rx+px,ey+py,11,11); X.fill();
    X.fillStyle='#1a1a1a'; el(lx+px,ey+py,9,9); X.fill(); el(rx+px,ey+py,9,9); X.fill();
    X.fillStyle=WH; el(lx+px+3,ey+py-3,4,4); X.fill(); el(rx+px+3,ey+py-3,4,4); X.fill();
    X.fillStyle='rgba(255,255,255,.6)'; el(lx+px-2,ey+py+4,2,2); X.fill(); el(rx+px-2,ey+py+4,2,2); X.fill();
  }

  if(blink){
    const ba=pose===2?1:Math.abs(Math.sin(blinkP*Math.PI));
    X.fillStyle=BR;
    X.save(); X.scale(1,ba); el(lx,ey/ba,20,20); X.fill(); el(rx,ey/ba,20,20); X.fill(); X.restore();
    X.strokeStyle=BRD; X.lineWidth=3;
    X.beginPath(); X.ellipse(lx,ey,18,10,0,Math.PI,0); X.stroke();
    X.beginPath(); X.ellipse(rx,ey,18,10,0,Math.PI,0); X.stroke();
  }

  // Gafas
  X.strokeStyle='#0d0d0d'; X.lineWidth=5.5; X.lineCap='round';
  X.beginPath(); X.arc(lx,ey,21,0,Math.PI*2); X.stroke();
  X.beginPath(); X.arc(rx,ey,21,0,Math.PI*2); X.stroke();
  X.strokeStyle='#111'; X.lineWidth=4;
  X.beginPath(); X.moveTo(lx+21,ey); X.lineTo(rx-21,ey); X.stroke();
  X.strokeStyle='#111'; X.lineWidth=5;
  X.beginPath(); X.moveTo(lx-21,ey); X.lineTo(lx-38,ey-4); X.stroke();
  X.beginPath(); X.moveTo(rx+21,ey); X.lineTo(rx+38,ey-4); X.stroke();
  X.strokeStyle='rgba(255,255,255,.5)'; X.lineWidth=2;
  X.beginPath(); X.arc(lx,ey,19,-0.8,0.1); X.stroke();
  X.beginPath(); X.arc(rx,ey,19,-0.8,0.1); X.stroke();

  // Cejas
  const bl2=(pose===0||pose===4)?-5:(pose===3?-2:0);
  const bltl=pose===3?0.18:(pose===0||pose===4?-0.12:0);
  const bltr=pose===3?-0.18:(pose===0||pose===4?0.12:0);
  X.strokeStyle=NS; X.lineWidth=3.5; X.lineCap='round';
  X.save(); X.translate(lx,-36+bl2); X.rotate(bltl);
  X.beginPath(); X.moveTo(-14,0); X.quadraticCurveTo(0,-5,14,0); X.stroke(); X.restore();
  X.save(); X.translate(rx,-36+bl2); X.rotate(bltr);
  X.beginPath(); X.moveTo(-14,0); X.quadraticCurveTo(0,-5,14,0); X.stroke(); X.restore();

  // Nariz
  X.fillStyle=NS; el(0,18,8,6); X.fill();
  X.fillStyle='rgba(255,255,255,.25)'; el(-2,16,3,2); X.fill();

  drawMouth();

  if(pose===2||pose===4||hov){
    X.fillStyle=PNK; el(-46,14,14,9); X.fill(); el(46,14,14,9); X.fill();
  }
}

function drawMouth(){
  X.strokeStyle=NS; X.lineWidth=3; X.lineCap='round'; X.lineJoin='round';
  if(pose===0){
    X.beginPath(); X.moveTo(-18,36); X.quadraticCurveTo(0,52,18,36); X.stroke();
    X.fillStyle=WH; X.beginPath(); X.moveTo(-14,37); X.quadraticCurveTo(0,50,14,37); X.closePath(); X.fill();
  } else if(pose===1){
    X.beginPath(); X.moveTo(-14,36); X.quadraticCurveTo(2,44,15,36); X.stroke();
    X.fillStyle=WH; X.beginPath(); X.moveTo(-10,37); X.quadraticCurveTo(2,43,11,37); X.closePath(); X.fill();
  } else if(pose===2){
    X.beginPath(); X.moveTo(-22,36); X.quadraticCurveTo(0,58,22,36); X.stroke();
    X.fillStyle=WH; X.beginPath(); X.moveTo(-18,37); X.quadraticCurveTo(0,54,18,37); X.closePath(); X.fill();
    X.fillStyle='#FFB3C1'; X.beginPath(); X.moveTo(-10,42); X.quadraticCurveTo(0,50,10,42); X.closePath(); X.fill();
  } else if(pose===3){
    const w=Math.sin(t*.06)*3;
    X.beginPath(); X.moveTo(-16,36+w); X.quadraticCurveTo(2,32,16,38-w); X.stroke();
  } else if(pose===4){
    X.beginPath(); X.moveTo(-24,34); X.quadraticCurveTo(0,58,24,34); X.stroke();
    X.fillStyle=WH; X.beginPath(); X.moveTo(-20,36); X.quadraticCurveTo(0,54,20,36); X.closePath(); X.fill();
    X.fillStyle='#FFB3C1'; X.beginPath(); X.moveTo(-12,42); X.quadraticCurveTo(0,52,12,42); X.closePath(); X.fill();
  }
}

function drawSparks(){
  sparks=sparks.filter(s=>s.life>0);
  sparks.forEach(s=>{
    s.x+=s.vx; s.y+=s.vy; s.vy+=0.08; s.life--;
    const a=s.life/s.max;
    X.save(); X.globalAlpha=a; X.fillStyle=s.c;
    X.translate(s.x,s.y); X.rotate(s.r+=0.1); X.scale(s.sz,s.sz);
    X.beginPath();
    X.moveTo(0,-4);X.lineTo(1,-1);X.lineTo(4,0);X.lineTo(1,1);
    X.lineTo(0,4);X.lineTo(-1,1);X.lineTo(-4,0);X.lineTo(-1,-1);
    X.closePath(); X.fill(); X.restore();
  });
}

function addSparks(x,y,n,cols){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, sp=1.5+Math.random()*3;
    sparks.push({
      x,y,
      vx:Math.cos(a)*sp,
      vy:Math.sin(a)*sp-2,
      life:35+Math.random()*20,
      max:55,
      r:Math.random()*Math.PI,
      sz:.8+Math.random()*1.4,
      c:cols[Math.floor(Math.random()*cols.length)]
    });
  }
}

function tick(){
  t++; blinkT++;
  if(!blinking&&blinkT>120+Math.random()*80){blinking=true;blinkT=0;}
  if(blinking){blinkP+=0.15; if(blinkP>=1){blinking=false;blinkP=0;}}
  clicked=false;
  draw();
  requestAnimationFrame(tick);
}

function next(){ goTo(pose+1); }
function prev(){ goTo(pose-1); }

function updateUI(){
  // Para cuando tengas botones
}

// Eventos
const cw=document.querySelector('.nexus-mascota');
cw.addEventListener('mouseenter',()=>{
  hover=true;
  showBubble(MSGS['hover'],1200);
});
cw.addEventListener('mouseleave',()=>hover=false);
cw.addEventListener('click',e=>{
  clicked=true;
  const r=cw.getBoundingClientRect();
  addSparks(e.clientX-r.left,e.clientY-r.top,12,[BL,'#FFD700','#FF6B9D','#fff']);
  showBubble(MSGS['click'],2200);
});

// Init
window.initNexus = function(){
  tick();
  const page=document.querySelector('.nexus-mascota').dataset.page;
  setMood(page);
 // schedule();
} 
// Pausa Nexus si cambio de pestaña
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    playing = false; 
  } else {
    playing = true;
    requestAnimationFrame(tick);
  }
});

// Pausa si hago scroll y Nexus no se ve
const observer = new IntersectionObserver((entries) => {
  playing = entries[0].isIntersecting;
  if (playing) requestAnimationFrame(tick);
});
observer.observe(document.querySelector('.nexus-mascota'));