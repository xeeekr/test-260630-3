import { clamp } from "./utils.js"; // 필요한 경우 제거하고 game.js 내 import 사용

export class Game {
  constructor(opts) {
    this.worldW = opts.width;
    this.worldH = opts.height;
    this.player = {
      x: this.worldW / 2,
      y: this.worldH / 2,
      size: 20,
      speed: 120,
    }; // px/sec
    this.keys = {};
    this.last = performance.now();
    this.zoom = 1;
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.initTrees(60);
  }

  initTrees(count) {
    this.trees = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.worldW;
      const y = Math.random() * this.worldH;
      const r = 8 + Math.random() * 14;
      this.trees.push({ x, y, r });
    }
  }

  start() {
    this.running = true;
    this.loop();
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = (now - this.last) / 1000;
    this.last = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  inputKey(key, isDown) {
    this.keys[key] = isDown;
  }

  update(dt) {
    let vx = 0,
      vy = 0;
    if (this.keys["ArrowUp"] || this.keys["w"] || this.keys["W"]) vy -= 1;
    if (this.keys["ArrowDown"] || this.keys["s"] || this.keys["S"]) vy += 1;
    if (this.keys["ArrowLeft"] || this.keys["a"] || this.keys["A"]) vx -= 1;
    if (this.keys["ArrowRight"] || this.keys["d"] || this.keys["D"]) vx += 1;

    const mag = Math.hypot(vx, vy) || 0;
    if (mag > 0) {
      vx /= mag;
      vy /= mag;
    }
    this.player.x += vx * this.player.speed * dt;
    this.player.y += vy * this.player.speed * dt;

    // 월드 경계 제한
    this.player.x = clamp(this.player.x, 0, this.worldW);
    this.player.y = clamp(this.player.y, 0, this.worldH);
  }

  // 월드좌표 -> 화면좌표 변환
  worldToScreen(wx, wy, camX, camY, screenW, screenH) {
    // 카메라 중심: 플레이어를 화면 중앙에 두되
    // 월드 좌표를 기준으로 상대좌표를 계산한다.
    // 화면 좌표에서의 중심은 (screenW/2, screenH/2)
    const sx = wx - camX + screenW / 2;
    const sy = wy - camY + screenH / 2;
    return { x: sx, y: sy };
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // 배경
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    // 화면 중심을 카메라 중심으로 설정
    const camX = this.player.x;
    const camY = this.player.y;

    // 월드 좌표계의 경계는 화면 중앙에서 고정된 프레임으로 표시하기 위해
    // 경계 프레임은 화면 좌표계의 절대 위치에 그림
    // 화면 중앙에 카메라가 있다면 경계 프레임의 절대 위치를 (margin, margin)처럼 고정하거나
    // 또는 화면 좌표의 중앙에 그리되 월드 경계에 대한 비율로 표시 가능. 아래는 화면 중앙 기준 고정 예시.
    const boundaryPadding = 20; // 화면 경계 프레임과 화면 가장자리 간 여백
    const frameX = boundaryPadding;
    const frameY = boundaryPadding;
    const frameW = w - boundaryPadding * 2;
    const frameH = h - boundaryPadding * 2;

    // 경계 프레임(고정 화면 좌표)
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.strokeRect(frameX, frameY, frameW, frameH);
    ctx.restore();

    // 월드 내 객체(나무) 렌더링: 월드 좌표를 화면 좌표로 변환
    this.trees.forEach((t) => {
      const screenPos = this.worldToScreen(t.x, t.y, camX, camY, w, h);
      // 화면 밖 여부 필터
      if (
        screenPos.x < -t.r ||
        screenPos.x > w + t.r ||
        screenPos.y < -t.r ||
        screenPos.y > h + t.r
      )
        return;

      ctx.fillStyle = "#2e5d2e";
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, t.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3b9b3b";
      ctx.beginPath();
      ctx.arc(
        screenPos.x - t.r * 0.4,
        screenPos.y - t.r * 0.4,
        t.r * 0.7,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        screenPos.x + t.r * 0.4,
        screenPos.y - t.r * 0.4,
        t.r * 0.7,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y - t.r * 0.7, t.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // 플레이어(화면 중앙 근처에 고정된 위치로 렌더링)
    // 화면 중앙에 고정된 플레이어 표현
    const playerScreenX = w / 2;
    const playerScreenY = h / 2;

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, this.player.size, 0, Math.PI * 2);
    ctx.fill();

    // 방향 표시
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerScreenX, playerScreenY);
    ctx.lineTo(playerScreenX + this.player.size * 1.5, playerScreenY);
    ctx.stroke();
  }
}
