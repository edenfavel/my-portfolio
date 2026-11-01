(() => {
  const section = document.querySelector('.mountain-drive');
  const path = document.querySelector('#drive-path');
  const car = document.querySelector('#driving-car');
  if (!section || !path || !car) return;
  const svgNS='http://www.w3.org/2000/svg';
  const smoke=document.createElementNS(svgNS,'g');
  smoke.setAttribute('aria-hidden','true');
  smoke.setAttribute('pointer-events','none');
  smoke.id='exhaust-smoke';
  car.before(smoke);
  const puffs=[];let lastPuff=0,lastCycle=-1;
  function clearSmoke(){for(const puff of puffs)puff.node.remove();puffs.length=0;lastPuff=0;}
  function updateSmoke(now,p,opacity,cycle){
    if(cycle!==lastCycle){clearSmoke();lastCycle=cycle;}
    if(p && opacity>.7 && now-lastPuff>150){
      const c=Math.cos(p.angle),s=Math.sin(p.angle);
      // Rear bumper anchor, rotated with the original illustration.
      const dx=11-rear.x,dy=61-rear.y;
      const node=document.createElementNS(svgNS,'g');
      node.setAttribute('fill','#88939b');
      for(const [x,y,r] of [[0,0,2.5],[-2,-1,2],[1,-2,1.8]]){
        const circle=document.createElementNS(svgNS,'circle');
        circle.setAttribute('cx',x);circle.setAttribute('cy',y);circle.setAttribute('r',r);node.append(circle);
      }
      smoke.append(node);puffs.push({node,born:now,x:p.x+dx*c-dy*s,y:p.y+dx*s+dy*c,c,s});lastPuff=now;
    }
    for(let i=puffs.length-1;i>=0;i--){
      const puff=puffs[i],age=(now-puff.born)/900;
      if(age>=1){puff.node.remove();puffs.splice(i,1);continue;}
      const x=puff.x-22*puff.c*age,y=puff.y-22*puff.s*age-12*age;
      puff.node.setAttribute('transform',`translate(${x} ${y}) scale(${.6+1.8*age})`);
      puff.node.setAttribute('opacity',String(.26*Math.sin(Math.PI*age)*(1-age)));
    }
  }
  // Wheel centres measured in the original SVG's 122 × 88 viewBox.
  const rear = {x:31.9,y:67.3}, front = {x:81.55,y:66.57};
  const axle = Math.hypot(front.x-rear.x,front.y-rear.y);
  const localAngle = Math.atan2(front.y-rear.y,front.x-rear.x);
  const radius = 11.7, length = path.getTotalLength();
  function wheel(s) {
    const p = path.getPointAtLength(s);
    const a = path.getPointAtLength(Math.max(0,s-1));
    const b = path.getPointAtLength(Math.min(length,s+1));
    const norm = Math.hypot(b.x-a.x,b.y-a.y);
    // Offset wheel centres along the ridge's upward normal, so tyres touch it.
    return {x:p.x+(b.y-a.y)/norm*radius,y:p.y-(b.x-a.x)/norm*radius};
  }
  function pose(s) {
    const a = wheel(s);
    let lo=s,hi=s;
    // First forward crossing of the rigid axle length, rather than a tangent guess.
    while(hi<length && Math.hypot(wheel(hi).x-a.x,wheel(hi).y-a.y)<axle) hi=Math.min(length,hi+.5);
    if(Math.hypot(wheel(hi).x-a.x,wheel(hi).y-a.y)<axle) return null;
    lo=Math.max(s,hi-.5);
    for(let i=0;i<22;i++) {
      const mid=(lo+hi)/2,b=wheel(mid);
      if(Math.hypot(b.x-a.x,b.y-a.y)<axle)lo=mid;else hi=mid;
    }
    const b=wheel((lo+hi)/2);
    return {x:a.x,y:a.y,angle:Math.atan2(b.y-a.y,b.x-a.x)-localAngle};
  }
  let lo=0,hi=length;
  for(let i=0;i<25;i++){const m=(lo+hi)/2;if(pose(m))lo=m;else hi=m;}
  const end=lo;
  function render(progress) {
    const p=pose(progress*end);
    if(p)car.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${p.angle*180/Math.PI}) translate(${-rear.x} ${-rear.y})`);
    return p;
  }
  render(0);
  let running=false,frame=0,start;
  const duration=4800,fade=180;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function tick(now){
    if(!running)return;
    start??=now;
    const elapsed=(now-start)%duration;
    const t=elapsed/duration;
    const currentPose=render((1-Math.cos(Math.PI*t))/2);
    // Brief fade around the reset keeps every trip travelling left to right.
    car.style.opacity=String(Math.min(1,elapsed/fade,(duration-elapsed)/fade));
    updateSmoke(now,currentPose,Number(car.style.opacity),Math.floor((now-start)/duration));
    frame=requestAnimationFrame(tick);
  }
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.some(e=>e.isIntersecting);
    if(reduced.matches){render(0);return;}
    if(visible&&!running){running=true;start=undefined;frame=requestAnimationFrame(tick);}
    else if(!visible&&running){running=false;cancelAnimationFrame(frame);clearSmoke();}
  },{threshold:[0]});
  observer.observe(section);
})();
