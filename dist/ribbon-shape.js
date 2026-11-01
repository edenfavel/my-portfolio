(() => {
  // Shared outline: the visible ribbon and photo reveal always use the same geometry.
  function outline(points, radius, time) {
    if (points.length < 2 || radius < .15) return null;
    const left=[], right=[];
    for(let i=0;i<points.length;i++) {
      const a=points[Math.max(0,i-1)], b=points[Math.min(points.length-1,i+1)];
      const angle=Math.atan2(b.y-a.y,b.x-a.x);
      const t=i/(points.length-1);
      const profile=Math.pow(1-t,1.6)*(1+.7*Math.sin(Math.PI*t));
      const fold=1+.16*Math.sin(t*7.5-time*.0018)*Math.sin(Math.PI*t);
      const width=radius*profile*fold;
      const curl=radius*.21*Math.sin(t*8-time*.0015)*Math.sin(Math.PI*t);
      const nx=-Math.sin(angle), ny=Math.cos(angle);
      const x=points[i].x+nx*curl,y=points[i].y+ny*curl;
      left.push({x:x+nx*width,y:y+ny*width});
      right.push({x:x-nx*width,y:y-ny*width});
    }
    return {left,right,radius,head:points[0],tail:points[points.length-1]};
  }
  function draw(ctx,shape) {
    if(!shape)return;
    const l=shape.left,r=shape.right;
    ctx.beginPath();ctx.moveTo(l[0].x,l[0].y);
    for(let i=1;i<l.length-1;i++)ctx.quadraticCurveTo(l[i].x,l[i].y,(l[i].x+l[i+1].x)/2,(l[i].y+l[i+1].y)/2);
    ctx.lineTo(l[l.length-1].x,l[l.length-1].y);
    ctx.lineTo(r[r.length-1].x,r[r.length-1].y);
    for(let i=r.length-2;i>0;i--)ctx.quadraticCurveTo(r[i].x,r[i].y,(r[i].x+r[i-1].x)/2,(r[i].y+r[i-1].y)/2);
    ctx.lineTo(r[0].x,r[0].y);
    // Round the leading end without introducing an independent reveal circle.
    const head=shape.head, next={x:head.x-shape.tail.x,y:head.y-shape.tail.y};
    const length=Math.hypot(next.x,next.y)||1;
    ctx.quadraticCurveTo(head.x+next.x/length*shape.radius*1.12,head.y+next.y/length*shape.radius*1.12,l[0].x,l[0].y);
    ctx.closePath();
  }
  window.PortfolioRibbon={outline,draw};
})();
