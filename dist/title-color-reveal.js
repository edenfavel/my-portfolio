(() => {
  const source = document.querySelector('img[alt="Portfolio"]');
  if (!source) return;
  const overlay = document.createElement('canvas');
  overlay.className = 'title-white-reveal';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.append(overlay);
  const ctx = overlay.getContext('2d', {willReadFrequently:true});
  document.addEventListener('portfolio-fluid', ({detail:field}) => {
    if (!source.complete || !source.naturalWidth) return;
    const motion = document.querySelector('.title-motion');
    const useMotion = motion && Number(getComputedStyle(motion).opacity) > 0;
    const original = useMotion ? motion : source;
    const r = original.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio || 1, 2);
    const width = Math.ceil(r.width * scale), height = Math.ceil(r.height * scale);
    if (overlay.width !== width || overlay.height !== height) {
      overlay.width = width; overlay.height = height;
    }
    Object.assign(overlay.style, {left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(original, 0, 0, width, height);
    // The original lettering is blue on cream: isolate its coverage, including antialiasing.
    const pixels = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const coverage = Math.max(0, Math.min(1, (255 - pixels.data[i]) / 168));
      pixels.data[i+3] = Math.round(pixels.data[i+3] * coverage);
      pixels.data[i] = pixels.data[i+1] = pixels.data[i+2] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(field, -r.left * scale, -r.top * scale, innerWidth * scale, innerHeight * scale);
    ctx.globalCompositeOperation = 'source-over';
  });
})();

// Reveal the homepage text through the same fluid field; project names are excluded.
(() => {
  const items = [...document.querySelectorAll('.name-text,.intro,.about-text,.contact-text,.signature-text,.scroll-cue span')].map(text => {
    const canvas = document.createElement('canvas');
    canvas.className = 'text-white-reveal';
    canvas.setAttribute('aria-hidden','true');
    document.body.append(canvas);
    return {text,canvas,ctx:canvas.getContext('2d')};
  });
  document.addEventListener('portfolio-fluid',({detail:field}) => {
    for (const {text,canvas,ctx} of items) {
      const r=text.getBoundingClientRect(), style=getComputedStyle(text);
      const scale=Math.min(devicePixelRatio||1,2);
      const width=Math.ceil(r.width*scale),height=Math.ceil(r.height*scale);
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      Object.assign(canvas.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
      ctx.setTransform(scale,0,0,scale,0,0);
      ctx.clearRect(0,0,r.width,r.height);
      ctx.globalCompositeOperation='source-over';
      ctx.fillStyle='#ffffff';
      ctx.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.textBaseline='alphabetic';
      const metrics=ctx.measureText('Hg');
      const lineHeight=parseFloat(style.lineHeight)||parseFloat(style.fontSize)*1.2;
      const ascent=metrics.fontBoundingBoxAscent??metrics.actualBoundingBoxAscent;
      const descent=metrics.fontBoundingBoxDescent??metrics.actualBoundingBoxDescent;
      let y=(lineHeight-ascent-descent)/2+ascent;
      const lines=text.innerHTML.split(/<br\s*\/?\s*>/i);
      for(const line of lines){
        const clean=line.replace(/<[^>]+>/g,'');
        ctx.fillText(clean,0,y);y+=lineHeight;
      }
      ctx.globalCompositeOperation='destination-in';
      ctx.drawImage(field,-r.left,-r.top,innerWidth,innerHeight);
      ctx.globalCompositeOperation='source-over';
    }
  });
})();
