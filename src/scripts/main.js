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
