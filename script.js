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

function buildWeddingSlideshow() {
  const track = document.querySelector("[data-wedding-track]");
  const photos = window.weddingPhotos;

  if (!track || !Array.isArray(photos) || !photos.length) {
    return;
  }

  const fragment = document.createDocumentFragment();

  photos.slice(1).forEach((photo, index) => {
    const photoIndex = index + 1;
    const slide = document.createElement("figure");
    slide.className = "slide";

    const image = document.createElement("img");
    const fileName = photo.alt || "";
    image.src = photo.thumb || photo.src;
    image.dataset.fullSrc = photo.src;
    image.alt = `Bryllupsbillede ${photoIndex + 1}${fileName ? `: ${fileName}` : ""}`;
    image.setAttribute("data-da-alt", `Bryllupsbillede ${photoIndex + 1}${fileName ? `: ${fileName}` : ""}`);
    image.setAttribute("data-en-alt", `Wedding photo ${photoIndex + 1}${fileName ? `: ${fileName}` : ""}`);
    image.loading = photoIndex < 2 ? "eager" : "lazy";
    image.addEventListener("error", () => {
      if (image.src !== image.dataset.fullSrc) {
        image.src = image.dataset.fullSrc;
      }
    });

    slide.appendChild(image);
    fragment.appendChild(slide);
  });

  track.appendChild(fragment);
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

  document.querySelectorAll("[data-slideshow]").forEach(slideshow => {
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
buildWeddingSlideshow();
const slideshowApi = setupSlideshows();
setupLanguageToggle(slideshowApi);
setupSectionSelect();
setupReveal();
