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
    velocity: 2.0,
    isBussy: false,
  },
  enemy: {
    mapView: Array.from(document.querySelectorAll(".window-closed")),
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
    var duration = parseInt((disTop + disLeft) * game.player.velocity);

    playerView.style.transitionDuration = `${duration}ms`;
    playerView.style.top = `${newPosTop}px`;
    playerView.style.left = `${newPosLeft}px`;
  } finally {
    setTimeout(() => {
      game.player.isBussy = false;
    }, duration);
    return playerView.getBoundingClientRect();
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
          if (game.player.pos.x >= game.player.mapView.length - 1) return;

          game.player.pos.x++;
          break;
        case "ArrowUp":
          if (game.player.pos.x <= 0) return;

          game.player.pos.x--;
          break;
        case "ArrowRight":
          if (game.player.pos.y >= game.player.mapView[0].length - 1) return;

          game.player.pos.y++;
          game.player.view.classList.remove("flipX");
          break;
        case "ArrowLeft":
          if (game.player.pos.y <= 0) return;

          game.player.pos.y--;
          break;
        default:
          return;
      }

      game.player.isBussy = true;
      updatePlayerPosition();
    },
    true
  );
}
