class AudioGame extends Audio {
  constructor(path) {
    super(path);

    this.repeatTime = 0;
    this.delay = 0; //ms
  }

  resume() {
    if (this.currentTime <= 0 && this.repeatTime <= 0) return;

    this.play();
  }

  stop() {
    this.pause();
    this.currentTime = 0;

    if (this.repeatTime > 0) this.repeatTime--;
  }

  play() {
    this.onended = () => this.stop();
    super.play();

    if (this.repeatTime > 0) {
      var id = setTimeout(() => {
        this.stop();
        this.play();

        clearTimeout(id);
      }, this.delay);
    }
  }
}

class Game {
  constructor() {
    this.isPaused = false;
    this.audios = {
      game: new AudioGame("../../res/audio/GAME.wav"),
      timer: new AudioGame("../../res/audio/GAME-TIMER.wav"),
      fix: new AudioGame("../../res/audio/FELIX-FIX.wav"),
      jump: new AudioGame("../../res/audio/FELIX-JUMP.wav"),
      wreck: new AudioGame("../../res/audio/DETONA-WRECK.wav"),
      damage: new AudioGame("../../res/audio/FELIX-DAMAGE.wav"),
    };
    this.score = {
      view: document.querySelector("#score"),
      limit: 9999999,
      value: 0,
    };
    this.time = {
      view: document.querySelector("#time"),
      id: null,
      value: 45,
    };
    this.hiscore = {
      view: document.querySelector("#hiscore"),
      value: 0,
    };
    this.life = {
      view: document.querySelectorAll("#life > img"),
      limit: 5,
      value: 3,
    };
    this.map = {
      view: [
        Array.from(document.querySelectorAll(".window-closed")),
        Array.from(document.querySelectorAll("div[id^='wp0']")),
        Array.from(document.querySelectorAll("div[id^='wp1']")),
        Array.from(document.querySelectorAll("div[id^='wp2']")),
      ],
    };
    this.player = {
      view: document.querySelector("#player"),
      isBusy: false,
      pos: { x: 3, y: 0, minX: 1, maxX: 3, minY: 0, maxY: 4 },
      velocity: 0.5,
    };
    this.enemy = {
      view: document.querySelector("#enemy"),
      pos: { x: 0, y: 0 },
      velocity: 0.1,
    };
    this.wreckage = {
      velocity: 0.2,
    };
  }
}

var game = null;

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

function addTime(value = 0) {
  var time = game.time.value + value;

  game.time.view.textContent = String(time).padStart(2, "0");

  game.time.value = time;
}

function updateTime() {
  if (game.isPaused) return;

  var time = game.time.value;

  if (time <= 0) clearInterval(game.time.id);
  if (time == 8) playAudio(game.audios.timer);

  addTime(-1);
}

function startTime() {
  if (game.time.id) return game.time;

  updateTime();

  game.time.id = setInterval(updateTime, 1000);

  return game.time;
}

function playAudio(audio, repeatTime = 0, delay = 250, volume = 0.2) {
  if (game.isPaused) return;

  audio.repeatTime = repeatTime;
  audio.delay = delay;
  audio.volume = volume;
  audio.play();
}

function muteAudio() {
  for (var name in game.audios) {
    if (game.isPaused) game.audios[name].pause();
    else game.audios[name].resume();
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

    playerView.classList.remove("jump", "take-damage", "fixing");

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

  playAudio(game.audios.jump);

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

    enemyView.getAnimations().forEach((anim) => anim.cancel());

    enemyWreckIt();
  });

  enemyView.addEventListener("animationend", () => {
    enemyView.classList.remove("wreck");

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
  playAudio(game.audios.wreck, 3);
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

    game.player.view
      .getAnimations()
      .filter((anim) => anim.animationName || false)[0]
      ?.cancel();

    game.player.view.classList.add("take-damage");

    playAudio(game.audios.damage);
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

    switch (event.key) {
      case "ArrowDown":
        if (
          game.player.pos.x >= game.player.pos.maxX ||
          game.isPaused ||
          game.player.isBusy
        )
          break;

        game.player.pos.x++;

        movePlayer();
        break;
      case "ArrowUp":
        if (
          game.player.pos.x <= game.player.pos.minX ||
          game.isPaused ||
          game.player.isBusy
        )
          break;

        game.player.pos.x--;

        movePlayer();
        break;
      case "ArrowRight":
        if (
          game.player.pos.y >= game.player.pos.maxY ||
          game.isPaused ||
          game.player.isBusy
        )
          break;

        game.player.view.classList.remove("flipX");
        game.player.pos.y++;

        movePlayer();
        break;
      case "ArrowLeft":
        if (
          game.player.pos.y <= game.player.pos.minY ||
          game.isPaused ||
          game.player.isBusy
        )
          break;

        game.player.view.classList.add("flipX");
        game.player.pos.y--;

        movePlayer();
        break;
      case "e":
        if (
          !windowIsBreak(game.player.pos) ||
          game.isPaused ||
          game.player.isBusy
        )
          break;

        game.player.isBusy = true;

        game.player.view.classList.add("fixing");

        playAudio(game.audios.fix, 1);
        break;
      case "Escape":
        if (!game.isPaused) pauseGame();
        else resumeGame();
        break;
    }
  });
}

function hasBreakWindows() {
  var windows = document.querySelectorAll(".window");

  for (var w of windows) {
    if (w.style.backgroundPositionX !== "") return true;
  }

  return false;
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

function pauseGame() {
  game.isPaused = true;

  game.player.view.getAnimations().forEach((anim) => anim.pause());
  game.enemy.view.getAnimations().forEach((anim) => anim.pause());

  document
    .querySelectorAll(".wreckage")
    .forEach((wreck) => wreck.getAnimations()[0].pause());

  muteAudio();
}

function resumeGame() {
  game.isPaused = false;

  game.player.view.getAnimations().forEach((anim) => anim.play());
  game.enemy.view.getAnimations().forEach((anim) => anim.play());

  document
    .querySelectorAll(".wreckage")
    .forEach((wreck) => wreck.getAnimations()[0].play());

  muteAudio();
}

function stageIsCompleted() {
  if (hasBreakWindows()) return;

  pauseGame();

  var gainScore = new Audio("../../res/audio/GAIN-SCORE.wav");

  var id = setInterval(() => {
    if (game.time.value > 0) {
      addTime(-1);
      addScore(50);

      gainScore.pause();
      gainScore.currentTime = 0;
      gainScore.volume = 0.5;
      gainScore.play();

      return;
    }

    clearInterval(id);

    var gameCompleted = new Audio("../../res/audio/GAME-COMPLETED.wav");
    gameCompleted.volume = 0.5;
    gameCompleted.play();

    document.querySelector("main").innerHTML = `
    <div id="stage-completed">
      <h2>
        Score <br />
        <span>${game.score.view.textContent}</span>
      </h2>
      <h1>It's fixed!</h1>
      <img src="./res/sprites/stage-completed.png" alt="It's fixed!" />
    </div>
    `;

    setTimeout(() => {
      window.location.reload();
    }, 5000);
  }, 100);
}

function gameOver() {
  pauseGame();

  var gameOver = new Audio("../../res/audio/GAME-OVER.wav");
  gameOver.volume = 0.5;
  gameOver.play();

  document.querySelector("main").innerHTML = `
  <div id="game-over">
    <h2>
      Score <br />
      <span>${game.score.view.textContent}</span>
    </h2>
    <h1>Game Over</h1>
    <img src="./res/sprites/game-over.png" alt="Game Over" />
  </div>
  `;

  setTimeout(() => {
    window.location.reload();
  }, 5000);
}

function startGame(event) {
  event.preventDefault();

  window.removeEventListener("keydown", startGame);

  document.querySelector("main").innerHTML = `
  <div id="hud">
    <h2>score <span id="score">0000000</span></h2>
    <h2>hiscore <span id="hiscore">0000000</span></h2>
    <h2>time <span id="time">00</span></h2>
    <div id="life">
      <img src="./res/sprites/life.png" alt="" />
      <img src="./res/sprites/life.png" alt="" />
      <img src="./res/sprites/life.png" alt="" />
      <img src="./res/sprites/life.png" alt="" hidden />
      <img src="./res/sprites/life.png" alt="" hidden />
    </div>
  </div>
  <div id="level">
    <div id="level-background"></div>
    <div id="level-building">
      <!-- Enemy positions -->
      <div class="window-closed"></div>
      <div class="window-closed"></div>
      <div class="window-closed"></div>
      <div class="window-closed"></div>
      <div class="window-closed"></div>

      <!-- Player positions -->
      <div class="window" id="wp00"></div>
      <div class="window" id="wp01"></div>
      <div class="window" id="wp02"></div>
      <div class="window" id="wp03"></div>
      <div class="window" id="wp04"></div>
      <div class="window" id="wp10"></div>
      <div class="window" id="wp11"></div>
      <div class="window-lobby" id="wp12"></div>
      <div class="window" id="wp13"></div>
      <div class="window" id="wp14"></div>
      <div class="window" id="wp20"></div>
      <div class="window" id="wp21"></div>
      <div class="lobby" id="wp22"></div>
      <div class="window" id="wp23"></div>
      <div class="window" id="wp24"></div>
    </div>
  </div>
  <div id="player"></div>
  <div id="enemy"></div>
`;
  game = new Game();

  spawnPlayer();
  spawnEnemy();
  breakWindows();
  startTime();

  playAudio(game.audios.game, 0, 0, 0.5);
}

window.addEventListener("keydown", startGame);
