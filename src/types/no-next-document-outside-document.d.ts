declare module 'next/document' {
  // Intentionally narrow types so any import outside _document fails loudly
  export const Html: never
  export const Head: never
  export const Main: never
  export const NextScript: never
  const _default: any
  export default _default
}
