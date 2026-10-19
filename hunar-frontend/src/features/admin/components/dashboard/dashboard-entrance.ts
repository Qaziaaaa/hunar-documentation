"use client";

/**
 * Dashboard entrance helpers.
 * Card / title / stack / hbar / toplist motion is driven by CSS
 * (.wf-view [data-card], .wf-page__title .ch, .wf-anim-*) with sample timings.
 * This module only adds what CSS cannot: activity-row stagger when the feed
 * lands, and optional re-trigger after retry.
 */

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canAnimate = (el: Element | null): el is Element =>
  !!el && typeof (el as HTMLElement).animate === "function";

function animateOne(
  el: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
) {
  if (!canAnimate(el) || prefersReducedMotion()) return;
  el.animate(keyframes, { fill: "both", ...options });
}

/** Sample Y(): opacity/x/y fromTo — activity rows (x:16, stagger .04, ~.8s) */
export function animateActivityRows(root: ParentNode | null, delayMs = 800) {
  if (!root) return;
  const rows = Array.from(
    root.querySelectorAll<HTMLElement>(".wf-rows--activity tbody tr"),
  );
  rows.forEach((el, i) => {
    animateOne(
      el,
      [
        { opacity: 0, transform: "translateX(16px)" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      {
        duration: 550,
        delay: delayMs + i * 40,
        easing: "cubic-bezier(0.215, 0.61, 0.355, 1)",
      },
    );
  });
}

/**
 * Mark the view ready so CSS entrance animations can start (if we gate them),
 * then fire the activity-row choreography once the feed is present.
 */
export function playDashboardEntrance(
  root: HTMLElement | null,
  options: { activityReady?: boolean } = {},
) {
  if (!root) return;
  if (prefersReducedMotion()) return;

  root.dataset.entrance = "on";

  if (options.activityReady !== false) {
    // Wait a frame so rows are in the DOM after feed render
    requestAnimationFrame(() => animateActivityRows(root, 800));
  }
}

/** Reset entrance flag so CSS can re-run after a retry reload. */
export function resetDashboardEntrance(root: HTMLElement | null) {
  if (!root) return;
  delete root.dataset.entrance;
  root.querySelectorAll<HTMLElement>(".wf-rows--activity tbody tr").forEach((tr) => {
    tr.getAnimations?.().forEach((a) => a.cancel());
  });
}
