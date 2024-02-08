const game = {
  audios: {
    game: new Audio("../../res/audio/GAME.wav"),
    timer: new Audio("../../res/audio/GAME-TIMER.wav"),
    fix: new Audio("../../res/audio/FELIX-FIX.wav"),
    jump: new Audio("../../res/audio/FELIX-JUMP.wav"),
    wreck: new Audio("../../res/audio/DETONA-WRECK.wav"),
    damage: new Audio("../../res/audio/FELIX-DAMAGE.wav"),
  },
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
  },
  enemy: {
    view: document.querySelector("#enemy"),
    pos: { x: 0, y: 0 },
    velocity: 0.1,
  },
  wreckage: {
    velocity: 0.2,
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
  
  if (time == 8) playAudio("timer");
  if (time <= 0) clearInterval(game.time.id);

  game.time.value = --time;
}

function startTime() {
  if (game.time.id) return game.time;

  updateTime();

  game.time.id = setInterval(updateTime, 1000);

  return game.time;
}

function playAudio(name, repeatTime = 0, delay = 250, volume = 0.2) {
  game.audios[name].pause();
  game.audios[name].volume = volume;
  game.audios[name].currentTime = 0;
  game.audios[name].play();

  if (repeatTime > 0) {
    var id = setTimeout(() => {
      playAudio(name, repeatTime - 1);

      clearTimeout(id);
    }, delay);
  }
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
    if (playerView.classList.contains("fixing")) fixWindows();

    playerView.classList.remove("jump");
    playerView.classList.remove("take-damage");
    playerView.classList.remove("fixing");

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

  playAudio("jump");

  return playerView.getBoundingClientRect();
}

function fixWindows() {
  var { x, y } = game.player.pos;

  addScore(200);

  game.map.view[x][y].style.backgroundPositionX = "";
}

function spawnEnemy() {
  var enemyView = game.enemy.view;

  enemyView.addEventListener("transitionend", () => {
    enemyView.classList.remove("move");

    enemyWreckIt();
  });

  enemyView.addEventListener("animationend", () => {
    game.enemy.view.classList.remove("wreck");

    requestAnimationFrame(() => {
      throwWreck();
      moveEnemy();
    });
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

  requestAnimationFrame(moveEnemy);
}

function randomEnemyNextPosition() {
  var enemyView = game.enemy.view;
  var randPosX = parseInt(Math.random() * game.map.view[0].length);

  var y =
    randPosX === game.enemy.pos.y
      ? (randPosX + 1) % game.map.view[0].length
      : randPosX;

  if (game.enemy.pos.y > y) enemyView.classList.add("flipX");
  else enemyView.classList.remove("flipX");

  game.enemy.pos.y = y;

  return game.enemy.pos;
}

function moveEnemy() {
  var enemyView = game.enemy.view;

  var {
    top: enemyTop,
    left: enemyLeft,
    height: enemyHeight,
  } = enemyView.getBoundingClientRect();

  randomEnemyNextPosition();

  var {
    left: windowLeft,
    bottom: windowBottom,
    width: windowWidth,
  } = getWindowPosition(game.enemy.pos);

  var newPosTop = windowBottom - enemyHeight;
  var newPosLeft = windowLeft - windowWidth / 2;

  var distanceY = Math.abs(enemyTop - newPosTop);
  var distanceX = Math.abs(enemyLeft - newPosLeft);
  var duration = parseInt((distanceY + distanceX) / game.enemy.velocity);

  enemyView.classList.add("move");
  enemyView.style.transitionDuration = `${duration}ms`;
  enemyView.style.top = `${newPosTop}px`;
  enemyView.style.left = `${newPosLeft}px`;

  return enemyView.getBoundingClientRect();
}

function enemyWreckIt() {
  game.enemy.view.classList.add("wreck");

  playAudio("wreck", 3);
}

function throwWreck() {
  var {
    left: windowLeft,
    bottom: windowBottom,
    width: windowWidth,
  } = getWindowPosition(game.enemy.pos);

  var { bottom: endPos } = document.body
    .querySelector("#level")
    .getBoundingClientRect();

  var wreck = document.createElement("div");
  wreck.classList.add("wreckage");

  document.body.querySelector("main").appendChild(wreck);

  var { width: wreckWidth } = wreck.getBoundingClientRect();

  var iniPosTop = windowBottom;
  var iniPosLeft = windowLeft + (windowWidth / 2 - wreckWidth / 2);

  wreck.style.top = `${iniPosTop}px`;
  wreck.style.left = `${iniPosLeft}px`;

  wreck.addEventListener("transitionstart", () => collidedWithPlayer(wreck));
  wreck.addEventListener("transitionend", () => wreck.remove());

  requestAnimationFrame(() => {
    var distance = Math.abs(iniPosTop - endPos);
    var duration = parseInt(distance / game.wreckage.velocity);

    wreck.style.transitionDuration = `${duration}ms`;
    wreck.style.top = `${endPos}px`;
  });
}

function collidedWithPlayer(view) {
  if (isPlayerCollidedWith(view.getBoundingClientRect())) {
    game.player.isBusy = true;

    addLife(-1);

    game.player.view.classList.add("take-damage");

    playAudio("damage");
    return;
  }

  requestAnimationFrame(() => collidedWithPlayer(view));
}

function isPlayerCollidedWith(rect) {
  var playerRect = game.player.view.getBoundingClientRect();

  return (
    rect.left <= playerRect.right &&
    rect.right >= playerRect.left &&
    rect.top <= playerRect.bottom &&
    rect.bottom >= playerRect.top
  );
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

        playAudio("fix", 1);
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

function main() {
  spawnPlayer();
  spawnEnemy();
  breakWindows();
  startTime();

  playAudio("game", 0, 0, 0.5);
}

main();
