(() => {
  const source = document.querySelector('img[src="assets/title-portfolio.svg"]');
  if (!source || !matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const layer = document.createElement('canvas');
  layer.className = 'title-motion'; layer.setAttribute('aria-hidden', 'true');
  source.after(layer);
  const useFluid = !!window.PortfolioFluidActive || !!window.PortfolioDisableTrail;
  const cursor = document.createElement('canvas');
  cursor.className = 'fluid-trail'; cursor.setAttribute('aria-hidden', 'true');
  if(!useFluid)document.body.append(cursor);
  const trailCtx = cursor.getContext('2d');
  const chain = Array.from({length:24},()=>({x:0,y:0}));
  let pointerInside = false, hasPointer = false, lastMove = 0, ribbonRadius = 0;
  function sizeTrail() {
    const scale=Math.min(devicePixelRatio||1,2);
    cursor.width=Math.ceil(innerWidth*scale);cursor.height=Math.ceil(innerHeight*scale);
    trailCtx.setTransform(scale,0,0,scale,0,0);
  }
  sizeTrail();window.addEventListener('resize',sizeTrail);
  function paintTrail(time, dt) {
    trailCtx.clearRect(0,0,innerWidth,innerHeight);
    const lag=Math.hypot(px-chain[0].x,py-chain[0].y);
    const moving=pointerInside && time-lastMove<650;
    const target=moving?Math.min(70,32+lag*.55):0;
    ribbonRadius+=(target-ribbonRadius)*(1-Math.pow(moving?.8:.95,dt));
    for(let i=0;i<chain.length;i++) {
      const preceding=i===0?{x:px,y:py}:chain[i-1];
      const spring=1-Math.pow(i===0?.6:.78,dt);
      chain[i].x+=(preceding.x-chain[i].x)*spring;
      chain[i].y+=(preceding.y-chain[i].y)*spring;
    }
    const shape=window.PortfolioRibbon.outline(chain,ribbonRadius,time);
    if(shape) {
      trailCtx.save();window.PortfolioRibbon.draw(trailCtx,shape);trailCtx.clip();
      const head=chain[0],tail=chain[chain.length-1];
      const angle=Math.atan2(head.y-tail.y,head.x-tail.x);
      const nx=-Math.sin(angle)*ribbonRadius,ny=Math.cos(angle)*ribbonRadius;
      const sheen=trailCtx.createLinearGradient(head.x-nx,head.y-ny,head.x+nx,head.y+ny);
      sheen.addColorStop(0,'#bad8f3');sheen.addColorStop(.25,'#d7e9fa');
      sheen.addColorStop(.44,'#00DF88');sheen.addColorStop(.54,'#b7ffe3');
      sheen.addColorStop(.64,'#00DF88');sheen.addColorStop(1,'#00b970');
      trailCtx.fillStyle=sheen;trailCtx.fillRect(0,0,innerWidth,innerHeight);
      // Broad moving highlights suggest the folds visible in Eden's reference.
      trailCtx.globalAlpha=.18;
      for(let i=3;i<chain.length;i+=5) {
        const point=chain[i],r=ribbonRadius*1.25;
        if(r<.1)continue;
        const light=trailCtx.createRadialGradient(point.x,point.y,0,point.x,point.y,r);
        light.addColorStop(0,'#b8dcff');light.addColorStop(1,'rgba(90,140,220,0)');
        trailCtx.fillStyle=light;trailCtx.fillRect(point.x-r,point.y-r,r*2,r*2);
      }
      trailCtx.restore();
    }
    for(const photo of document.querySelectorAll('.project')) {
      if(!photo.querySelector('.color'))continue;
      const bounds=photo.getBoundingClientRect();const viewport=photo.parentElement.getBoundingClientRect();const top=Math.max(bounds.top,viewport.top),bottom=Math.min(bounds.bottom,viewport.bottom);if(bottom>top)trailCtx.clearRect(bounds.left,top,bounds.width,bottom-top);
    }
    document.dispatchEvent(new CustomEvent('portfolio-trail',{detail:shape}));
  }

  const ctx = layer.getContext('2d');
  let rect, width, height, dpr, active = false, frame = 0, lastTime = 0;
  let px = 0, py = 0, followX = 0, followY = 0, vx = 0, vy = 0, strength = 0;
  const pad = 24;
  function geometry() {
    rect = source.getBoundingClientRect(); width = rect.width; height = rect.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    layer.style.left = `${source.offsetLeft - pad}px`;
    layer.style.top = `${source.offsetTop - pad}px`;
    layer.style.width = `${width + pad * 2}px`; layer.style.height = `${height + pad * 2}px`;
    layer.width = Math.ceil((width + pad * 2) * dpr); layer.height = Math.ceil((height + pad * 2) * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); paint(0);
  }
  function paint(time) {
    ctx.clearRect(0, 0, width + pad * 2, height + pad * 2);
    if (strength < .01) { ctx.drawImage(source, pad, pad, width, height); return; }
    const cx = px - rect.left, cy = py - rect.top;
    // Sample original pixels in narrow tiles: the original lettering and color stay intact.
    const step = 3, radius = Math.max(38, width * .16);
    for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
      const w = Math.min(step, width - x), h = Math.min(step, height - y);
      const dx = x - cx, dy = y - cy;
      const influence = Math.exp(-(dx * dx + dy * dy) / (radius * radius));
      const wave = Math.sin(Math.sqrt(dx * dx + dy * dy) * .095 - time * .006);
      const shiftX = influence * strength * (vx * .18 + wave * 3);
      const shiftY = influence * strength * (vy * .18 + wave * 5);
      ctx.drawImage(source, x / width * source.naturalWidth, y / height * source.naturalHeight,
        w / width * source.naturalWidth, h / height * source.naturalHeight,
        pad + x + shiftX, pad + y + shiftY, w + .3, h + .3);
    }
  }
  function animate(time) {
    const dt = Math.min((time - (lastTime || time)) / 16.67, 3); lastTime = time;
    const ease = 1 - Math.pow(.78, dt);
    followX += (px - followX) * ease; followY += (py - followY) * ease;
    vx *= Math.pow(.86, dt); vy *= Math.pow(.86, dt);
    strength += ((active ? 1 : 0) - strength) * (1 - Math.pow(.85, dt));
    if(!useFluid)paintTrail(time,dt);
    if(source.complete && source.naturalWidth)paint(time);
    if (active || strength > .01 || (!useFluid && (ribbonRadius > .15 || (pointerInside && time-lastMove<650)))) frame = requestAnimationFrame(animate);
    else { frame = 0; lastTime = 0; layer.style.opacity = '0'; source.style.opacity = ''; }
  }
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    rect = source.getBoundingClientRect();
    const over = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    vx = Math.max(-25, Math.min(25, e.clientX - px)); vy = Math.max(-25, Math.min(25, e.clientY - py));
    px = e.clientX; py = e.clientY;
    if (!hasPointer) { followX = px; followY = py; chain.forEach(p=>{p.x=px;p.y=py;}); hasPointer = true; }
    pointerInside = true; lastMove = performance.now();
    active = over;
    source.classList.toggle('motion-active', active);
    layer.classList.toggle('is-pink',active);
    if (active && source.complete && source.naturalWidth) { source.style.opacity = '0'; layer.style.opacity = '1'; }
    if (!frame) frame = requestAnimationFrame(animate);
  }, {passive: true});
  function leave() { active = false; pointerInside = false; lastMove = 0; source.classList.remove('motion-active'); layer.classList.remove('is-pink'); }
  document.addEventListener('pointerleave', leave); window.addEventListener('blur', leave);
  window.addEventListener('scroll', leave, {passive:true});
  new ResizeObserver(geometry).observe(source);
  if (source.complete && source.naturalWidth) geometry(); else source.addEventListener('load', geometry, {once:true});
})();
