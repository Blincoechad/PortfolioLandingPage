const certCarousel = document.querySelector("[data-cert-carousel]");

const CERTIFICATE_DESCRIPTIONS = {
  "CanvaIntro.png":
    "Introductory Canva certificate focused on core design tools, layout basics, and creating clean visual content.",
  "CanvaProjects.jpg":
    "Canva projects certificate centered on building complete branded assets using templates, typography, and design workflows.",
  "ExcelGraphs.png":
    "Excel graphs certificate covering chart creation, data visualization choices, and presenting data clearly for reports.",
  "FigmaComponents.png":
    "Figma components certificate focused on reusable UI components, variants, and consistent design system structure.",
  "FigmaIntoCode.png":
    "Figma into code certificate emphasizing translating design files into structured, implementation-ready web interfaces.",
  "JsAiPrograming.png":
    "JavaScript AI programming certificate covering practical ways JavaScript can be used with AI-assisted workflows and tooling.",
  "JsDebugging.png":
    "JavaScript debugging certificate focused on identifying runtime issues, tracing logic errors, and resolving common bugs.",
  "JsWebForms.png":
    "JavaScript web forms certificate covering client-side validation, form handling patterns, and interactive form behavior.",
  "PythonMadeApp.png":
    "Python app development certificate focused on building a functional application with core Python programming concepts.",
  "ProjectManagementFoundationsEthics_PMI.png":
    "Project Management Foundations and Ethics certificate covering planning fundamentals, delivery practices, and professional ethics.",
  "ProjectManagementExam.png":
    "Project management exam certificate validating knowledge of standard project lifecycle concepts and decision-making frameworks.",
  "SEO(SquareSpace).png":
    "Squarespace SEO certificate focused on search optimization basics such as page structure, metadata, and content discoverability.",
  "VideoCreationCanva.png":
    "Canva video creation certificate covering editing tools, pacing, and producing short-form visual content.",
  "WebFlowNoCode.png":
    "Webflow no-code certificate focused on building responsive websites visually with CMS and layout controls.",
  "Webflow101.png":
    "Webflow 101 certificate covering platform fundamentals, structure setup, and core website-building workflow.",
  "WebflowLayouts.png":
    "Webflow layouts certificate focused on responsive section design, spacing systems, and multi-breakpoint layout control.",
};

// Match an image file name to its description text for the lightbox caption.
function getCertificateDescription(imageSrc) {
  if (!imageSrc) return "";

  try {
    const imageName = new URL(imageSrc, window.location.href).pathname
      .split("/")
      .pop();
    return CERTIFICATE_DESCRIPTIONS[imageName] || "";
  } catch (error) {
    const parts = imageSrc.split("/");
    const imageName = parts[parts.length - 1] || "";
    return CERTIFICATE_DESCRIPTIONS[imageName] || "";
  }
}

if (certCarousel) {
  const track = certCarousel.querySelector("#certTrack");
  const slides = track
    ? Array.from(track.querySelectorAll(".carousel-item"))
    : [];
  const prevButton = certCarousel.querySelector(".cert-nav-prev");
  const nextButton = certCarousel.querySelector(".cert-nav-next");
  const dotsContainer = certCarousel.querySelector("#certDots");
  const scene = certCarousel.querySelector("#certScene");
  const lightbox = document.getElementById("certLightbox");
  const lightboxImage = document.getElementById("certLightboxImage");
  const lightboxDescription = document.getElementById(
    "certLightboxDescription",
  );

  let currentIndex = 0;
  let autoAdvanceTimer = null;
  let autoAdvanceKickoffTimer = null;
  let theta = 0;
  let radius = 0;
  let currentRotation = 0;

  const AUTO_ADVANCE_INTERVAL_MS = 5200;
  const AUTO_ADVANCE_FIRST_DELAY_MS = 900;

  // Wrap indexes so moving past either end loops back around the carousel.
  function normalizeIndex(index) {
    if (slides.length === 0) return 0;
    return (index + slides.length) % slides.length;
  }

  // Update visual emphasis for the active slide and active pagination dot.
  function updateActiveState() {
    slides.forEach((slide, index) => {
      const isActive = index === currentIndex;
      slide.classList.toggle("is-active", isActive);
      slide.style.opacity = isActive ? "1" : "0.78";
      slide.style.filter = isActive
        ? "brightness(1) saturate(1)"
        : "brightness(0.78) saturate(0.8)";
      slide.style.pointerEvents = isActive ? "auto" : "none";
      slide.style.zIndex = isActive ? "5" : "1";
    });

    dotsContainer?.querySelectorAll(".cert-dot").forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
    });
  }

  // Rotate the 3D ring to the requested slide index.
  function rotateTo(index) {
    if (!track || slides.length === 0) return;

    currentIndex = normalizeIndex(index);
    currentRotation = -theta * currentIndex;
    track.style.transform = `rotateY(${currentRotation}deg)`;
    updateActiveState();
  }

  // Recalculate spacing math so the 3D layout stays correct on resize.
  function updateGeometry() {
    if (!scene || !track || slides.length === 0) return;

    const itemWidth = track.clientWidth;
    if (!itemWidth) return;
    theta = 360 / slides.length;

    // Classic radius formula for equal angular spacing around the ring.
    const baseRadius = Math.round(
      itemWidth / 2 / Math.tan(Math.PI / slides.length),
    );
    radius = Math.max(120, baseRadius + 45);

    slides.forEach((slide, index) => {
      const angle = theta * index;
      slide.style.transform = `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px)`;
    });

    rotateTo(currentIndex);
  }

  // Move forward one certificate.
  function nextSlide() {
    rotateTo(currentIndex + 1);
  }

  // Build pagination dots and wire each one to jump to its slide.
  function buildDots() {
    if (!dotsContainer || slides.length === 0) return;

    dotsContainer.innerHTML = "";

    slides.forEach((slide, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "cert-dot";
      dot.setAttribute("aria-label", `Go to certification ${index + 1}`);
      dot.addEventListener("click", () => {
        rotateTo(index);
        restartAutoAdvance();
      });
      dotsContainer.appendChild(dot);
    });
  }

  // Move backward one certificate.
  function previousSlide() {
    rotateTo(currentIndex - 1);
  }

  // Run the repeating timer that advances the carousel automatically.
  function runAutoAdvanceInterval() {
    if (autoAdvanceTimer) return;
    autoAdvanceTimer = window.setInterval(() => {
      nextSlide();
    }, AUTO_ADVANCE_INTERVAL_MS);
  }

  // Start auto-advance, with an optional quick first move after page load.
  function startAutoAdvance(useFastStart = false) {
    if (slides.length < 2) return;
    if (autoAdvanceTimer || autoAdvanceKickoffTimer) return;

    if (!useFastStart) {
      runAutoAdvanceInterval();
      return;
    }

    autoAdvanceKickoffTimer = window.setTimeout(() => {
      autoAdvanceKickoffTimer = null;
      nextSlide();
      runAutoAdvanceInterval();
    }, AUTO_ADVANCE_FIRST_DELAY_MS);
  }

  // Stop all auto-advance timers (both kickoff and repeating interval).
  function stopAutoAdvance() {
    if (autoAdvanceKickoffTimer) {
      window.clearTimeout(autoAdvanceKickoffTimer);
      autoAdvanceKickoffTimer = null;
    }

    if (!autoAdvanceTimer) return;

    window.clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }

  // Restart auto-advance after any manual interaction.
  function restartAutoAdvance() {
    stopAutoAdvance();
    startAutoAdvance();
  }

  // Open cert image in lightbox with its matching description text.
  function openLightbox(imageSrc, imageAlt, descriptionText) {
    if (!lightbox || !lightboxImage || !imageSrc) return;

    lightboxImage.src = imageSrc;
    lightboxImage.alt = imageAlt || "Certification preview";
    if (lightboxDescription) {
      lightboxDescription.textContent = descriptionText || "";
    }
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    stopAutoAdvance();
  }

  // Close lightbox, clear old media state, and resume carousel rotation.
  function closeLightbox() {
    if (!lightbox || !lightboxImage) return;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.removeAttribute("src");
    if (lightboxDescription) {
      lightboxDescription.textContent = "";
    }
    document.body.classList.remove("modal-open");
    startAutoAdvance();
  }

  prevButton?.addEventListener("click", () => {
    previousSlide();
    restartAutoAdvance();
  });

  nextButton?.addEventListener("click", () => {
    nextSlide();
    restartAutoAdvance();
  });

  slides.forEach((slide) => {
    // Clicking the active slide opens a larger preview in the lightbox.
    slide.addEventListener("click", () => {
      const image = slide.querySelector("img");
      if (!image) return;

      const imageSrc = image.currentSrc || image.src;
      const description = getCertificateDescription(imageSrc);
      openLightbox(imageSrc, image.alt, description);
    });
  });

  document.querySelectorAll("[data-close-cert-lightbox]").forEach((element) => {
    element.addEventListener("click", closeLightbox);
  });

  lightbox
    ?.querySelector(".cert-lightbox__dialog")
    ?.addEventListener("click", (event) => {
      event.stopPropagation();
    });

  certCarousel.addEventListener("mouseenter", stopAutoAdvance);
  certCarousel.addEventListener("mouseleave", startAutoAdvance);

  // Mouse wheel rotates the 3D carousel and pauses/resets auto-advance.
  scene?.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (event.deltaY > 0) {
        nextSlide();
      } else {
        previousSlide();
      }
      restartAutoAdvance();
    },
    { passive: false },
  );

  window.addEventListener("resize", () => {
    updateGeometry();
  });

  window.addEventListener("load", () => {
    updateGeometry();
    rotateTo(currentIndex);
  });

  if (typeof ResizeObserver !== "undefined") {
    // Keep geometry synced even when container size changes without window resize.
    const geometryObserver = new ResizeObserver(() => {
      updateGeometry();
    });
    if (scene) geometryObserver.observe(scene);
    if (track) geometryObserver.observe(track);
  }

  slides.forEach((slide) => {
    const image = slide.querySelector("img");
    image?.addEventListener("load", () => {
      updateGeometry();
      rotateTo(currentIndex);
    });
  });

  document.addEventListener("keydown", (event) => {
    // Escape closes lightbox; arrow keys rotate carousel when lightbox is closed.
    if (event.key === "Escape" && lightbox?.classList.contains("is-open")) {
      closeLightbox();
      return;
    }

    if (lightbox?.classList.contains("is-open")) {
      return;
    }

    if (event.key === "ArrowLeft") {
      previousSlide();
      restartAutoAdvance();
    }
    if (event.key === "ArrowRight") {
      nextSlide();
      restartAutoAdvance();
    }
  });

  buildDots();
  updateGeometry();
  window.requestAnimationFrame(() => {
    updateGeometry();
    rotateTo(0);
  });
  startAutoAdvance(true);
}
