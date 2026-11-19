export const SIZES = { '1080x1080': [1080,1080], '1080x1350': [1080,1350], '1920x1080': [1920,1080] };
export const LAYOUTS = [
  {id:'story',name:'COVER STORY'}, {id:'duo',name:'DOUBLE TAKE'},
  {id:'trio',name:'TRIPTYCH'}, {id:'quad',name:'FOUR PLAY'}
];
export const GRADES = [
  {id:'vice',name:'SUNSET',filter:'saturate(1.3) contrast(1.09)',wash:['#ffba56','#ef4d91','#43256d']},
  {id:'neon',name:'NEON',filter:'saturate(1.5) contrast(1.16)',wash:['#02d8da','#174b9b','#e92a9b']},
  {id:'noir',name:'NOIR',filter:'saturate(.5) contrast(1.22) sepia(.16)',wash:['#d9b37c','#69595e','#252337']}
];

export function panelsFor(layout,w,h){
  const p=(x,y,ww,hh)=>({x:x*w,y:y*h,w:ww*w,h:hh*h});
  if(layout==='duo') return [p(0,0,.5,1),p(.5,0,.5,1)];
  if(layout==='trio') return [p(0,0,1/3,1),p(1/3,0,1/3,1),p(2/3,0,1/3,1)];
  if(layout==='quad') return [p(0,0,.5,.5),p(.5,0,.5,.5),p(0,.5,.5,.5),p(.5,.5,.5,.5)];
  return w/h>1.25 ? [p(0,0,.64,1),p(.64,0,.36,.5),p(.64,.5,.36,.5)] : [p(0,0,1,.68),p(0,.68,1/3,.32),p(1/3,.68,1/3,.32),p(2/3,.68,1/3,.32)];
}

function placeholder(ctx,r,i){
  const g=ctx.createLinearGradient(r.x,r.y,r.x,r.y+r.h);g.addColorStop(0,'#f7b678');g.addColorStop(.5,'#db6e9a');g.addColorStop(1,'#29254b');ctx.fillStyle=g;ctx.fillRect(r.x,r.y,r.w,r.h);
  ctx.fillStyle='#ffe6a1';ctx.beginPath();ctx.arc(r.x+r.w*.72,r.y+r.h*.25,Math.min(r.w,r.h)*.15,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#29233d';ctx.fillRect(r.x,r.y+r.h*.66,r.w,r.h*.34);
  ctx.strokeStyle='#29233d';ctx.lineWidth=Math.max(3,r.w*.025);for(let n=0;n<2;n++){const x=r.x+r.w*(.2+n*.55),y=r.y+r.h*.7;ctx.beginPath();ctx.moveTo(x,y+r.h*.3);ctx.quadraticCurveTo(x-r.w*.03,y,x+r.w*.01,y-r.h*.36);ctx.stroke();for(let a=0;a<6;a++){ctx.beginPath();ctx.moveTo(x,y-r.h*.34);ctx.quadraticCurveTo(x+Math.cos(a)*r.w*.25,y-r.h*.42,x+Math.cos(a)*r.w*.3,y-r.h*(.25+(a%2)*.08));ctx.stroke();}}
}
function drawPhoto(ctx,r,slot,grade,illustrated){
  ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
  if(!slot?.img){placeholder(ctx,r,0);ctx.restore();return;}
  const img=slot.img, base=Math.max(r.w/img.naturalWidth,r.h/img.naturalHeight),s=base*slot.zoom;
  const dw=img.naturalWidth*s,dh=img.naturalHeight*s;
  const x=r.x+(r.w-dw)/2+slot.x*r.w,y=r.y+(r.h-dh)/2+slot.y*r.h;
  ctx.filter=grade.filter+(illustrated?' contrast(1.08)':'');
  ctx.drawImage(img,x,y,dw,dh);ctx.filter='none';
  const tint=ctx.createLinearGradient(r.x,r.y,r.x+r.w,r.y+r.h);tint.addColorStop(0,grade.wash[0]+'26');tint.addColorStop(.55,grade.wash[1]+'16');tint.addColorStop(1,grade.wash[2]+'70');ctx.globalCompositeOperation='soft-light';ctx.fillStyle=tint;ctx.fillRect(r.x,r.y,r.w,r.h);
  ctx.globalCompositeOperation='multiply';ctx.fillStyle=grade.wash[2]+'20';ctx.fillRect(r.x,r.y,r.w,r.h);
  if(illustrated){ctx.globalCompositeOperation='overlay';ctx.fillStyle='#ffb07c18';ctx.fillRect(r.x,r.y,r.w,r.h);}
  ctx.restore();
}
function lineSplit(text){const words=text.trim().toUpperCase().split(/\s+/).filter(Boolean);if(words.length<2)return words;let best=1,score=Infinity;for(let i=1;i<words.length;i++){const a=words.slice(0,i).join(' ').length,b=words.slice(i).join(' ').length,s=Math.abs(a-b);if(s<score){score=s;best=i}}return [words.slice(0,best).join(' '),words.slice(best).join(' ')];}
function typography(ctx,w,h,title,subtitle){
  const landscape=w/h>1.25,lines=lineSplit(title),maxWidth=w*(landscape?.56:.78),area=landscape?h*.48:h*.33;
  let size=Math.min(area/(lines.length*.83),w*(landscape?.14:.18));ctx.textAlign=landscape?'left':'center';ctx.textBaseline='alphabetic';
  const family='Impact, Haettenschweiler, Arial Narrow Bold, sans-serif';
  while(size>20){ctx.font=`italic 900 ${size}px ${family}`;if(Math.max(...lines.map(x=>ctx.measureText(x).width),0)<=maxWidth)break;size-=2;}
  const total=lines.length*size*.86,base=h-h*.105, start=base-total+size*.75,x=landscape?w*.055:w*.5;
  ctx.save();ctx.transform(1,0,-.07,1,0,0);ctx.font=`italic 900 ${size}px ${family}`;ctx.lineJoin='round';
  lines.forEach((line,i)=>{const y=start+i*size*.86;ctx.shadowColor='#2a163d';ctx.shadowBlur=size*.09;ctx.shadowOffsetY=size*.045;ctx.strokeStyle='#332044';ctx.lineWidth=size*.065;ctx.strokeText(line,x,y);ctx.shadowColor='transparent';ctx.fillStyle='#fff8e9';ctx.fillText(line,x,y);ctx.fillStyle='#ef7da5';ctx.globalAlpha=.45;ctx.fillText(line,x+size*.018,y+size*.022);ctx.globalAlpha=1;ctx.fillStyle='#fff8e9';ctx.fillText(line,x,y);});
  ctx.restore();
  const sx=landscape?w*.057:w*.08;ctx.textAlign='left';ctx.font=`700 ${Math.max(11,h*.014)}px Arial, sans-serif`;ctx.fillStyle='#fff';ctx.letterSpacing=`${w*.002}px`;ctx.fillText(subtitle.toUpperCase(),sx,h-h*.046);
  ctx.fillStyle='#edfa79';ctx.fillRect(landscape?w*.55:w*.78,h-h*.057,w*.15,Math.max(3,h*.004));
}
export function drawCover(canvas,state,slots){
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,grade=GRADES.find(g=>g.id===state.grade)||GRADES[0];
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#221b37';ctx.fillRect(0,0,w,h);
  const rects=panelsFor(state.layout,w,h),gap=Math.max(5,w*.006);
  rects.forEach((r,i)=>{const inner={x:r.x+gap/2,y:r.y+gap/2,w:r.w-gap,h:r.h-gap};drawPhoto(ctx,inner,slots[i%Math.max(slots.length,1)],grade,state.illustrated);});
  const shade=ctx.createLinearGradient(0,h*.35,0,h);shade.addColorStop(0,'#17132900');shade.addColorStop(.65,'#17132910');shade.addColorStop(1,'#171329dd');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w*.85,h*.05,0,w*.85,h*.05,w*.6);glow.addColorStop(0,grade.wash[0]+'55');glow.addColorStop(1,grade.wash[0]+'00');ctx.globalCompositeOperation='screen';ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='source-over';
  if(state.grain){ctx.save();ctx.globalAlpha=.075;for(let y=0;y<h;y+=4){for(let x=(y%8);x<w;x+=8){const n=((x*13+y*7)%23)/23;ctx.fillStyle=n>.5?'#fff':'#000';ctx.fillRect(x,y,2,2)}}ctx.restore();}
  ctx.fillStyle='#fff9e8';ctx.font=`700 ${Math.max(12,h*.013)}px Arial,sans-serif`;ctx.textAlign='left';ctx.fillText('VICE / ORIGINAL STORIES',w*.04,h*.045);
  ctx.textAlign='right';ctx.fillStyle='#edfa79';ctx.fillText('EST. 2026   •   VOL. 06',w*.96,h*.045);
  typography(ctx,w,h,state.title,state.subtitle);
  ctx.strokeStyle='#fff9e888';ctx.lineWidth=Math.max(1,w*.001);ctx.strokeRect(w*.018,h*.022,w*.964,h*.956);
}
