const game = {
  score: {
    view: document.querySelector("#score"),
    limit: 9999999,
    points: 0,
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
    view: document.querySelector("#life"),
    limit: 5,
    count: 3,
  },
  player: {
    view: document.querySelector("#player"),
    mapView: [
      Array.from(document.querySelectorAll("div[id^='wp0']")),
      Array.from(document.querySelectorAll("div[id^='wp1']")),
      Array.from(document.querySelectorAll("div[id^='wp2']")),
    ],
    pos: { x: 2, y: 0 },
    velocity: 0.5,
    isBussy: false,
    timeFixingID: null,
    timeFixing: 500, //ms
  },
  enemy: {
    view: document.querySelector("#enemy"),
    mapView: Array.from(document.querySelectorAll(".window-closed")),
    posX: 0,
    velocity: 0.2,
    wreckDuration: 500, //ms
  },
};

function addScore(value = 0) {
  var score = game.score.points;
  score += value;

  if (score < 0) score = 0;
  else if (score > game.score.limit) score = game.score.limit;

  game.score.view.textContent = String(score).padStart(7, "0");
  game.score.points = score;

  return game.score;
}

function updateLife(value = 0) {
  var lifeCount = game.life.count;
  lifeCount += value;

  if (lifeCount < 0) lifeCount = 0;
  else if (lifeCount > game.life.limit) lifeCount = game.life.limit;

  var lifeMenu = Array.from(game.life.view.getElementsByTagName("img"));

  for (i = 0; i < lifeMenu.length; i++) {
    if (lifeCount > i) {
      lifeMenu[i].hidden = false;
      continue;
    }

    lifeMenu[i].hidden = true;
  }

  game.life.count = lifeCount;

  return game.life;
}

function updateHiscore() {
  var hiscore =
    game.score.points > game.hiscore.value
      ? game.score.points
      : game.hiscore.value;

  game.hiscore.view.textContent = String(hiscore).padStart(7, "0");
  game.hiscore.value = hiscore;

  return game.hiscore;
}

function startTime() {
  if (game.time.id) return game.time;

  game.time.id = setInterval(() => {
    var time = game.time.value;

    game.time.view.textContent = String(time).padStart(2, "0");

    if (time <= 0) clearInterval(game.time.id);
    else time--;

    game.time.value = time;
  }, 1000);

  return game.time;
}

function updatePlayerPosition() {
  try {
    var { x, y } = game.player.pos;
    var playerView = game.player.view;
    var windowView = game.player.mapView[x][y];

    var {
      top: playerTop,
      left: playerLeft,
      width: playerWidth,
    } = playerView.getBoundingClientRect();

    var { top: windowTop, left: windowLeft } =
      windowView.getBoundingClientRect();

    var {
      top: bWindowTop,
      left: bWindowLeft,
      width: bWindowWidth,
    } = window.getComputedStyle(windowView, "::before");

    var paddingLeft = playerView.classList.contains("flipX")
      ? parseFloat(bWindowWidth) - playerWidth
      : 0;

    var newPosTop = windowTop + parseFloat(bWindowTop);
    var newPosLeft = windowLeft + parseFloat(bWindowLeft) + paddingLeft;

    var disTop = Math.abs(playerTop - newPosTop);
    var disLeft = Math.abs(playerLeft - newPosLeft);
    var duration = parseInt((disTop + disLeft) / game.player.velocity);

    game.player.isBussy = true;

    playerView.classList.add("jump");
    playerView.style.transitionDuration = `${duration}ms`;
    playerView.style.top = `${newPosTop}px`;
    playerView.style.left = `${newPosLeft}px`;
  } finally {
    setTimeout(() => {
      game.player.isBussy = false;

      playerView.classList.remove("jump");
    }, duration);
    return playerView.getBoundingClientRect();
  }
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

function enemyWreckIt() {
  game.enemy.view.classList.add("wreck");

  setTimeout(() => {
    game.enemy.view.classList.remove("wreck");
    updateEnemyPosition();
  }, game.enemy.wreckDuration);

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
  window.addEventListener(
    "keydown",
    (event) => {
      event.preventDefault();

      if (game.player.isBussy) return;

      switch (event.key) {
        case "ArrowDown":
          if (game.player.pos.x >= game.player.mapView.length - 1) break;

          game.player.pos.x++;

          updatePlayerPosition();
          break;
        case "ArrowUp":
          if (game.player.pos.x <= 0) break;

          game.player.pos.x--;

          updatePlayerPosition();
          break;
        case "ArrowRight":
          if (game.player.pos.y >= game.player.mapView[0].length - 1) break;

          game.player.pos.y++;
          game.player.view.classList.remove("flipX");

          updatePlayerPosition();
          break;
        case "ArrowLeft":
          if (game.player.pos.y <= 0) break;

          game.player.pos.y--;
          game.player.view.classList.add("flipX");

          updatePlayerPosition();
          break;
        case "e":
          if (!windowIsBreak(game.player.pos)) break;

          fixWindows(game.player.pos);
          break;
        default:
          break;
      }
    },
    true
  );
  window.addEventListener("keyup", (event) => {
    event.preventDefault();

    if (!game.player.isBussy) return;

    switch (event.key) {
      case "e":
        game.player.isBussy = false;

        game.player.view.classList.remove("fixing");

        clearInterval(game.player.timeFixingID);
        break;
      default:
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
  return game.player.mapView[x][y].style.backgroundPositionX !== "";
}

function fixWindows({ x, y }) {
  game.player.isBussy = true;

  game.player.view.classList.add("fixing");

  game.player.timeFixingID = setTimeout(() => {
    game.player.isBussy = false;

    game.player.view.classList.remove("fixing");

    game.player.mapView[x][y].style.backgroundPositionX = "";
  }, game.player.timeFixing);
}

