const LOG_ENABLED = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

function timestamp(): string {
  return new Date().toISOString();
}

function formatArgs(args: unknown[]): string {
  return args.map(a => {
    if (typeof a === 'object' && a !== null) {
      try { return JSON.stringify(a, null, 2); } catch { return String(a); }
    }
    return String(a);
  }).join(' ');
}

export const logger = {
  info: (...args: unknown[]) => {
    if (LOG_ENABLED) console.log(`[${timestamp()}] [INFO]`, formatArgs(args));
  },
  warn: (...args: unknown[]) => {
    if (LOG_ENABLED) console.warn(`[${timestamp()}] [WARN]`, formatArgs(args));
  },
  error: (...args: unknown[]) => {
    console.error(`[${timestamp()}] [ERROR]`, formatArgs(args));
  },
  debug: (...args: unknown[]) => {
    if (LOG_ENABLED) console.log(`[${timestamp()}] [DEBUG]`, formatArgs(args));
  },
  section: (name: string) => {
    if (LOG_ENABLED) {
      console.log('');
      console.log('='.repeat(60));
      console.log(`  ${name}`);
      console.log('='.repeat(60));
    }
  },
};
