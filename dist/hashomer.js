(() => {
  // Reset only on entry, before the visitor starts interacting.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  let interacted = false;
  const markInteraction = () => { interacted = true; };
  addEventListener('wheel', markInteraction, {passive:true});
  addEventListener('touchstart', markInteraction, {passive:true});
  addEventListener('pointerdown', markInteraction, {passive:true});
  addEventListener('keydown', event => {
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) markInteraction();
  });
  function startAtTop(){
    if (interacted || (location.hash && location.hash !== '#project-top')) return;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelector('.hashomer-wrap').scrollTop = 0;
    window.scrollTo({top:0,left:0,behavior:'instant'});
  }
  function settleEntry(){
    fit();
    startAtTop();
    requestAnimationFrame(() => requestAnimationFrame(startAtTop));
  }
  addEventListener('pageshow', () => { interacted = false; settleEntry(); });
  addEventListener('load', settleEntry);
  const root=document.documentElement;
  const screen=document.querySelector('.live-screen');
  const viewport=document.querySelector('.live-viewport');
  const iframe=viewport.querySelector('iframe');
  iframe.addEventListener('load', settleEntry);
  function fit(){
    root.style.setProperty('--page-scale',root.clientWidth/1440);
    const scale=screen.clientWidth/1440;
    viewport.style.setProperty('--embed-scale',scale);
    viewport.style.height=screen.clientHeight/scale+'px';
    iframe.style.height=screen.clientHeight/scale+'px';
  }
  addEventListener('resize',fit);
  new ResizeObserver(fit).observe(screen);
  settleEntry();
})();
