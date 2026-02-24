/**
 * Motion Design Tokens
 * Standardized animation curves, spring configurations, and durations
 */

/* ─────────────────────────────────────────────────────────────────────────── */
/* EASING CURVES - Animation timing functions                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

export const EASING = {
  // Standard easing (Material Design standard)
  // Used for general purpose transitions
  standard: [0.4, 0, 0.2, 1],

  // Emphasis easing (elastic, playful)
  // Used for entrance animations, emphasis moments
  emphasis: [0.23, 1, 0.32, 1],

  // Decelerate easing (entrance motion)
  // Used for elements entering the screen
  decelerate: [0, 0, 0.2, 1],

  // Accelerate easing (exit motion)
  // Used for elements leaving the screen
  accelerate: [0.4, 0, 1, 1],

  // Smooth easing (subtle)
  // Used for micro-interactions, fades
  smooth: [0.4, 0.0, 0.2, 1.0],

  // Sharp easing (immediate response)
  // Used for direct interaction feedback
  sharp: [0.5, 0, 0.5, 1],
} as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/* SPRING CONFIGURATIONS - Physical motion parameters                         */
/* ─────────────────────────────────────────────────────────────────────────── */

export const SPRING = {
  // Smooth, natural motion (default for most animations)
  smooth: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 1,
  },

  // Snappy, responsive motion (user interactions)
  snappy: {
    type: 'spring',
    stiffness: 700,
    damping: 25,
    mass: 1,
  },

  // Bouncy, playful motion (emphasis moments)
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 20,
    mass: 1,
  },

  // Tight, quick motion (micro-interactions)
  tight: {
    type: 'spring',
    stiffness: 900,
    damping: 40,
    mass: 0.8,
  },

  // Loose, relaxed motion (large elements)
  loose: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 1.2,
  },
} as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/* DURATIONS - Animation timing in seconds                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

export const DURATION = {
  // Instant (for micro-interactions that feel instantaneous)
  instant: 0.08,

  // Fast (quick feedback, hover states, focus rings)
  fast: 0.15,

  // Normal (standard transitions, modals, page changes)
  normal: 0.25,

  // Slow (complex multi-element animations, entrances)
  slow: 0.4,

  // Very slow (special emphasis, tutorial animations)
  verySlow: 0.6,
} as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/* ANIMATION PRESETS - Ready-to-use animation configurations                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export const ANIMATION = {
  // Button press/tap feedback
  buttonTap: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: SPRING.snappy,
  },

  // Card hover lift
  cardHover: {
    whileHover: { y: -4, shadowElevation: 4 },
    transition: { type: 'spring', stiffness: 600, damping: 30 },
  },

  // Fade in entrance
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: DURATION.normal },
  },

  // Fade in with slide up
  slideUpIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { ...SPRING.smooth, duration: undefined },
  },

  // Scale in (zoom entrance)
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { ...SPRING.snappy, duration: undefined },
  },

  // Modal entrance
  modalEnter: {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 10 },
    transition: { ...SPRING.smooth, duration: undefined },
  },

  // Sidebar collapse/expand
  sidebarExpand: {
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 30,
      mass: 0.5,
    },
  },

  // List item stagger
  listItemStagger: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0,
    },
  },

  // Loading pulse
  pulse: {
    initial: { opacity: 0.5 },
    animate: { opacity: 1 },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'reverse',
      easing: EASING.smooth,
    },
  },

  // Skeleton loading shimmer
  shimmer: {
    initial: { backgroundPosition: '200% center' },
    animate: { backgroundPosition: '-200% center' },
    transition: {
      duration: 2,
      repeat: Infinity,
      easing: EASING.linear,
    },
  },

  // Success checkmark animation
  successCheck: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: {
      type: 'spring',
      stiffness: 800,
      damping: 15,
    },
  },

  // Error shake
  errorShake: {
    initial: { x: 0 },
    animate: { x: [-8, 8, -8, 8, 0] },
    transition: {
      duration: 0.4,
      type: 'spring',
      stiffness: 600,
      damping: 10,
    },
  },

  // Tooltip entrance (quick and sharp)
  tooltipEnter: {
    initial: { opacity: 0, scale: 0.8, y: -4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: -4 },
    transition: { duration: DURATION.fast, easing: EASING.sharp },
  },
} as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/* UTILITIES - Helper functions for motion                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Get spring config with custom parameters
 */
export function getSpring(
  preset: keyof typeof SPRING,
  overrides?: Partial<(typeof SPRING)[keyof typeof SPRING]>
) {
  return { ...SPRING[preset], ...overrides };
}

/**
 * Get animation preset with custom duration
 */
export function getAnimation(
  preset: keyof typeof ANIMATION,
  durationPreset?: keyof typeof DURATION
) {
  const anim = ANIMATION[preset];
  if (durationPreset && 'transition' in anim) {
    return {
      ...anim,
      transition: {
        ...anim.transition,
        duration: DURATION[durationPreset],
      },
    };
  }
  return anim;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get safe animation config that respects prefers-reduced-motion
 */
export function getSafeAnimation(
  preset: keyof typeof ANIMATION,
  fallbackToInstant: boolean = true
) {
  if (prefersReducedMotion()) {
    return fallbackToInstant
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0 },
        }
      : ANIMATION[preset];
  }
  return ANIMATION[preset];
}

export default {
  EASING,
  SPRING,
  DURATION,
  ANIMATION,
};
