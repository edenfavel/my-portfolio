(() => {
  const column=document.querySelector('.projects-scroll');
  if(!column)return;
  const mobile=matchMedia('(max-width:900px)');
  const originals=[...column.querySelectorAll('.project')],count=originals.length;
  if(!count)return;
  function clone(card){const copy=card.cloneNode(true);copy.removeAttribute('id');copy.dataset.loopClone='';copy.setAttribute('aria-hidden','true');copy.tabIndex=-1;copy.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));return copy;}
  const before=document.createDocumentFragment(),after=document.createDocumentFragment();
  for(let cycle=0;cycle<3;cycle++)for(const card of originals){before.append(clone(card));after.append(clone(card));}
  column.prepend(before);column.append(after);
  let cycleHeight=0,center=0,scrollFrame=0,scrollTarget=column.scrollTop,lastFrame=0;
  const modulo=(n,m)=>((n%m)+m)%m;
  function size(){
    document.body.classList.toggle('mobile-home',mobile.matches);
    column.querySelectorAll('[data-loop-clone]').forEach(card=>{card.hidden=mobile.matches});
    if(mobile.matches){column.scrollTop=0;return;}
    const phase=cycleHeight?modulo(column.scrollTop-center,cycleHeight)/cycleHeight:0;
    const cards=column.querySelectorAll('.project');
    cycleHeight=cards[count].offsetTop-cards[0].offsetTop;
    center=originals[0].offsetTop-cards[0].offsetTop;
    column.scrollTop=center+phase*cycleHeight;scrollTarget=column.scrollTop;
  }
  column.addEventListener('scroll',()=>{
    if(mobile.matches||!cycleHeight)return;
    const max=column.scrollHeight-column.clientHeight;
    if(column.scrollTop<cycleHeight||column.scrollTop>max-cycleHeight){
      const old=column.scrollTop,next=center+modulo(old-center,cycleHeight),delta=next-old;
      column.scrollTop=next;scrollTarget+=delta;
      column.dispatchEvent(new CustomEvent('portfolio-scroll-wrap',{detail:{delta}}));
    }
    if(!scrollFrame)scrollTarget=column.scrollTop;
  },{passive:true});
  if(matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
    function glide(time){
      const dt=Math.min((time-(lastFrame||time-16.67))/16.67,3);lastFrame=time;
      const difference=scrollTarget-column.scrollTop;
      if(Math.abs(difference)<1){column.scrollTop=scrollTarget;scrollFrame=0;lastFrame=0;return}
      column.scrollTop+=difference*(1-Math.pow(.85,dt));
      scrollFrame=requestAnimationFrame(glide);
    }
    window.addEventListener('wheel',event=>{
      if(mobile.matches||event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
      event.preventDefault();
      if(!scrollFrame)scrollTarget=column.scrollTop;
      const multiplier=event.deltaMode===1?16:event.deltaMode===2?column.clientHeight:1;
      scrollTarget=Math.max(0,Math.min(column.scrollHeight-column.clientHeight,scrollTarget+event.deltaY*multiplier));
      if(!scrollFrame)scrollFrame=requestAnimationFrame(glide);
    },{passive:false});
  }
  // With reduced motion or a coarse pointer, route only outside-column wheel
  // events; native scrolling inside the column must not be counted twice.
  if(!matchMedia('(pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches){
    window.addEventListener('wheel',event=>{
      if(mobile.matches||event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||column.contains(event.target))return;
      event.preventDefault();
      const multiplier=event.deltaMode===1?16:event.deltaMode===2?column.clientHeight:1;
      column.scrollTop+=event.deltaY*multiplier;
    },{passive:false});
  }
  size();
  const anchor=document.getElementById(location.hash.slice(1));
  if(!mobile.matches&&anchor&&originals.includes(anchor))column.scrollTop=center+anchor.offsetTop-originals[0].offsetTop;
  addEventListener('resize',size,{passive:true});mobile.addEventListener('change',size);
})();
