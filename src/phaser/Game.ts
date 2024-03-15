import Phaser from "phaser";
import { addItem } from "../services/Storage";
import { GameScene } from "./GameScene";

export const leaderBoardId = "acbd";
export let score = 0;
export let level = 1;
export let levelToChangeScore = 1000;
export let currentActiveTileTypes = 4;
export let bombPowerups = 3;

export function initGame() {
  return new Phaser.Game({
    width: window.innerWidth,
    height: window.innerHeight,
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    parent: "game",
    scene: [GameScene],
    fps: {
      forceSetTimeOut: true,
    },
  });
}

export function resetStats() {
  saveScore();
  score = 0;
  level = 1;
  currentActiveTileTypes = 4;
  bombPowerups = 3;
}

export function decreasePowerUp() {
  bombPowerups -= 1;
}

export function addScore(amount: number) {
  score += amount;
}

export function addLevel() {
  level += 1;
}

export function addCurrentActiveTileTypes() {
  currentActiveTileTypes += 1;
}

export function saveScore() {
  if (score === 0) {
    console.log("You have to get more than 0 to save score");
    return;
  }
  addItem<number>("score", score);
}

export function showLeaderBoard() {
  console.log("To be Implemented");
}
