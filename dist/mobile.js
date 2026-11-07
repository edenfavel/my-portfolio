(() => {
  const media = matchMedia('(max-width:900px)');
  const $ = selector => document.querySelector(selector);
  const node = id => document.querySelector(`[data-node-id="${id}"]`);
  const text = source => {
    const original=typeof source==='string'?$(source):source;if(!original)return '';
    const copy=original.cloneNode(true);copy.querySelectorAll('br').forEach(br=>br.replaceWith(document.createTextNode(' ')));
    return copy.textContent.replace(/\s+/g,' ').trim();
  };
  const make = (tag, className, value) => {
    const el = document.createElement(tag); el.className = className || '';
    if (value) el.textContent = value;
    return el;
  };

  // Keep the original full-site artwork intact while making its navigation usable by touch.
  if(location.pathname.endsWith('/hashomer-website.html')){
    if(new URLSearchParams(location.search).get('embed')==='1')return;
    const toolbar=make('nav','mobile-site-tools');toolbar.setAttribute('aria-label','ניווט ותצוגה');toolbar.dir='rtl';
    const select=make('select');select.setAttribute('aria-label','מעבר לעמוד באתר השומר החדש');
    document.querySelectorAll('main.frame').forEach(frame=>{const option=make('option','',frame.id==='home'?'דף הבית':frame.getAttribute('aria-label'));option.value=frame.id;select.append(option);});
    const zoom=make('button','','הגדלה');zoom.type='button';zoom.setAttribute('aria-pressed','false');
    const fit=make('button','','התאמה למסך');fit.type='button';let enlarged=false;
    const apply=()=>{const active=media.matches&&enlarged;document.documentElement.classList.toggle('mobile-site-enlarged',active);if(active)document.documentElement.style.setProperty('--site-scale',Math.max(760,document.documentElement.clientWidth)/1440);zoom.setAttribute('aria-pressed',String(active));select.value=location.hash.slice(1)||'home';};
    select.addEventListener('change',()=>{location.hash=select.value;});
    zoom.addEventListener('click',()=>{enlarged=true;apply();});
    fit.addEventListener('click',()=>{enlarged=false;document.documentElement.style.setProperty('--site-scale',document.documentElement.clientWidth/1440);scrollTo({left:0,behavior:'instant'});apply();});
    toolbar.append(select,zoom,fit);document.body.prepend(toolbar);
    addEventListener('resize',apply);addEventListener('hashchange',apply);media.addEventListener('change',apply);apply();return;
  }

  if ($('.projects-scroll')) {
    $('.intro').querySelectorAll('br').forEach(br=>br.after(document.createTextNode(' ')));
    const syncHome = () => document.body.classList.toggle('mobile-home', media.matches);
    syncHome(); media.addEventListener('change', syncHome);
    return;
  }
  if ($('.about-page')) {
    $('.bio').querySelectorAll('br').forEach(br => br.after(document.createTextNode(' ')));
    const syncAbout = () => document.body.classList.toggle('mobile-about', media.matches);
    syncAbout(); media.addEventListener('change', syncAbout);
    return;
  }

  const path = location.pathname.split('/').pop();
  if (!['carup.html','hamarcolet.html','hashomer.html','urban-oasis.html'].includes(path)) return;
  let built = false, main, source, moving = [];
  const figures = [];
  function copy(parent, sourceNode, kind='p', className='m-copy') {
    const value = text(sourceNode); if (!value) return;
    const el = make(kind,className,value); parent.append(el); return el;
  }
  function section(label, title, paragraphs=[]) {
    const el = make('section','m-section');
    if (label) el.append(make('p','m-label',label));
    if (title) el.append(make('h2','',title));
    paragraphs.filter(Boolean).forEach(p => el.append(make('p','m-copy',p)));
    main.append(el); return el;
  }
  function image(parent, src, alt, max) {
    if (!src) return;
    const img = make('img','m-image'); img.src=src;img.alt=alt || '';img.loading='lazy';img.decoding='async';
    if(max) img.style.maxWidth=max+'px'; parent.append(img); return img;
  }
  function action(parent, original, label, extra='') {
    if(!original) return;
    const link=make('a','m-action '+extra,label||text(original));
    link.href=original.getAttribute('href');
    if(original.target){link.target=original.target;link.rel='noopener noreferrer';}
    parent.append(link); return link;
  }
  // Move existing artwork rather than rasterizing it: SVG, video and event listeners survive.
  // Restore the exact original inline styles and DOM positions when returning to desktop.
  function art(parent, element, maxWidth, inset={left:0,right:0,top:0,bottom:0}) {
    if(!element) return;
    let elements=Array.isArray(element)?element.filter(Boolean):[element];
    const flatten = el => getComputedStyle(el).display==='contents' ? Array.from(el.children).flatMap(flatten) : [el];
    elements=elements.flatMap(flatten);
    const page=$('.hashomer-page')||$('#project-page')||$('#urban-page')||$('.page');
    const pageScale=page.getBoundingClientRect().width/1440;
    const boxes=elements.map(el=>({el,rect:el.getBoundingClientRect(),computed:getComputedStyle(el)}));
    if(boxes.some(x=>!x.rect.width||!x.rect.height)) return;
    const left=Math.min(...boxes.map(x=>x.rect.left)),top=Math.min(...boxes.map(x=>x.rect.top));
    const width=(Math.max(...boxes.map(x=>x.rect.right))-left)/pageScale+inset.left+inset.right;
    const height=(Math.max(...boxes.map(x=>x.rect.bottom))-top)/pageScale+inset.top+inset.bottom;
    const figure=make('div','m-art'),stage=make('div','m-art-stage');
    figure.style.setProperty('--art-max',Math.min(maxWidth||width,width)+'px');
    stage.style.width=width+'px';stage.style.height=height+'px';figure.append(stage);parent.append(figure);
    for(const {el,rect,computed} of boxes){
      const home=document.createComment('mobile artwork home');el.before(home);
      const style=el.getAttribute('style');
      const matrix=computed.transform==='none'?null:new DOMMatrixReadOnly(computed.transform);
      const transform=matrix?`matrix(${matrix.a},${matrix.b},${matrix.c},${matrix.d},0,0)`:'none';
      moving.push({el,home,stage,style,x:(rect.left-left)/pageScale+inset.left,y:(rect.top-top)/pageScale+inset.top,w:parseFloat(computed.width)||rect.width/pageScale,h:parseFloat(computed.height)||rect.height/pageScale,transform});
    }
    const fit=()=>{const scale=Math.min(1,figure.clientWidth/width);figure.style.setProperty('--art-scale',scale);figure.style.height=height*scale+'px';};
    const observer=new ResizeObserver(fit);observer.observe(figure);figures.push(fit);return figure;
  }
  function video(parent, original, alt, max) {
    if(!original) return;
    const clip=make('video','m-video');
    prepareVideo(clip);clip.controls=false;clip.setAttribute('aria-label',alt);
    clip.src=original.currentSrc||original.querySelector('source')?.getAttribute('src')||original.getAttribute('src');
    const videoStyle=getComputedStyle(original);
    const ratio=original.videoWidth&&original.videoHeight?original.videoWidth/original.videoHeight:(parseFloat(videoStyle.width)/parseFloat(videoStyle.height)||16/9);
    clip.style.aspectRatio=ratio;
    if(max){clip.style.maxWidth=max+'px';clip.style.alignSelf='center';}
    parent.append(clip);return clip;
  }
  function header(title,subtitle,discipline,back,heroSrc) {
    const header=make('header','m-header');
    const link=action(header,back,'← Back to portfolio');link.className='m-back';
    if(heroSrc){const hero=make('div','m-hero');const img=make('img');img.src=heroSrc;img.alt='';hero.append(img,make('h1','',title),make('p','m-subtitle',subtitle));header.append(hero);header.style.paddingBottom='0';}
    else header.append(make('h1','',title),make('p','m-subtitle',subtitle));
    if(discipline)header.append(make('p','m-discipline',discipline));main.append(header);
  }
  function footer() {
    const original=$('.next-project-footer')||$('.hashomer-next-footer');if(!original)return;
    const el=make('footer','m-next');copy(el,original.querySelector('.next-eyebrow'),'p','m-label');copy(el,original.querySelector('h2'),'h2','');copy(el,original.querySelector('.next-discipline'));
    action(el,original.querySelector('a'),'Next project →');main.append(el);
  }
  function carup() {
    source=$('.wrap');header(text('h1'),text('.subtitle'),text('.discipline'),$('.back'));
    let sec=section('LIVE DEMO');art(sec,$('.splash'),260);action(sec,$('.splash-slot'),'Explore the app','m-live');
    sec=section('01 / THE PROJECT',text('.section-title'),[text('.body-copy')]);art(sec,$('.mountain-drive'),340,{left:72,right:72,top:64,bottom:12});
    $('.project-details').querySelectorAll('article').forEach(el=>section(text(el.querySelector('.label')),'',[text(el.querySelector('.body-copy'))]));
    sec=section(text('.home-screen .label'),text('.home-screen h2'),[text('.home-screen .body-copy')]);art(sec,$('.home-phone-shadow'),270);
    sec=section(text('#smart-reminders .label'),text('#smart-reminders h2'),[text('#smart-reminders .body-copy')]);art(sec,$('.notification-slot'));
    sec=section(text('.how-it-works>.label'),text('.how-it-works>h2'),[text('.how-it-works>.body-copy')]);
    const steps=make('div','m-cards steps');sec.append(steps);
    $('.how-it-works .steps').querySelectorAll('article').forEach(original=>{const card=make('article','m-step');steps.append(card);art(card,original.querySelector('.process-phone-shadow'),270);copy(card,original.querySelector('.step-number'),'p','m-label');copy(card,original.querySelector('h3'),'h3','');copy(card,original.querySelector('.body-copy'));});
  }
  function hashomer() {
    source=$('.hashomer-wrap');header(text('#project-title'),text('.hero-subtitle'),'',$('.back-portfolio'),$('.hero-landscape').getAttribute('src'));
    let sec=section('',text('#overview-title'));art(sec,[$('.laptop-mockup'),$('.laptop-support-label')]);art(sec,$('.opening-iphone'),230);
    section(text('.project-label'),'',[text('.first-copy'),text('.second-copy')]);
    sec=section(text('.challenge-label'),text('#challenge-title'),[text('.challenge-copy')]);
    const before=make('div','');before.append(make('p','m-label','BEFORE'));art(before,$('.comparison-before'));sec.append(before);
    const after=make('div','');after.append(make('p','m-label','AFTER'));art(after,$('.after-crop'));sec.append(after);
    sec=section(text('.explore-label'),text('#explore-title'),[text('.explore-copy')]);action(sec,$('.explore-full'),'Explore full website','m-live');art(sec,$('.live-screen'));
    sec=section(text('.mobile-label'),text('#mobile-title'),[text('.mobile-copy')]);art(sec,$('.mobile-phone'),290);
  }
  function hamarcolet() {
    source=$('.page-wrap');header(text(node('16972:9560')),text(node('16972:9562')),'',$('.back.nav'),node('16972:9530').querySelector('img').getAttribute('src'));
    let sec=section('01 / THE PROJECT','',[text(node('16972:9561'))]);art(sec,node('16972:9563'));
    sec=section('','Logo');art(sec,node('16972:9564'));art(sec,$('#animated-pattern'));
    sec=section('','Color Palette');Array.from(node('16972:9680').children).forEach(swatch=>art(sec,swatch,220));
    sec=section('','Mobile Landing Page');art(sec,$('.mobile-video'),290);
    sec=section('','Social Media');['16972:9602','16972:9636','16972:9658'].forEach(id=>art(sec,node(id),440));
    sec=section('','Mockups');['16972:9548','16972:9547','16972:9549'].forEach(id=>art(sec,node(id),600));
  }
  function urban() {
    source=$('.page-wrap');header(text(node('17052:11088')),text(node('17052:11090')),text(node('17052:11092')),$('.back-portfolio'));
    let sec=section('LIVE DEMO');art(sec,$('.urban-live-frame'));action(sec,$('.urban-open-full'),'Open full experience ↗','m-live');
    section(text(node('17052:10987')),text(node('17052:11096')),[text(node('17052:10993'))]);
    sec=section(text(node('17052:10988')),text(node('17052:10996')),[text(node('17052:10999'))]);
    [['17052:11099','17052:11100','17052:11101'],['17052:11104','17052:11105','17052:11106'],['17052:11108','17052:11109','17052:11110']].forEach(ids=>{const card=make('article','m-step');sec.append(card);copy(card,node(ids[0]),'p','m-label');copy(card,node(ids[1]),'h3','');copy(card,node(ids[2]));});
    sec=section(text(node('17052:10989')),text(node('17052:10997')),[text(node('17052:11000'))]);art(sec,node('17052:11128'));
    const cards=make('div','m-cards');sec.append(cards);
    [['11133','11134','11135','11136'],['11143','11144','11145','11146'],['11137','11141','11140','11142'],['11147','11148','11149','11150']].forEach(ids=>{const card=make('article','m-step');cards.append(card);copy(card,node('17052:'+ids[0]),'p','m-label');copy(card,node('17052:'+ids[1]),'h3','');copy(card,node('17052:'+ids[2]));const img=node('17052:'+ids[3])?.querySelector('img');if(img)image(card,img.getAttribute('src'),text(node('17052:'+ids[1])),260);});
    sec=section(text(node('17052:10990')),text(node('17052:10998')),[text(node('17052:11001'))]);
    [['17078:11172','17078:11174','17078:11173','17076:11166'],['17078:11176','17078:11177','17078:11178','17078:11168']].forEach(ids=>{const card=make('article','m-step');sec.append(card);copy(card,node(ids[0]),'p','m-label');copy(card,node(ids[1]),'h3','');copy(card,node(ids[2]));video(card,node(ids[3])?.querySelector('video'),text(node(ids[1])));});
  }
  function build() {
    main=make('main','mobile-case');main.setAttribute('aria-label',document.title);main.dataset.project=path.replace('.html','');
    ({'carup.html':carup,'hamarcolet.html':hamarcolet,'hashomer.html':hashomer,'urban-oasis.html':urban})[path]();footer();document.body.append(main);built=true;
    source.classList.add('mobile-desktop-source');
  }
  function sync() {
    if(media.matches&&!built)build();if(!built)return;
    source.classList.toggle('mobile-desktop-source',media.matches);
    source.inert=media.matches;main.inert=!media.matches;
    for(const item of moving){
      const {el,home,stage,style,x,y,w,h,transform}=item;
      if(media.matches){stage.append(el);for(const [name,value] of Object.entries({position:'absolute',left:x+'px',top:y+'px',right:'auto',bottom:'auto',width:w+'px',height:h+'px',translate:'none',transform,transformOrigin:'top left',margin:'0',display:'block'}))el.style.setProperty(name==='transformOrigin'?'transform-origin':name,value,'important');}
      else{home.after(el);if(style===null)el.removeAttribute('style');else el.setAttribute('style',style);}
    }
    figures.forEach(fit=>fit());
    requestAnimationFrame(()=>dispatchEvent(new Event('resize')));
    source.querySelectorAll('video').forEach(clip=>{if(media.matches)clip.pause();});
    if(media.matches&&location.hash==='#project-top')scrollTo(0,0);
  }
  // Observe the visible phone frame, not the oversized video cropped inside it.
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  const videoStates=new Map();
  function prepareVideo(v){
    v.muted=true;v.defaultMuted=true;v.loop=true;v.playsInline=true;v.autoplay=!motion.matches;v.preload='auto';
    ['muted','loop','playsinline'].forEach(name=>v.setAttribute(name,''));
    v.toggleAttribute('autoplay',!motion.matches);
  }
  function resumeVideo(v){
    const state=videoStates.get(v);
    if(media.matches&&state?.visible&&!document.hidden&&!motion.matches&&!v.dataset.mobileUserPaused)v.play().catch(()=>{});
  }
  const videoObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
    for(const [v,state] of videoStates){if(state.frame!==target)continue;state.visible=isIntersecting;
      if(!media.matches)continue;
      if(isIntersecting)resumeVideo(v);else v.pause();
    }
  }),{threshold:0.01});
  function observeVideos(){if(main)main.querySelectorAll('video').forEach(v=>{
    if(videoStates.has(v))return;
    prepareVideo(v);
    const frame=v.closest('.m-art')||v;
    videoStates.set(v,{frame,visible:false});videoObserver.observe(frame);
    ['loadeddata','canplay'].forEach(event=>v.addEventListener(event,()=>resumeVideo(v)));
    if(!v.controls){
      const button=make('button','m-action m-pause','Pause animation');button.type='button';
      const update=()=>{button.textContent=v.paused?'Play animation':'Pause animation';button.setAttribute('aria-pressed',String(v.paused));};
      button.addEventListener('click',()=>{if(v.paused){delete v.dataset.mobileUserPaused;v.play().catch(()=>{});}else{v.dataset.mobileUserPaused='true';v.pause();}});
      v.addEventListener('play',update);v.addEventListener('pause',update);frame.after(button);update();
    }
  });}
  const resumeVisible=()=>videoStates.forEach((state,v)=>resumeVideo(v));
  document.addEventListener('visibilitychange',resumeVisible);
  document.addEventListener('pointerdown',resumeVisible,{passive:true});
  motion.addEventListener('change',()=>videoStates.forEach((state,v)=>{v.autoplay=!motion.matches;if(motion.matches)v.pause();else resumeVideo(v);}));
  const start=()=>{sync();observeVideos();};
  if(document.fonts&&document.fonts.status!=='loaded')document.fonts.ready.then(start);else start();
  media.addEventListener('change',start);
})();
