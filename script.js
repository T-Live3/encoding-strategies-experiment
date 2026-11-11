
const experiment = document.getElementById("experiment");

const strategies = [
  {
    id: "rehearsal",
    name: "Maintenance Rehearsal",
    instructions:
      "Repeat each word silently in your mind several times while it appears."
  },
  {
    id: "self",
    name: "Self-Reference",
    instructions:
      "Think about how each word relates to your own life, experiences, or memories."
  },
  {
    id: "imagery",
    name: "Mental Imagery",
    instructions:
      "Create a clear mental picture of each word while it appears."
  }
];

const wordLists = [
  {
    id: "A",
    words: ["apple", "chair", "pencil", "river", "candle", "window"]
  },
  {
    id: "B",
    words: ["banana", "table", "hammer", "mountain", "basket", "flower"]
  },
  {
    id: "C",
    words: ["orange", "mirror", "pillow", "guitar", "garden", "ticket"]
  }
];

let session = null;

function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function startExperiment() {
  const order = shuffle(strategies);
  const lists = shuffle(wordLists);

  session = {
    id: "session-" + Date.now(),
    started: new Date().toISOString(),
    completed: "",
    order: order,
    lists: lists,
    trials: [],
    distractorStart: 0,
    countingResponses: [],
    recallResponses: []
  };

  order.forEach((strategy, blockIndex) => {
    const list = lists[blockIndex];

    list.words.forEach((word, wordIndex) => {
      session.trials.push({
        session_id: session.id,
        strategy: strategy.id,
        strategy_name: strategy.name,
        list_id: list.id,
        block_order: blockIndex + 1,
        word_order: wordIndex + 1,
        word: word,
        recalled: 0
      });
    });
  });

  showInstructions(0);
}

function showInstructions(blockIndex) {
  if (blockIndex >= 3) {
    startDistractor();
    return;
  }

  const strategy = session.order[blockIndex];

  experiment.innerHTML = `
    <p class="progress">Block ${blockIndex + 1} of 3</p>
    <h2>${strategy.name}</h2>
    <p>${strategy.instructions}</p>
    <p>You will see six words, one at a time.</p>
    <p>Each word will appear for 3.5 seconds.</p>
    <button id="continueButton">Begin Block</button>
  `;

  document.getElementById("continueButton")
    .addEventListener("click", () => showWord(blockIndex, 0));
}

function showWord(blockIndex, wordIndex) {
  if (wordIndex >= 6) {
    showInstructions(blockIndex + 1);
    return;
  }

  const trial = session.trials[blockIndex * 6 + wordIndex];

  experiment.innerHTML = `
    <p class="progress">
      Block ${blockIndex + 1} of 3 —
      Word ${wordIndex + 1} of 6
    </p>
    <p>Use your assigned encoding strategy.</p>
    <div class="word">${trial.word}</div>
  `;

  setTimeout(() => {
    showWord(blockIndex, wordIndex + 1);
  }, 3500);
}

function startDistractor() {
  const startNumber =
    Math.floor(Math.random() * 500) + 500;

  session.distractorStart = startNumber;

  experiment.innerHTML = `
    <h2>Counting Task</h2>
    <p>
      Count backward by 3 from the number below.
      Type each new number and press Enter.
    </p>
    <div class="word">${startNumber}</div>
    <p class="timer" id="timer">30 seconds</p>

    <form id="countForm">
      <input
        id="countInput"
        type="number"
        placeholder="Enter the next number"
        required
        autofocus
      >
      <button type="submit">Enter Number</button>
    </form>

    <p id="countStatus">Responses entered: 0</p>
  `;

  const form = document.getElementById("countForm");
  const input = document.getElementById("countInput");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (input.value.trim() === "") return;

    session.countingResponses.push(Number(input.value));

    document.getElementById("countStatus").textContent =
      "Responses entered: " +
      session.countingResponses.length;

    input.value = "";
    input.focus();
  });

  input.focus();

  const deadline = performance.now() + 30000;

  const interval = setInterval(() => {
    const remaining = Math.max(
      0,
      Math.ceil((deadline - performance.now()) / 1000)
    );

    document.getElementById("timer").textContent =
      remaining + " seconds";

    if (remaining === 0) {
      clearInterval(interval);
      showRecall();
    }
  }, 100);
}

function showRecall() {
  experiment.innerHTML = `
    <h2>Free Recall Test</h2>
    <p>
      Recall as many words as possible from all
      three blocks.
    </p>
    <p>
      Enter the words in any order.
      Separate them with commas, spaces, or new lines.
    </p>
    <form id="recallForm">
      <textarea
        id="recallInput"
        placeholder="Type remembered words here..."
        required
      ></textarea>
      <button type="submit">Submit Recall</button>
    </form>
  `;

  document.getElementById("recallForm")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      scoreRecall();
    });
}

function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

function scoreRecall() {
  const raw = document.getElementById("recallInput").value;

  const responses = raw
    .split(/[,\s;]+/)
    .map(normalizeWord)
    .filter(Boolean);

  session.recallResponses = [...new Set(responses)];
  session.completed = new Date().toISOString();

  const responseSet = new Set(session.recallResponses);

  session.trials.forEach((trial) => {
    trial.recalled =
      responseSet.has(normalizeWord(trial.word)) ? 1 : 0;
  });

  showResults();
}

function getScore(strategyId) {
  return session.trials
    .filter((trial) => trial.strategy === strategyId)
    .reduce((total, trial) => total + trial.recalled, 0);
}

function showResults() {
  const rehearsal = getScore("rehearsal");
  const self = getScore("self");
  const imagery = getScore("imagery");
  const total = rehearsal + self + imagery;

  experiment.innerHTML = `
    <h2>Your Memory Results</h2>

    <div class="results">
      <p><strong>Maintenance Rehearsal:</strong>
        ${rehearsal} / 6</p>
      <p><strong>Self-Reference:</strong>
        ${self} / 6</p>
      <p><strong>Mental Imagery:</strong>
        ${imagery} / 6</p>
      <hr>
      <h3>Total: ${total} / 18</h3>
    </div>

    <p>
      Download both CSV files to save your
      experimental data.
    </p>

    <button id="summaryDownload">
      Download Summary CSV
    </button>

    <button id="trialDownload">
      Download Trial-Level CSV
    </button>

    <button id="restartButton">
      Start New Session
    </button>
  `;

  document.getElementById("summaryDownload")
    .addEventListener("click", downloadSummary);

  document.getElementById("trialDownload")
    .addEventListener("click", downloadTrials);

  document.getElementById("restartButton")
    .addEventListener("click", startExperiment);
}

function createCSV(rows) {
  const headers = Object.keys(rows[0]);

  const escapeValue = (value) => {
    const text = String(value ?? "");
    return '"' + text.replace(/"/g, '""') + '"';
  };

  const lines = [
    headers.map(escapeValue).join(",")
  ];

  rows.forEach((row) => {
    lines.push(
      headers.map((header) => escapeValue(row[header])).join(",")
    );
  });

  return lines.join("\r\n");
}

function downloadCSV(filename, rows) {
  const csv = createCSV(rows);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadSummary() {
  const total =
    getScore("rehearsal") +
    getScore("self") +
    getScore("imagery");

  const row = {
    session_id: session.id,
    started_at: session.started,
    completed_at: session.completed,
    strategy_order: session.order.map(s => s.id).join("|"),
    list_assignment: session.lists.map(l => l.id).join("|"),
    distractor_start: session.distractorStart,
    distractor_responses: session.countingResponses.join("|"),
    recall_responses: session.recallResponses.join("|"),
    rehearsal_correct: getScore("rehearsal"),
    self_reference_correct: getScore("self"),
    imagery_correct: getScore("imagery"),
    total_correct: total
  };

  downloadCSV("memory_summary.csv", [row]);
}

function downloadTrials() {
  downloadCSV("memory_trials.csv", session.trials);
}

document.getElementById("startButton")
  .addEventListener("click", startExperiment);
