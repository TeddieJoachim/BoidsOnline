// import a renderer object
import { Renderer } from "./renderer.js";
let Module; // C functions will be called through module._(a c func name)

// grab webgl rendering context
const canvas = document.getElementById("gameCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  console.error("Ruh roh couldn't load webgl2");
}

let simulationRunning = true;

// async needed so that javascript doesn't just mosey along and do other shit
async function startGame() {
  Module = await createWASMModule(); // Locks things up until we get our WASM

  if (!simulationRunning) return; // if user clicks stop before wasm loads

  // if we want javascript/webgl to control the number of boids, do it here 
  Module._initializeBoids();

  runGame(Module);
}


function runGame(Module) {
  const numBoids = Module._getNumBoids();
  const boidDim = Module._getDim();
  const numPositions = numBoids * boidDim;
  const renderer = new Renderer(canvas, boidDim);
  // Module.HEAPU8.buffer is the heap memory of WebAssembly. 
  // Module._getBoidPos returns the address we begin reading  
  // we read numPositions (bytes * sizeof(float)) = 4 bytes * numFloats
  const sharedHeapCoords = new Float32Array(Module.HEAPU8.buffer, Module._getBoidPositions(), numPositions);

  const delTime = 1.0/60.0; 
  let prevTime = null;
  let accumulator = 0.0;

  // currTime is supplied by requestAnimationFrame
  function gameLoop(currTime) {
    if (!simulationRunning) return;
    if (prevTime == null) prevTime = currTime; // don't panic and update the simulation a bunch on first iteration
    const elapsedTime = (currTime - prevTime) / 1000.0;
    prevTime = currTime;

    // to get a smooth picture, we take a bunch of little snapshots of the simulation with step size delT
    // we also want this to happen in these discrete increments regardless of how frequently render is being called
    // so we accumulate how much time passes between running the simulation and rendering, and then run the simulation for the same amount of time
    // if we don't use this, there is one update per rendered frame, and if frame rate drops, our simulation slows
    // we don't want that, so we run as much "game time" as is required to catch up, with a small timestep delTime
    // if we have to play a lot of catchup, there could be lagginess/stuttering if the simulation makes up for this lost time (hasnt happened yet)
    // one potential solution is interpolating between simulation states, which ill put as todo                           INTERPOLATING BETWEEN SIMULATION STATES COULD MAKE SMOOTHER
    accumulator += elapsedTime;
    while (accumulator >= delTime) {
      Module._advanceBoids(delTime); // Update shared heap memory
      accumulator -= delTime;
    }

    // render using sharedHeapCoords (this is a pointer, not a copy!)
    renderer.render(sharedHeapCoords, numBoids, boidDim);
  
    // next frame
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

function endSimulationAndCleanup() {
  if (!simulationRunning) return;

  simulationRunning = false;

  Module._freeBoids();
}
document.getElementById("stopButton").addEventListener("click", endSimulationAndCleanup);


startGame(); 