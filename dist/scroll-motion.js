(() => {
  const column = document.querySelector('.projects-scroll');
  if (!column || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const cards = [...column.querySelectorAll('.project')].map(element => ({element,zoom:1,target:1,pan:0,targetPan:0,hover:false,position:0}));
  let frame = 0, lastTime = 0, velocity = 0, targetVelocity = 0, previousScroll = column.scrollTop;
  function targets() {
    const viewport = column.getBoundingClientRect();
    const center = viewport.top + viewport.height / 2;
    for (const card of cards) {
      const rect = card.element.getBoundingClientRect();
      card.target = (card.element.classList.contains('second') || card.element.classList.contains('fourth')) ? 1 : 1.06;
      const position = Math.max(-1,Math.min(1,(rect.top + rect.height / 2 - center)/(viewport.height/2)));
      card.position = position;
      card.targetPan = (card.element.classList.contains('second') || card.element.classList.contains('fourth')) ? 0 : -position * Math.min(12, rect.height * .025);
    }
    if (!frame) frame = requestAnimationFrame(animate);
  }
  function animate(time) {
    const dt = Math.min((time - (lastTime || time - 16.67)) / 16.67, 3);
    lastTime = time;
    targetVelocity *= Math.pow(.9,dt);
    velocity += (targetVelocity-velocity)*(1-Math.pow(.91,dt));
    if(Math.abs(velocity)<.001&&Math.abs(targetVelocity)<.001){velocity=0;targetVelocity=0;}
    let unsettled = velocity!==0 || targetVelocity!==0;
    // One mild projection for the complete viewport; no independent card hinges.
    // Native scroll positions and wheel inertia remain unchanged.
    column.style.transform=velocity?`perspective(1600px) rotateX(${(-velocity*16).toFixed(3)}deg)`:'none';
    for (const card of cards) {
      card.element.style.transform='none';
      const effectiveZoom=card.target+(card.hover?.14:0);
      card.zoom += (effectiveZoom - card.zoom) * (1 - Math.pow(.9, dt));
      card.pan += (card.targetPan - card.pan) * (1 - Math.pow(.9, dt));
      if(Math.abs(card.targetPan-card.pan)>.01)unsettled=true;
      if (Math.abs(effectiveZoom - card.zoom) > .00005) unsettled = true;
      else card.zoom = effectiveZoom;
      card.element.style.setProperty('--photo-zoom', card.zoom.toFixed(5));
      card.element.dataset.photoZoom = card.zoom.toFixed(5);
      card.element.style.setProperty("--photo-pan",`${card.pan.toFixed(3)}px`);
      card.element.dataset.photoPan=card.pan.toFixed(3);
    }
    if (unsettled) frame = requestAnimationFrame(animate);
    else {frame = 0; lastTime = 0;}
  }
  column.addEventListener('portfolio-scroll-wrap',event=>{previousScroll+=event.detail.delta});
  column.addEventListener('scroll',()=>{
    let delta=column.scrollTop-previousScroll;previousScroll=column.scrollTop;
    const cycle=cards.length>4?cards[4].element.offsetTop-cards[0].element.offsetTop:0;
    if(cycle&&Math.abs(delta)>cycle/2)delta=0;
    targetVelocity=Math.max(-1,Math.min(1,targetVelocity+delta/55));
    targets();
  },{passive:true});
  window.addEventListener('resize', targets, {passive:true});
  for(const card of cards){
    card.element.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){card.hover=true;targets();}});
    card.element.addEventListener('pointerleave',()=>{card.hover=false;targets();});
  }
  targets();
})();
