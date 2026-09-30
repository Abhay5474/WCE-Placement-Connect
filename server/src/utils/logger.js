/* Minimal leveled logger — avoids a heavy dependency while keeping output structured. */
const ts = () => new Date().toISOString();

export const logger = {
  info: (...a) => console.log(`[${ts()}] INFO `, ...a),
  warn: (...a) => console.warn(`[${ts()}] WARN `, ...a),
  error: (...a) => console.error(`[${ts()}] ERROR`, ...a),
  debug: (...a) => process.env.NODE_ENV !== 'production' && console.debug(`[${ts()}] DEBUG`, ...a),
};

export default logger;
