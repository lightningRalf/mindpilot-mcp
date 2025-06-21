import packageJson from '../../../../package.json';

export const APP_NAME = packageJson.name;
export const APP_VERSION = packageJson.version;
export const APP_DESCRIPTION = packageJson.description;

// Branding configuration
export const BRANDING = {
  name: APP_NAME,
  version: APP_VERSION,
  displayName: `${APP_NAME} v${APP_VERSION}`,
} as const;
