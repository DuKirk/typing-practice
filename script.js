const nav = document.querySelector(".nav");
const menuButton = document.querySelector("#menuButton");
const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");

menuButton.addEventListener("click", () => {
  nav.classList.toggle("open");
});

function showPage(pageId) {
  pages.forEach((page) => {
    page.classList.toggle("active-page", page.id === pageId);
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  nav.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    showPage(link.dataset.page);
  });
});

document.querySelector(".logo").addEventListener("click", (event) => {
  event.preventDefault();
  showPage("home");
});

document.querySelectorAll(".setting").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".setting").forEach((item) => {
      item.classList.remove("active");
    });
    button.classList.add("active");
  });
});


/*
  TYPING ENGINE — Phase 1 interaction prototype

  Important behavior:
  - The practice sentence itself is the typing area.
  - Untyped text is faded.
  - Correct characters become dark.
  - Wrong characters become red.
  - The user does not need to match a word's exact length before
    moving forward.
  - Pressing Space commits the current word and moves to the next word.
*/

const typingSurface = document.querySelector("#typingSurface");
const typingInput = document.querySelector("#typingInput");
const timeValue = document.querySelector("#timeValue");
const wpmValue = document.querySelector("#wpmValue");
const accuracyValue = document.querySelector("#accuracyValue");
const restartButton = document.querySelector("#restartButton");
const testStatus = document.querySelector("#testStatus");
const settingButtons = document.querySelectorAll(".setting");
const testResult = document.querySelector("#testResult");
const sessionTestsValue = document.querySelector("#sessionTests");
const sessionTimeValue = document.querySelector("#sessionTime");
const sessionWpmValue = document.querySelector("#sessionWpm");
const sessionAccuracyValue = document.querySelector("#sessionAccuracy");
const sessionBestWpmValue = document.querySelector("#sessionBestWpm");
const sessionBestAccuracyValue = document.querySelector("#sessionBestAccuracy");

let currentPassageIndex = -1;
let currentPassage = null;
let words = [];

let currentWordIndex = 0;
let typedWords = [];
let currentTyped = "";

let testDuration = 60;
let timeLeft = 60;
let elapsedSeconds = 0;
let timerId = null;
let testStarted = false;
let testFinished = false;
let viewInitialized = false;

// Session-only performance. This intentionally lives only in memory:
// refreshing or leaving the website resets everything to zero.
let sessionTests = 0;
let sessionPracticeSeconds = 0;
let sessionWpmTotal = 0;
let sessionAccuracyTotal = 0;
let sessionBestWpm = 0;
let sessionBestAccuracy = 0;

function formatSessionTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) return `${remainingSeconds} sec`;
  return `${minutes} min${remainingSeconds ? ` ${remainingSeconds} sec` : ""}`;
}

function updatePerformancePanel(extraCurrentSeconds = 0) {
  const totalTime = sessionPracticeSeconds + (testStarted && !testFinished ? elapsedSeconds : 0);

  sessionTestsValue.textContent = String(sessionTests);
  sessionTimeValue.textContent = formatSessionTime(totalTime);
  sessionWpmValue.textContent = sessionTests > 0
    ? String(Math.round(sessionWpmTotal / sessionTests))
    : "0";
  sessionAccuracyValue.textContent = sessionTests > 0
    ? `${(sessionAccuracyTotal / sessionTests).toFixed(1)}%`
    : "0%";
  sessionBestWpmValue.textContent = String(sessionBestWpm);
  sessionBestAccuracyValue.textContent = sessionTests > 0
    ? `${sessionBestAccuracy.toFixed(1)}%`
    : "0%";
}

function recordSessionResult(result) {
  sessionTests += 1;
  sessionPracticeSeconds += elapsedSeconds;
  sessionWpmTotal += result.wpm;
  sessionAccuracyTotal += result.accuracy;
  sessionBestWpm = Math.max(sessionBestWpm, result.wpm);
  sessionBestAccuracy = Math.max(sessionBestAccuracy, result.accuracy);
  addHistoryRow(result);
  updatePerformancePanel();
}


/* -------------------------
   PASSAGE SELECTION
------------------------- */

function choosePassage() {
  if (!Array.isArray(PASSAGES) || PASSAGES.length === 0) {
    throw new Error("No typing passages are available.");
  }

  let nextIndex = Math.floor(Math.random() * PASSAGES.length);

  // Avoid showing the same passage twice in a row.
  if (PASSAGES.length > 1) {
    while (nextIndex === currentPassageIndex) {
      nextIndex = Math.floor(Math.random() * PASSAGES.length);
    }
  }

  currentPassageIndex = nextIndex;
  currentPassage = PASSAGES[nextIndex];
  words = currentPassage.text.split(" ");
}


/* -------------------------
   TYPING DISPLAY
------------------------- */

function createWordElement(word, index) {
  const wordElement = document.createElement("span");
  wordElement.className = "typing-word";
  wordElement.dataset.index = index;

  [...word].forEach((character, charIndex) => {
    const span = document.createElement("span");
    span.className = "typing-char";
    span.textContent = character;
    span.dataset.char = charIndex;
    wordElement.appendChild(span);
  });

  if (index === currentWordIndex) {
    wordElement.classList.add("current");
  }

  return wordElement;
}

function renderText() {
  typingSurface.innerHTML = "";

  words.forEach((word, index) => {
    const wordElement = createWordElement(word, index);
    typingSurface.appendChild(wordElement);

    if (index < words.length - 1) {
      const space = document.createElement("span");
      space.className = "typing-space";
      space.textContent = " ";
      typingSurface.appendChild(space);
    }
  });

  // Always start a fresh passage at the very top of the four-line window.
  typingSurface.scrollTop = 0;
  viewInitialized = false;

  // Explicitly paint every character from the current typing state.
  // This guarantees that the initial state is completely faded.
  paintCurrentWord();

  // Re-assert the top position after layout has been calculated.
  requestAnimationFrame(() => {
    typingSurface.scrollTop = 0;
    viewInitialized = true;
  });
}

function updateCurrentWord() {
  document.querySelectorAll(".typing-word").forEach((element, index) => {
    element.classList.toggle("current", index === currentWordIndex);
  });

  document.querySelectorAll(".typing-char.current").forEach((element) => {
    element.classList.remove("current");
  });

  const wordElement = document.querySelector(
    `.typing-word[data-index="${currentWordIndex}"]`
  );

  if (!wordElement) return;

  const characters = wordElement.querySelectorAll(".typing-char:not(.extra)");

  if (currentTyped.length < characters.length) {
    characters[currentTyped.length].classList.add("current");
  }
}

function keepCurrentLineVisible() {
  // Do not let the browser jump to the end when the passage is first
  // rendered. The first four lines must always be visible initially.
  if (!viewInitialized) return;

  const wordElement = document.querySelector(
    `.typing-word[data-index="${currentWordIndex}"]`
  );

  if (!wordElement) return;

  const surfaceRect = typingSurface.getBoundingClientRect();
  const wordRect = wordElement.getBoundingClientRect();
  const styles = getComputedStyle(typingSurface);
  const lineHeight = parseFloat(styles.lineHeight);

  if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;

  // Keep the current word inside the four-line viewport. Move only one
  // line at a time instead of jumping directly to the current word.
  const topPadding = parseFloat(styles.paddingTop) || 0;
  const bottomPadding = parseFloat(styles.paddingBottom) || 0;
  const visibleTop = surfaceRect.top + topPadding;
  const visibleBottom = surfaceRect.bottom - bottomPadding;

  if (wordRect.bottom > visibleBottom) {
    const maxScroll = Math.max(0, typingSurface.scrollHeight - typingSurface.clientHeight);
    typingSurface.scrollTop = Math.min(
      typingSurface.scrollTop + lineHeight,
      maxScroll
    );
  } else if (wordRect.top < visibleTop && typingSurface.scrollTop > 0) {
    typingSurface.scrollTop = Math.max(
      0,
      typingSurface.scrollTop - lineHeight
    );
  }
}
function paintCurrentWord() {
  const word = words[currentWordIndex];
  const wordElement = document.querySelector(
    `.typing-word[data-index="${currentWordIndex}"]`
  );

  if (!wordElement) return;

  // Rebuild the active word so deleted characters immediately return
  // to their faded state.
  wordElement.innerHTML = "";

  [...word].forEach((character, index) => {
    const span = document.createElement("span");
    span.className = "typing-char";

    if (index < currentTyped.length) {
      span.classList.add(
        currentTyped[index] === character ? "correct" : "incorrect"
      );
    }

    span.textContent = character;
    wordElement.appendChild(span);
  });

  // Extra typed characters are always incorrect and therefore red.
  if (currentTyped.length > word.length) {
    const extraCharacters = currentTyped.slice(word.length);

    extraCharacters.split("").forEach((character) => {
      const extra = document.createElement("span");
      extra.className = "typing-char extra";
      extra.textContent = character;
      wordElement.appendChild(extra);
    });
  }

  updateCurrentWord();
  keepCurrentLineVisible();
}


/* -------------------------
   PERFORMANCE CALCULATIONS
------------------------- */

// Collect all characters the user has actually typed, including
// characters inside committed words.
function getAllTypedText() {
  let result = "";

  for (let i = 0; i < currentWordIndex; i++) {
    result += typedWords[i] || "";

    // Space is a typed delimiter between committed words.
    if (typedWords[i] !== undefined) {
      result += " ";
    }
  }

  result += currentTyped;
  return result;
}

function calculatePerformance() {
  const typedText = getAllTypedText();

  let correctCharacters = 0;

  for (let i = 0; i < currentWordIndex; i++) {
    const typed = typedWords[i] || "";
    const target = words[i];

    for (let j = 0; j < typed.length; j++) {
      if (j < target.length && typed[j] === target[j]) {
        correctCharacters++;
      }
    }
  }

  // Current word
  const currentTarget = words[currentWordIndex] || "";

  for (let j = 0; j < currentTyped.length; j++) {
    if (j < currentTarget.length && currentTyped[j] === currentTarget[j]) {
      correctCharacters++;
    }
  }

  // WPM uses the standard 5 characters = 1 word convention.
  const minutes = elapsedSeconds / 60;

  let wpm = 0;
  if (minutes > 0) {
    wpm = Math.round((correctCharacters / 5) / minutes);
  }

  const typedCharacters = [...typedText].filter(
    (character) => character !== " "
  ).length;

  const accuracy =
    typedCharacters > 0
      ? (correctCharacters / typedCharacters) * 100
      : 0;

  // WPM and accuracy are intentionally not shown during the test.
  // Their values are calculated continuously, but are revealed only
  // after the test finishes.
  return { wpm, accuracy, correctCharacters, typedCharacters };
}


/* -------------------------
   TIMER
------------------------- */

function startTimer() {
  if (timerId !== null || testFinished) return;

  timerId = setInterval(() => {
    elapsedSeconds += 1;
    timeLeft = Math.max(testDuration - elapsedSeconds, 0);

    timeValue.textContent = timeLeft;
    calculatePerformance();
    updatePerformancePanel();

    if (timeLeft <= 0) {
      finishTest();
    }
  }, 1000);
}

function finishTest() {
  if (testFinished) return;

  testFinished = true;
  clearInterval(timerId);
  timerId = null;

  typingInput.disabled = true;
  typingSurface.classList.add("test-finished");
  testStatus.textContent = "Test finished";
  timeValue.textContent = "0";

  const result = calculatePerformance();
  recordSessionResult(result);

  wpmValue.textContent = result.wpm;
  accuracyValue.textContent =
    result.typedCharacters > 0 ? `${result.accuracy.toFixed(1)}%` : "0.0%";

  document.querySelector("#testResult").hidden = false;
}


/* -------------------------
   RESET / DURATION
------------------------- */

function resetTest() {
  clearInterval(timerId);
  timerId = null;

  choosePassage();

  currentWordIndex = 0;
  typedWords = [];
  currentTyped = "";

  timeLeft = testDuration;
  elapsedSeconds = 0;
  testStarted = false;
  testFinished = false;

  typingInput.value = "";
  typingInput.disabled = false;

  typingSurface.classList.remove("test-finished");

  timeValue.textContent = testDuration;
  wpmValue.textContent = "--";
  accuracyValue.textContent = "--";
  testStatus.textContent = "Start typing to begin";

  document.querySelector("#testResult").hidden = true;

  typingSurface.scrollTop = 0;
  viewInitialized = false;
  renderText();
  updatePerformancePanel();
}

function setDuration(seconds, clickedButton) {
  testDuration = seconds;

  settingButtons.forEach((button) => {
    button.classList.remove("active");
  });

  clickedButton.classList.add("active");
  resetTest();
}


/* -------------------------
   WORD NAVIGATION
------------------------- */

function commitWord() {
  // Space commits exactly what the user typed. Mistakes and extra
  // characters are intentionally preserved for later correction.
  typedWords[currentWordIndex] = currentTyped;

  if (currentWordIndex < words.length - 1) {
    currentWordIndex++;
    currentTyped = "";
    typingInput.value = "";
    paintCurrentWord();
  }

  calculatePerformance();
}

function handleTyping(event) {
  if (testFinished) return;

  // Space or Enter commits the word and moves forward.
  if (event.key === " " || event.code === "Space" || event.key === "Enter") {
    event.preventDefault();

    if (currentTyped.length === 0) {
      // Ignore leading/repeated spaces.
      return;
    }

    commitWord();
    return;
  }

  // Backspace first moves backward within the current word.
  // Once the word is empty, it restores the previous committed word.
  if (event.key === "Backspace") {
    event.preventDefault();

    if (currentTyped.length > 0) {
      currentTyped = currentTyped.slice(0, -1);
      typingInput.value = currentTyped;
      paintCurrentWord();
      calculatePerformance();
      return;
    }

    if (currentWordIndex > 0) {
      currentWordIndex--;
      currentTyped = typedWords[currentWordIndex] || "";
      typedWords[currentWordIndex] = undefined;

      typingInput.value = currentTyped;
      paintCurrentWord();
      calculatePerformance();
    }

    return;
  }

  // Ignore modifier keys and other non-character keys.
  if (event.key.length !== 1) return;

  event.preventDefault();

  // Timer starts on the first actual alphabet/character typed.
  if (!testStarted) {
    testStarted = true;
    testStatus.textContent = "Typing...";
    startTimer();
  }

  currentTyped += event.key;
  typingInput.value = currentTyped;

  paintCurrentWord();
  calculatePerformance();
}


/* -------------------------
   EVENTS
------------------------- */

function focusTyping() {
  if (!testFinished) {
    typingInput.focus();
  }
}

typingSurface.addEventListener("click", focusTyping);
typingSurface.addEventListener("focus", focusTyping);
typingInput.addEventListener("keydown", handleTyping);

restartButton.addEventListener("click", () => {
  resetTest();
  focusTyping();
});

settingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const text = button.textContent.trim();
    const match = text.match(/(\d+)/);

    if (match) {
      setDuration(Number(match[1]), button);
      focusTyping();
    }
  });
});

choosePassage();
renderText();
updatePerformancePanel();


/* -------------------------
   TEST HISTORY (session only)
------------------------- */

const historyBody = document.querySelector("#historyBody");
const historyEmpty = document.querySelector("#historyEmpty");
const historyTable = document.querySelector("#historyTable");

function addHistoryRow(result) {
  const cells = [
    `Test ${sessionTests}`,
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }),
    String(result.wpm),
    result.typedCharacters > 0 ? `${result.accuracy.toFixed(1)}%` : "0.0%",
    formatSessionTime(elapsedSeconds),
  ];

  const row = document.createElement("tr");
  cells.forEach((text) => {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
  });

  historyBody.prepend(row);
  historyTable.hidden = false;
  historyEmpty.hidden = true;
}
