(() => {
  const exerciseMap = Object.fromEntries(window.EXERCISES.map(x => [x.id, x]));
  const $ = id => document.getElementById(id);
  const state = {
    day: localStorage.getItem("gym-day") || "Monday",
    index: 0
  };

  const fields = ["weight", "rep1", "rep2", "rep3", "notes"];

  function workoutIds() {
    return window.SCHEDULE[state.day];
  }

  function currentExercise() {
    return exerciseMap[workoutIds()[state.index]];
  }

  function storageKey(id) {
    return `gym:${state.day}:${id}`;
  }

  function getRecord(id) {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? JSON.parse(raw) : {};
  }

  function saveCurrent() {
    const ex = currentExercise();
    const old = getRecord(ex.id);
    const record = {...old};
    fields.forEach(f => record[f] = $(f).value);
    record.completed = $("completeButton").classList.contains("done");
    record.savedAt = new Date().toISOString();
    localStorage.setItem(storageKey(ex.id), JSON.stringify(record));
    updateProgress();
  }

  function loadCurrent() {
    const ex = currentExercise();
    const record = getRecord(ex.id);
    const n = workoutIds().length;

    $("dayTitle").textContent = `${state.day} Workout`;
    $("exerciseCount").textContent = `Exercise ${state.index + 1} of ${n}`;
    $("exerciseNumber").textContent = state.index + 1;
    $("exerciseName").textContent = ex.name;
    $("cue").textContent = ex.cue;
    $("muscles").textContent = ex.muscles;
    $("mistakes").textContent = ex.mistakes;
    $("variations").textContent = ex.variations;

    $("startImage").src = `images/${ex.id}-start.webp`;
    $("finishImage").src = `images/${ex.id}-finish.webp`;
    $("muscleImage").src = `images/${ex.id}-muscles.webp`;
    $("startImage").alt = `${ex.name} start position`;
    $("finishImage").alt = `${ex.name} finish position`;
    $("muscleImage").alt = `${ex.name} muscles worked`;

    fields.forEach(f => {
      $(f).value = record[f] ?? (f === "weight" ? ex.defaultWeight : "");
    });

    $("completeButton").classList.toggle("done", Boolean(record.completed));
    $("completeButton").textContent = record.completed ? "Completed ✓" : "Mark exercise complete";
    $("previousButton").disabled = state.index === 0;
    $("nextButton").textContent = state.index === n - 1 ? "Finish" : "Next →";
    updateProgress();
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function updateProgress() {
    const ids = workoutIds();
    const completed = ids.filter(id => getRecord(id).completed).length;
    const percent = Math.round((completed / ids.length) * 100);
    $("progressPercent").textContent = `${percent}%`;
    $("progressBar").style.width = `${percent}%`;
  }

  fields.forEach(f => $(f).addEventListener("input", saveCurrent));

  $("completeButton").addEventListener("click", () => {
    const done = !$("completeButton").classList.contains("done");
    $("completeButton").classList.toggle("done", done);
    $("completeButton").textContent = done ? "Completed ✓" : "Mark exercise complete";
    saveCurrent();
  });

  $("dayButton").addEventListener("click", () => $("dayDialog").showModal());

  $("dayDialog").addEventListener("close", () => {
    const value = $("dayDialog").returnValue;
    if (window.SCHEDULE[value]) {
      saveCurrent();
      state.day = value;
      state.index = 0;
      localStorage.setItem("gym-day", value);
      loadCurrent();
    }
  });

  $("resetButton").addEventListener("click", () => {
    if (!confirm(`Reset all saved entries for ${state.day}?`)) return;
    workoutIds().forEach(id => localStorage.removeItem(storageKey(id)));
    state.index = 0;
    loadCurrent();
  });

  loadCurrent();
})();
