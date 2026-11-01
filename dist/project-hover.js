(() => {
  document.querySelectorAll('.project.first').forEach(card => card.addEventListener('click', () => { location.href = 'hamarcolet.html?v=latest-portrait-dot-20261031'; }));
  document.querySelectorAll('.project.second').forEach(card => card.addEventListener('click', () => { location.href = 'hashomer.html?v=support-centered-20261031'; }));
  document.querySelectorAll('.project.third').forEach(card => card.addEventListener('click', () => { location.href = 'carup.html?v=latest-portrait-dot-20261031'; }));
  document.querySelectorAll('.project.fourth').forEach(card => card.addEventListener('click', () => { location.href = 'urban-oasis.html?v=latest-portrait-dot-20261031'; }));
  const names = [...document.querySelectorAll('[data-project]')];
  function activate(key) {
    names.forEach(name => name.classList.toggle('active', name.dataset.project === key));
  }
  document.querySelectorAll('.project').forEach(project => {
    const key = ['first', 'second', 'third', 'fourth'].find(key => project.classList.contains(key));
    project.addEventListener('pointerenter', () => activate(key));
    project.addEventListener('pointerleave', () => activate(null));
    project.addEventListener('focusin', () => activate(key));
    project.addEventListener('focusout', () => activate(null));
  });
})();
