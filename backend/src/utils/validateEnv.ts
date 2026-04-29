export const validateEnv = (): void => {
  const required = ['NODE_ENV', 'PORT', 'MONGO_URI'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
