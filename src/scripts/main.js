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
