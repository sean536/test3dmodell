import gsap from 'gsap';

export const UI_TIMING = { navigation: .65, details: .9, unlock: 1.9 };
const root = document.documentElement;
let revealTimeline;
let revealed = false;
const locked = () => root.dataset.intro !== 'ready';
const stop = event => { if (locked()) { event.preventDefault(); event.stopImmediatePropagation(); } };
const keys = event => { if (locked() && ['Tab', ' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Enter'].includes(event.key)) stop(event); };
function phase(value) { root.dataset.intro = value; }
function unlock() {
  phase('ready');
  document.body.inert = false;
  root.classList.remove('intro-locked');
  document.removeEventListener('wheel', stop, true);
  document.removeEventListener('touchmove', stop, true);
  document.removeEventListener('keydown', keys, true);
  document.removeEventListener('click', stop, true);
  window.dispatchEvent(new Event('homepage-ready'));
}
function visibility() {
  if (document.hidden) revealTimeline?.pause(); else revealTimeline?.resume();
}
document.body.inert = true;
window.scrollTo(0, 0);
document.removeEventListener('wheel', stop, true);
document.addEventListener('wheel', stop, { capture: true, passive: false });
document.addEventListener('touchmove', stop, { capture: true, passive: false });
document.addEventListener('keydown', keys, true);
document.addEventListener('click', stop, true);
document.addEventListener('visibilitychange', visibility);

export const intro = {
  get unlocked() { return !locked(); },
  start() { if (!revealed) phase('cinematic'); },
  reveal({ instant = false } = {}) {
    if (revealed) { if (instant) { revealTimeline?.kill(); unlock(); } return; }
    revealed = true;
    if (instant) { unlock(); return; }
    phase('identity');
    revealTimeline = gsap.timeline({ paused: document.hidden });
    revealTimeline.call(() => phase('navigation'), [], UI_TIMING.navigation);
    revealTimeline.call(() => phase('details'), [], UI_TIMING.details);
    revealTimeline.call(unlock, [], UI_TIMING.unlock);
  },
  dispose() { revealTimeline?.kill(); document.removeEventListener('visibilitychange', visibility); },
};
