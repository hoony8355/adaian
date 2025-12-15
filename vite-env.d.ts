// Removed reference to vite/client to resolve "Cannot find type definition file" error.
// Removed "declare const process" to resolve "Cannot redeclare block-scoped variable" error.
// Instead, we augment the NodeJS namespace which is the standard way to type process.env in TypeScript.

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
