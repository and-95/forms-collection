declare module 'qrcode' {
  export function toDataURL(text: string, callback?: (error: Error | null, url: string) => void): Promise<string>;
  export function toString(text: string, callback?: (error: Error | null, url: string) => void): Promise<string>;
}