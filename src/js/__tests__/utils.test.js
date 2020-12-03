import { calcTileType } from '../utils';

test('calcTileType - boardSize 4', () => {
  const boardSize = 4;
  expect(calcTileType(0, boardSize)).toBe('top-left');
  expect(calcTileType(3, boardSize)).toBe('top-right');
  expect(calcTileType(1, boardSize)).toBe('top');
  expect(calcTileType(4, boardSize)).toBe('left');
});
