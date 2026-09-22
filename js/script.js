(function () {
  "use strict";

  function trackPixel(eventName, isCustom, params) {
    if (typeof window.fbq !== "function") return;
    if (isCustom) {
      window.fbq("trackCustom", eventName, params || {});
    } else {
      window.fbq("track", eventName, params || {});
    }
  }

  // Clique nos botões de inscrição
  var transitioning = false;

  function runInkTransition(e, link) {
    var overlay = document.getElementById("page-transition");
    var blob = document.getElementById("page-transition-blob");
    var destination = link.href;

    if (!overlay || !blob) {
      window.location.href = destination;
      return;
    }

    var originX = e.clientX;
    var originY = e.clientY;
    if (!originX && !originY) {
      // ativação por teclado: usa o centro do próprio botão
      var rect = link.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }

    var maxX = Math.max(originX, window.innerWidth - originX);
    var maxY = Math.max(originY, window.innerHeight - originY);
    var radius = Math.sqrt(maxX * maxX + maxY * maxY);
    var scale = (radius / 16) * 1.15;

    blob.style.left = originX + "px";
    blob.style.top = originY + "px";
    blob.style.setProperty("--pt-scale", scale);

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // força reflow para garantir que a transição rode a partir de scale(0)
    void blob.offsetWidth;
    blob.classList.add("is-active");

    window.setTimeout(function () {
      window.location.href = destination;
    }, reduceMotion ? 0 : 900);
  }

  document.querySelectorAll(".cta-inscricao").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      trackPixel("Lead", false, { content_name: btn.dataset.cta || "inscricao" });

      if (btn.dataset.inkTransition === "true" && btn.tagName === "A") {
        if (transitioning) { e.preventDefault(); return; }
        transitioning = true;
        e.preventDefault();
        runInkTransition(e, btn);
      }
    });
  });

  // Reprodução do aftermovie (vídeo local)
  var playBtn = document.getElementById("video-play-btn");
  var embedBox = document.getElementById("video-embed");
  var video = document.getElementById("aftermovie-video");

  if (playBtn && embedBox && video) {
    playBtn.addEventListener("click", function () {
      playBtn.hidden = true;
      embedBox.hidden = false;
      video.play();
      trackPixel("AftermovieStart", true, { content_name: "aftermovie_1a_edicao" });
    }, { once: true });
  }

  // Contagem regressiva até a largada (29/11/2026, 07h, horário de Brasília)
  var topbarEl = document.getElementById("topbar");
  if (topbarEl) {
    var raceStart = new Date("2026-11-29T07:00:00-03:00").getTime();
    var cdDays = document.querySelectorAll(".cd-d");
    var cdHours = document.querySelectorAll(".cd-h");
    var cdMinutes = document.querySelectorAll(".cd-m");
    var cdSeconds = document.querySelectorAll(".cd-s");
    var countdownTimer = null;

    function pad(n) { return String(n).padStart(2, "0"); }
    function setAll(list, value) { list.forEach(function (el) { el.textContent = value; }); }

    function updateCountdown() {
      var diff = raceStart - Date.now();
      if (diff <= 0) {
        setAll(cdDays, "00");
        setAll(cdHours, "00");
        setAll(cdMinutes, "00");
        setAll(cdSeconds, "00");
        if (countdownTimer) clearInterval(countdownTimer);
        return;
      }
      setAll(cdDays, pad(Math.floor(diff / 86400000)));
      setAll(cdHours, pad(Math.floor((diff % 86400000) / 3600000)));
      setAll(cdMinutes, pad(Math.floor((diff % 3600000) / 60000)));
      setAll(cdSeconds, pad(Math.floor((diff % 60000) / 1000)));
    }

    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);
  }

  // Botão "rolar para baixo" no fim da 1ª dobra
  var scrollDownBtn = document.getElementById("scroll-down-btn");
  var dobra2 = document.getElementById("dobra-2");
  if (scrollDownBtn && dobra2) {
    scrollDownBtn.addEventListener("click", function () {
      dobra2.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Animações de entrada (reveal ao rolar a página)
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (typeof window.IntersectionObserver === "function") {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.01, rootMargin: "0px 0px 40px 0px" });

      revealEls.forEach(function (el) { observer.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    }
  }
})();
