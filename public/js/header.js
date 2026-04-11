// Mobile navigation menu — served as a static file from 'self' to satisfy CSP.
// Loaded via <script src="/js/header.js"> in Header.astro.
(function () {
  var toggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  var iconHamburger = document.getElementById('icon-hamburger');
  var iconClose = document.getElementById('icon-close');

  if (!toggle || !menu || !iconHamburger || !iconClose) return;

  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú de navegación');
    menu.classList.remove('hidden');
    menu.setAttribute('aria-hidden', 'false');
    iconHamburger.classList.add('hidden');
    iconClose.classList.remove('hidden');
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú de navegación');
    menu.classList.add('hidden');
    menu.setAttribute('aria-hidden', 'true');
    iconHamburger.classList.remove('hidden');
    iconClose.classList.add('hidden');
  }

  toggle.addEventListener('click', function () {
    if (toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Cerrar con Escape y devolver foco al botón
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });

  // Cerrar al hacer clic fuera del menú
  document.addEventListener('click', function (e) {
    var target = e.target;
    if (
      toggle.getAttribute('aria-expanded') === 'true' &&
      target instanceof Node &&
      !toggle.contains(target) &&
      !menu.contains(target)
    ) {
      closeMenu();
    }
  });
})();
