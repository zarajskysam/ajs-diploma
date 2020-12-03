export default class GameState {
  static from(savePosition, saveLevel) {
    const object = {
      position: savePosition,
      level: saveLevel,
    };
    return object;
  }
}
