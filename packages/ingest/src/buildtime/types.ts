//modules
import type { SourceFile, ProjectOptions } from 'ts-morph';
//stackpress
import type { Method } from '@stackpress/types/dist/types';
import type FileSystem from '@stackpress/types/dist/filesystem/FileSystem';
//common
import type { IM, SR, CookieOptions } from '../types';
import type Request from '../Request';
import type Response from '../Response';
//local
import type Router from './Router';

export type { SourceFile, ProjectOptions };

//--------------------------------------------------------------------//
// Build Types

export type BuildArgs = [ Request<IM>, Response<SR> ];
export type BuildMap = Record<string, BuildArgs>;
export type BuildTask = { entry: string, priority: number };

export type BuildType = 'function' | 'endpoint';

export type BuildInfo = {
  type: BuildType,
  method: Method,
  event: string,
  route: string,
  pattern?: RegExp,
  tasks: Set<BuildTask>
};

export type BuildResult = {
  id: string;
  type: BuildType;
  method: Method;
  event: string;
  route: string;
  pattern?: RegExp;
  entry: string
};

export type BuildManifest = Set<BuildInfo>;

export type TranspileInfo = {
  type: BuildType,
  method: Method,
  event: string,
  route: string,
  pattern?: RegExp,
  actions: string[]
};

export type Transpiler = (info: TranspileInfo) => SourceFile;

export type ESBuildOptions = {
  minify?: boolean,
  bundle?: boolean,
  platform?: 'node'|'browser',
  globalName?: string,
  format?: 'iife'|'esm'|'cjs',
  preserveSymlinks?: boolean,
  write?: boolean,
  plugins?: {
    name: string,
    setup: Function
  }[]
};

export type ManifestOptions = ESBuildOptions & {
  fs?: FileSystem,
  cwd?: string,
  buildDir?: string,
  manifestName?: string
};

export type BuilderOptions = ManifestOptions & {
  cookie?: CookieOptions,
  router?: Router,
  tsconfig?: string
};