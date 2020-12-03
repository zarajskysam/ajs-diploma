/* eslint-disable no-plusplus */
/**
 * Generates random characters
 *
 * @param allowedTypes iterable of classes
 * @param maxLevel max character level
 * @returns Character type children (ex. Magician, Bowman, etc)
 */
export function characterGenerator(allowedTypes, maxLevel) {
  // TODO: write logic here
  const iterable = Math.floor(Math.random() * allowedTypes.length);
  const level = Math.floor(Math.random() * maxLevel);
  const newChar = new allowedTypes[iterable]();
  newChar.level = level;
  if (newChar.level === 0) {
    newChar.level = 1;
  }
  return newChar;
}

export function generateTeam(allowedTypes, maxLevel, characterCount) {
  // TODO: write logic here
  const team = [];
  for (let i = 0; i < characterCount; i++) {
    team.push(characterGenerator(allowedTypes, maxLevel));
  }
  return team;
}
