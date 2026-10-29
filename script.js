
let score = 0;
let time = 30;
let playing = false;
let timer = null;
let moveTimer = null;
let goal = 60;
let settings = {};
let reachedMilestones = [];

const water = document.getElementById("water");
const dirty = document.getElementById("dirty");
const gameArea = document.getElementById("gameArea");
const message = document.getElementById("message");
const milestone = document.getElementById("milestone");
const difficulty = document.getElementById("difficulty");

const modes = {
  easy: {
    time: 45,
    goal: 40,
    points: 10,
    penalty: 5,
    speed: 1400
  },
  normal: {
    time: 30,
    goal: 60,
    points: 10,
    penalty: 10,
    speed: 900
  },
  hard: {
    time: 20,
    goal: 100,
    points: 10,
    penalty: 20,
    speed: 550
  }
};

// Play simple sounds without external audio files
let audioContext;

function playSound(frequency, duration) {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log("Audio unavailable");
  }
}

function updateScore() {
  document.getElementById("score").textContent = score;

  const progress = Math.min((score / goal) * 100, 100);
  document.getElementById("progressBar").style.width =
    progress + "%";

  checkMilestones();
}

function checkMilestones() {
  const checkpoints = [25, 50, 75];

  checkpoints.forEach(percent => {
    const target = goal * percent / 100;

    if (score >= target &&
        !reachedMilestones.includes(percent)) {
      reachedMilestones.push(percent);

      milestone.textContent =
        "🌟 Milestone reached: " + percent + "% of your goal!";

      playSound(750, 0.15);
    }
  });
}

function moveOneDrop(element) {
  const maxX = Math.max(
    0, gameArea.clientWidth - element.offsetWidth - 8
  );
  const maxY = Math.max(
    0, gameArea.clientHeight - element.offsetHeight - 8
  );

  element.style.left = Math.random() * maxX + "px";
  element.style.top = Math.random() * maxY + "px";
}

function moveDrops() {
  moveOneDrop(water);
  moveOneDrop(dirty);

  // Keep the drops from overlapping
  let attempts = 0;

  while (attempts < 20) {
    const dx = water.offsetLeft - dirty.offsetLeft;
    const dy = water.offsetTop - dirty.offsetTop;
    const distance = Math.hypot(dx, dy);

    if (distance > 85) break;

    moveOneDrop(dirty);
    attempts++;
  }
}

function stopTimers() {
  clearInterval(timer);
  clearInterval(moveTimer);
  timer = null;
  moveTimer = null;
}

function endGame(won) {
  if (!playing) return;

  playing = false;
  stopTimers();

  water.style.display = "none";
  dirty.style.display = "none";

  difficulty.disabled = false;
  document.getElementById("startBtn").disabled = false;

  if (won) {
    message.textContent =
      "🎉 You won! You reached the clean water goal!";
    milestone.textContent = "Mission complete!";
    playSound(900, 0.4);
  } else {
    message.textContent =
      "⏰ Time is up! Final score: " + score +
      ". Try again!";
    playSound(220, 0.4);
  }
}

function startGame() {
  stopTimers();

  settings = modes[difficulty.value];
  score = 0;
  time = settings.time;
  goal = settings.goal;
  playing = true;
  reachedMilestones = [];

  document.getElementById("time").textContent = time;
  document.getElementById("goal").textContent = goal;
  document.getElementById("startBtn").disabled = true;

  difficulty.disabled = true;
  message.textContent = "Collect the clean water! 💧";
  milestone.textContent = "";

  water.style.display = "flex";
  dirty.style.display = "flex";

  updateScore();
  moveDrops();

  moveTimer = setInterval(moveDrops, settings.speed);

  timer = setInterval(() => {
    time--;
    document.getElementById("time").textContent = time;

    if (time <= 0) {
      endGame(false);
    }
  }, 1000);
}

function resetGame() {
  stopTimers();
  playing = false;
  score = 0;

  settings = modes[difficulty.value];
  time = settings.time;
  goal = settings.goal;
  reachedMilestones = [];

  document.getElementById("time").textContent = time;
  document.getElementById("goal").textContent = goal;
  document.getElementById("startBtn").disabled = false;

  difficulty.disabled = false;
  water.style.display = "none";
  dirty.style.display = "none";

  message.textContent =
    "Choose a difficulty and press Start!";
  milestone.textContent = "";

  updateScore();
}

water.addEventListener("click", () => {
  if (!playing) return;

  score += settings.points;
  playSound(600, 0.12);
  updateScore();

  if (score >= goal) {
    endGame(true);
  } else {
    message.textContent = "Great job! +10 clean water points!";
    moveDrops();
  }
});

dirty.addEventListener("click", () => {
  if (!playing) return;

  score = Math.max(0, score - settings.penalty);
  playSound(180, 0.2);
  updateScore();

  message.textContent =
    "⚠️ Dirty water! -" + settings.penalty + " points!";
  moveDrops();
});

document.getElementById("startBtn")
  .addEventListener("click", startGame);

document.getElementById("resetBtn")
  .addEventListener("click", resetGame);

difficulty.addEventListener("change", resetGame);

// Initialize the game
resetGame();
