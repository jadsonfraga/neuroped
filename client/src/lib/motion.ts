/**
 * Presets de animacao para framer-motion.
 *
 * Filosofia:
 *  - Curvas easeOut suaves (sem bounce excessivo).
 *  - Duracoes 200-400ms (rapido para nao prender, lento o suficiente para sentir).
 *  - Distancias de translate pequenas (8-16px) para evitar layout jumps.
 *  - Respeita prefers-reduced-motion: variantes simplificadas para acessibilidade.
 */

import type { Variants, Transition } from "framer-motion";

export const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =====================================================================
 * EASING & TIMING
 * ===================================================================== */

export const easing = {
  smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],   // out-quint suave
  swift: [0.16, 1, 0.3, 1] as [number, number, number, number],     // out-cubic rapido
  gentle: [0.4, 0, 0.2, 1] as [number, number, number, number],     // material standard
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number], // leve overshoot
};

export const duration = {
  fast: 0.18,
  normal: 0.28,
  slow: 0.45,
  splash: 0.7,
};

/* =====================================================================
 * VARIANTS COMUNS
 * ===================================================================== */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: reducedMotion ? 0 : duration.normal, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: reducedMotion ? 0 : duration.fast, ease: easing.swift },
  },
};

export const slideUpFadeIn: Variants = {
  hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reducedMotion ? 0 : duration.normal, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    y: reducedMotion ? 0 : -8,
    transition: { duration: reducedMotion ? 0 : duration.fast, ease: easing.swift },
  },
};

export const slideRightFadeIn: Variants = {
  hidden: { opacity: 0, x: reducedMotion ? 0 : -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: reducedMotion ? 0 : duration.normal, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    x: reducedMotion ? 0 : 16,
    transition: { duration: reducedMotion ? 0 : duration.fast, ease: easing.swift },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: reducedMotion ? 1 : 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: reducedMotion ? 0 : duration.normal, ease: easing.spring },
  },
  exit: {
    opacity: 0,
    scale: reducedMotion ? 1 : 0.96,
    transition: { duration: reducedMotion ? 0 : duration.fast, ease: easing.swift },
  },
};

/** Stagger para listas de items (cada filho entra com delay incremental). */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: reducedMotion ? 0 : 0.05,
      delayChildren: reducedMotion ? 0 : 0.05,
      duration: reducedMotion ? 0 : duration.fast,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: reducedMotion ? 0 : 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reducedMotion ? 0 : duration.normal, ease: easing.smooth },
  },
};

/** Card hover com leve elevacao. */
export const cardHover: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: reducedMotion ? 1 : 1.02,
    y: reducedMotion ? 0 : -2,
    transition: { duration: 0.18, ease: easing.smooth },
  },
};

/** Tap feedback para botoes (press down). */
export const buttonTap = {
  scale: reducedMotion ? 1 : 0.97,
  transition: { duration: 0.1, ease: easing.swift },
};

/* =====================================================================
 * SHARED ANIMATION TRANSITION
 * ===================================================================== */

export const pageTransition: Transition = {
  duration: reducedMotion ? 0 : duration.normal,
  ease: easing.smooth,
};
