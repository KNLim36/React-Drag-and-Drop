import { COLUMN_WIDTH, GUTTER_SIZE } from './constants';

export const moduleY2LocalY = (moduleY: number) => moduleY + GUTTER_SIZE;
export const moduleW2LocalWidth = (moduleW: number) =>
  moduleW * COLUMN_WIDTH - GUTTER_SIZE;
export const localWidth2ModuleW = (localW: number) => {
  let width = localW + GUTTER_SIZE;
  return Math.round(width / COLUMN_WIDTH);
};
export const moduleX2LocalX = (moduleX: number) =>
  moduleW2LocalWidth(moduleX) + GUTTER_SIZE * 2;
export const localX2ModuleX = (localX: number) =>
  localWidth2ModuleW(localX - GUTTER_SIZE * 2);
