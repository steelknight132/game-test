const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const moveCountEl = document.getElementById("moveCount");
const levelNumberEl = document.getElementById("levelNumber");
const levelSelect = document.getElementById("levelSelect");
const resetBtn = document.getElementById("resetBtn");
const nextBtn = document.getElementById("nextBtn");
const statusMessage = document.getElementById("statusMessage");

const TILE_SIZE = 60;
const COLORS = {
  floor: "#151b3b",
  wall: "#2c3569",
  goal: "#4f62d6",
  crate: "#f0c45c",
  crateOnGoal: "#f6e39a",
  player: "#ff7bb6",
  playerRing: "#fff2f7",
};

const LEVELS = [
  {
    name: "The First Glow",
    layout: [
      "########",
      "#......#",
      "#..$...#",
      "#..#.#.#",
      "#..@#..#",
      "#..#...#",
      "#..*...#",
      "########",
    ],
  },
  {
    name: "Split Path",
    layout: [
      "########",
      "#..#...#",
      "#..$.$.#",
      "#..#...#",
      "#..@#..#",
      "#..#..*#",
      "#......#",
      "########",
    ],
  },
  {
    name: "Crate Carousel",
    layout: [
      "########",
      "#..*...#",
      "#..$#..#",
      "#..$#..#",
      "#..@#..#",
      "#......#",
      "#..*...#",
      "########",
    ],
  },
];

let state = null;

function parseLevel(level) {
  const grid = level.layout.map((row) => row.split(""));
  const goals = new Set();
  const crates = new Set();
  let player = { x: 0, y: 0 };

  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === "@") {
        player = { x, y };
        grid[y][x] = ".";
      }
      if (cell === "$") {
        crates.add(`${x},${y}`);
        grid[y][x] = ".";
      }
      if (cell === "*") {
        crates.add(`${x},${y}`);
        goals.add(`${x},${y}`);
        grid[y][x] = ".";
      }
      if (cell === ".") {
        goals.add(`${x},${y}`);
      }
    });
  });

  return {
    grid,
    goals,
    crates,
    player,
    moves: 0,
    levelName: level.name,
  };
}

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < state.grid.length; y += 1) {
    for (let x = 0; x < state.grid[y].length; x += 1) {
      const cell = state.grid[y][x];
      if (cell === "#") {
        drawTile(x, y, COLORS.wall);
      } else {
        drawTile(x, y, COLORS.floor);
      }

      if (state.goals.has(`${x},${y}`)) {
        ctx.fillStyle = COLORS.goal;
        ctx.beginPath();
        ctx.arc(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          TILE_SIZE / 6,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  state.crates.forEach((coord) => {
    const [x, y] = coord.split(",").map(Number);
    const onGoal = state.goals.has(coord);
    drawTile(x, y, onGoal ? COLORS.crateOnGoal : COLORS.crate);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.strokeRect(x * TILE_SIZE + 6, y * TILE_SIZE + 6, TILE_SIZE - 12, TILE_SIZE - 12);
  });

  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(
    state.player.x * TILE_SIZE + TILE_SIZE / 2,
    state.player.y * TILE_SIZE + TILE_SIZE / 2,
    TILE_SIZE / 3,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.strokeStyle = COLORS.playerRing;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function isWall(x, y) {
  return state.grid[y]?.[x] === "#";
}

function tryMove(dx, dy) {
  const next = {
    x: state.player.x + dx,
    y: state.player.y + dy,
  };
  if (isWall(next.x, next.y)) {
    return;
  }

  const crateKey = `${next.x},${next.y}`;
  if (state.crates.has(crateKey)) {
    const beyond = { x: next.x + dx, y: next.y + dy };
    if (isWall(beyond.x, beyond.y) || state.crates.has(`${beyond.x},${beyond.y}`)) {
      return;
    }
    state.crates.delete(crateKey);
    state.crates.add(`${beyond.x},${beyond.y}`);
  }

  state.player = next;
  state.moves += 1;
  moveCountEl.textContent = state.moves;
  updateStatus();
  draw();
}

function updateStatus() {
  const solved = Array.from(state.crates).every((coord) => state.goals.has(coord));
  if (solved) {
    statusMessage.textContent = `Nice! You solved ${state.levelName}.`;
    statusMessage.classList.add("solved");
  } else {
    statusMessage.textContent = "Arrange the crates to begin.";
    statusMessage.classList.remove("solved");
  }
}

function loadLevel(index) {
  state = parseLevel(LEVELS[index]);
  levelNumberEl.textContent = `${index + 1}`;
  moveCountEl.textContent = "0";
  statusMessage.textContent = `Level ${index + 1}: ${state.levelName}`;
  statusMessage.classList.remove("solved");
  draw();
}

function init() {
  LEVELS.forEach((level, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${index + 1}. ${level.name}`;
    levelSelect.appendChild(option);
  });

  levelSelect.addEventListener("change", (event) => {
    loadLevel(Number(event.target.value));
  });

  resetBtn.addEventListener("click", () => {
    loadLevel(Number(levelSelect.value));
  });

  nextBtn.addEventListener("click", () => {
    const nextIndex = (Number(levelSelect.value) + 1) % LEVELS.length;
    levelSelect.value = `${nextIndex}`;
    loadLevel(nextIndex);
  });

  window.addEventListener("keydown", (event) => {
    const keyMap = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const direction = keyMap[event.key];
    if (!direction) {
      return;
    }
    event.preventDefault();
    tryMove(direction[0], direction[1]);
  });

  levelSelect.value = "0";
  loadLevel(0);
}

init();
