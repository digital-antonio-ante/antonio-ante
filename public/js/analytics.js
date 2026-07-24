/**
 * analytics.js — Inicialización de Google Analytics 4.
 *
 * Se sirve como archivo externo (script-src 'self') para no depender de un hash
 * de CSP por cada cambio de ID. El identificador de medición llega en el atributo
 * data-ga-id de la etiqueta <script> que lo carga; así el ID es configurable
 * (variable de entorno) sin tocar la Content-Security-Policy.
 */
(function () {
  var el = document.currentScript;
  var id = el && el.dataset ? el.dataset.gaId : null;
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id);
})();
