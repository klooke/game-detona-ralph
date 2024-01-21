const game = {
  score: {
    view: document.querySelector("#score"),
    limit: 9999999,
    points: 0,
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
