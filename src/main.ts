import { Playground } from './createScene';
import { Playground2 } from './example2Scene';
import './style.css';
import { Engine } from 'babylonjs';

const main = () => {
  const renderCanvas = document.getElementById(
    'renderCanvas'
  ) as HTMLCanvasElement;
  if (!renderCanvas) {
    return;
  }

  const engine = new Engine(renderCanvas, true);

  //const scene = Playground.CreateScene(engine, renderCanvas);
  const scene2 = Playground2.CreateScene(engine, renderCanvas);

  window.addEventListener('resize', () => {
    engine.resize();
  });

  engine.runRenderLoop(() => {
    scene2.render();
  });
};

main();
