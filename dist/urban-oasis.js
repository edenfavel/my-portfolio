(() => {
  function fit(){
    document.documentElement.style.setProperty('--scale',document.documentElement.clientWidth/1440);
    const frame=document.querySelector('.urban-live-frame');
    if(frame){const scale=frame.clientWidth/1440;frame.style.setProperty('--dashboard-scale',scale);frame.querySelector('iframe').style.height=frame.clientHeight/scale+'px'}
  }
  fit();addEventListener('resize',fit);
  const page=document.querySelector('#urban-page');
  const cards=[
    {name:'Critical Issues',ids:['11129','11133','11134','11135','11136']},
    {name:'Daily Tasks',ids:['11132','11143','11144','11145','11146']},
    {name:'Room Overview',ids:['11131','11147','11148','11149','11150']},
    {name:'Staff Activity',ids:['11130','11137','11141','11140','11142']}
  ];
  for(const card of cards){
    const nodes=card.ids.map(id=>page.querySelector('[data-node-id="17052:'+id+'"]'));
    if(nodes.some(node=>!node))continue;
    const geometry=nodes.map(node=>{const s=getComputedStyle(node);return {left:parseFloat(s.left),top:parseFloat(s.top)}});
    const origin=geometry[0];
    const wrapper=document.createElement('div');
    wrapper.className='urban-callout';wrapper.tabIndex=0;
    wrapper.setAttribute('role','group');wrapper.setAttribute('aria-label',card.name);
    wrapper.style.left=origin.left+'px';wrapper.style.top=origin.top+'px';
    page.insertBefore(wrapper,nodes[0]);
    nodes.forEach((node,index)=>{
      node.style.left=geometry[index].left-origin.left+'px';
      node.style.top=geometry[index].top-origin.top+'px';
      if(index===0)node.classList.add('callout-surface');
      wrapper.appendChild(node);
    });
  }
  // Preserve downstream spacing when the opening dashboard is lowered.
  const downstream=[...page.querySelectorAll('*')].filter(node=>node.offsetParent===page&&getComputedStyle(node).position==='absolute').map(node=>({node,top:parseFloat(getComputedStyle(node).top)})).filter(item=>item.top>=1050);
  for(const {node,top}of downstream)node.style.setProperty('top',(top+88)+'px','important');
})();
