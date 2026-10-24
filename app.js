const BASE_WORDS = [
  ["てんき","tenki","погода"],["べんきょう","benkyō","учёба"],["がっこう","gakkō","школа"],["しごと","shigoto","работа"],["ほん","hon","книга"],["えいが","eiga","фильм"],["あたたかい","atatakai","тёплый"],["さむい","samui","холодный"],["いそがしい","isogashii","занятой"],["おもしろい","omoshiroi","интересный"],["つまらない","tsumaranai","скучный"],["じゅぎょう","jugyō","урок"],["かたい","katai","твёрдый"],["あぶない","abunai","опасный"],["かんたん","kantan","простой"],["まじめ","majime","серьёзный"],["あまい","amai","сладкий"],["ひろい","hiroi","широкий"],["せまい","semai","узкий"],["おおきい","ōkii","большой"],["ちいさい","chiisai","маленький"],["きたない","kitanai","грязный"],["としょかん","toshokan","библиотека"],["えき","eki","станция"],["みせ","mise","магазин"],["ぎんこう","ginkō","банк"],["こうえん","kōen","парк"],["おねえさん","onēsan","старшая сестра"],
  ["おにいさん","onīsan","старший брат"],["いもうと","imōto","младшая сестра"],["おとうと","otōto","младший брат"],["きのう","kinō","вчера"],["しゅくだい","shukudai","домашнее задание"],["はやい","hayai","быстрый / ранний"],["はな","hana","цветок"],["き","ki","дерево"],["みどり","midori","зелёный"],["くろい","kuroi","чёрный"],["むらさき","murasaki","фиолетовый"],["はいいろ","haiiro","серый"],["ちゃいろ","chairo","коричневый"],["オレンジ","orenji","оранжевый"],["いろ","iro","цвет"],["かわいい","kawaii","милый"],["あおい","aoi","синий / голубой"],["あかい","akai","красный"],["ピンク","pinku","розовый"],["きいろい","kiiroi","жёлтый"],["うさぎ","usagi","кролик"],["しろい","shiroi","белый"],["むずかしい","muzukashii","сложный"],["うた","uta","песня"],["くも","kumo","облако"],["でんしゃ","densha","поезд"],["ともだち","tomodachi","друг"],["ていねい","teinei","вежливый / тщательный"],["ペン","pen","ручка"],["ノート","nōto","тетрадь"],
  ["えんぴつ","enpitsu","карандаш"],["きょうかしょ","kyōkasho","учебник"],["おもちゃ","omocha","игрушка"],["くま","kuma","медведь"],["くじら","kujira","кит"],["はこ","hako","коробка"],["つかれました","tsukaremashita","устал(а)"],["きょう","kyō","сегодня"],["あした","ashita","завтра"],["はれ","hare","ясная погода"],["あめ","ame","дождь"],["かぜ","kaze","ветер"],["やすみ","yasumi","отдых / выходной"],["はは","haha","моя мама"],["ちち","chichi","мой папа"],["しんせつ","shinsetsu","добрый / любезный"],["きれい","kirei","красивый / чистый"],["みち","michi","дорога"],["もも","momo","персик"],["うつくしい","utsukushii","прекрасный"],
  ["ふくざつ","fukuzatsu","сложный"],["きらい","kirai","нелюбимый"],["べんり","benri","удобный"],["ハンサム","hansamu","красивый (о мужчине)"],["ひま","hima","свободный (о времени)"],["げんき","genki","здоровый / бодрый"],["ゆうめい","yūmei","известный"],["まち","machi","город"],
  ["すき","suki","любимый"],["だいじ","daiji","важный"],["へた","heta","неумелый"],["すてき","suteki","чудесный"],["じょうず","jōzu","умелый"],["へん","hen","странный"],["にぎやか","nigiyaka","многолюдный"],["しずか","shizuka","тихий"],["たいせつ","taisetsu","важный / дорогой сердцу"],["いす","isu","стул"],["おとうさん","otōsan","отец"]
].map((word, index) => ({ id: `base-${index + 1}`, japanese: word[0], kana: toHiragana(word[0]), romaji: word[1], russian: word[2], custom: false }));

const STORAGE_KEY = "kotoba-data-v1";
const DAY = 86400000;
const defaultData = () => ({ version: 1, customWords: [], favorites: [], theme: "classic", progress: {}, stats: { total: 0, correct: 0, mistakes: 0, byDay: {}, bestStreak: 0 } });
let data = loadData();
let currentSession = null;
let deferredInstall = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const allWords = () => [...BASE_WORDS, ...data.customWords];
const todayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const dayStart = () => new Date(new Date().setHours(0,0,0,0)).getTime();
const shuffle = items => [...items].sort(() => Math.random() - .5);

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && saved.version === 1 ? { ...defaultData(), ...saved, favorites: Array.isArray(saved.favorites) ? saved.favorites : [], stats: { ...defaultData().stats, ...saved.stats } } : defaultData();
  } catch {
    return defaultData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function progressFor(id) {
  return data.progress[id] || { repetitions: 0, interval: 0, ease: 2.5, due: 0, correct: 0, incorrect: 0 };
}

function showView(name) {
  $$(".view").forEach(view => view.classList.toggle("active", view.id === `${name}-view`));
  $$(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === name));
  if (name === "home") renderHome();
  if (name === "words") renderWords();
  if (name === "stats") renderStats();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function dueWords() {
  const now = dayStart();
  return allWords().filter(word => progressFor(word.id).due <= now);
}

function reviewedToday() {
  return data.stats.byDay[todayKey()]?.total || 0;
}

function calculateStreak() {
  let streak = 0;
  const cursor = new Date();
  if (!data.stats.byDay[todayKey(cursor)]?.total) cursor.setDate(cursor.getDate() - 1);
  while (data.stats.byDay[todayKey(cursor)]?.total) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function renderHome() {
  const today = reviewedToday();
  const due = dueWords().length;
  const accuracy = data.stats.total ? Math.round(data.stats.correct / data.stats.total * 100) : null;
  $("#today-count").textContent = today;
  $(".progress-ring").style.setProperty("--progress", `${Math.min(100, today / 20 * 100)}%`);
  $("#due-count").textContent = due;
  $("#streak-count").textContent = calculateStreak();
  $("#accuracy-count").textContent = accuracy === null ? "—" : `${accuracy}%`;
  $("#home-title").textContent = today >= 20 ? "План на сегодня выполнен" : "Готовы к занятию?";
  $("#home-subtitle").textContent = due ? `${due} слов ждут повторения` : "Все слова повторены — можно потренироваться ещё";
}

function renderWords() {
  const query = $("#word-search").value.trim().toLowerCase();
  const onlyFavorites = $("#word-filter").value === "favorites";
  const words = allWords().filter(word => (!onlyFavorites || data.favorites.includes(word.id)) && [word.japanese, word.kana, word.romaji, word.russian].some(value => value.toLowerCase().includes(query)));
  $("#word-count").textContent = allWords().length;
  $("#favorites-count").textContent = data.favorites.length;
  $("#word-list").innerHTML = words.map(word => {
    const progress = progressFor(word.id);
    const learned = progress.repetitions >= 3;
    const favorite = data.favorites.includes(word.id);
    return `<article class="word-row"><div><div class="word-japanese">${escapeHtml(word.japanese)}</div><div class="word-meta">${escapeHtml(word.romaji)} · ${escapeHtml(word.russian)}</div></div><div class="word-actions"><button class="favorite-word ${favorite ? "active" : ""}" type="button" data-favorite-word="${word.id}" aria-label="${favorite ? "Убрать из избранного" : "Добавить в избранное"}: ${escapeHtml(word.japanese)}" aria-pressed="${favorite}">${favorite ? "★" : "☆"}</button><span class="word-status ${learned ? "learned" : ""}">${learned ? "выучено" : progress.correct ? "учится" : "новое"}</span>${word.custom ? `<button class="delete-word" type="button" data-delete-word="${word.id}" aria-label="Удалить ${escapeHtml(word.japanese)}">×</button>` : ""}</div></article>`;
  }).join("") || `<p class="muted">Ничего не найдено.</p>`;
}

function startSession(mode, sourceWords = null) {
  const size = Number($("#session-size").value);
  const favoritesOnly = $("#session-source").value === "favorites";
  let pool = sourceWords || (favoritesOnly ? allWords().filter(word => data.favorites.includes(word.id)) : dueWords());
  if (!pool.length && !sourceWords && !favoritesOnly) pool = allWords();
  if (!pool.length) { showToast("Сначала отметьте слова звёздочками"); return; }
  const questions = shuffle(pool).slice(0, size);
  currentSession = { mode, questions, index: 0, correct: 0, mistakes: [], answered: false };
  $("#mode-picker").classList.add("hidden");
  $("#session-result").classList.add("hidden");
  $("#quiz").classList.remove("hidden");
  showView("study");
  renderQuestion();
}

function renderQuestion() {
  const session = currentSession;
  const word = session.questions[session.index];
  session.answered = false;
  $("#quiz-counter").textContent = `${session.index + 1}/${session.questions.length}`;
  $("#quiz-progress-bar").style.width = `${session.index / session.questions.length * 100}%`;
  $("#feedback").className = "feedback hidden";
  $("#next-question").classList.add("hidden");
  $("#quiz-options").innerHTML = "";
  $("#typing-form").classList.toggle("hidden", session.mode !== "typing");
  $("#quiz-options").classList.toggle("hidden", session.mode === "typing");
  $("#quiz-reading").textContent = "";

  if (session.mode === "jp-ru") {
    $("#quiz-direction").textContent = "Выберите перевод";
    $("#quiz-prompt").textContent = word.japanese;
    renderOptions(word, "russian");
  } else if (session.mode === "ru-jp") {
    $("#quiz-direction").textContent = "Выберите японское слово";
    $("#quiz-prompt").textContent = word.russian;
    renderOptions(word, "japanese");
  } else {
    $("#quiz-direction").textContent = "Напишите слово хираганой";
    $("#quiz-prompt").textContent = word.russian;
    $("#typing-answer").value = "";
    setTimeout(() => $("#typing-answer").focus(), 50);
  }
}

function renderOptions(correctWord, field) {
  const alternatives = shuffle(allWords().filter(word => word.id !== correctWord.id && word[field] !== correctWord[field])).filter((word, index, words) => words.findIndex(item => item[field] === word[field]) === index).slice(0, 3);
  const options = shuffle([correctWord, ...alternatives]);
  $("#quiz-options").innerHTML = options.map(word => `<button class="option" type="button" data-id="${word.id}">${escapeHtml(word[field])}</button>`).join("");
}

function answerQuestion(isCorrect, selectedId = null) {
  if (currentSession.answered) return;
  currentSession.answered = true;
  const word = currentSession.questions[currentSession.index];
  updateProgress(word.id, isCorrect);
  if (isCorrect) currentSession.correct += 1;
  else if (!currentSession.mistakes.some(item => item.id === word.id)) currentSession.mistakes.push(word);

  if (currentSession.mode !== "typing") {
    $$(".option").forEach(button => {
      button.disabled = true;
      if (button.dataset.id === word.id) button.classList.add("correct");
      if (!isCorrect && button.dataset.id === selectedId) button.classList.add("wrong");
    });
  } else {
    $("#typing-answer").disabled = true;
  }

  $("#quiz-reading").textContent = `${word.romaji} · ${word.russian}`;
  const feedback = $("#feedback");
  feedback.textContent = isCorrect ? "Правильно!" : `Правильный ответ: ${currentSession.mode === "typing" ? word.kana : word.romaji}`;
  feedback.className = `feedback ${isCorrect ? "correct" : "wrong"}`;
  $("#next-question").textContent = currentSession.index === currentSession.questions.length - 1 ? "Результат" : "Дальше";
  $("#next-question").classList.remove("hidden");
}

function updateProgress(id, isCorrect) {
  const progress = progressFor(id);
  if (isCorrect) {
    progress.repetitions += 1;
    progress.interval = progress.repetitions === 1 ? 1 : progress.repetitions === 2 ? 3 : Math.max(4, Math.round(progress.interval * progress.ease));
    progress.ease = Math.min(2.8, progress.ease + .05);
    progress.correct += 1;
  } else {
    progress.repetitions = 0;
    progress.interval = 1;
    progress.ease = Math.max(1.3, progress.ease - .2);
    progress.incorrect += 1;
  }
  progress.due = dayStart() + progress.interval * DAY;
  progress.last = Date.now();
  data.progress[id] = progress;
  const key = todayKey();
  data.stats.byDay[key] = data.stats.byDay[key] || { total: 0, correct: 0 };
  data.stats.byDay[key].total += 1;
  data.stats.byDay[key].correct += isCorrect ? 1 : 0;
  data.stats.total += 1;
  data.stats.correct += isCorrect ? 1 : 0;
  data.stats.mistakes += isCorrect ? 0 : 1;
  data.stats.bestStreak = Math.max(data.stats.bestStreak, calculateStreak());
  saveData();
}

function nextQuestion() {
  $("#typing-answer").disabled = false;
  if (currentSession.index < currentSession.questions.length - 1) {
    currentSession.index += 1;
    renderQuestion();
  } else {
    finishSession();
  }
}

function finishSession() {
  $("#quiz").classList.add("hidden");
  $("#session-result").classList.remove("hidden");
  $("#result-summary").textContent = `${currentSession.correct} из ${currentSession.questions.length} правильно. Ошибок: ${currentSession.mistakes.length}.`;
  $("#repeat-mistakes").classList.toggle("hidden", currentSession.mistakes.length === 0);
  renderHome();
}

function closeQuiz() {
  currentSession = null;
  $("#quiz").classList.add("hidden");
  $("#session-result").classList.add("hidden");
  $("#mode-picker").classList.remove("hidden");
}

function renderStats() {
  const learned = allWords().filter(word => progressFor(word.id).repetitions >= 3).length;
  const reviewing = allWords().filter(word => progressFor(word.id).correct > 0 && progressFor(word.id).repetitions < 3).length;
  const accuracy = data.stats.total ? Math.round(data.stats.correct / data.stats.total * 100) : null;
  $("#total-answers").textContent = data.stats.total;
  $("#learned-count").textContent = learned;
  $("#mistake-count").textContent = data.stats.mistakes;
  $("#stats-accuracy").textContent = accuracy === null ? "—" : `${accuracy}%`;
  $("#best-streak").textContent = `${data.stats.bestStreak || calculateStreak()} дн.`;
  $("#reviewing-count").textContent = reviewing;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const value = data.stats.byDay[todayKey(date)]?.total || 0;
    return { label: date.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", ""), value };
  });
  const max = Math.max(1, ...days.map(day => day.value));
  $("#week-chart").innerHTML = days.map(day => `<div class="day-bar"><strong>${day.value || ""}</strong><i style="height:${Math.max(3, day.value / max * 110)}px"></i><span>${day.label}</span></div>`).join("");
  const difficultWords = allWords().map(word => ({ word, errors: progressFor(word.id).incorrect })).filter(item => item.errors > 0).sort((first, second) => second.errors - first.errors || first.word.id.localeCompare(second.word.id)).slice(0, 5);
  $("#difficult-words").innerHTML = difficultWords.length ? difficultWords.map(({ word, errors }) => `<div class="difficult-word"><div><strong>${escapeHtml(word.japanese)}</strong><span>${escapeHtml(word.russian)}</span></div><span class="error-count">${errors} ${errorForm(errors)}</span></div>`).join("") : `<p class="muted">Пока нет ошибок — так держать!</p>`;
}

function errorForm(count) {
  if (count % 100 >= 11 && count % 100 <= 14) return "ошибок";
  if (count % 10 === 1) return "ошибка";
  if (count % 10 >= 2 && count % 10 <= 4) return "ошибки";
  return "ошибок";
}

function addWord(form) {
  const formData = new FormData(form);
  const word = { id: `custom-${Date.now()}`, japanese: formData.get("japanese").trim(), kana: formData.get("kana").trim(), romaji: formData.get("romaji").trim(), russian: formData.get("russian").trim(), custom: true };
  data.customWords.push(word);
  saveData();
  form.reset();
  $("#add-word-dialog").close();
  renderWords();
  showToast("Слово добавлено");
}

function deleteCustomWord(id) {
  const word = data.customWords.find(item => item.id === id);
  if (!word || !confirm(`Удалить слово «${word.japanese}»?`)) return;
  data.customWords = data.customWords.filter(item => item.id !== id);
  data.favorites = data.favorites.filter(favoriteId => favoriteId !== id);
  delete data.progress[id];
  saveData();
  renderWords();
  showToast("Слово удалено");
}

function exportData() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `kotoba-backup-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Резервная копия создана");
}

async function importData(file) {
  try {
    const imported = JSON.parse(await file.text());
    if (imported.version !== 1 || !Array.isArray(imported.customWords) || typeof imported.progress !== "object") throw new Error();
    data = { ...defaultData(), ...imported, favorites: Array.isArray(imported.favorites) ? imported.favorites : [], stats: { ...defaultData().stats, ...imported.stats } };
    saveData();
    applyTheme();
    renderHome();
    renderWords();
    renderStats();
    showToast("Данные восстановлены");
  } catch {
    showToast("Не удалось прочитать резервную копию");
  }
}

function normalizeKana(value) {
  return toHiragana(value.trim().replace(/[\s。、・]/g, ""));
}

function toHiragana(value) {
  return value.replace(/[ァ-ヶ]/g, character => String.fromCharCode(character.charCodeAt(0) - 96));
}

function applyTheme() {
  const theme = data.theme === "pink" ? "pink" : "classic";
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === "pink" ? "#d18b9e" : "#d95d39";
  $$("[data-theme]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.theme === theme)));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 2400);
}

$$('.tab').forEach(tab => tab.addEventListener("click", () => { closeQuiz(); showView(tab.dataset.view); }));
$$('[data-start-mode]').forEach(button => button.addEventListener("click", () => startSession(button.dataset.startMode)));
$("#quiz-options").addEventListener("click", event => {
  const option = event.target.closest(".option");
  if (!option) return;
  answerQuestion(option.dataset.id === currentSession.questions[currentSession.index].id, option.dataset.id);
});
$("#typing-form").addEventListener("submit", event => {
  event.preventDefault();
  const word = currentSession.questions[currentSession.index];
  answerQuestion(normalizeKana($("#typing-answer").value) === normalizeKana(word.kana));
});
$("#next-question").addEventListener("click", nextQuestion);
$("#close-quiz").addEventListener("click", closeQuiz);
$("#finish-session").addEventListener("click", () => { closeQuiz(); showView("home"); });
$("#repeat-mistakes").addEventListener("click", () => startSession(currentSession.mode, currentSession.mistakes));
$("#word-search").addEventListener("input", renderWords);
$("#word-filter").addEventListener("change", renderWords);
$("#word-list").addEventListener("click", event => {
  const favoriteButton = event.target.closest("[data-favorite-word]");
  if (favoriteButton) {
    const id = favoriteButton.dataset.favoriteWord;
    data.favorites = data.favorites.includes(id) ? data.favorites.filter(favoriteId => favoriteId !== id) : [...data.favorites, id];
    saveData(); renderWords(); return;
  }
  const button = event.target.closest("[data-delete-word]");
  if (button) deleteCustomWord(button.dataset.deleteWord);
});
$("#show-add-word").addEventListener("click", () => $("#add-word-dialog").showModal());
$("#close-dialog").addEventListener("click", () => $("#add-word-dialog").close());
$("#add-word-form").addEventListener("submit", event => { event.preventDefault(); addWord(event.currentTarget); });
$("#export-data").addEventListener("click", exportData);
$("#import-data").addEventListener("change", event => { if (event.target.files[0]) importData(event.target.files[0]); event.target.value = ""; });
$$('[data-theme]').forEach(button => button.addEventListener("click", () => { data.theme = button.dataset.theme; saveData(); applyTheme(); }));
$("#reset-progress").addEventListener("click", () => {
  if (!confirm("Сбросить весь прогресс? Добавленные слова тоже будут удалены.")) return;
  const theme = data.theme;
  data = { ...defaultData(), theme }; saveData(); applyTheme(); renderHome(); renderWords(); renderStats(); showToast("Прогресс сброшен");
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault(); deferredInstall = event; $("#install-button").classList.remove("hidden");
});
$("#install-button").addEventListener("click", async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $("#install-button").classList.add("hidden");
});

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js?v=5"));
applyTheme();
renderHome();
