/* progress.js — localStorage-backed progress tracking */
const Progress = (() => {
  const KEY = 'netcourse:v1';
  const TOTAL = 12;
  let state = { lessons: {}, last: 1, quiz: null, hw: 'none' };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (e) { /* storage unavailable: run in memory */ }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('progress:change'));
  }
  function completeLesson(id, done = true) {
    if (done) state.lessons[id] = true; else delete state.lessons[id];
    save();
  }
  function isDone(id) { return !!state.lessons[id]; }
  function doneCount() { return Object.keys(state.lessons).length; }
  function setLast(id) { state.last = id; save(); }
  function setQuiz(result) { state.quiz = result; save(); }
  function setHw(status) { state.hw = status; save(); }
  // lessons = 60%, quiz = 20%, homework = 20% (partial homework = 10%)
  function percent() {
    let p = (doneCount() / TOTAL) * 60;
    if (state.quiz) p += 20;
    if (state.hw === 'done') p += 20; else if (state.hw === 'partial') p += 10;
    return Math.round(p);
  }
  function reset() { state = { lessons: {}, last: 1, quiz: null, hw: 'none' }; save(); }
  load();
  return {
    TOTAL, completeLesson, isDone, doneCount, setLast, setQuiz, setHw, percent, reset,
    get last() { return state.last; },
    get quiz() { return state.quiz; },
    get hw() { return state.hw; }
  };
})();
