import { Game } from "./game.js";
import { clamp } from "./utils.js"; // 필요한 경우 제거하고 game.js 내 import 사용

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

const game = new Game({ width: 800, height: 600 });
game.start();

window.addEventListener("keydown", (e) => game.inputKey(e.key, true));
window.addEventListener("keyup", (e) => game.inputKey(e.key, false));
