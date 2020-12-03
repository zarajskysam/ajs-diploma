/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable class-methods-use-this */
import themes from './themes';
import PositionedCharacter from './PositionedCharacter';
import GamePlay from './GamePlay';
import GameState from './GameState';
import Daemon from './Daemon';
import Swordsman from './Swordsman';
import Vampire from './Vampire';
import Undead from './Undead';
import Magician from './Magician';
import Bowman from './Bowman';
import { generateTeam } from './generators';
import cursors from './cursors';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.onCellEnter = this.onCellEnter.bind(this);
    this.onCellLeave = this.onCellLeave.bind(this);
    this.onCellClick = this.onCellClick.bind(this);
    this.onStartGameButton = this.onStartGameButton.bind(this);
    this.onSaveGameButton = this.onSaveGameButton.bind(this);
    this.onLoadGameButton = this.onLoadGameButton.bind(this);
    this.friendlyCharacters = [];
    this.enemyCharacters = [];
    this.gameCharacters = [];
    this.selected = 0;
    this.gameLevel = 1;
    this.gameLocations = [themes.prairie, themes.desert, themes.arctic, themes.mountain];
  }

  init() {
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.drawUi(this.gameLocations[this.gameLevel - 1]);
    this.gamePlay.addCellEnterListener(this.onCellEnter);
    this.gamePlay.addCellClickListener(this.onCellClick);
    this.gamePlay.addCellLeaveListener(this.onCellLeave);
    this.gamePlay.addNewGameListener(this.onStartGameButton);
    this.gamePlay.addSaveGameListener(this.onSaveGameButton);
    this.gamePlay.addLoadGameListener(this.onLoadGameButton);
    this.startGame();
  }

  async onCellClick(index) {
    // TODO: react to click
    if (this.getSelectedCharacter()) {
      const selectedChar = this.getSelectedCharacter();
      const selectetDistanceMove = this.getAllCharacterCoordinats(selectedChar.position, selectedChar.character.distance);
      const resultMove = selectetDistanceMove.find((value) => value === index);
      const selectedAttackMove = this.getAllCharacterCoordinats(selectedChar.position, selectedChar.character.distanceAttack);
      const resultAttack = selectedAttackMove.find((value) => value === index);

      if (resultAttack) {
        for (const item of this.gameCharacters) {
          if (item.position === index && item.character.isUndead) {
            this.gamePlay.deselectCell(this.getSelectedCharacter().position);
            await this.attack(this.getSelectedCharacter(), index);
            this.gamePlay.redrawPositions(this.gameCharacters);
            await this.enemyMove();
            this.gamePlay.redrawPositions(this.gameCharacters);
            if (this.getSelectedCharacter()) {
              this.getSelectedCharacter().character.selected = false;
            }
            this.gamePlay.deselectAllCell();
            this.checkGame();
            return;
          }
        }
      }
      if (resultMove) {
        for (const item of this.gameCharacters) {
          if (item.position === index && !item.character.isUndead) {
            this.gamePlay.deselectCell(this.getSelectedCharacter().position);
            this.getSelectedCharacter().character.selected = false;
            this.gamePlay.selectCell(item.position);
            item.character.selected = true;
            return;
          } if (item.position === index && item.character.isUndead) {
            GamePlay.showError('Нельзя ходить туда, где стоит враг');
            this.gamePlay.deselectCell(this.getSelectedCharacter().position);
            this.getSelectedCharacter().character.selected = false;
            return;
          }
        }
        this.move(index);
        this.gamePlay.deselectAllCell();
        this.getSelectedCharacter().character.selected = false;
        this.gamePlay.redrawPositions(this.gameCharacters);
        await this.enemyMove();
        this.gamePlay.redrawPositions(this.gameCharacters);
        this.checkGame();
        return;
      }
      for (const item of this.gameCharacters) {
        if (item.position === index && !item.character.isUndead) {
          this.gamePlay.deselectCell(this.getSelectedCharacter().position);
          this.getSelectedCharacter().character.selected = false;
          this.gamePlay.selectCell(item.position);
          item.character.selected = true;
          return;
        } if (item.position === index && item.character.isUndead) {
          GamePlay.showError('Нельзя выбрать вражеского персонажа');
          this.gamePlay.deselectCell(this.getSelectedCharacter().position);
          this.getSelectedCharacter().character.selected = false;
          return;
        }
      }
    }

    if (!this.getSelectedCharacter()) {
      for (const item of this.gameCharacters) {
        if (item.position === index && !item.character.isUndead) {
          item.character.selected = true;
          this.gamePlay.selectCell(index);
          return;
        } if (item.position === index && item.character.isUndead) {
          GamePlay.showError('Нельзя выбрать вражеского персонажа');
          return;
        }
      }
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    const result = this.gameCharacters.find((value) => value.position === index);
    if (result) {
      const searchChar = result.character;
      this.gamePlay.showCellTooltip(`&#127894 ${searchChar.level} &#9876 ${searchChar.attack} &#128737 ${searchChar.defence} &#10084 ${searchChar.health}`, index);
    }

    const selected = this.getSelectedCharacter();
    if (selected === undefined) {
      for (const item of this.gameCharacters) {
        if (item.position === index && !item.character.isUndead) {
          this.gamePlay.selectCell(index);
          this.gamePlay.setCursor('pointer');
          return;
        } if (item.position === index && item.character.isUndead) {
          this.gamePlay.setCursor(cursors.notallowed);
          return;
        }
        this.gamePlay.deselectAllCell();
        this.gamePlay.setCursor('auto');
      }
    } else {
      for (const item of this.gameCharacters) {
        const attackDistance = this.getAllCharacterCoordinats(selected.position, selected.character.distanceAttack);
        const moveDistance = this.getAllCharacterCoordinats(selected.position, selected.character.distance);
        this.spliceCharPosition(moveDistance);
        const resultAttack = attackDistance.filter((value) => value === index);
        const resultMove = moveDistance.filter((value) => value === index);
        if (resultAttack[0] === index && item.position === index && item.character.isUndead) {
          this.gamePlay.deselectAllCell();
          this.gamePlay.selectCell(selected.position);
          this.gamePlay.setCursor(cursors.crosshair);
          this.gamePlay.selectCell(index, 'red');
          return;
        }

        if (item.position === index && !item.character.isUndead) {
          this.gamePlay.deselectAllCell();
          this.gamePlay.selectCell(selected.position);
          this.gamePlay.setCursor(cursors.pointer);
          this.gamePlay.selectCell(index);
          return;
        }

        if (item.position === index && item.character.isUndead) {
          this.gamePlay.setCursor(cursors.notallowed);
          return;
        }

        if (resultMove[0] === index && item.position !== index) {
          this.gamePlay.deselectAllCell();
          this.gamePlay.selectCell(selected.position);
          this.gamePlay.setCursor(cursors.pointer);
          this.gamePlay.selectCell(index, 'green');
          return;
        }
        this.gamePlay.deselectAllCell();
        this.deselectAllCell();
        this.gamePlay.selectCell(selected.position);
        this.gamePlay.setCursor('auto');
      }
    }
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
  }

  onStartGameButton() {
    this.deselectAllCell();
    this.startGame();
  }


  onSaveGameButton() {
    this.stateService.save(GameState.from(this.gameCharacters, this.gameLevel));
  }

  onLoadGameButton() {
    if (!localStorage.state) GamePlay.showError('Сохранения отстствуют');
    const loadGame = this.stateService.load();
    this.gameLevel = loadGame.level;
    this.gamePlay.drawUi(this.gameLocations[this.gameLevel - 1]);
    this.gameCharacters = loadGame.position;
    this.gamePlay.redrawPositions(loadGame.position);
  }

  startGame() {
    this.gameLevel = 1;
    this.gamePlay.drawUi(this.gameLocations[this.gameLevel - 1]);
    const startFriendlyTeam = generateTeam([Bowman, Swordsman], 1, 2);
    const startEnemyTeam = generateTeam([Daemon, Vampire, Undead], 1, 2);
    const randomStartFriendlyPositionArr = this.getCol(0, 1);
    const randomStartEnemyPositionArr = this.getCol(6, 7);
    const startFriendlyTeamArr = [];
    const startEnemyTeamArr = [];
    for (const char of startFriendlyTeam) {
      const position = this.generateStartPosition(randomStartFriendlyPositionArr);
      const index = randomStartFriendlyPositionArr.indexOf(position);
      randomStartFriendlyPositionArr.splice(index, 1);
      startFriendlyTeamArr.push(new PositionedCharacter(char, position));
    }
    for (const char of startEnemyTeam) {
      const position = this.generateStartPosition(randomStartEnemyPositionArr);
      const index = randomStartEnemyPositionArr.indexOf(position);
      randomStartEnemyPositionArr.splice(index, 1);
      startEnemyTeamArr.push(new PositionedCharacter(char, position));
    }
    this.friendlyCharacters = startFriendlyTeamArr;
    this.enemyCharacters = startEnemyTeamArr;
    this.gameCharacters = startEnemyTeamArr.concat(startFriendlyTeamArr);

    this.gamePlay.redrawPositions(this.gameCharacters);
  }

  getCol(...cols) {
    const arrCol = [];
    for (let item of cols) {
      arrCol.push(item);
      while (item < 56) {
        item += 8;
        arrCol.push(item);
      }
    }
    return arrCol;
  }

  generateStartPosition(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  generatePosition(arr) {
    for (const item of this.gameCharacters) {
      for (let i = 0; i < arr.length; i += 1) {
        if (arr[i] === item.position) {
          arr.splice(i, 1);
        }
      }
    }
    return arr[Math.floor(Math.random() * arr.length)];
  }
  // move logic

  getRowCharacterPosition(index) {
    const rowArrLength = 7;
    let rowPosition = index;
    while (rowPosition > rowArrLength) {
      rowPosition -= 8;
    }
    return rowPosition;
  }

  getRowDistanceCoordinats(clickIndex, charDistance) {
    const nowRowPos = this.getRowCharacterPosition(clickIndex);
    const arrCharacterDistance = [];
    let distanceDotRight = clickIndex;
    let distanceDotLeft = clickIndex;
    for (let i = 0; i < charDistance; i += 1) {
      distanceDotLeft -= 1;
      const nowDistanceDotLeft = nowRowPos - i - 1;
      if (nowDistanceDotLeft <= 7 && nowDistanceDotLeft >= 0) {
        arrCharacterDistance.push(distanceDotLeft);
      }
    }
    for (let i = 0; i < charDistance; i += 1) {
      distanceDotRight += 1;
      const nowDistanceDot = nowRowPos + i + 1;
      if (nowDistanceDot <= 7 && nowDistanceDot > 0) {
        arrCharacterDistance.push(distanceDotRight);
      }
    }
    return arrCharacterDistance;
  }

  getUpRowDistanceCoordinats(clickIndex, charDistance) {
    let arrUpCharacterDistance = [];
    let distanceDot = clickIndex;
    for (let i = 0; i < charDistance; i += 1) {
      distanceDot -= 8;
      if (distanceDot >= 0) {
        const arr = this.getRowDistanceCoordinats(distanceDot, charDistance);
        arrUpCharacterDistance = arrUpCharacterDistance.concat(arr);
        arrUpCharacterDistance.push(distanceDot);
      }
    }
    return arrUpCharacterDistance;
  }

  getDownRowDistanceCoordinats(clickIndex, charDistance) {
    let arrDownCharacterDistance = [];
    let distanceDot = clickIndex;
    for (let i = 0; i < charDistance; i += 1) {
      if (distanceDot <= 63) {
        distanceDot += 8;
        const arr = this.getRowDistanceCoordinats(distanceDot, charDistance);
        arrDownCharacterDistance = arrDownCharacterDistance.concat(arr);
        arrDownCharacterDistance.push(distanceDot);
      }
    }
    return (arrDownCharacterDistance);
  }

  getAllCharacterCoordinats(clickIndex, charDistance) {
    let mainRow = this.getRowDistanceCoordinats(clickIndex, charDistance);
    const upRows = this.getUpRowDistanceCoordinats(clickIndex, charDistance);
    const downRows = this.getDownRowDistanceCoordinats(clickIndex, charDistance);
    mainRow = mainRow.concat(upRows, downRows);
    return mainRow;
  }

  spliceCharPosition(arr) {
    for (let i = 0; i < arr.length; i += 1) {
      for (const item of this.gameCharacters) {
        if (arr[i] === item.position) {
          arr.splice(i, 1);
        }
      }
    }
  }

  // eslint-disable-next-line consistent-return
  getSelectedCharacter() {
    for (const item of this.gameCharacters) {
      if (item.character.selected) {
        return item;
      }
    }
  }

  deselectAllCell() {
    for (const item of this.gameCharacters) {
      this.gamePlay.deselectCell(item.position);
    }
  }

  move(index) {
    this.gamePlay.deselectCell(this.getSelectedCharacter().position);
    for (const item of this.gameCharacters) {
      if (this.getSelectedCharacter() === item) {
        item.position = index;
      }
    }
  }

  async attack(attackChar, index) {
    let victium;
    let damage;
    // this.gamePlay.deselectCell(this.getSelectedCharacter().position);
    for (const item of this.gameCharacters) {
      if (item.position === index) {
        const damageChar = Math.max(attackChar.character.attack - item.character.defence, attackChar.character.attack * 0.1);
        item.character.health -= damageChar;
        this.gamePlay.redrawPositions(this.gameCharacters);
        victium = item;
        damage = damageChar;
      }
    }
    if (victium.character.health <= 0) {
      for (let i = 0; i <= this.gameCharacters.length; i += 1) {
        if (this.gameCharacters[i] === victium) {
          this.gameCharacters.splice(i, 1);
        }
      }
    }

    // this.getSelectedCharacter().character.selected = false;
    await this.gamePlay.showDamage(victium.position, damage);
  }

  async enemyMove() {
    const enemyChars = [];
    const friendlyChars = [];
    for (const item of this.gameCharacters) {
      if (item.character.isUndead) {
        enemyChars.push(item);
      }
    }
    if (enemyChars[0] === undefined) {
      return;
    }
    for (const item of this.gameCharacters) {
      if (!item.character.isUndead) {
        friendlyChars.push(item);
      }
    }
    const enemyChar = enemyChars[Math.floor(Math.random() * enemyChars.length)];
    const attackMove = this.getAllCharacterCoordinats(enemyChar.position, enemyChar.character.distanceAttack);
    for (const move of attackMove) {
      for (const item of friendlyChars) {
        if (item.position === move) {
          await this.attack(enemyChar, item.position);
          return;
        }
      }
    }
    const positionMove = this.getAllCharacterCoordinats(enemyChar.position, enemyChar.character.distance);
    for (let i = 0; i < positionMove.length; i += 1) {
      for (const item of this.gameCharacters) {
        if (item.position === positionMove[i]) {
          positionMove.splice(i, 1);
        }
      }
    }
    const randomMove = positionMove[Math.floor(Math.random() * positionMove.length)];
    for (const item of this.gameCharacters) {
      if (enemyChar.position === item.position) {
        item.position = randomMove;
        return;
      }
    }
  }

  checkGame() {
    const friendlyChars = [];
    const enemyChars = [];
    for (const item of this.gameCharacters) {
      if (!item.character.isUndead) {
        friendlyChars.push(item);
      }
    }
    if (friendlyChars[0] === undefined) {
      GamePlay.showError('Вы проиграли!');
      this.startGame();
      return;
    }
    for (const item of this.gameCharacters) {
      if (item.character.isUndead) {
        enemyChars.push(item);
      }
    }
    if (enemyChars[0] === undefined) {
      if (this.gameLevel === 4) {
        GamePlay.showError('Вы молодец! Вы прошли игру. Игра начинается с начала');
        this.startGame();
        return;
      }
      GamePlay.showError('Вы переходите на следующий уровень!');
      for (const item of this.gameCharacters) {
        item.character.level += 1;
        item.character.attack = Math.floor(Math.max(item.character.attack, item.character.attack * (1.8 - (100 - item.character.health) / 100)));
        item.character.defence = Math.floor(Math.max(item.character.defence, item.character.defence * (1.8 - (100 - item.character.health) / 100)));
        item.character.health += 80;
        if (item.character.health > 100) {
          item.character.health = 100;
        }
      }
      this.gameLevel += 1;
      const randomStartFriendlyPositionArr = this.getCol(0, 1);
      const randomStartEnemyPositionArr = this.getCol(6, 7);

      if (this.gameLevel === 2) {
        const friendly = generateTeam([Bowman, Swordsman, Magician], 1, 1);
        for (const item of friendly) {
          this.gameCharacters.push(new PositionedCharacter(item, this.generatePosition(randomStartFriendlyPositionArr)));
        }
      } else {
        const friendly = generateTeam([Bowman, Swordsman, Magician], this.gameLevel - 1, 2);
        for (const item of friendly) {
          this.gameCharacters.push(new PositionedCharacter(item, this.generatePosition(randomStartFriendlyPositionArr)));
        }
      }
      const enemy = generateTeam([Daemon, Vampire, Undead], this.gameLevel, this.gameCharacters.length);
      for (const item of enemy) {
        this.gameCharacters.push(new PositionedCharacter(item, this.generatePosition(randomStartEnemyPositionArr)));
      }
      this.gamePlay.drawUi(this.gameLocations[this.gameLevel - 1]);
      this.gamePlay.redrawPositions(this.gameCharacters);
    }
  }
}
