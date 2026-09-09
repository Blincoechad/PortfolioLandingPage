// ─── Cursor
const isTouchDevice = window.matchMedia(
  "(hover: none) and (pointer: coarse)",
).matches;
const cursor = document.getElementById("cursor");
const dot = document.getElementById("cursorDot");

if (isTouchDevice) {
  // Touch devices have no mouse pointer — drop the custom cursor entirely.
  cursor?.remove();
} else {
  let mx = 0,
    my = 0;
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
  });
  function animCursor() {
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
    requestAnimationFrame(animCursor);
  }
  animCursor();
}

// ─── Mobile navigation
const nav = document.querySelector("nav");
const navToggle = document.getElementById("navToggle");
const mobileNavLinks = document.querySelectorAll(".mobile-nav-menu a");
const themeToggle = document.getElementById("themeToggle");
const themeToggleDesktopSlot = document.getElementById(
  "themeToggleDesktopSlot",
);
const themeToggleMobileSlot = document.getElementById("themeToggleMobileSlot");
const THEME_STORAGE_KEY = "pixel-designs-theme";
const DARK_THEME = "dark";
const LIGHT_THEME = "light";

function syncThemeToggleLabel(theme) {
  if (!themeToggle) return;
  const nextTheme = theme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
  const label =
    nextTheme === LIGHT_THEME
      ? "Switch to light theme"
      : "Switch to dark theme";
  themeToggle.setAttribute("aria-label", label);
  themeToggle.setAttribute("title", label);
}

function applyTheme(theme, persist = true) {
  const resolvedTheme = theme === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  syncThemeToggleLabel(resolvedTheme);

  if (!persist) return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
  } catch (error) {
    // Ignore persistence errors in private mode.
  }
}

function moveThemeToggleForViewport() {
  if (!themeToggle) return;
  const isMobileViewport = window.innerWidth <= 900;
  const targetSlot = isMobileViewport
    ? themeToggleMobileSlot
    : themeToggleDesktopSlot;

  if (!targetSlot || themeToggle.parentElement === targetSlot) return;
  targetSlot.appendChild(themeToggle);
}

function initializeTheme() {
  let storedTheme = null;
  try {
    storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    storedTheme = null;
  }

  const validStoredTheme =
    storedTheme === LIGHT_THEME || storedTheme === DARK_THEME
      ? storedTheme
      : DARK_THEME;

  applyTheme(validStoredTheme, false);
  moveThemeToggleForViewport();
}

function closeMobileNav() {
  if (!nav || !navToggle) return;
  nav.classList.remove("mobile-nav-open");
  navToggle.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation menu");
}

function toggleMobileNav() {
  if (!nav || !navToggle) return;
  const isOpen = nav.classList.toggle("mobile-nav-open");
  navToggle.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu",
  );
}

navToggle?.addEventListener("click", toggleMobileNav);
mobileNavLinks.forEach((link) => {
  link.addEventListener("click", closeMobileNav);
});

themeToggle?.addEventListener("click", () => {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") === LIGHT_THEME
      ? LIGHT_THEME
      : DARK_THEME;
  applyTheme(currentTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME);
});

window.addEventListener("resize", () => {
  moveThemeToggleForViewport();
  if (window.innerWidth > 900) {
    closeMobileNav();
  }
});

initializeTheme();

// ─── Reveal on scroll
const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        const siblings = [
          ...e.target.parentElement.querySelectorAll(".reveal"),
        ];
        const idx = siblings.indexOf(e.target);
        setTimeout(() => e.target.classList.add("visible"), idx * 80);
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 },
);
reveals.forEach((r) => observer.observe(r));

// ─── Back to top button
const backToTop = document.getElementById("backToTop");
const backToTopText = document.querySelector(".back-to-top-text");
const pageFooter = document.querySelector("footer");

function updateBackToTop() {
  if (!backToTop) return;

  backToTop.classList.toggle("visible", window.scrollY > 320);

  // Dock the button (and its label) just above the footer so it never
  // overlaps footer content once you reach the bottom of the page.
  if (pageFooter) {
    const gap = 12;
    const anchor = backToTopText || backToTop;
    const currentLift =
      parseFloat(
        document.documentElement.style.getPropertyValue("--btt-lift"),
      ) || 0;
    const restingBottom = anchor.getBoundingClientRect().bottom + currentLift;
    const lift = Math.max(
      0,
      restingBottom - (pageFooter.getBoundingClientRect().top - gap),
    );
    if (Math.abs(lift - currentLift) > 0.5) {
      document.documentElement.style.setProperty("--btt-lift", `${lift}px`);
    }
  }
}

window.addEventListener("scroll", updateBackToTop, { passive: true });
window.addEventListener("resize", updateBackToTop);
window.addEventListener("load", updateBackToTop);
updateBackToTop();

backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ─── Process modal
const processModal = document.getElementById("processModal");
const processModalTitle = document.getElementById("processModalTitle");
const processModalText = document.getElementById("processModalText");
const processSteps = document.querySelectorAll(".process-step");
const videoModal = document.getElementById("videoModal");
const videoModalPlayer = document.getElementById("videoModalPlayer");
const videoCards = document.querySelectorAll("[data-video-modal]");
const externalCards = document.querySelectorAll("[data-external-url]");
const projectPreviewVideos = document.querySelectorAll(
  ".project-video-wrap video",
);
const imageModal = document.getElementById("imageModal");
const imageModalPreview = document.getElementById("imageModalPreview");
const imageModalThumbs = document.getElementById("imageModalThumbs");
const imageModalPrev = imageModal?.querySelector(".image-modal__nav--prev");
const imageModalNext = imageModal?.querySelector(".image-modal__nav--next");
const imageCards = document.querySelectorAll(
  ".project-card:not([data-video-modal]):not([data-external-url])",
);
const contactForm = document.querySelector(".contact-form");
const submitModal = document.getElementById("submitModal");
const submitModalCloseControls = document.querySelectorAll(
  "[data-close-submit-modal]",
);

let imageModalItems = [];
let imageModalIndex = 0;

function closeProcessModal() {
  if (!processModal) return;
  processModal.classList.remove("is-open");
  processModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function openProcessModal(step) {
  if (!processModal || !processModalTitle || !processModalText) return;

  const title =
    step.dataset.title ||
    step.querySelector(".step-title")?.textContent?.trim() ||
    "Process";
  const text =
    step.dataset.text ||
    step.querySelector(".step-desc")?.textContent?.trim() ||
    "";

  processModalTitle.textContent = title;
  processModalText.textContent = text;
  processModal.classList.add("is-open");
  processModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

processSteps.forEach((step) => {
  step.addEventListener("click", () => openProcessModal(step));
});

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeProcessModal);
});

document
  .querySelector(".process-modal__dialog")
  ?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && processModal?.classList.contains("is-open")) {
    closeProcessModal();
  }
});

// ─── Case Study Modal
const caseStudyModal = document.getElementById("caseStudyModal");
const caseStudyModalTitle = document.getElementById("caseStudyModalTitle");
const caseStudyModalContent = document.getElementById("caseStudyModalContent");
const caseStudyModalBody = caseStudyModal?.querySelector(
  ".case-study-modal__body",
);
const caseStudyModalClose = caseStudyModal?.querySelector(
  ".case-study-modal__close",
);
let caseStudyLastTrigger = null;
let caseStudyLastTouchY = null;

function containsCaseStudyContent(target) {
  return !!target?.closest?.(".case-study-modal__body");
}

function shouldBlockScrollChaining(deltaY) {
  if (!caseStudyModalBody) return true;

  const { scrollTop, scrollHeight, clientHeight } = caseStudyModalBody;
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

  return (deltaY < 0 && atTop) || (deltaY > 0 && atBottom);
}

function stopCaseStudyWheelChaining(event) {
  if (!caseStudyModal?.classList.contains("is-open")) return;
  if (!containsCaseStudyContent(event.target)) {
    event.preventDefault();
    return;
  }

  if (shouldBlockScrollChaining(event.deltaY)) {
    event.preventDefault();
  }
}

function handleCaseStudyTouchStart(event) {
  caseStudyLastTouchY = event.touches?.[0]?.clientY ?? null;
}

function stopCaseStudyTouchChaining(event) {
  if (!caseStudyModal?.classList.contains("is-open")) return;
  if (!containsCaseStudyContent(event.target)) {
    event.preventDefault();
    return;
  }

  const currentY = event.touches?.[0]?.clientY;
  if (typeof currentY !== "number") return;

  if (caseStudyLastTouchY === null) {
    caseStudyLastTouchY = currentY;
    return;
  }

  const deltaY = caseStudyLastTouchY - currentY;
  caseStudyLastTouchY = currentY;

  if (shouldBlockScrollChaining(deltaY)) {
    event.preventDefault();
  }
}

caseStudyModal?.addEventListener("wheel", stopCaseStudyWheelChaining, {
  passive: false,
});
caseStudyModal?.addEventListener("touchstart", handleCaseStudyTouchStart, {
  passive: true,
});
caseStudyModal?.addEventListener("touchmove", stopCaseStudyTouchChaining, {
  passive: false,
});

function openCaseStudyModal(card) {
  if (
    !caseStudyModal ||
    !caseStudyModalTitle ||
    !caseStudyModalContent ||
    !card
  )
    return;

  const content = card.querySelector(".case-study-content");
  if (!content) return;

  caseStudyModalTitle.textContent =
    card.querySelector(".project-title")?.textContent?.trim() || "Case Study";
  caseStudyModalContent.innerHTML = content.innerHTML;
  if (caseStudyModalBody) caseStudyModalBody.scrollTop = 0;
  caseStudyModal.classList.add("is-open");
  caseStudyModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  caseStudyModalClose?.focus();
}

function closeCaseStudyModal() {
  if (!caseStudyModal) return;
  caseStudyModal.classList.remove("is-open");
  caseStudyModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  caseStudyLastTrigger?.focus();
  caseStudyLastTrigger = null;
}

document.querySelectorAll("[data-case-study-trigger]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    caseStudyLastTrigger = trigger;
    openCaseStudyModal(trigger.closest(".project-card"));
  });
});

document.querySelectorAll("[data-close-case-study]").forEach((element) => {
  element.addEventListener("click", closeCaseStudyModal);
});

caseStudyModal
  ?.querySelector(".case-study-modal__dialog")
  ?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && caseStudyModal?.classList.contains("is-open")) {
    closeCaseStudyModal();
  }
});

function closeVideoModal() {
  if (!videoModal || !videoModalPlayer) return;
  videoModal.classList.remove("is-open");
  videoModal.setAttribute("aria-hidden", "true");
  videoModalPlayer.pause();
  videoModalPlayer.currentTime = 0;
  videoModalPlayer.removeAttribute("src");
  videoModalPlayer.load();
  document.body.classList.remove("modal-open");
}

function startPreviewVideo(video) {
  if (!video) return;
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  video.load();
  video.play().catch(() => {
    // Some browsers still defer background media; keep the element loaded.
  });
}

async function openVideoModal(videoSrc) {
  if (!videoModal || !videoModalPlayer || !videoSrc) return;
  videoModalPlayer.src = videoSrc;
  videoModalPlayer.load();
  videoModalPlayer.muted = true;
  videoModal.classList.add("is-open");
  videoModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  try {
    await videoModalPlayer.play();
  } catch (error) {
    // Ignore blocked autoplay errors; controls remain available for manual play.
  }
}

projectPreviewVideos.forEach((video) => {
  if (video.readyState === 0) {
    startPreviewVideo(video);
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  projectPreviewVideos.forEach((video) => {
    if (video.paused) {
      startPreviewVideo(video);
    }
  });
});

// Keep card-level click handlers from hijacking real link/button actions.
document.querySelectorAll(".project-links a").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

videoCards.forEach((card) => {
  const videoSrc = card.dataset.videoSrc;

  card.addEventListener("click", (event) => {
    const clickedLink = event.target.closest("a, button");
    if (clickedLink) {
      return;
    }
    openVideoModal(videoSrc);
  });
});

document.querySelectorAll("[data-video-trigger]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    openVideoModal(trigger.dataset.videoSrc);
  });
});

externalCards.forEach((card) => {
  const externalUrl = card.dataset.externalUrl;

  card.addEventListener("click", (event) => {
    const clickedLink = event.target.closest("a, button");
    if (clickedLink || !externalUrl) {
      return;
    }

    window.open(externalUrl, "_blank", "noopener,noreferrer");
  });
});

document.querySelectorAll("[data-close-video-modal]").forEach((element) => {
  element.addEventListener("click", closeVideoModal);
});

videoModal
  ?.querySelector(".video-modal__dialog")
  ?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && videoModal?.classList.contains("is-open")) {
    closeVideoModal();
  }
});

function setImageModalNavVisibility() {
  const shouldShowNav = imageModalItems.length > 1;
  imageModalPrev?.classList.toggle("is-hidden", !shouldShowNav);
  imageModalNext?.classList.toggle("is-hidden", !shouldShowNav);
}

function renderImageModalPreview() {
  if (!imageModalPreview || imageModalItems.length === 0) return;

  const currentItem = imageModalItems[imageModalIndex];
  imageModalPreview.src = currentItem.src;
  imageModalPreview.alt = currentItem.alt || "Project preview";

  imageModalThumbs
    ?.querySelectorAll(".image-modal__thumb")
    .forEach((thumb, idx) => {
      thumb.classList.toggle("is-active", idx === imageModalIndex);
    });
}

function closeImageModal() {
  if (!imageModal || !imageModalPreview || !imageModalThumbs) return;
  imageModal.classList.remove("is-open");
  imageModal.setAttribute("aria-hidden", "true");
  imageModalPreview.removeAttribute("src");
  imageModalThumbs.innerHTML = "";
  imageModalItems = [];
  imageModalIndex = 0;
  document.body.classList.remove("modal-open");
}

function openSubmitModal() {
  if (!submitModal) return;
  submitModal.classList.add("is-open");
  submitModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeSubmitModal() {
  if (!submitModal) return;
  submitModal.classList.remove("is-open");
  submitModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

async function handleContactSubmit(event) {
  if (!contactForm) return;
  event.preventDefault();

  const submitButton = contactForm.querySelector(".form-submit");
  const originalButtonText = submitButton?.textContent || "Send Inquiry →";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
  }

  try {
    const response = await fetch(contactForm.action, {
      method: "POST",
      body: new FormData(contactForm),
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Form submit failed");
    }

    contactForm.reset();
    openSubmitModal();
  } catch (error) {
    window.alert(
      "There was a problem sending your inquiry. Please try again in a moment.",
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

function stepImageModal(direction) {
  if (imageModalItems.length < 2) return;
  imageModalIndex =
    (imageModalIndex + direction + imageModalItems.length) %
    imageModalItems.length;
  renderImageModalPreview();
}

function openImageModal(images, startIndex = 0) {
  if (
    !imageModal ||
    !imageModalPreview ||
    !imageModalThumbs ||
    images.length === 0
  ) {
    return;
  }

  imageModalItems = images;
  imageModalIndex = startIndex;
  imageModalThumbs.innerHTML = "";

  imageModalItems.forEach((item, idx) => {
    const thumbButton = document.createElement("button");
    thumbButton.type = "button";
    thumbButton.className = "image-modal__thumb";
    thumbButton.setAttribute("aria-label", `Preview image ${idx + 1}`);
    thumbButton.innerHTML = `<img src="${item.src}" alt="${item.alt || "Project thumbnail"}" />`;
    thumbButton.addEventListener("click", () => {
      imageModalIndex = idx;
      renderImageModalPreview();
    });
    imageModalThumbs.appendChild(thumbButton);
  });

  setImageModalNavVisibility();
  renderImageModalPreview();
  imageModal.classList.add("is-open");
  imageModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

imageCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    const clickedLink = event.target.closest("a, button");
    if (clickedLink) {
      return;
    }

    const images = [
      ...card.querySelectorAll(".project-img img, .project-img video"),
    ]
      .map((media) => ({
        src:
          media.getAttribute("data-modal-src") ||
          media.currentSrc ||
          media.getAttribute("src") ||
          media.getAttribute("poster") ||
          "",
        alt:
          media.getAttribute("alt") ||
          media.getAttribute("aria-label") ||
          "Project preview",
      }))
      .filter((item) => item.src);

    const uniqueImages = images.filter(
      (item, idx, arr) =>
        arr.findIndex((entry) => entry.src === item.src) === idx,
    );

    if (uniqueImages.length === 0) return;
    openImageModal(uniqueImages);
  });
});

imageModalPrev?.addEventListener("click", () => stepImageModal(-1));
imageModalNext?.addEventListener("click", () => stepImageModal(1));

document.querySelectorAll("[data-close-image-modal]").forEach((element) => {
  element.addEventListener("click", closeImageModal);
});

submitModalCloseControls.forEach((element) => {
  element.addEventListener("click", closeSubmitModal);
});

contactForm?.addEventListener("submit", handleContactSubmit);

imageModal
  ?.querySelector(".image-modal__dialog")
  ?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && imageModal?.classList.contains("is-open")) {
    closeImageModal();
  }
  if (event.key === "Escape" && submitModal?.classList.contains("is-open")) {
    closeSubmitModal();
  }
  if (event.key === "ArrowLeft" && imageModal?.classList.contains("is-open")) {
    stepImageModal(-1);
  }
  if (event.key === "ArrowRight" && imageModal?.classList.contains("is-open")) {
    stepImageModal(1);
  }
});
