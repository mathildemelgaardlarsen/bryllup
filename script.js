const weekendStart = new Date("2026-09-11T12:00:00+02:00").getTime();
let currentLanguage = "da";

function updateCountdown() {
  const now = Date.now();
  const diff = weekendStart - now;

  if (diff <= 0) {
    setUnit("days", 0);
    setUnit("hours", 0);
    setUnit("minutes", 0);
    setUnit("seconds", 0);
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  setUnit("days", days);
  setUnit("hours", hours);
  setUnit("minutes", minutes);
  setUnit("seconds", seconds);
}

function setUnit(unit, value) {
  const node = document.querySelector(`[data-unit="${unit}"]`);
  if (node) {
    node.textContent = String(value).padStart(2, "0");
  }
}

function setupSlideshow() {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const dotsWrap = document.querySelector("[data-dots]");
  const prev = document.querySelector(".slideshow__btn.prev");
  const next = document.querySelector(".slideshow__btn.next");
  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxPrev = document.querySelector("[data-lightbox-prev]");
  const lightboxNext = document.querySelector("[data-lightbox-next]");
  const lightboxClose = document.querySelector("[data-lightbox-close]");

  if (!slides.length || !dotsWrap || !prev || !next) {
    return;
  }

  let current = 0;
  let timer;

  slides.forEach((slide, i) => {
    const dot = document.createElement("button");
    dot.className = "dot";
    dot.type = "button";
    dot.setAttribute("aria-label", getSlideAria(i + 1));
    dot.addEventListener("click", () => {
      goTo(i);
      restartAuto();
    });
    dotsWrap.appendChild(dot);

    const image = slide.querySelector("img");
    if (image && lightbox) {
      image.style.cursor = "zoom-in";
      image.addEventListener("click", () => openLightbox());
    }
  });

  function getSlideAria(index) {
    return currentLanguage === "da" ? `Gaa til billede ${index}` : `Go to image ${index}`;
  }

  function refreshDotLabels() {
    Array.from(dotsWrap.children).forEach((dot, index) => {
      dot.setAttribute("aria-label", getSlideAria(index + 1));
    });
  }

  function goTo(index) {
    slides[current].classList.remove("is-active");
    dotsWrap.children[current].classList.remove("is-active");
    current = (index + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    dotsWrap.children[current].classList.add("is-active");

    if (lightbox && !lightbox.hidden && lightboxImage) {
      const img = slides[current].querySelector("img");
      if (img) {
        lightboxImage.src = img.currentSrc || img.src;
        lightboxImage.alt = img.alt;
      }
    }
  }

  function nextSlide() {
    goTo(current + 1);
  }

  function previousSlide() {
    goTo(current - 1);
  }

  function restartAuto() {
    window.clearInterval(timer);
    timer = window.setInterval(nextSlide, 5000);
  }

  function openLightbox() {
    if (!lightbox || !lightboxImage) {
      return;
    }
    const img = slides[current].querySelector("img");
    if (!img) {
      return;
    }
    lightboxImage.src = img.currentSrc || img.src;
    lightboxImage.alt = img.alt;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) {
      return;
    }
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  prev.addEventListener("click", () => {
    previousSlide();
    restartAuto();
  });

  next.addEventListener("click", () => {
    nextSlide();
    restartAuto();
  });

  if (lightboxPrev && lightboxNext && lightboxClose && lightbox) {
    lightboxPrev.addEventListener("click", previousSlide);
    lightboxNext.addEventListener("click", nextSlide);
    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", event => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    window.addEventListener("keydown", event => {
      if (lightbox.hidden) {
        return;
      }
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowRight") {
        nextSlide();
      } else if (event.key === "ArrowLeft") {
        previousSlide();
      }
    });
  }

  goTo(0);
  refreshDotLabels();
  restartAuto();

  return {
    refreshDotLabels,
  };
}

function setupLanguageToggle(slideshowApi) {
  const toggle = document.querySelector("[data-language-toggle]");
  if (!toggle) {
    return;
  }

  const translatable = Array.from(document.querySelectorAll("[data-da][data-en]"));

  function applyLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;

    translatable.forEach(node => {
      node.textContent = node.getAttribute(`data-${lang}`) || node.textContent;
    });

    document.querySelectorAll("[data-da-aria-label][data-en-aria-label]").forEach(node => {
      const value = node.getAttribute(`data-${lang}-aria-label`);
      if (value) {
        node.setAttribute("aria-label", value);
      }
    });

    const buttonLabel = toggle.getAttribute(`data-${lang}-label`);
    if (buttonLabel) {
      toggle.textContent = buttonLabel;
    }

    if (slideshowApi && slideshowApi.refreshDotLabels) {
      slideshowApi.refreshDotLabels();
    }
  }

  toggle.addEventListener("click", () => {
    applyLanguage(currentLanguage === "da" ? "en" : "da");
  });
}

function setupSectionSelect() {
  const select = document.querySelector("[data-section-select]");
  if (!select) {
    return;
  }

  select.addEventListener("change", () => {
    const value = select.value;
    if (!value || !value.startsWith("#")) {
      return;
    }
    const target = document.querySelector(value);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) {
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  items.forEach(item => observer.observe(item));
}

updateCountdown();
window.setInterval(updateCountdown, 1000);
const slideshowApi = setupSlideshow();
setupLanguageToggle(slideshowApi);
setupSectionSelect();
setupReveal();
