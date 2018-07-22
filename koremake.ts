export { Project } from './src/Project'
export { GraphicsApi } from './src/GraphicsApi'
export { AudioApi } from './src/AudioApi'
export { Platform, PlatformType } from './src/Platform'


export const platform = 'default';
export const graphics = 'default';
export const audio = 'default';
export const vr = 'default';
export const koreDir = __dirname;

const defines: string[] = [];
export function addDefine(str: string): void {
    if (defines.indexOf(str) === -1) {
      defines.push(str);
    }
}
export function isDefined(str: string): boolean {
  return defines.indexOf(str) !== -1;
}