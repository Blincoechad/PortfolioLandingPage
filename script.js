// ─── Cursor
const dot = document.getElementById("cursorDot");
const ring = document.getElementById("cursorRing");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;
document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
});
function animCursor() {
  dot.style.left = mx + "px";
  dot.style.top = my + "px";
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + "px";
  ring.style.top = ry + "px";
  requestAnimationFrame(animCursor);
}
animCursor();

// ─── Mobile navigation
const nav = document.querySelector("nav");
const navToggle = document.getElementById("navToggle");
const mobileNavLinks = document.querySelectorAll(".mobile-nav-menu a");

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

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    closeMobileNav();
  }
});

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

function updateBackToTop() {
  if (!backToTop) return;
  if (window.scrollY > 320) {
    backToTop.classList.add("visible");
  } else {
    backToTop.classList.remove("visible");
  }
}

window.addEventListener("scroll", updateBackToTop);
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
  videoModalPlayer.muted = false;
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
    const clickedLink = event.target.closest("a");
    if (clickedLink) {
      return;
    }
    openVideoModal(videoSrc);
  });
});

externalCards.forEach((card) => {
  const externalUrl = card.dataset.externalUrl;

  card.addEventListener("click", (event) => {
    const clickedLink = event.target.closest("a");
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
    const clickedLink = event.target.closest("a");
    if (clickedLink) {
      return;
    }

    const images = [...card.querySelectorAll(".project-img img")]
      .map((img) => ({
        src: img.currentSrc || img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || "Project preview",
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

imageModal
  ?.querySelector(".image-modal__dialog")
  ?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && imageModal?.classList.contains("is-open")) {
    closeImageModal();
  }
  if (event.key === "ArrowLeft" && imageModal?.classList.contains("is-open")) {
    stepImageModal(-1);
  }
  if (event.key === "ArrowRight" && imageModal?.classList.contains("is-open")) {
    stepImageModal(1);
  }
});
