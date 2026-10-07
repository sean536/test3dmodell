// All narrative company facts, numbers and references are fictional demo content.
// They are not analytics, verified clients, incorporation dates, or real-world claims.
export const STORY_SHOTS = [
  { id: 'introduction', travel: 0, hold: 2.8, showAfter: .6 },
  { id: 'precision', travel: 2.4, hold: 2.3, showAfter: .1 },
  { id: 'experience', travel: 1.65, hold: 1.85, showAfter: .1 },
  { id: 'projects', travel: 1.4, hold: 3.05, showAfter: .1 },
  { id: 'material', travel: 1.75, hold: 2.2, showAfter: .1 },
  { id: 'homepage', travel: 2.7, hold: 0, showAfter: 0 },
];
export const STORY_DURATION = STORY_SHOTS.reduce((sum, shot) => sum + shot.travel + shot.hold, 0);
export const TEXT_FADE = .22;
export const TEXT_DEPARTURE = .35; // Fade completes before the next camera movement.

export function buildStoryTimeline(timeline, motion) {
  let cursor = 0;
  STORY_SHOTS.forEach((shot, index) => {
    if (shot.travel) timeline.to(motion, { progress: index / (STORY_SHOTS.length - 1), duration: shot.travel, ease: 'power2.inOut' }, cursor);
    cursor += shot.travel;
    if (shot.hold) {
      timeline.to(motion, { progress: index / (STORY_SHOTS.length - 1), duration: shot.hold, ease: 'none' }, cursor);
      timeline.call(() => { motion.story = index; }, [], cursor + shot.showAfter);
      timeline.call(() => { motion.story = -1; }, [], cursor + shot.hold - TEXT_DEPARTURE);
    }
    cursor += shot.hold;
  });
  return timeline;
}

export function updateStory(index) {
  const overlay = document.querySelector('#story');
  overlay.dataset.shot = index < 0 ? '' : STORY_SHOTS[index].id;
  overlay.querySelectorAll('.story-stop').forEach((stop, i) => { stop.setAttribute('aria-hidden', String(index !== i)); });
}
