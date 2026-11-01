(() => {
  if(!matchMedia('(pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const field=document.createElement('canvas');
  const gl=field.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!gl||!gl.getExtension('EXT_color_buffer_float'))return;
  const vertex=`#version 300 es
  in vec2 position;out vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const header=`#version 300 es
  precision highp float;in vec2 uv;out vec4 result;
  uniform sampler2D a,b,c;uniform vec2 cell,point,force;uniform float dt,fade,radius,aspect;`;
  function program(body){
    function shader(type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,header+body));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;
  }
  // Independent implementation of standard incompressible-fluid passes.
  const passes={
    inject:program(`void main(){vec2 q=uv-point;q.x*=aspect;float amount=exp(-dot(q,q)/max(radius,.0000001));result=texture(a,uv)+vec4(force*amount,amount,0.);}`),
    move:program(`void main(){vec2 drift=texture(b,uv).xy;result=texture(a,clamp(uv-dt*drift*cell,vec2(0.),vec2(1.)))*fade;}`),
    divergence:program(`void main(){float l=texture(a,uv-vec2(cell.x,0)).x;float r=texture(a,uv+vec2(cell.x,0)).x;float t=texture(a,uv+vec2(0,cell.y)).y;float d=texture(a,uv-vec2(0,cell.y)).y;result=vec4((r-l+t-d)*.5,0.,0.,0.);}`),
    pressure:program(`void main(){float sum=texture(a,uv-vec2(cell.x,0)).r+texture(a,uv+vec2(cell.x,0)).r+texture(a,uv-vec2(0,cell.y)).r+texture(a,uv+vec2(0,cell.y)).r;result=vec4((sum-texture(b,uv).r)*.25,0.,0.,0.);}`),
    relax:program(`void main(){result=texture(a,uv)*fade;}`),
    project:program(`void main(){vec2 grad=vec2(texture(b,uv+vec2(cell.x,0)).r-texture(b,uv-vec2(cell.x,0)).r,texture(b,uv+vec2(0,cell.y)).r-texture(b,uv-vec2(0,cell.y)).r);result=vec4(texture(a,uv).xy-grad,0.,0.);}`),
    show:program(`void main(){float ink=texture(a,uv).b;float alpha=smoothstep(.001,.003,ink);result=vec4(1.,1.,1.,alpha);}`)
  };
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  function target(size){const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,size,size,0,gl.RGBA,gl.HALF_FLOAT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Fluid framebuffer unsupported');return {texture,fb,size};}
  const pair=size=>({read:target(size),write:target(size),swap(){[this.read,this.write]=[this.write,this.read];}});
  const velocity=pair(256),density=pair(512),pressure=pair(256),divergence=target(256);
  function run(p,dest,values={}){
    gl.useProgram(p);gl.bindFramebuffer(gl.FRAMEBUFFER,dest?.fb??null);gl.viewport(0,0,dest?.size??field.width,dest?.size??field.height);
    const pos=gl.getAttribLocation(p,'position');gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    let slot=0;for(const [key,value]of Object.entries(values)){const loc=gl.getUniformLocation(p,key);if(loc===null)continue;if(value?.texture){gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,value.texture);gl.uniform1i(loc,slot++);}else if(Array.isArray(value))gl.uniform2f(loc,...value);else gl.uniform1f(loc,value);}
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  const visible=document.createElement('canvas');visible.className='fluid-trail';visible.setAttribute('aria-hidden','true');document.body.append(visible);const ctx=visible.getContext('2d');
  function resize(){const dpr=Math.min(devicePixelRatio||1,1.5);field.width=visible.width=Math.ceil(innerWidth*dpr);field.height=visible.height=Math.ceil(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  resize();window.addEventListener('resize',resize);
  window.PortfolioFluidActive=true;
  let queue=[],last=null,previousTime=0,raf=0,idle=0,speed=0,splatSize=0;
  document.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse')return;
    if(last){const dx=e.clientX-last.x,dy=e.clientY-last.y;speed=Math.abs(dx)+Math.abs(dy);if(speed>.4){queue.push({x:e.clientX/innerWidth,y:1-e.clientY/innerHeight,dx:dx*5,dy:-dy*5});idle=0;if(!raf)raf=requestAnimationFrame(frame);}}
    last={x:e.clientX,y:e.clientY};
  },{passive:true});
  document.addEventListener('pointerleave',()=>{last=null;});window.addEventListener('blur',()=>{last=null;queue=[];});
  function frame(time){
    const dt=Math.min((time-(previousTime||time-16.67))/1000,.05);previousTime=time;const rate=dt*60;
    splatSize+=(Math.min(speed,6)*.01-splatSize)*(1-Math.pow(.9,rate));
    for(const input of queue.splice(0)){
      const shared={point:[input.x,input.y],aspect:innerWidth/innerHeight,radius:splatSize/100};
      run(passes.inject,velocity.write,{...shared,a:velocity.read,force:[input.dx,input.dy]});velocity.swap();
      run(passes.inject,density.write,{...shared,a:density.read,force:[0,0]});density.swap();
    }
    const cell=[1/256,1/256];
    run(passes.move,velocity.write,{a:velocity.read,b:velocity.read,cell,dt,fade:Math.pow(.98,rate)});velocity.swap();
    run(passes.divergence,divergence,{a:velocity.read,cell});
    run(passes.relax,pressure.write,{a:pressure.read,fade:Math.pow(.7,rate)});pressure.swap();
    run(passes.pressure,pressure.write,{a:pressure.read,b:divergence,cell});pressure.swap();
    run(passes.project,velocity.write,{a:velocity.read,b:pressure.read,cell});velocity.swap();
    run(passes.move,density.write,{a:density.read,b:velocity.read,cell,dt,fade:Math.pow(.73,rate)});density.swap();
    run(passes.show,null,{a:density.read});
    ctx.clearRect(0,0,innerWidth,innerHeight);ctx.globalCompositeOperation='source-over';ctx.drawImage(field,0,0,innerWidth,innerHeight);
    ctx.globalCompositeOperation='source-in';ctx.fillStyle='#00DF88';ctx.fillRect(0,0,innerWidth,innerHeight);ctx.globalCompositeOperation='source-over';
    document.dispatchEvent(new CustomEvent('portfolio-fluid',{detail:field}));
    if(++idle<150)raf=requestAnimationFrame(frame);else{raf=0;previousTime=0;ctx.clearRect(0,0,innerWidth,innerHeight);}
  }
})();
