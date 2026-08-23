/**
 * Shared tooling configuration constants.
 * Note: Runtime environment configurations and secrets belong in individual applications.
 */
export const TOOLING_CONFIG = {
  prettier: {
    tabWidth: 2,
    semi: true,
    singleQuote: true,
  },
} as const;
