import {
  setData,
  countdownsAndTimers,
  questionsAndTimers
} from './dataStore';

/**
 * Clears all timer Ids in countdownsAndTimers and questionsAndTimers, queued from
 * session state transitions.
 */
function clearTimers() {
  for (const id in countdownsAndTimers) {
    clearTimeout(countdownsAndTimers[id]);
    delete countdownsAndTimers[id];
  }
  for (const id in questionsAndTimers) {
    clearTimeout(questionsAndTimers[id]);
    delete questionsAndTimers[id];
  }
}

/**
 * Reset the state of the application back to the start
 *
 * @returns { } empty object
 */
export function clear (): object {
  clearTimers();
  setData({
    users: [],
    quizzes: [],
    quizTrash: [],
    sessions: [],
  });
  return {};
}
