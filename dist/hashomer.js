(() => {
  // Enter the case study at its hero, including after cached history restoration.
  function startAtTop(){
    if(!location.hash||location.hash==='#project-top')window.scrollTo({top:0,left:0,behavior:'instant'});
  }
  addEventListener('pageshow',startAtTop);
  addEventListener('load',startAtTop);
  startAtTop();
  const root=document.documentElement;
  const screen=document.querySelector('.live-screen');
  const viewport=document.querySelector('.live-viewport');
  const iframe=viewport.querySelector('iframe');
  function fit(){
    root.style.setProperty('--page-scale',root.clientWidth/1440);
    const scale=screen.clientWidth/1440;
    viewport.style.setProperty('--embed-scale',scale);
    viewport.style.height=screen.clientHeight/scale+'px';
    iframe.style.height=screen.clientHeight/scale+'px';
  }
  addEventListener('resize',fit);
  new ResizeObserver(fit).observe(screen);
  fit();
})();
