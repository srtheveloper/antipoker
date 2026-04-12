/// <reference types="vite/client" />

// Explicit declarations for uppercase extensions (e.g. .JPG from iPhone photos)
declare module '*.JPG' {
  const src: string;
  export default src;
}

declare module '*.PNG' {
  const src: string;
  export default src;
}

declare module '*.JPEG' {
  const src: string;
  export default src;
}

declare module '*.WEBP' {
  const src: string;
  export default src;
}

declare module '*.SVG' {
  const src: string;
  export default src;
}
