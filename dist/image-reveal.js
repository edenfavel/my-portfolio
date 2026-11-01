(() => {
  const projects=[...document.querySelectorAll('.project')].filter(p=>p.querySelector('.color')).map(project=>{
    const image=project.querySelector('.color');
    const canvas=document.createElement('canvas');canvas.className='reveal-canvas';canvas.setAttribute('aria-hidden','true');project.append(canvas);
    return {project,image,canvas};
  });

  document.addEventListener('portfolio-fluid',event=>{
    const field=event.detail;
    for(const {project,image,canvas}of projects){
      const rect=project.getBoundingClientRect();if(!rect.width||!rect.height)continue;
      const scale=Math.min(devicePixelRatio||1,2),w=Math.ceil(rect.width*scale),h=Math.ceil(rect.height*scale);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      const ctx=canvas.getContext('2d');ctx.setTransform(scale,0,0,scale,0,0);ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,rect.width,rect.height);
      if(!image.complete||!image.naturalWidth)continue;
      const fit=Math.max(rect.width/image.naturalWidth,rect.height/image.naturalHeight)*(Number(project.dataset.photoZoom)||1);
      const iw=image.naturalWidth*fit,ih=image.naturalHeight*fit;
      ctx.drawImage(image,(rect.width-iw)/2,(rect.height-ih)/2+(Number(project.dataset.photoPan)||0),iw,ih);
      ctx.globalCompositeOperation='destination-in';ctx.drawImage(field,-rect.left,-rect.top,innerWidth,innerHeight);ctx.globalCompositeOperation='source-over';
    }
  });
  document.addEventListener('portfolio-trail',event=>{
    for(const {project,image,canvas} of projects) {
      const rect=project.getBoundingClientRect();if(!rect.width||!rect.height)continue;
      const scale=Math.min(devicePixelRatio||1,2),w=Math.ceil(rect.width*scale),h=Math.ceil(rect.height*scale);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      const ctx=canvas.getContext('2d');ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,rect.width,rect.height);
      const shape=event.detail;
      if(!shape||!image.complete||!image.naturalWidth)continue;
      const points=shape.left.concat(shape.right);
      const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
      if(Math.max(...xs)<rect.left||Math.min(...xs)>rect.right||Math.max(...ys)<rect.top||Math.min(...ys)>rect.bottom)continue;
      ctx.save();ctx.translate(-rect.left,-rect.top);
      window.PortfolioRibbon.draw(ctx,shape);ctx.clip();
      // Drawing directly avoids CSS masks/data URLs, including when opened as a local file.
      const fit=Math.max(rect.width/image.naturalWidth,rect.height/image.naturalHeight)*(Number(project.dataset.photoZoom)||1);
      const iw=image.naturalWidth*fit,ih=image.naturalHeight*fit;
      ctx.drawImage(image,rect.left+(rect.width-iw)/2,rect.top+(rect.height-ih)/2+(Number(project.dataset.photoPan)||0),iw,ih);ctx.restore();
    }
  });
  for(const {project} of projects) {
    let timer;
    project.addEventListener('click',event=>{
      if(matchMedia('(hover:hover) and (pointer:fine)').matches&&event.detail!==0)return;
      clearTimeout(timer);project.classList.add('touch-preview');timer=setTimeout(()=>project.classList.remove('touch-preview'),1600);
    });
  }
})();
