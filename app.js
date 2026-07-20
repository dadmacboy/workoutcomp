(() => {
  const exerciseMap = Object.fromEntries(
    window.EXERCISES.map(exercise => [exercise.id, exercise])
  );

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

    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveCurrent() {
    const exercise = currentExercise();

    if (!exercise) return;

    const oldRecord = getRecord(exercise.id);
    const record = { ...oldRecord };

    fields.forEach(field => {
      record[field] = $(field).value;
    });

    record.completed =
      $("completeButton").classList.contains("done");

    record.savedAt = new Date().toISOString();

    localStorage.setItem(
      storageKey(exercise.id),
      JSON.stringify(record)
    );

    updateProgress();
  }

  function loadCurrent() {
    const exercise = currentExercise();

    if (!exercise) return;

    const record = getRecord(exercise.id);
    const totalExercises = workoutIds().length;

    $("dayTitle").textContent = `${state.day} Workout`;

    $("exerciseCount").textContent =
      `Exercise ${state.index + 1} of ${totalExercises}`;

    $("exerciseNumber").textContent = state.index + 1;
    $("exerciseName").textContent = exercise.name;
    $("cue").textContent = exercise.cue;
    $("muscles").textContent = exercise.muscles;
    $("mistakes").textContent = exercise.mistakes;
    $("variations").textContent = exercise.variations;

    $("startImage").src =
      `images/${exercise.id}-start.webp`;

    $("finishImage").src =
      `images/${exercise.id}-finish.webp`;

    $("muscleImage").src =
      `images/${exercise.id}-muscles.webp`;

    $("startImage").alt =
      `${exercise.name} start position`;

    $("finishImage").alt =
      `${exercise.name} finish position`;

    $("muscleImage").alt =
      `${exercise.name} muscles worked`;

    fields.forEach(field => {
      $(field).value =
        record[field] ??
        (field === "weight" ? exercise.defaultWeight : "");
    });

    const completed = Boolean(record.completed);

    $("completeButton").classList.toggle(
      "done",
      completed
    );

    $("completeButton").textContent =
      completed
        ? "Completed ✓"
        : "Mark exercise complete";

    updateProgress();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function updateProgress() {
    const ids = workoutIds();

    const completed = ids.filter(id => {
      return getRecord(id).completed;
    }).length;

    const percent = Math.round(
      (completed / ids.length) * 100
    );

    $("progressPercent").textContent = `${percent}%`;
    $("progressBar").style.width = `${percent}%`;
  }

  function goToPreviousExercise() {
    if (state.index <= 0) return;

    saveCurrent();
    state.index--;
    loadCurrent();
  }

  function goToNextExercise() {
    if (state.index >= workoutIds().length - 1) return;

    saveCurrent();
    state.index++;
    loadCurrent();
  }

  fields.forEach(field => {
    $(field).addEventListener("input", saveCurrent);
  });

  $("completeButton").addEventListener("click", () => {
    const completed =
      !$("completeButton").classList.contains("done");

    $("completeButton").classList.toggle(
      "done",
      completed
    );

    $("completeButton").textContent =
      completed
        ? "Completed ✓"
        : "Mark exercise complete";

    saveCurrent();
  });

  $("dayButton").addEventListener("click", () => {
    $("dayDialog").showModal();
  });

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
    const confirmed = confirm(
      `Reset all saved entries for ${state.day}?`
    );

    if (!confirmed) return;

    workoutIds().forEach(id => {
      localStorage.removeItem(storageKey(id));
    });

    state.index = 0;
    loadCurrent();
  });

  /*
   * Swipe controls
   *
   * Swipe left  = next exercise
   * Swipe right = previous exercise
   */

  let touchStartX = 0;
  let touchStartY = 0;
  let touchTarget = null;

  document.addEventListener(
    "touchstart",
    event => {
      const touch = event.changedTouches[0];

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchTarget = event.target;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    event => {
      /*
       * Do not change exercises while touching
       * an input, notes box, button, or dialog.
       */
      if (
        touchTarget?.closest(
          "input, textarea, select, button, dialog"
        )
      ) {
        return;
      }

      const touch = event.changedTouches[0];

      const horizontalMovement =
        touch.clientX - touchStartX;

      const verticalMovement =
        touch.clientY - touchStartY;

      const minimumSwipeDistance = 60;

      /*
       * Ignore short movements and ordinary
       * upward or downward scrolling.
       */
      if (
        Math.abs(horizontalMovement) <
          minimumSwipeDistance ||
        Math.abs(horizontalMovement) <=
          Math.abs(verticalMovement)
      ) {
        return;
      }

      if (horizontalMovement < 0) {
        goToNextExercise();
      } else {
        goToPreviousExercise();
      }
    },
    { passive: true }
  );

  loadCurrent();
})();
