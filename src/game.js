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
    // 숲 나무 데이터: 간단한 위치 배열(월드 좌표)
    this.trees = [];
    this.initTrees(60); // 트리 개수 예시
  }

  initTrees(count) {
    for (let i = 0; i < count; i++) {
      // 월드 좌표 내 임의 위치
      const x = Math.random() * this.worldW;
      const y = Math.random() * this.worldH;
      const r = 8 + Math.random() * 14; // 나무 반지름
      const a = Math.random() * Math.PI * 2; // 회전 각도(장식용)
      this.trees.push({ x, y, r, a });
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

    // 월드 경계
    this.player.x = clamp(this.player.x, 0, this.worldW);
    this.player.y = clamp(this.player.y, 0, this.worldH);
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // 배경: 숲 느낌의 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#1b3a2e"); // 상단 어두운 초록
    gradient.addColorStop(1, "#0b2b14"); // 하단 더 어둡게
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // 화면 중앙에 플레이어를 두고, 월드 좌표를 -cam으로 표현
    const screenW = w;
    const screenH = h;
    const camX = this.player.x;
    const camY = this.player.y;

    ctx.save();
    ctx.translate(screenW / 2, screenH / 2); // 화면 중앙을 원점으로
    const gridSize = 40;
    const offsetX = -camX;
    const offsetY = -camY;

    // 숲 배경에 잔디 패턴(격자 위에 미세 포인트)
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    for (let x = -screenW; x < screenW; x += gridSize) {
      ctx.fillRect(x, -screenH, 2, screenH * 2);
    }
    for (let y = -screenH; y < screenH; y += gridSize) {
      ctx.fillRect(-screenW, y, screenW * 2, 2);
    }

    // 나무 그리기
    this.trees.forEach((t) => {
      const tx = t.x + offsetX;
      const ty = t.y + offsetY;
      // 화면 밖 나무는 생략 (가시성 최적화)
      if (
        tx < -screenW / 2 - t.r ||
        tx > screenW / 2 + t.r ||
        ty < -screenH / 2 - t.r ||
        ty > screenH / 2 + t.r
      )
        return;
      // 나무 원
      ctx.fillStyle = "#2e5d2e";
      ctx.beginPath();
      ctx.arc(tx, ty, t.r, 0, Math.PI * 2);
      ctx.fill();
      // 나뭇잎 층
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

    // 플레이어(중앙 표시)
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(camX - camX, camY - camY, this.player.size, 0, Math.PI * 2);
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
