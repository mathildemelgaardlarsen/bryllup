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

function setupWeddingSlideshow() {
  const slideshow = document.querySelector("[data-wedding-slideshow]");
  const sourcePhotos = window.weddingPhotos;
  const photos = Array.isArray(sourcePhotos) && sourcePhotos.length > 28
    ? [sourcePhotos[28], ...sourcePhotos.slice(0, 28), ...sourcePhotos.slice(29)]
    : sourcePhotos;
  const image = slideshow?.querySelector(".slide img");
  const prev = slideshow?.querySelector(".slideshow__btn.prev");
  const next = slideshow?.querySelector(".slideshow__btn.next");
  const counter = document.querySelector("#bryllupsbilleder [data-slide-counter]");
  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxPrev = document.querySelector("[data-lightbox-prev]");
  const lightboxNext = document.querySelector("[data-lightbox-next]");
  const lightboxClose = document.querySelector("[data-lightbox-close]");

  if (!slideshow || !image || !prev || !next || !Array.isArray(photos) || !photos.length) {
    return;
  }

  let current = 0;
  const preloadedFullImages = new Map();

  function getAlt(photo, index) {
    const prefix = currentLanguage === "da" ? "Bryllupsbillede" : "Wedding photo";
    return `${prefix} ${index + 1}${photo.alt ? `: ${photo.alt}` : ""}`;
  }

  function preloadFullImage(index) {
    const normalizedIndex = (index + photos.length) % photos.length;
    if (preloadedFullImages.has(normalizedIndex)) {
      return preloadedFullImages.get(normalizedIndex);
    }

    const preload = new Image();
    preload.src = photos[normalizedIndex].src;
    preloadedFullImages.set(normalizedIndex, preload);
    return preload;
  }

  function trimPreloadedImages() {
    const keep = new Set([current, (current + 1) % photos.length, (current - 1 + photos.length) % photos.length]);
    preloadedFullImages.forEach((_, index) => {
      if (!keep.has(index)) {
        preloadedFullImages.delete(index);
      }
    });
  }

  function render() {
    const index = current;
    const photo = photos[index];
    slideshow.classList.add("is-loading");
    image.alt = getAlt(photo, current);
    image.setAttribute("data-da-alt", `Bryllupsbillede ${current + 1}${photo.alt ? `: ${photo.alt}` : ""}`);
    image.setAttribute("data-en-alt", `Wedding photo ${current + 1}${photo.alt ? `: ${photo.alt}` : ""}`);
    if (counter) {
      counter.textContent = `${current + 1} / ${photos.length}`;
    }
    if (lightbox && !lightbox.hidden && lightboxImage) {
      lightboxImage.src = photo.src;
      lightboxImage.alt = image.alt;
    }

    const fullImage = preloadFullImage(index);
    const showFullImage = () => {
      if (current !== index) {
        return;
      }
      image.src = photo.src;
      slideshow.classList.remove("is-loading");
    };

    if (fullImage.complete && fullImage.naturalWidth) {
      showFullImage();
    } else {
      fullImage.addEventListener("load", showFullImage, { once: true });
    }
    fullImage.addEventListener("error", () => {
      if (current === index) {
        slideshow.classList.remove("is-loading");
      }
    }, { once: true });
    preloadFullImage(current + 1);
    preloadFullImage(current - 1);
    trimPreloadedImages();
  }

  function goTo(index) {
    current = (index + photos.length) % photos.length;
    render();
  }

  function closeLightbox() {
    if (!lightbox) {
      return;
    }
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  prev.addEventListener("click", () => goTo(current - 1));
  next.addEventListener("click", () => goTo(current + 1));
  image.style.cursor = "zoom-in";
  image.addEventListener("click", () => {
    if (!lightbox || !lightboxImage) {
      return;
    }
    lightboxImage.src = photos[current].src;
    lightboxImage.alt = image.alt;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  });

  lightboxPrev?.addEventListener("click", () => {
    if (lightbox && !lightbox.hidden) {
      goTo(current - 1);
    }
  });
  lightboxNext?.addEventListener("click", () => {
    if (lightbox && !lightbox.hidden) {
      goTo(current + 1);
    }
  });
  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  window.addEventListener("keydown", event => {
    if (!lightbox || lightbox.hidden) {
      return;
    }
    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowRight") {
      goTo(current + 1);
    } else if (event.key === "ArrowLeft") {
      goTo(current - 1);
    }
  });

  render();
}

function setupSlideshows() {
  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxPrev = document.querySelector("[data-lightbox-prev]");
  const lightboxNext = document.querySelector("[data-lightbox-next]");
  const lightboxClose = document.querySelector("[data-lightbox-close]");
  const controllers = [];
  let activeController = null;

  function openLightbox(controller) {
    if (!lightbox || !lightboxImage) {
      return;
    }
    const img = controller.getCurrentImage();
    if (!img) {
      return;
    }
    activeController = controller;
    lightboxImage.src = img.dataset.fullSrc || img.currentSrc || img.src;
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
    activeController = null;
  }

  document.querySelectorAll("[data-slideshow]:not([data-wedding-slideshow])").forEach(slideshow => {
    const slides = Array.from(slideshow.querySelectorAll(".slide"));
    const sectionChildren = Array.from(slideshow.parentElement.children);
    const dotsWrap = sectionChildren.find(child => child.matches("[data-dots]"));
    const prev = slideshow.querySelector(".slideshow__btn.prev");
    const next = slideshow.querySelector(".slideshow__btn.next");
    const meta = sectionChildren.find(child => child.matches(".slideshow__meta"));
    const counter = meta?.querySelector("[data-slide-counter]");

    if (!slides.length || !prev || !next) {
      return;
    }

    const showDots = dotsWrap && !dotsWrap.hidden;
    let current = Math.max(0, slides.findIndex(slide => slide.classList.contains("is-active")));
    let timer;

    function getSlideAria(index) {
      return currentLanguage === "da" ? `Gå til billede ${index}` : `Go to image ${index}`;
    }

    function updateLightboxImage() {
      if (!lightbox || lightbox.hidden || activeController !== controller || !lightboxImage) {
        return;
      }
      const image = controller.getCurrentImage();
      if (image) {
        lightboxImage.src = image.dataset.fullSrc || image.currentSrc || image.src;
        lightboxImage.alt = image.alt;
      }
    }

    function updateCounter() {
      if (counter) {
        counter.textContent = `${current + 1} / ${slides.length}`;
      }
    }

    function goTo(index) {
      slides[current].classList.remove("is-active");
      if (showDots) {
        dotsWrap.children[current].classList.remove("is-active");
      }
      current = (index + slides.length) % slides.length;
      slides[current].classList.add("is-active");
      if (showDots) {
        dotsWrap.children[current].classList.add("is-active");
      }
      updateCounter();
      updateLightboxImage();
    }

    function nextSlide() {
      goTo(current + 1);
    }

    function previousSlide() {
      goTo(current - 1);
    }

    function restartAuto() {
      if (slideshow.dataset.autoplay === "false") {
        return;
      }
      window.clearInterval(timer);
      timer = window.setInterval(nextSlide, 5000);
    }

    const controller = {
      next: nextSlide,
      previous: previousSlide,
      getCurrentImage: () => slides[current].querySelector("img"),
      refreshDotLabels: () => {
        if (!showDots) {
          return;
        }
        Array.from(dotsWrap.children).forEach((dot, index) => {
          dot.setAttribute("aria-label", getSlideAria(index + 1));
        });
      },
    };

    if (showDots) {
      slides.forEach((slide, index) => {
        const dot = document.createElement("button");
        dot.className = "dot";
        dot.type = "button";
        dot.setAttribute("aria-label", getSlideAria(index + 1));
        dot.addEventListener("click", () => {
          goTo(index);
          restartAuto();
        });
        dotsWrap.appendChild(dot);
      });
    }

    slides.forEach(slide => {
      const image = slide.querySelector("img");
      if (!image || !lightbox) {
        return;
      }
      image.style.cursor = "zoom-in";
      image.addEventListener("click", () => openLightbox(controller));
    });

    prev.addEventListener("click", () => {
      previousSlide();
      restartAuto();
    });

    next.addEventListener("click", () => {
      nextSlide();
      restartAuto();
    });

    slides[current].classList.add("is-active");
    if (showDots) {
      dotsWrap.children[current].classList.add("is-active");
    }
    updateCounter();
    controller.refreshDotLabels();
    restartAuto();
    controllers.push(controller);
  });

  if (lightboxPrev && lightboxNext && lightboxClose && lightbox) {
    lightboxPrev.addEventListener("click", () => activeController?.previous());
    lightboxNext.addEventListener("click", () => activeController?.next());
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
        activeController?.next();
      } else if (event.key === "ArrowLeft") {
        activeController?.previous();
      }
    });
  }

  return {
    refreshDotLabels: () => controllers.forEach(controller => controller.refreshDotLabels()),
  };
}

function setupLanguageToggle(slideshowApi) {
  const toggle = document.querySelector("[data-language-toggle]");
  if (!toggle) {
    return;
  }

  const translatable = Array.from(
    document.querySelectorAll("[data-da][data-en], [data-da-html][data-en-html]")
  );

  function applyLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;

    translatable.forEach(node => {
      const htmlValue = node.getAttribute(`data-${lang}-html`);
      if (htmlValue !== null) {
        node.innerHTML = htmlValue;
        return;
      }

      const textValue = node.getAttribute(`data-${lang}`);
      if (textValue !== null) {
        node.textContent = textValue;
      }
    });

    document.querySelectorAll("[data-da-aria-label][data-en-aria-label]").forEach(node => {
      const value = node.getAttribute(`data-${lang}-aria-label`);
      if (value) {
        node.setAttribute("aria-label", value);
      }
    });

    document.querySelectorAll("[data-da-alt][data-en-alt]").forEach(node => {
      const value = node.getAttribute(`data-${lang}-alt`);
      if (value) {
        node.setAttribute("alt", value);
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
const slideshowApi = setupSlideshows();
setupWeddingSlideshow();
setupLanguageToggle(slideshowApi);
setupSectionSelect();
setupReveal();
