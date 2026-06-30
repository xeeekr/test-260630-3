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

  render() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // 배경 그리기 (월드 경계 표시를 위한 여백 포함)
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    // 화면 중앙 카메라 설정
    const screenW = w;
    const screenH = h;
    const camX = this.player.x;
    const camY = this.player.y;

    ctx.save();
    ctx.translate(screenW / 2, screenH / 2); // 화면 중앙을 원점으로
    // 월드 경계 표시: 화면 중앙에서 월드 경계까지의 시각적 프레임
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    // 경계 사각형: 중앙에서 월드 경계까지의 상대 좌표를 사용
    ctx.rect(-this.worldW / 2, -this.worldH / 2, this.worldW, this.worldH);
    ctx.stroke();

    // 월드 경계 내부에 렌더링: 나무와 잔디(격자 형태는 월드 경계 안에서만)
    // 나무
    this.trees.forEach((t) => {
      const tx = t.x - camX;
      const ty = t.y - camY;
      // 화면 밖에 못 보이게 필터링
      if (
        tx < -screenW / 2 - t.r ||
        tx > screenW / 2 + t.r ||
        ty < -screenH / 2 - t.r ||
        ty > screenH / 2 + t.r
      )
        return;

      ctx.fillStyle = "#2e5d2e";
      ctx.beginPath();
      ctx.arc(tx, ty, t.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3b9b3b";
      ctx.beginPath();
      ctx.arc(tx - t.r * 0.4, ty - t.r * 0.4, t.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tx + t.r * 0.4, ty - t.r * 0.4, t.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tx, ty - t.r * 0.7, t.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // 플레이어
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, this.player.size, 0, Math.PI * 2);
    ctx.fill();

    // 방향 표시
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.player.size * 1.5, 0);
    ctx.stroke();

    ctx.restore();
  }
}
