declare module 'follow-redirects' {
  export const http: typeof import('http');
  export const https: typeof import('https');
}

declare module 'is-buffer' {
  const isBuffer: (val: any) => val is Buffer;
  export = isBuffer;
}
