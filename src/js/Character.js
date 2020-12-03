export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 100;
    this.type = type;
    this.selected = false;
    // TODO: throw error if user use "new Character()"
    if (new.target.name === 'Character') throw new Error('The class type is set incorrectly');
  }
}
