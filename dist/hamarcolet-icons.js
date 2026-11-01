(() => {
  const board=document.querySelector('[data-node-id="16972:9563"]');
  const source=board?.querySelector('img');
  if(!source)return;
  async function setup(){
    await source.decode();
    const canvas=document.createElement('canvas');canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
    const W=canvas.width,H=canvas.height;
    const cells=[[0,0,526,495,'Bread'],[526,0,W,495,'Jam'],[0,495,526,H,'Milk'],[526,495,W,H,'Eggs']];
    board.style.isolation='isolate';
    for(const [x0,y0,x1,y1,name]of cells){
      const w=x1-x0,h=y1-y0,data=ctx.getImageData(x0,y0,w,h),bg=[...data.data.slice((10*w+10)*4,(10*w+10)*4+3)];
      let fg=bg,max=0;
      for(let y=3;y<h-3;y++)for(let x=3;x<w-3;x++){const i=(y*w+x)*4;const d=bg.reduce((v,b,c)=>v+(data.data[i+c]-b)**2,0);if(d>max){max=d;fg=[...data.data.slice(i,i+3)]}}
      const vector=fg.map((c,i)=>c-bg[i]);let left=w,top=h,right=0,bottom=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=(y*w+x)*4;if(x<3||y<3||x>=w-3||y>=h-3){data.data[i+3]=0;continue}const alpha=Math.max(0,Math.min(1,vector.reduce((v,c,k)=>v+(data.data[i+k]-bg[k])*c,0)/max));
        for(let k=0;k<3;k++)data.data[i+k]=fg[k];data.data[i+3]=Math.round(alpha*255);
        if(alpha>.04){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
      }
      const tile=document.createElement('span');tile.style.cssText=`position:absolute;left:${x0/W*100}%;top:${y0/H*100}%;width:${w/W*100}%;height:${h/H*100}%;background:rgb(${bg.join(',')});pointer-events:none`;board.append(tile);
      const full=document.createElement('canvas');full.width=w;full.height=h;full.getContext('2d').putImageData(data,0,0);
      const icon=document.createElement('canvas');icon.width=right-left+1;icon.height=bottom-top+1;icon.getContext('2d').drawImage(full,left,top,icon.width,icon.height,0,0,icon.width,icon.height);
      const button=document.createElement('button');button.type='button';button.className='grocery-draggable';button.setAttribute('aria-label',`Move ${name} icon. Use arrow keys or drag.`);
      let px=(x0+left)/W,py=(y0+top)/H;const iw=icon.width/W,ih=icon.height/H;
      button.style.cssText=`position:absolute;left:${px*100}%;top:${py*100}%;width:${iw*100}%;height:${ih*100}%;border:0;padding:0;background:none;cursor:grab;touch-action:none;z-index:1`;
      const image=new Image();image.src=icon.toDataURL();image.alt='';image.draggable=false;image.style.cssText='width:100%;height:100%;position:static;pointer-events:none;user-select:none';button.append(image);board.append(button);
      function move(x,y){px=Math.max(0,Math.min(1-iw,x));py=Math.max(0,Math.min(1-ih,y));button.style.left=px*100+'%';button.style.top=py*100+'%'}
      let drag=null;
      button.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();button.focus({preventScroll:true});button.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,px,py};button.style.cursor='grabbing';button.style.zIndex='2'});
      button.addEventListener('pointermove',e=>{if(!drag)return;const r=board.getBoundingClientRect();move(drag.px+(e.clientX-drag.x)/r.width,drag.py+(e.clientY-drag.y)/r.height)});
      for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{drag=null;button.style.cursor='grab';button.style.zIndex='1'});
      button.addEventListener('keydown',e=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta)return;e.preventDefault();const step=e.shiftKey?.03:.01;move(px+delta[0]*step,py+delta[1]*step)});
    }
    source.style.visibility='hidden';
  }
  setup().catch(()=>{});
})();
