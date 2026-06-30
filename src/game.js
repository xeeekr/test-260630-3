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

    // 경계 프레임(월드 크기와 위치에 기반)
    // 프레임의 크기는 월드 비율을 적용해 화면에 보이도록 설정
    // 예: 월드 크기가 화면에 맞춘 비율로 보이도록 프레임의 너비/높이를 계산
    // 프레임의 월드 단위 크기를 먼저 계산하고, 이를 화면 좌표로 투영해 렌더링
    const framePadding = 40; // 프레임 주변 여백(월드 경계 프레임의 화면 표시 위치를 일정 간격 유지)
    // 월드 좌표 기준 프레임의 왼쪽 상단(-worldW/2, -worldH/2)에서 월드 중앙 기준으로 표시하기
    // 월드 좌표 기준 프레임의 크기
    const frameWorldW = this.worldW;
    const frameWorldH = this.worldH;

    // 화면 좌표로 변환하여 프레임의 위치를 고정시키되,
    // 월드 경계의 중심에 프레임이 매핑되도록 카메라 중심과의 차이를 고려
    // 월드 좌표의 사각형 경계(왼쪽 위, 크기)
    // 월드 좌표 기준 프레임의 네 구석을 화면 좌표로 변환
    const topLeft = this.worldToScreen(0, 0, camX, camY, w, h);
    const bottomRight = this.worldToScreen(
      this.worldW,
      this.worldH,
      camX,
      camY,
      w,
      h,
    );

    // 프레임의 화면 좌표 위치를 위 두 점으로 간단히 추정
    // 프레임의 왼쪽 상단은 월드 좌상 corner가 화면에서 어느 위치인지에 의해 결정
    // 실제로 프레임을 월드 경계에 맞춰 그림: 프레임의 위치를 월드의 좌상과 좌하를 매핑한 값으로 설정
    // 좌상단 화면 좌표
    const frameLeftTopX = Math.min(topLeft.x, bottomRight.x);
    const frameLeftTopY = Math.min(topLeft.y, bottomRight.y);
    // 프레임의 화면 크기는 월드 프레임의 화면 투영 크기로 계산
    const frameRightBottomX = Math.max(topLeft.x, bottomRight.x);
    const frameRightBottomY = Math.max(topLeft.y, bottomRight.y);
    const frameW = Math.max(0, frameRightBottomX - frameLeftTopX);
    const frameH = Math.max(0, frameRightBottomY - frameLeftTopY);

    // 경계 프레임 그리기(월드 경계에 맞춘 화면 좌표 직사각형)
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    // 프레임이 화면 밖으로 잘리지 않도록 좌표 보정
    ctx.strokeRect(frameLeftTopX, frameLeftTopY, frameW, frameH);
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
