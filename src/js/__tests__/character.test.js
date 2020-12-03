import Character from '../Character';
import Bowman from '../Bowman';

test('new Character error', () => {
  // eslint-disable-next-line no-new
  expect(() => { new Character(); }).toThrow();
});

test('BowmanClassTest', () => {
  const expected = {
    type: 'bowman', health: 100, level: 1, attack: 25, defence: 25, distance: 2, distanceAttack: 2, isUndead: false, selected: false,
  };
  const testClass = new Bowman(1);
  expect(testClass).toEqual(expected);
});
