(() => {
  window.PortfolioDisableTrail=true;
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  const cursor=document.createElement('span');
  cursor.className='project-arrow-cursor';cursor.setAttribute('aria-hidden','true');
  cursor.innerHTML='<svg viewBox="0 0 24 24" fill="none"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.append(cursor);
  let active=null;
  function clear(){active?.classList.remove('has-project-cursor');active=null;cursor.classList.remove('visible')}
  document.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'){clear();return}
    const card=event.target.closest('.project');
    const photo=card?.querySelector('img');
    if(!photo){clear();return}
    const bounds=photo.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom){clear();return}
    if(active!==card){clear();active=card;card.classList.add('has-project-cursor')}
    cursor.style.left=event.clientX+'px';cursor.style.top=event.clientY+'px';cursor.classList.add('visible');
  },{passive:true});
  document.addEventListener('pointerleave',clear);window.addEventListener('blur',clear);
  document.addEventListener('click',clear);
  window.addEventListener('pagehide',clear);
})();
