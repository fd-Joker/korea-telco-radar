(() => {
  const isDetailRoute = /^\/event\/[^/]+\/?$/.test(window.location.pathname);
  if (!isDetailRoute) return;

  document.body.dataset.page = 'detail';
  const main = document.querySelector('main');
  if (main) {
    main.className = 'shell';
    main.innerHTML = '<div id="detail"></div>';
  }

  document.querySelectorAll('nav a.active').forEach(a => a.classList.remove('active'));
})();
