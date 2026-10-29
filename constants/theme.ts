import tokens from '@/theme/tokens.json';

/**
 * Tokens de color para APIs imperativas (navegación, splash y props que no
 * aceptan className). La fuente de verdad es `theme/tokens.json`, que también
 * consume `tailwind.config.js`.
 */
export const colors = tokens.colors;

export type ColorToken = keyof typeof colors;
