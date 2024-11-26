//stackpress
import type { BuilderOptions } from '@stackpress/ingest/dist/buildtime/types';
//vercel
import VercelBuilder from './Builder';

export * from '@stackpress/ingest/dist/buildtime';

export { VercelBuilder };

export default function vercel(options: BuilderOptions = {}) {
  return new VercelBuilder(options);
}