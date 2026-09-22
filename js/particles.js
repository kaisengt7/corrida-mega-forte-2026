/**
 * Campo de partículas pontilhadas com física de deslocamento
 * (repulsão + mola) reagindo à posição do cursor, suavizada por lerp.
 * Roda apenas em desktop (>=860px) e respeita prefers-reduced-motion.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  var mql = window.matchMedia("(min-width: 860px)");

  var INFLUENCE_R = 190;         // raio de influência do cursor sobre os pontos
  var REPEL_STRENGTH = 5.5;      // força de repulsão
  var SPRING = 0.025;            // força de retorno à posição original
  var DAMPING = 0.88;            // amortecimento do deslocamento
  var CURSOR_LERP = 0.14;        // suavização da posição do cursor

  function createParticleField(sectionSelector, canvasSelector, dotRgb) {
    var section = document.querySelector(sectionSelector);
    var canvas = document.querySelector(canvasSelector);
    if (!section || !canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var dots = [];
    var rafId = null;
    var running = false;
    var resizeTimer = null;
    var mouse = { rawX: -9999, rawY: -9999, x: -9999, y: -9999, active: false };

    function buildDots() {
      var count = Math.round(Math.min(130, Math.max(45, (W * H) / 9000)));
      dots = [];
      for (var i = 0; i < count; i++) {
        var bx = Math.random() * W;
        var by = Math.random() * H;
        dots.push({
          bx: bx, by: by, x: bx, y: by, vx: 0, vy: 0,
          r: 1 + Math.random() * 1.6,
          a: 0.22 + Math.random() * 0.3
        });
      }
    }

    function resize() {
      var rect = section.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildDots();
    }

    function onMouseMove(e) {
      var rect = section.getBoundingClientRect();
      mouse.rawX = e.clientX - rect.left;
      mouse.rawY = e.clientY - rect.top;
      if (!mouse.active) {
        // evita o "salto" longo do lerp vindo da posição sentinela inicial
        mouse.x = mouse.rawX;
        mouse.y = mouse.rawY;
      }
      mouse.active = true;
    }

    function onMouseLeave() {
      mouse.active = false;
    }

    function step() {
      if (!running) return;
      try {
        render();
      } catch (err) {
        // nunca deixa o loop morrer por um erro pontual de desenho
      }
      rafId = requestAnimationFrame(step);
    }

    function render() {
      ctx.clearRect(0, 0, W, H);

      // suavização (lerp) da posição do cursor
      mouse.x += (mouse.rawX - mouse.x) * CURSOR_LERP;
      mouse.y += (mouse.rawY - mouse.y) * CURSOR_LERP;

      var withinBounds = mouse.active && mouse.rawX >= -40 && mouse.rawX <= W + 40 && mouse.rawY >= -40 && mouse.rawY <= H + 40;

      // física de deslocamento dos pontos (repulsão + mola + amortecimento)
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];

        if (withinBounds) {
          var dx = d.x - mouse.x;
          var dy = d.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          if (dist < INFLUENCE_R) {
            var force = (1 - dist / INFLUENCE_R) * REPEL_STRENGTH;
            d.vx += (dx / dist) * force;
            d.vy += (dy / dist) * force;
          }
        }

        d.vx += (d.bx - d.x) * SPRING;
        d.vy += (d.by - d.y) * SPRING;
        d.vx *= DAMPING;
        d.vy *= DAMPING;
        d.x += d.vx;
        d.y += d.vy;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + dotRgb + "," + d.a + ")";
        ctx.fill();
      }
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      document.addEventListener("mouseleave", onMouseLeave);
      window.addEventListener("resize", onResize);
      document.addEventListener("visibilitychange", onVisibilityChange);
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots = [];
    }

    function onVisibilityChange() {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (running) {
        rafId = requestAnimationFrame(step);
      }
    }

    function handleBreakpointChange(e) {
      if (e.matches) start(); else stop();
    }

    if (mql.addEventListener) {
      mql.addEventListener("change", handleBreakpointChange);
    } else if (mql.addListener) {
      mql.addListener(handleBreakpointChange);
    }

    if (mql.matches) start();
  }

  // mesma cor de pontos (azul bem claro #CFE2F0) nas duas dobras
  createParticleField(".hero", ".hero__particles", "207,226,240");
  createParticleField(".impact", ".impact__particles", "207,226,240");
})();
