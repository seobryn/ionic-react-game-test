import { Capacitor } from "@capacitor/core";
import {
  addCurrentActiveTileTypes,
  addLevel,
  addScore,
  bombPowerups,
  currentActiveTileTypes,
  decreasePowerUp,
  level,
  levelToChangeScore,
  resetStats,
  score,
} from "./Game";
import { vibrate, giveHapticFeedback } from "../Vibration";

export class GameScene extends Phaser.Scene {
  static KEY = "game";

  tileGrid: Phaser.GameObjects.Sprite[][] | null[][] = Array(6).fill([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  tileTypes = [
    "bear",
    "buffalo",
    "chick",
    "chicken",
    "cow",
    "crocodile",
    "dog",
    "duck",
    "elephant",
    "frog",
    "giraffe",
    "goat",
    "gorilla",
    "hippo",
    "horse",
    "monkey",
    "moose",
    "narwhal",
    "owl",
    "panda",
    "parrot",
    "penguin",
    "pig",
    "rabbit",
    "rhino",
    "sloth",
    "snake",
    "walrus",
    "whale",
    "zebra",
  ];

  activeTile1: Phaser.GameObjects.Sprite | null = null;
  activeTile2: Phaser.GameObjects.Sprite | null = null;

  startX = -1;
  startY = -1;

  canMove = false;

  bombs: Phaser.GameObjects.Image[] = [];

  assetTileSize = 136;
  assetScale = 0;
  tileWidth = 0;
  tileHeight = 0;

  yOffset = 0;

  tiles: Phaser.GameObjects.Group | null = null;
  random: Phaser.Math.RandomDataGenerator | null = null;

  matchParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  feedbox: Phaser.GameObjects.Image | null = null;
  scoreText: Phaser.GameObjects.Text | null = null;
  levelText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: GameScene.KEY });
  }

  preload() {
    this.load.atlas("animals", "assets/animals.png", "assets/animals.json");
    this.load.svg("back-fence", "assets/back_fence.svg", { scale: 1 });
    this.load.svg("feed", "assets/feed.svg", { scale: 1 });
    this.load.svg("feedbox", "assets/feedbox.svg", { scale: 1 });
    this.load.svg("front-fence", "assets/front_fence.svg", { scale: 1 });
    this.load.svg("refresh-sign", "assets/refresh_sign.svg", { scale: 1 });
    this.load.svg("title", "assets/title_level_score.svg", { scale: 1 });
    this.load.image("match-particle", "assets/white_particle.png");
  }

  create() {
    this.cameras.main.setBackgroundColor("#2e7b45");

    this.tileWidth = this.game.scale.gameSize.width / 6;
    this.tileHeight = this.game.scale.gameSize.width / 6;
    this.yOffset = this.game.scale.gameSize.height / 4;
    this.assetScale = (this.tileWidth - 10) / this.assetTileSize;

    this.matchParticles = this.add.particles(0, 0, "match-particle", {
      angle: { min: 240, max: 300 },
      speed: { min: 400, max: 600 },
      quantity: { min: 20, max: 50 },
      lifespan: 1000,
      alpha: { start: 1, end: 0 },
      scale: this.assetScale,
      gravityY: 800,
    });

    this.add
      .rectangle(
        0,
        0,
        this.game.scale.gameSize.width,
        this.yOffset - this.tileHeight,
        0x9ef1ff
      )
      .setOrigin(0);
    const title = this.add
      .image(this.game.scale.gameSize.width / 2, 0, "title")
      .setOrigin(0.5, 0)
      .setScale(this.game.scale.gameSize.width / 515)
      .setDepth(1);

    this.scoreText = this.add
      .text(
        111 * (this.game.scale.gameSize.width / 515),
        168 * (this.game.scale.gameSize.width / 515),
        "Score: 0",
        {
          align: "center",
          fontSize: "26px",
          stroke: "#000000",
          strokeThickness: 1,
        }
      )
      .setOrigin(0.5)
      .setScale(this.game.scale.gameSize.width / 515)
      .setDepth(2);

    this.levelText = this.add
      .text(
        407 * (this.game.scale.gameSize.width / 515),
        168 * (this.game.scale.gameSize.width / 515),
        "Level: 1",
        {
          align: "center",
          fontSize: "26px",
          stroke: "#000000",
          strokeThickness: 1,
        }
      )
      .setOrigin(0.5)
      .setScale(this.game.scale.gameSize.width / 515)
      .setDepth(2);

    this.add
      .image(0, this.yOffset - this.tileHeight / 2, "back-fence")
      .setOrigin(0)
      .setScale(this.game.scale.gameSize.width / 1021);
    this.add
      .image(0, this.yOffset + this.tileHeight * 6, "front-fence")
      .setOrigin(0)
      .setScale(this.game.scale.gameSize.width / 1021);

    this.feedbox = this.add
      .image(0, this.game.scale.gameSize.height - 5, "feedbox")
      .setOrigin(0, 1)
      .setScale((this.game.scale.gameSize.width / 6 / 199) * 1.7);

    const restartSign = this.add
      .image(
        this.game.scale.gameSize.width - 5,
        this.game.scale.gameSize.height,
        "refresh-sign"
      )
      .setOrigin(1)
      .setScale((this.game.scale.gameSize.width / 6 / 224) * 2)
      .setInteractive();
    restartSign.on("pointerdown", () => {
      resetStats();
      this.scene.restart();
    });

    this.getPowerups();

    this.tiles = this.add.group();

    const seed = Date.now().toString();
    this.random = new Phaser.Math.RandomDataGenerator([seed]);
    this.shuffleTileTypes();
    this.initTiles();
  }

  update() {
    if (this.activeTile1 && !this.activeTile2) {
      const hoverX = this.game.input.activePointer.x;
      const hoverY = this.game.input.activePointer.y;

      const startPosX = Math.floor(this.activeTile1.x / this.tileWidth);
      const startPosY = Math.floor(
        (this.activeTile1.y - this.yOffset) / this.tileHeight
      );

      const hoverPosX = Math.floor(hoverX / this.tileWidth);
      const hoverPosY = Math.floor((hoverY - this.yOffset) / this.tileHeight);

      let difX = hoverPosX - this.startX;
      let difY = hoverPosY - this.startY;

      if (difX > 0 && difX !== 0) {
        difX = 1;
      }
      if (difX < 0 && difX !== 0) {
        difX = -1;
      }
      if (difY > 0 && difY !== 0) {
        difY = 1;
      }
      if (difY < 0 && difY !== 0) {
        difY = -1;
      }

      if (
        !(hoverPosY > this.tileGrid[0].length - 1 || hoverPosY < 0) &&
        !(hoverPosX > this.tileGrid.length - 1 || hoverPosX < 0)
      ) {
        if (
          (Math.abs(difY) >= 1 && difX === 0) ||
          (Math.abs(difX) >= 1 && difY === 0)
        ) {
          this.canMove = false;
          this.activeTile2 = this.tileGrid[startPosX + difX][startPosY + difY];
          this.swapTiles();
          this.time.addEvent({ delay: 500, callback: () => this.checkMatch() });
        }
      }
    }
  }

  private getPowerups() {
    this.bombs.forEach((bomb) => bomb.destroy());
    this.bombs = [];
    const bombs = bombPowerups;
    for (let i = 0; i < bombs; i++) {
      const bomb = this.add
        .image(
          (i * this.tileWidth * 1.5) / 2 + (this.tileWidth * 1.5) / 3,
          this.game.scale.gameSize.height -
            5 -
            (this.feedbox!.height * this.feedbox!.scale) / 2,
          "feed"
        )
        .setScale(this.assetScale * 1.5)
        .setOrigin(0.5)
        .setInteractive();
      (bomb as Phaser.GameObjects.Sprite).on("pointerdown", () =>
        this.triggerBomb()
      );
      this.bombs.push(bomb);
    }
  }

  triggerBomb() {
    if (this.canMove && bombPowerups > 0) {
      this.canMove = false;
      decreasePowerUp();
      this.bombs[bombPowerups].destroy(true);
      this.clearTiles();
      this.time.addEvent({ delay: 500, callback: () => this.checkMatch() });
    }
  }

  private shuffleTileTypes() {
    let j;
    let x;
    for (let i = this.tileTypes.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = this.tileTypes[i];
      this.tileTypes[i] = this.tileTypes[j];
      this.tileTypes[j] = x;
    }
  }

  private initTiles() {
    this.tileGrid.forEach((column, x) => {
      this.tileGrid[x] = column.map((_, y) => this.addTile(x, y));
    });

    this.time.addEvent({ delay: 500, callback: () => this.checkMatch() });
  }

  private addTile(x: number, y: number) {
    const tileToAdd =
      this.tileTypes[
        this.random!.integerInRange(0, currentActiveTileTypes - 1)
      ];
    const tile = this.tiles!.create(
      x * this.tileWidth + this.tileWidth / 2,
      0,
      "animals",
      tileToAdd
    );
    tile.scale = this.assetScale;

    this.add.tween({
      targets: tile,
      duration: 500,
      y: {
        from: tile.y,
        to: y * this.tileHeight + this.tileHeight / 2 + this.yOffset,
      },
    });

    tile.setInteractive();
    tile.tileType = tileToAdd;

    (tile as Phaser.GameObjects.Sprite).on("pointerdown", () =>
      this.tileDown(tile)
    );

    return tile;
  }

  private tileDown(tile: Phaser.GameObjects.Sprite) {
    if (Capacitor.getPlatform() !== "web") {
      giveHapticFeedback();
    }
    if (this.canMove) {
      this.activeTile1 = tile;
      this.startX = (tile.x - this.tileWidth / 2) / this.tileWidth;
      this.startY =
        (tile.y - this.tileHeight / 2 - this.yOffset) / this.tileHeight;
    }
  }

  private swapTiles() {
    if (this.activeTile1 && this.activeTile2) {
      const tile1Pos = {
        x: (this.activeTile1.x - this.tileWidth / 2) / this.tileWidth,
        y:
          (this.activeTile1.y - this.tileHeight / 2 - this.yOffset) /
          this.tileHeight,
      };

      const tile2Pos = {
        x: (this.activeTile2.x - this.tileWidth / 2) / this.tileWidth,
        y:
          (this.activeTile2.y - this.tileHeight / 2 - this.yOffset) /
          this.tileHeight,
      };

      this.tileGrid[tile1Pos.x][tile1Pos.y] = this.activeTile2;
      this.tileGrid[tile2Pos.x][tile2Pos.y] = this.activeTile1;

      this.add.tween({
        targets: this.activeTile1,
        duration: 200,
        x: {
          from: this.activeTile1.x,
          to: tile2Pos.x * this.tileWidth + this.tileWidth / 2,
        },
        y: {
          from: this.activeTile1.y,
          to: tile2Pos.y * this.tileHeight + this.tileHeight / 2 + this.yOffset,
        },
      });

      this.add.tween({
        targets: this.activeTile2,
        duration: 200,
        x: {
          from: this.activeTile2.x,
          to: tile1Pos.x * this.tileWidth + this.tileWidth / 2,
        },
        y: {
          from: this.activeTile2.y,
          to: tile1Pos.y * this.tileHeight + this.tileHeight / 2 + this.yOffset,
        },
      });
      this.activeTile1 = this.tileGrid[tile1Pos.x][tile1Pos.y];
      this.activeTile2 = this.tileGrid[tile2Pos.x][tile2Pos.y];
    }
  }

  private checkMatch() {
    const matches = this.getMatches(this.tileGrid);
    if (matches.length > 0) {
      if (Capacitor.getPlatform() !== "web") {
        vibrate();
      }
      this.removeTileGroup(matches);
      this.resetTile();
      this.fillTile();
      this.time.addEvent({ delay: 500, callback: () => this.tileUp() });
      this.time.addEvent({ delay: 600, callback: () => this.checkMatch() });
    } else {
      this.swapTiles();
      this.time.addEvent({
        delay: 500,
        callback: () => {
          this.tileUp();
          this.canMove = !this.checkGameOver();
        },
      });
    }
  }

  private checkGameOver(): boolean {
    const outOfBombs: boolean = bombPowerups === 0;
    const outOfMoves: boolean = !this.checkSwapPossible();

    if (outOfBombs && outOfMoves) {
      const levelText = this.add
        .text(
          this.game.scale.gameSize.width / 2,
          this.game.scale.gameSize.height / 2,
          "Game Over \nNo more moves",
          {
            align: "center",
            fontSize: "32px",
            stroke: "#000000",
            strokeThickness: 5,
          }
        )
        .setOrigin(0.5)
        .setDepth(1);

      this.tweens.add({
        targets: levelText,
        scaleX: 1,
        scaleY: 1,
        angle: 360,
        _ease: "Sine.easeInOut",
        ease: "Power2",
        duration: 1000,
        delay: 50,
      });
      return true;
    }
    return false;
  }

  private clearTiles() {
    if (Capacitor.getPlatform() !== "web") {
      vibrate();
    }
    this.removeTileGroup(this.tileGrid);
    this.fillTile();
  }

  private tileUp() {
    this.activeTile1 = null;
    this.activeTile2 = null;
  }

  private getMatches(grid: any[][]) {
    const matches = [];
    let groups = [];
    // Check for horizontal matches
    let i = 0;
    let j = 0;

    for (const tempArr of grid) {
      groups = [];
      for (j = 0; j < tempArr.length; j++) {
        if (j < tempArr.length - 2) {
          if (grid[i][j] && grid[i][j + 1] && grid[i][j + 2]) {
            if (
              grid[i][j].tileType === grid[i][j + 1].tileType &&
              grid[i][j + 1].tileType === grid[i][j + 2].tileType
            ) {
              if (groups.length > 0) {
                if (groups.indexOf(grid[i][j]) === -1) {
                  matches.push(groups);
                  groups = [];
                }
              }

              if (groups.indexOf(grid[i][j]) === -1) {
                groups.push(grid[i][j]);
              }
              if (groups.indexOf(grid[i][j + 1]) === -1) {
                groups.push(grid[i][j + 1]);
              }
              if (groups.indexOf(grid[i][j + 2]) === -1) {
                groups.push(grid[i][j + 2]);
              }
            }
          }
        }
      }
      if (groups.length > 0) {
        matches.push(groups);
      }
      i++;
    }

    i = 0;
    j = 0;

    // Check for vertical matches
    for (const tempArr of grid) {
      groups = [];
      for (i = 0; i < tempArr.length; i++) {
        if (i < tempArr.length - 2) {
          if (grid[i][j] && grid[i + 1][j] && grid[i + 2][j]) {
            if (
              grid[i][j].tileType === grid[i + 1][j].tileType &&
              grid[i + 1][j].tileType === grid[i + 2][j].tileType
            ) {
              if (groups.length > 0) {
                if (groups.indexOf(grid[i][j]) === -1) {
                  matches.push(groups);
                  groups = [];
                }
              }

              if (groups.indexOf(grid[i][j]) === -1) {
                groups.push(grid[i][j]);
              }
              if (groups.indexOf(grid[i + 1][j]) === -1) {
                groups.push(grid[i + 1][j]);
              }
              if (groups.indexOf(grid[i + 2][j]) === -1) {
                groups.push(grid[i + 2][j]);
              }
            }
          }
        }
      }
      if (groups.length > 0) {
        matches.push(groups);
      }
      j++;
    }
    return matches;
  }

  private checkSwapPossible() {
    const testGrid = this.cloneGrid(this.tileGrid);

    for (let i = 0; i < testGrid.length; i++) {
      for (let j = 0; j < testGrid[i].length; j++) {
        if (
          this.canSwapWithNeighbor(i, j, i, j - 1, testGrid) || // Left
          this.canSwapWithNeighbor(i, j, i, j + 1, testGrid) || // Right
          this.canSwapWithNeighbor(i, j, i - 1, j, testGrid) || // Up
          this.canSwapWithNeighbor(i, j, i + 1, j, testGrid)
        ) {
          // Down
          return true;
        }
      }
    }

    return false;
  }

  private cloneGrid(
    tileGrid: Phaser.GameObjects.Sprite[][] | null[][]
  ): any[][] {
    return tileGrid.map((row) =>
      row.map((tile) => ({ tileType: (tile as any).tileType }))
    );
  }

  private canSwapWithNeighbor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    grid: any[][]
  ) {
    if (x2 < 0 || x2 >= grid.length || y2 < 0 || y2 >= grid[0].length)
      return false;

    const temp = grid[x1][y1];
    grid[x1][y1] = grid[x2][y2];
    grid[x2][y2] = temp;

    const matches = this.getMatches(grid);

    // Restore the grid to its original state
    grid[x2][y2] = grid[x1][y1];
    grid[x1][y1] = temp;

    return matches.length > 0;
  }

  private removeTileGroup(matches: any[][]) {
    for (const tempArr of matches) {
      for (const tile of tempArr) {
        const tilePos = this.getTilePos(this.tileGrid, tile);
        this.matchParticles!.emitParticleAt(tile.x, tile.y);
        this.tiles!.remove(tile, true);
        this.incrementScore();
        if (tilePos.x !== -1 && tilePos.y !== -1) {
          this.tileGrid[tilePos.x][tilePos.y] = null;
        }
      }
    }
  }

  private incrementScore() {
    addScore(10);
    this.scoreText!.setText(`Score: ${score}`);
    //this.achievements.checkScoreAchievementsState(score);
    this.checkLevelChange();
  }

  private checkLevelChange() {
    if (score > 0 && score % levelToChangeScore === 0) {
      addLevel();
      if (currentActiveTileTypes < this.tileTypes.length) {
        addCurrentActiveTileTypes();
      }

      const levelText = this.add
        .text(
          this.game.scale.gameSize.width / 2,
          this.game.scale.gameSize.height / 2,
          `Level ${level}`,
          {
            fontSize: "32px",
            stroke: "#000000",
            strokeThickness: 5,
          }
        )
        .setOrigin(0.5)
        .setDepth(1);

      this.tweens.add({
        targets: levelText,
        scaleX: 1,
        scaleY: 1,
        angle: 360,
        _ease: "Sine.easeInOut",
        ease: "Power2",
        duration: 1000,
        delay: 50,
      });

      this.time.addEvent({
        delay: 2000,
        callback: () => {
          levelText.destroy(true);
        },
      });

      this.levelText!.setText(`Level ${level}`);
    }
  }

  private getTilePos(tileGrid: string | any[], tile: any) {
    const pos = { x: -1, y: -1 };

    for (let i = 0; i < tileGrid.length; i++) {
      for (let j = 0; j < tileGrid[i].length; j++) {
        if (tile === tileGrid[i][j]) {
          pos.x = i;
          pos.y = j;
          break;
        }
      }
    }

    return pos;
  }

  private resetTile() {
    for (let i = 0; i < this.tileGrid.length; i++) {
      for (let j = this.tileGrid[i].length - 1; j > 0; j--) {
        if (this.tileGrid[i][j] == null && this.tileGrid[i][j - 1] != null) {
          const tempTile = this.tileGrid[i][j - 1];
          this.tileGrid[i][j] = tempTile;
          this.tileGrid[i][j - 1] = null;

          this.add.tween({
            targets: tempTile,
            duration: 200,
            y: {
              from: tempTile!.y,
              to: this.tileHeight * j + this.tileHeight / 2 + this.yOffset,
            },
          });

          j = this.tileGrid[i].length;
        }
      }
    }
  }

  private fillTile() {
    for (let i = 0; i < this.tileGrid.length; i++) {
      for (let j = 0; j < this.tileGrid.length; j++) {
        if (this.tileGrid[i][j] == null) {
          const tile = this.addTile(i, j);
          this.tileGrid[i][j] = tile;
        }
      }
    }
  }
}
