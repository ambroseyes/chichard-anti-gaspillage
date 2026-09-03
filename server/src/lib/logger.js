import pino from 'pino';
import { env, isProduction } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : isProduction ? 'info' : 'debug',
  // Aucune de ces clés ne doit jamais atterrir dans un fichier de log.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'password_hash',
      '*.password_hash',
      'token',
      '*.token',
    ],
    censor: '[masqué]',
  },
  transport: isProduction ? undefined : { target: 'pino/file', options: { destination: 1 } },
});
