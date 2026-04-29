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
