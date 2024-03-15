import { useEffect } from 'react';
import './Game.css';
import Phaser from 'phaser';
import { initGame } from '../phaser/Game';

interface ContainerProps { }

const GameBoard: React.FC<ContainerProps> = () => {

  let gameInstance: Phaser.Game | null = null

  useEffect(()=> {
    window.addEventListener("load", ()=>{
      if(window.innerWidth > 0 && !gameInstance){
        gameInstance = initGame()
      }
    })
  },[])

  return (
    <div id="game">
    </div>
  );
};

export default GameBoard;
