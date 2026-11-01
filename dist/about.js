(() => {
 function fit(){const scale=document.documentElement.clientWidth/1440;document.documentElement.style.setProperty('--scale',scale);document.body.style.height=1229*scale+'px'}
 fit();addEventListener('resize',fit);
 if(matchMedia('(prefers-reduced-motion:reduce)').matches){document.querySelectorAll('animate').forEach(el=>el.remove());return}
 const crumbs=document.querySelector('.crumbs');
 const bites=[[65,4,0.12],[64,25,0.23],[41,21,0.34],[89,22,0.45],[65,51,0.56],[34,54,0.67],[97,55,0.76],[65,83,0.84],[30,93,0.89],[100,93,0.94]];
 for(const [x,y,time]of bites)for(let i=0;i<5;i++){
  const crumb=document.createElement('i');crumb.className='crumb';crumb.style.setProperty('--delay',(time-.12)*8+'s');crumb.style.setProperty('--dx',(i-2)*12+'px');crumb.style.setProperty('--dy',65+i*15+'px');crumb.style.left=x/130*100+'%';crumb.style.top=y/124*100+'%';crumb.style.width=(3+i%3)+'px';crumb.style.background=i%2?'#bc783a':'#6d4028';crumbs.append(crumb);
 }
})();
