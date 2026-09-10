/* ============================================================
   ISO/IEC 27001 — Presentación Grupo 4
   Navegación, animación de transición y utilidades de UI
   ============================================================ */
(function () {
  "use strict";

  const track = document.getElementById("track");
  const slides = Array.from(track.querySelectorAll(".slide"));
  const sideNav = document.getElementById("sideNav");
  const blockBar = document.getElementById("blockBar");
  const blockNameEl = document.getElementById("blockName");
  const slideNowEl = document.getElementById("slideNow");
  const slideTotalEl = document.getElementById("slideTotal");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let current = 0;
  const total = slides.length;
  const TOTAL_BLOCKS = 6;
  slideTotalEl.textContent = pad(total);

  /* ---------- mapear diapositivas de contenido a cada bloque (1-6) ---------- */
  const blockSlideIndexes = {};   // { "1": [i,i,i,i,i], ... }
  const blockTitles = {};         // { "1": "Bloque I — Fundamentos", ... }
  slides.forEach((slide, i) => {
    const b = slide.dataset.block;
    if (!b || b === "0" || b === "7") return;
    (blockSlideIndexes[b] = blockSlideIndexes[b] || []).push(i);
    if (slide.classList.contains("slide-block")) {
      const roman = ["I", "II", "III", "IV", "V", "VI"][Number(b) - 1] || b;
      const titleText = slide.querySelector(".block-title")?.textContent || "";
      blockTitles[b] = "Bloque " + roman + " — " + titleText;
    }
  });

  /* ---------- construir barra de bloques en la cabecera ---------- */
  const blockSegs = [];
  for (let b = 1; b <= TOTAL_BLOCKS; b++) {
    const seg = document.createElement("div");
    seg.className = "hud-block-seg";
    seg.innerHTML = '<span class="hud-block-fill"></span>';
    blockBar.appendChild(seg);
    blockSegs.push(seg);
  }

  function updateBlockBar() {
    const activeSlide = slides[current];
    const activeBlockStr = activeSlide.dataset.block;
    const activeBlock = Number(activeBlockStr);

    if (!activeBlockStr || activeBlockStr === "0") {
      blockNameEl.textContent = "Carátula";
      blockSegs.forEach((seg) => {
        seg.classList.remove("is-current", "is-done");
        seg.querySelector(".hud-block-fill").style.width = "0%";
      });
      return;
    }
    if (activeBlockStr === "7") {
      blockNameEl.textContent = "Cierre — Gracias";
      blockSegs.forEach((seg) => {
        seg.classList.remove("is-current");
        seg.classList.add("is-done");
      });
      return;
    }

    blockNameEl.textContent = blockTitles[activeBlockStr] || ("Bloque " + activeBlockStr);

    blockSegs.forEach((seg, idx) => {
      const segBlock = idx + 1;
      const fillEl = seg.querySelector(".hud-block-fill");
      seg.classList.remove("is-current", "is-done");

      if (segBlock < activeBlock) {
        seg.classList.add("is-done");
        fillEl.style.width = "100%";
      } else if (segBlock > activeBlock) {
        fillEl.style.width = "0%";
      } else {
        seg.classList.add("is-current");
        const list = blockSlideIndexes[activeBlockStr] || [];
        const posInBlock = list.indexOf(current);
        const pct = list.length > 1 ? (posInBlock / (list.length - 1)) * 100 : 100;
        fillEl.style.width = pct + "%";
      }
    });
  }

  /* ---------- construir navegación lateral (puntos) ---------- */
  slides.forEach((slide, i) => {
    const dot = document.createElement("button");
    dot.className = "side-dot" + (slide.classList.contains("slide-block") ? " is-block" : "");
    dot.setAttribute("data-label", (slide.dataset.nav || slide.dataset.code || ("Slide " + (i + 1))));
    dot.setAttribute("aria-label", "Ir a " + (slide.dataset.nav || i + 1));
    dot.addEventListener("click", () => goTo(i));
    sideNav.appendChild(dot);
  });
  const dots = Array.from(sideNav.children);

  /* ---------- núcleo de navegación ---------- */
  function goTo(index) {
    index = Math.max(0, Math.min(total - 1, index));
    if (index === current) return;

    const prevSlide = slides[current];
    prevSlide.classList.remove("is-active");
    prevSlide.classList.add("is-prev");
    // limpiar la clase auxiliar tras la transición para que no interfiera al volver
    window.setTimeout(() => prevSlide.classList.remove("is-prev"), 700);

    current = index;
    const nextSlide = slides[current];
    nextSlide.classList.remove("is-prev");
    // forzar reflow para reiniciar la animación de entrada (stagger)
    void nextSlide.offsetWidth;
    nextSlide.classList.add("is-active");

    updateUI();
  }

  function updateUI() {
    slideNowEl.textContent = pad(current + 1);
    updateBlockBar();
    dots.forEach((d, i) => d.classList.toggle("is-active", i === current));
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;

    const activeDot = dots[current];
    if (activeDot && activeDot.scrollIntoView) {
      activeDot.scrollIntoView({ block: "nearest" });
    }
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  /* ---------- controles ---------- */
  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));

  window.addEventListener("keydown", (e) => {
    if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
      e.preventDefault(); goTo(current + 1);
    } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
      e.preventDefault(); goTo(current - 1);
    } else if (e.key === "Home") {
      e.preventDefault(); goTo(0);
    } else if (e.key === "End") {
      e.preventDefault(); goTo(total - 1);
    }
  });

  /* rueda del mouse, con freno anti-rebote */
  let wheelLock = false;
  window.addEventListener("wheel", (e) => {
    if (wheelLock) return;
    if (Math.abs(e.deltaY) < 18) return;
    wheelLock = true;
    goTo(current + (e.deltaY > 0 ? 1 : -1));
    window.setTimeout(() => { wheelLock = false; }, 650);
  }, { passive: true });

  /* gestos táctiles */
  let touchStartY = null;
  window.addEventListener("touchstart", (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchend", (e) => {
    if (touchStartY === null) return;
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 60) goTo(current + (dy > 0 ? 1 : -1));
    touchStartY = null;
  }, { passive: true });

  /* ---------- detección de imágenes faltantes ----------
     Si una imagen imagenX.jpg/png no existe todavía en assets/img,
     se muestra un marco con el nombre del archivo para ubicarla fácilmente. */
  document.querySelectorAll(".frame-img").forEach((img) => {
    img.addEventListener("error", () => {
      img.closest(".img-frame")?.classList.add("is-missing");
    }, { once: true });
  });

  /* ---------- estado inicial ---------- */
  slides[0].classList.add("is-active");
  updateUI();
})();