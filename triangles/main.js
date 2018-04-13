const canvas = document.getElementById("canvas");

const LINE_WIDTH = 4;
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
const ctx = canvas.getContext("2d");

function debounce(f) {
  let willFire = false;
  return () => {
    if (willFire) return;
    willFire = true;

    setTimeout(() => {
      f()
      willFire = false;
    }, 1);
  }
}

const debouncedWindowResizeListener = debounce(() => {
  resetShapesData();
  draw();
});

window.addEventListener("resize", () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  debouncedWindowResizeListener();
});

window.addEventListener("keydown", (e) => {
  debugger
  if (e.code === "Space") {
    toggleAnimation();
  } else if (e.code === "KeyR") {
    bumpColor("red");
  } else if (e.code === "KeyG") {
    bumpColor("green");
  } else if (e.code === "KeyB") {
    bumpColor("blue");
  }
});

const COLOR_WEIGHTS = {
  red: 0.5,
  green: 0.5,
  blue: 0.5,
};

function bumpColor(color) {
  COLOR_WEIGHTS[color] *= 2.0;

  const norm = Math.sqrt(
    (COLOR_WEIGHTS.red ** 2)
      + (COLOR_WEIGHTS.green ** 2)
      + (COLOR_WEIGHTS.blue ** 2)
  );

  COLOR_WEIGHTS.red *= Math.sqrt(1.5) / norm;
  COLOR_WEIGHTS.green *= Math.sqrt(1.5) / norm;
  COLOR_WEIGHTS.blue *= Math.sqrt(1.5) / norm;
}

const POW = 1.25;
function randomVal(bias) {
  // Sample from density ~ (x - 0.5)**2.
  // Easier to just on range (0, 0.5) ~ x**2.
  // Then you flip coin for pos or neg.
  // Integral over range is (0.5**3)/3.
  // So solve x = 0.5 (p ** (1/3))

  const offset = 0.5 * (Math.random() ** (1 / POW));
  return Math.random() < bias ? 0.5+offset : 0.5-offset;
}

function randomVector() {
  const redToGreenAngle = randomVal(
    COLOR_WEIGHTS["green"]
  ) * Math.PI / 2;
  const redGreenToBlueAngle = randomVal(
    COLOR_WEIGHTS["blue"]
  ) * Math.PI / 2;

  // Point on the spherical surface.
  return {
    red: Math.cos(redToGreenAngle) * Math.cos(redGreenToBlueAngle),
    green: Math.sin(redToGreenAngle) * Math.cos(redGreenToBlueAngle),
    blue: Math.sin(redGreenToBlueAngle),
  };
}

function randomColor() {
  let vec = randomVector();
  vec = {
    red: Math.floor(256 * vec.red),
    green: Math.floor(256 * vec.green),
    blue: Math.floor(256 * vec.blue),
  };
  const alpha = Math.random();

  return `rgba(${vec.red}, ${vec.green}, ${vec.blue}, ${alpha})`;
}

function randomPoint() {
  const x = Math.random();
  const y = Math.random();

  return { x, y };
}

function pointToPos(point) {
  return {
    x: (-0.2 + 1.4 * point.x) * canvas.width,
    y: (-0.2 + 1.4 * point.y) * canvas.height,
  };
}

function randomLine() {
  const p1 = randomPoint();
  const p2 = randomPoint();
  const color = randomColor();

  return { p1, p2, color };
}

const TARGET_AREA = 0.01;
function randomTriangle() {
  let len1 = Math.random();
  let len2 = Math.random();
  const angle = Math.random() * Math.PI / 2;
  let height = Math.sin(angle) * len2;

  const initialArea = 0.5 * len1 * height;
  len1 /= Math.sqrt(initialArea / TARGET_AREA);
  len2 /= Math.sqrt(initialArea / TARGET_AREA);
  height = Math.sin(angle) * len2;

  const pointPos1 = randomPoint();
  const rotationAngle = Math.random() * (2 * Math.PI);
  const pointPos2 = {
    x: pointPos1.x + Math.cos(rotationAngle) * len1,
    y: pointPos1.y + Math.sin(rotationAngle) * len1,
  }
  const pointPos3 = {
    x: pointPos1.x + Math.cos(angle + rotationAngle) * len2,
    y: pointPos1.y + Math.sin(angle + rotationAngle) * len2,
  }

  const color = randomColor();

  return {
    p1: pointPos1,
    p2: pointPos2,
    p3: pointPos3,
    color
  };
}

function drawLine(l) {
  ctx.strokeStyle = l.color;
  ctx.lineWidth = LINE_WIDTH;

  const pos1 = pointToPos(l.p1);
  const pos2 = pointToPos(l.p2);

  ctx.beginPath();
  ctx.moveTo(pos1.x, pos1.y);
  ctx.lineTo(pos2.x, pos2.y);
  ctx.stroke();
  ctx.closePath();
}

function drawTriangle(t) {
  ctx.fillStyle = t.color;

  const pos1 = pointToPos(t.p1);
  const pos2 = pointToPos(t.p2);
  const pos3 = pointToPos(t.p3);

  ctx.beginPath();
  ctx.moveTo(pos1.x, pos1.y);
  ctx.lineTo(pos2.x, pos2.y);
  ctx.lineTo(pos3.x, pos3.y);
  ctx.lineTo(pos1.x, pos1.y);
  ctx.fill();
  ctx.closePath();
}

const MAX_SHAPES = 200;
const SHAPES = [];
const SHAPES_DATA = new Map();

function generateLine() {
  drawLine(randomLine());
}

function generateTriangle() {
  const s = randomTriangle();
  SHAPES.push(s);
  SHAPES_DATA.set(s, false);

  if (SHAPES.length > MAX_SHAPES) {
    const s = SHAPES.shift();
    SHAPES_DATA.delete(s);
  }
}

function resetShapesData() {
  for (const shape of SHAPES) {
    SHAPES_DATA.set(shape, false);
  }
}



function draw() {
  for (const shape of SHAPES) {
    const isDrawn = SHAPES_DATA.get(shape);
    if (!isDrawn) {
      drawTriangle(shape);
      SHAPES_DATA.set(shape, true);
    }
  }
}

let isPaused = false;
function toggleAnimation() {
  isPaused = !isPaused;
}

setInterval(
  () => {
    if (isPaused) return;
    generateTriangle();
    draw();
  },
  10
);
