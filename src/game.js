import { clamp } from "./utils.js";

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
    this.zoom = 1; // 확대/축소는 향후 확장용 기본 1
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

    // 정규화하여 방향 벡터를 일정 속도로
    const mag = Math.hypot(vx, vy) || 0;
    if (mag > 0) {
      vx /= mag;
      vy /= mag;
    }
    this.player.x += vx * this.player.speed * dt;
    this.player.y += vy * this.player.speed * dt;

    // 월드 경계 내 제한
    this.player.x = clamp(this.player.x, 0, this.worldW);
    this.player.y = clamp(this.player.y, 0, this.worldH);
  }

  render() {
    // 화면 중앙에 고정된 카메라 가정: 플레이어를 화면 중앙에 두고, 월드 좌표를 화면 중앙으로 맵핑
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // 화면 크기 기준으로 월드 좌표를 화면 좌표로 변환
    const screenW = canvas.clientWidth;
    const screenH = canvas.clientHeight;
    const camX = this.player.x;
    const camY = this.player.y;

    // 간단한 배경 그리기 (격자)
    ctx.save();
    ctx.translate(screenW / 2, screenH / 2); // 화면 중앙을 원점으로
    // 월드 좌표계를 화면에 맞게 표시: 플레이어를 원점으로 두고, 나머지 오브젝트를 -cam
    const gridSize = 40;
    const offsetX = -camX;
    const offsetY = -camY;

    // 경계선(가상 월드)
    ctx.fillStyle = "#0b0b0f";
    ctx.fillRect(-screenW / 2, -screenH / 2, screenW, screenH);

    // 격자
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;
    const left = -screenW,
      right = screenW,
      top = -screenH,
      bottom = screenH;
    for (let x = left - (camX % gridSize); x < right; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    for (let y = top - (camY % gridSize); y < bottom; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    // 플레이어
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(camX - camX, camY - camY, this.player.size, 0, Math.PI * 2);
    ctx.fill();

    // 방향 표시 등(선)
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.player.size * 1.5, 0);
    ctx.stroke();

    ctx.restore();
  }
}

// 유틸리티 파일 추가 필요
