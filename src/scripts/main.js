const game = {
  score: {
    view: document.querySelector("#score"),
    limit: 9999999,
    value: 0,
  },
  time: {
    view: document.querySelector("#time"),
    id: null,
    value: 45,
  },
  hiscore: {
    view: document.querySelector("#hiscore"),
    value: 0,
  },
  life: {
    view: document.querySelectorAll("#life > img"),
    limit: 5,
    value: 3,
  },
  map: {
    view: [
      Array.from(document.querySelectorAll(".window-closed")),
      Array.from(document.querySelectorAll("div[id^='wp0']")),
      Array.from(document.querySelectorAll("div[id^='wp1']")),
      Array.from(document.querySelectorAll("div[id^='wp2']")),
    ],
  },
  player: {
    view: document.querySelector("#player"),
    isBusy: false,
    pos: { x: 3, y: 0, minX: 1, maxX: 3, minY: 0, maxY: 4 },
    velocity: 0.5,
    timeFixingID: null,
    timeFixing: 500, //ms
  },
  enemy: {
    view: document.querySelector("#enemy"),
    pos: { x: 0, y: 0 },
    velocity: 0.2,
    wreckDuration: 500, //ms
  },
};

function addScore(value = 0) {
  var score = game.score.value;
  score += value;

  if (score < 0) score = 0;
  else if (score > game.score.limit) score = game.score.limit;

  game.score.view.textContent = String(score).padStart(7, "0");
  game.score.value = score;

  return game.score;
}

function addLife(value = 0) {
  var lifeCount = game.life.value;
  var lifeMenu = game.life.view;

  lifeCount += value;

  if (lifeCount < 0) lifeCount = 0;
  else if (lifeCount > game.life.limit) lifeCount = game.life.limit;

  for (i = 0; i < lifeMenu.length; i++) {
    if (lifeCount > i) {
      lifeMenu[i].hidden = false;
      continue;
    }

    lifeMenu[i].hidden = true;
  }

  game.life.value = lifeCount;

  return game.life;
}

function updateHiscore() {
  var hiscore =
    game.score.value > game.hiscore.value
      ? game.score.value
      : game.hiscore.value;

  game.hiscore.view.textContent = String(hiscore).padStart(7, "0");
  game.hiscore.value = hiscore;

  return game.hiscore;
}

function updateTime() {
  var time = game.time.value;

  game.time.view.textContent = String(time).padStart(2, "0");

  if (time <= 0) clearInterval(game.time.id);
  else time--;

  game.time.value = time;
}

function startTime() {
  if (game.time.id) return game.time;

  updateTime();

  game.time.id = setInterval(updateTime, 1000);

  return game.time;
}

function getWindowPosition({ x, y }) {
  var windowView = game.map.view[x][y];
  var windowRect = windowView.getBoundingClientRect();

  var { top: bWindowTop, left: bWindowLeft } = window.getComputedStyle(
    windowView,
    "::before"
  );

  windowRect.x += parseFloat(bWindowLeft) || 0;
  windowRect.y += parseFloat(bWindowTop) || 0;

  return windowRect;
}

function spawnPlayer() {
  var playerView = game.player.view;

  playerView.addEventListener(
    "animationstart",
    () => (game.player.isBusy = true)
  );

  playerView.addEventListener("animationend", () => {
    if (playerView.classList.contains("fixing"))
      game.map.view[x][y].style.backgroundPositionX = "";

    playerView.classList.remove("jump");

    game.player.isBusy = false;
  });

  var { top: newPosTop, left: newPosLeft } = getWindowPosition(game.player.pos);

  playerView.style.top = `${newPosTop}px`;
  playerView.style.left = `${newPosLeft}px`;

  addPlayerController();
}

function movePlayer() {
  var playerView = game.player.view;

  var {
    top: playerTop,
    left: playerLeft,
    width: playerWidth,
  } = playerView.getBoundingClientRect();

  var {
    top: newPosTop,
    left: newPosLeft,
    right: newPosRight,
  } = getWindowPosition(game.player.pos);

  newPosLeft = playerView.classList.contains("flipX")
    ? newPosRight - playerWidth
    : newPosLeft;

  var distanceX = Math.abs(playerLeft - newPosLeft);
  var distanceY = Math.abs(playerTop - newPosTop);
  var duration = parseInt((distanceY + distanceX) / game.player.velocity);

  playerView.classList.add("jump");
  playerView.style.transitionDuration = `${duration}ms`;
  playerView.style.top = `${newPosTop}px`;
  playerView.style.left = `${newPosLeft}px`;

  return playerView.getBoundingClientRect();
}

function updateEnemyPosition() {
  try {
    var randPosX = parseInt(Math.random() * game.enemy.mapView.length);

    var x =
      randPosX === game.enemy.posX
        ? (randPosX + 1) % game.enemy.mapView.length
        : randPosX;
    var enemyView = game.enemy.view;
    var windowView = game.enemy.mapView[x];

    game.enemy.posX = x;

    var {
      top: enemyTop,
      left: enemyLeft,
      height: enemyHeight,
    } = enemyView.getBoundingClientRect();

    var {
      left: windowLeft,
      bottom: windowBottom,
      width: windowWidth,
    } = windowView.getBoundingClientRect();

    var newPosTop = windowBottom - enemyHeight;
    var newPosLeft = windowLeft - windowWidth / 2;

    var disTop = Math.abs(enemyTop - newPosTop);
    var disLeft = Math.abs(enemyLeft - newPosLeft);
    var duration = parseInt((disTop + disLeft) / game.enemy.velocity);

    enemyView.classList.add("move");
    enemyView.style.transitionDuration = `${duration}ms`;
    enemyView.style.top = `${newPosTop}px`;
    enemyView.style.left = `${newPosLeft}px`;
  } finally {
    setTimeout(() => {
      enemyView.classList.remove("move");
      enemyWreckIt();
    }, duration);
    return enemyView.getBoundingClientRect();
  }
}

function spawnEnemy() {
  var enemyView = game.enemy.view;

  enemyView.addEventListener("transitionend", () => {
    enemyView.classList.remove("move");

    enemyWreckIt();
  });

  enemyView.addEventListener("animationend", () => {
    game.enemy.view.classList.remove("wreck");

    updateEnemyPosition();
  });

  var { height: enemyHeight } = enemyView.getBoundingClientRect();

  var {
    left: windowLeft,
    bottom: windowBottom,
    width: windowWidth,
  } = getWindowPosition(game.enemy.pos);

  var newPosTop = windowBottom - enemyHeight;
  var newPosLeft = windowLeft - windowWidth / 2;

  enemyView.style.top = `${newPosTop}px`;
  enemyView.style.left = `${newPosLeft}px`;

  requestAnimationFrame(updateEnemyPosition);
}


function enemyWreckIt() {
  game.enemy.view.classList.add("wreck");

  requestAnimationFrame(throwWreck);
}

function throwWreck() {
  var {
    x: enemyX,
    y: enemyY,
    width: enemyWidth,
    height: enemyHeight,
  } = game.enemy.view.getBoundingClientRect();

  var { bottom: endPos } = document.body
    .querySelector("#level")
    .getBoundingClientRect();

  var iniPosTop = enemyY + enemyHeight;
  var iniPosLeft = enemyX + enemyWidth / 2;

  var wreck = document.createElement("div");
  wreck.classList.add("wreckage");
  wreck.style.top = `${iniPosTop}px`;
  wreck.style.left = `${iniPosLeft}px`;

  document.body.querySelector("main").appendChild(wreck);

  requestAnimationFrame(() => {
    var distance = Math.abs(iniPosTop - endPos);
    var duration = parseInt(distance / game.wreckage.velocity);

    wreck.style.transitionDuration = `${duration}ms`;
    wreck.style.top = `${endPos}px`;
  });

  wreck.addEventListener("transitionend", () => wreck.remove());
}
}

function addPlayerController() {
  window.addEventListener("keydown", (event) => {
    event.preventDefault();

    if (game.player.isBusy) return;

    switch (event.key) {
      case "ArrowDown":
        if (game.player.pos.x >= game.player.pos.maxX) break;

        game.player.pos.x++;

        movePlayer();
        break;
      case "ArrowUp":
        if (game.player.pos.x <= game.player.pos.minX) break;

        game.player.pos.x--;

        movePlayer();
        break;
      case "ArrowRight":
        if (game.player.pos.y >= game.player.pos.maxY) break;

        game.player.view.classList.remove("flipX");
        game.player.pos.y++;

        movePlayer();
        break;
      case "ArrowLeft":
        if (game.player.pos.y <= game.player.pos.minY) break;

        game.player.view.classList.add("flipX");
        game.player.pos.y--;

        movePlayer();
        break;
      case "e":
        if (!windowIsBreak(game.player.pos)) break;

        game.player.isBusy = true;

        game.player.view.classList.add("fixing");
        break;
    }
  });
}

function breakWindows() {
  var windows = document.querySelectorAll(".window");

  for (var w of windows) {
    var { width: wWidth } = w.getBoundingClientRect();

    var randTop = Math.round(Math.random() + 1);
    var randBottom = Math.round(Math.random() + 1);

    w.style.backgroundPositionX = `${wWidth * -randTop}px, ${
      wWidth * -randBottom
    }px`;
  }
}

function windowIsBreak({ x, y }) {
  return game.map.view[x][y].style.backgroundPositionX !== "";
}

function fixWindows({ x, y }) {
  game.player.isBusy = true;

  game.player.view.classList.add("fixing");
}

function main() {
  spawnPlayer();
  spawnEnemy();
}

main();
