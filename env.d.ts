// env.d.ts
/// <reference types="node" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  // add other VITE_ prefixed vars here if you need them
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
