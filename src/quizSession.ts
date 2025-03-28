import fs from 'fs';
import path from 'path';
import config from './config.json';
import {
  QuizInfo,
  DataStore,
  getData,
  Session,
  setData,
  quizInfoReturn,
  EmptyObject,
  State,
  Action,
  countdownsAndTimers,
  questionsAndTimers,
  QuestionResults,
} from './dataStore';
import {
  InvalidQuizIdError,
  UnauthorisedQuizIdError,
  InvalidTokenError,
  ActionUnavailable,
} from './errors';
import { adminQuizInfo } from './quiz';

/**
 * HELPER FUNCTION
 *
 * @param {string} token
 * @returns {Token} will return userId of the user who has the valid token, else a error message
 *
 * Checks whether the token provided is a valid sessionId linked to a currently registered user. Returns the user
 * if found, else a null object.
 */
function isValidToken(token: string): { authUserId: number } {
  const data = getData() as DataStore;
  if (!token) {
    return null;
  }
  for (const user of data.users) {
    if (user.currentSessionIds.includes(token)) {
      return { authUserId: user.userId };
    }
  }
  return null;
}

/**
 * HELPER FUNCTION
 *
 * @param {QuizInfo} quiz
 * @param {string} token
 * @returns {ErrorMsg} either an error message, or null if quiz and authUserId matches.
 *
 * Given a quiz object, validates whether the quiz actually exists, and whether the quiz belongs to the provided
 * authUserId. Returns null if success, else returns an error object.
 */
function isQuizIdValid(quiz: QuizInfo, authUserId: number): null {
  if (!quiz) {
    throw new InvalidQuizIdError();
  }

  // Check if the quiz ID is user owns
  if (quiz.authUserId !== authUserId) {
    throw new UnauthorisedQuizIdError();
  }

  return null;
}

/**
 * HELPER FUNCTION
 *
 * @param {string} action
 * @returns
 *
 * Given a string, returns the enum version of the action provided, if possible.
 */
function setAction(action: string): Action {
  // Action provided is not a valid action - else, convert action to enum
  let actionEnum: Action;
  switch (action) {
    case 'NEXT_QUESTION':
      actionEnum = Action.NEXT_QUESTION;
      break;
    case 'SKIP_COUNTDOWN':
      actionEnum = Action.SKIP_COUNTDOWN;
      break;
    case 'GO_TO_ANSWER':
      actionEnum = Action.GO_TO_ANSWER;
      break;
    case 'GO_TO_FINAL_RESULTS':
      actionEnum = Action.GO_TO_FINAL_RESULTS;
      break;
    case 'END':
      actionEnum = Action.END;
      break;
    default:
      throw new Error('Action provided is not a valid Action enum');
  }
  return actionEnum;
}

/**
 * HELPER FUNCTION
 *
 * @param {Session} session
 * @param {DataStore} data
 *
 * If session is transitioning to end state, multiple elements in dataStore have to be updated.
 * This function does so.
 */
function updateDataAtEnd(session: Session, data: DataStore) {
  // Update session state
  session.state = State.END;
  // Find original copy of quiz
  const quiz: QuizInfo = data.quizzes.find(quiz => quiz.quizId === session.metadata.quizId);
  // Add to inactiveSessions list
  quiz.inactiveSessions.push(session.sessionId);
  // Remove from currentSessions list
  const sessionIndex = quiz.currentSessions.findIndex(s => s === session.sessionId);
  quiz.currentSessions.splice(sessionIndex, 1);
}

/**
 * HELPER FUNCTION
 *
 * @param {number | null} qDuration Depending on whether setting countdownTimer or questionTimer
 * @param {Session} session
 * @param {DataStore} data
 * @returns { ReturnType<typeof setTimeout> }
 *
 * Sets a timer and returns the timeoutId for future clearings.
 */
function setTimer(qDuration: number | null, session: Session, data: DataStore): ReturnType<typeof setTimeout> {
  if (qDuration) {
    return setTimeout(() => {
      session.state = State.QUESTION_CLOSE;
      calculateQuestionResults(session, data);
      setData(data);
      delete questionsAndTimers[session.sessionId];
    }, qDuration * 1000);
  } else {
    return setTimeout(() => {
      session.state = State.QUESTION_OPEN;
      session.questionOpenTime = Math.floor(Date.now() / 1000);
      setData(data);
      delete countdownsAndTimers[session.sessionId];
    }, 3000);
  }
}

/**
 * HELPER FUNCTION
 *
 * @param {Session} session
 * @param {DataStore} data
 *
 * Fills out playerResults with 'incorrect' and 'unsubmitted' submission details.
 */
function setInitialPlayerResults(session: Session, data: DataStore, index: number) {
  const playerResults = session.usersRankedByScore.map(p => ({
    playerId: p.playerId,
    name: p.name,
    correct: false,
    time: session.questionOpenTime + session.metadata.questions[index].duration,
    rank: 0,
    score: 0,
  }));
  session.results.push({
    playerResults: playerResults,
    averageAnswerTime: 0,
    percentCorrect: 0
  });
  setData(data);
}

/**
 * HELPER FUNCTION
 *
 * @param {Session} session
 * @param {DataStore} data
 *
 * Ranks and scores each player after a question ends.
 * Also calculates averageAnswerTime and percentCorrect
 */
function calculateQuestionResults(session: Session, data: DataStore) {
  const answers = session.results[session.atQuestion - 1];

  // sort playerResults based on time --> calculate appropriate scores and ranks
  const correctResults = answers.playerResults.filter(p => p.correct);
  correctResults.sort((a, b) => a.time - b.time);
  correctResults.forEach((player, index) => {
    player.rank = index + 1;
    player.time = player.time - session.questionOpenTime;
    player.score = Math.round(session.metadata.questions[session.atQuestion - 1].points / player.rank);
    session.usersRankedByScore.find(p => p.playerId === player.playerId).score += player.score;
  });

  const incorrectResults = answers.playerResults.filter(p => !p.correct);

  answers.playerResults = [...correctResults, ...incorrectResults];

  // calculate averageAnswerTime and percentCorrect for current question
  answers.averageAnswerTime = Math.round(correctResults.reduce((sum, player) => sum + player.time, 0) / correctResults.length);
  answers.percentCorrect = Math.round(correctResults.length / session.usersRankedByScore.length * 100);

  // sort usersRankedByScore in descending order of score
  session.usersRankedByScore.sort((a, b) => b.score - a.score);

  // Update data store
  setData(data);
}

/**
 * HELPER FUNCTION
 *
 * @param {Object} sessionResults - The session results object.
 * @param {Array} sessionResults.usersRankedByScore - Array of users ranked by score.
 * @param {Array} sessionResults.questionResults - Array of question results.
 * @returns {string} - The CSV formatted string.
 *
 * Convert session results to CSV format.
 */
function convertToCSV(sessionResults: {
  usersRankedByScore: { name: string; score: number; }[];
  questionResults: { playersCorrectList: { name: string; score: number; rank: number; }[]; averageAnswerTime: number; percentCorrect: number; }[];
}): string {
  const { usersRankedByScore, questionResults } = sessionResults;

  // Get headers
  const headers = ['Player'];
  questionResults.forEach((_, index) => {
    headers.push(`question${index + 1}score`);
    headers.push(`question${index + 1}rank`);
  });

  // Get rows
  const rows = usersRankedByScore.map(user => {
    const row = [user.name];
    questionResults.forEach(result => {
      const playerResult = result.playersCorrectList.find(p => p.name === user.name) || { score: 0, rank: 0 };
      row.push(playerResult.score.toString());
      row.push(playerResult.rank.toString());
    });
    return row.join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * HELPER FUNCTION
 *
 * @param {Session} session - The session object containing session details.
 * @param {string} csvContent - The CSV content to be saved.
 * @returns {string} - The URL to access the saved CSV file.
 *
 * Save CSV content to a file and return the URL to access the file.
 */
function generateCSVUrl(session: Session, csvContent: string): string {
  // Define the directory to store the CSV files
  const csvDir = path.join(__dirname, 'csv_files');

  // Ensure the directory exists
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true });
  }

  // Define the CSV file name and path
  const csvFileName = `session_${session.sessionId}.csv`;
  const csvFilePath = path.join(csvDir, csvFileName);

  // Save the CSV content to the file
  fs.writeFileSync(csvFilePath, csvContent);

  // Generate and return the URL to access the CSV file
  return `${config.url}:${config.port}/csv/${csvFileName}`;
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @param {number} autoStartNum
 * @returns { sessionId: number }
 *
 * Start a new session for a quiz
 * This copies the quiz, so that any edits whilst a session is running does not affect active session
 */
export function adminSessionStart(token: string, quizId: number, autoStartNum: number): { sessionId: number } {
  // Check if token is a valid session ID related to a registered user.
  const checkSession = isValidToken(token);
  let authUserId: number;
  if (checkSession) {
    authUserId = checkSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Check if the quiz ID is valid
  const quiz: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);

  if (!quiz) {
    // Quiz found in user's trash
    const quizTrash: QuizInfo = data.quizTrash.find(quiz => quiz.quizId === quizId);
    if (quizTrash) {
      if (quizTrash.authUserId === authUserId) {
        throw new Error('Quiz found in user\'s trash');
      } else {
        throw new UnauthorisedQuizIdError();
      }
    }
    // Else, no quiz found
    throw new InvalidQuizIdError();
  }

  // Check if the quiz ID is user owns
  if (quiz.authUserId !== authUserId) {
    throw new UnauthorisedQuizIdError();
  }

  if (autoStartNum > 50) {
    throw new Error('autoStartNum is greater than 50');
  }

  // 10 sessions that are not in END state currently exist for this quiz
  if (quiz.currentSessions.length >= 10) {
    throw new Error('10 sessions that are not in END state currently exist for this quiz');
  }
  // The quiz does not have any questions in it
  if (quiz.questions.length === 0) {
    throw new Error('The quiz does not have any questions in it');
  }

  // No errors - add empty session
  const sessionId: number = data.sessions.length;
  const newSession: Session = {
    sessionId: sessionId,
    state: State.LOBBY,
    autoStartNum: autoStartNum,
    atQuestion: 0,
    questionOpenTime: Math.floor(Date.now() / 1000),
    usersRankedByScore: [],
    metadata: adminQuizInfo(token, quizId) as quizInfoReturn,
    results: [],
    chat: { messages: [] },
  };
  data.sessions.push(newSession);
  // Update currentSession array in quiz structure too
  quiz.currentSessions.push(sessionId);
  setData(data);
  return { sessionId: sessionId };
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @param {number} sessionId
 * @param {string} action
 * @returns { }
 *
 * Update the state of a particular quiz session by sending an action command.
 */
export function adminSessionUpdate(token: string, quizId: number, sessionId: number, action: string): EmptyObject {
  // Check if token is a valid session ID related to a registered user.
  const checkSession = isValidToken(token);
  let authUserId: number;
  if (checkSession) {
    authUserId = checkSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Check if the quiz ID is valid
  const quiz: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);
  isQuizIdValid(quiz, authUserId);

  // Session Id does not refer to a valid session within this quiz
  if (!quiz.currentSessions.includes(sessionId)) {
    throw new Error('Session Id does not refer to a valid session within this quiz');
  }

  // Action provided is not a valid action - else, convert action to enum
  action = setAction(action);

  // Find session data
  const session: Session = data.sessions.find(s => s.sessionId === sessionId);
  // Handle state transitions and actions
  switch (session.state) {
    case State.LOBBY:
      if (action === Action.NEXT_QUESTION) {
        for (let i = 0; i < session.metadata.numQuestions; i++) {
          setInitialPlayerResults(session, data, i);
        }
        session.atQuestion++;
        session.state = State.QUESTION_COUNTDOWN;
        countdownsAndTimers[sessionId] = setTimer(null, session, data);
      } else if (action === Action.END) {
        updateDataAtEnd(session, data);
      } else {
        throw new ActionUnavailable();
      }
      break;

    case State.QUESTION_COUNTDOWN:
      if (action === Action.SKIP_COUNTDOWN || action === Action.END) {
        clearTimeout(countdownsAndTimers[sessionId]);
        delete countdownsAndTimers[sessionId];
      }
      if (action === Action.SKIP_COUNTDOWN) {
        session.state = State.QUESTION_OPEN;
        session.questionOpenTime = Math.floor(Date.now() / 1000);
        const qDuration = session.metadata.questions[session.atQuestion - 1].duration;
        questionsAndTimers[sessionId] = setTimer(qDuration, session, data);
      } else if (action === Action.END) {
        updateDataAtEnd(session, data);
      } else {
        throw new ActionUnavailable();
      }
      break;

    case State.QUESTION_OPEN:
      if (action === Action.GO_TO_ANSWER || action === Action.END) {
        clearTimeout(questionsAndTimers[sessionId]);
        delete questionsAndTimers[sessionId];
      }
      if (action === Action.GO_TO_ANSWER) {
        session.state = State.ANSWER_SHOW;
        calculateQuestionResults(session, data);
      } else if (action === Action.END) {
        updateDataAtEnd(session, data);
      } else {
        throw new ActionUnavailable();
      }
      break;

    case State.QUESTION_CLOSE:
      if (action === Action.GO_TO_ANSWER) {
        session.state = State.ANSWER_SHOW;
        calculateQuestionResults(session, data);
      } else if (action === Action.GO_TO_FINAL_RESULTS) {
        session.state = State.FINAL_RESULTS;
      } else if (action === Action.END) {
        updateDataAtEnd(session, data);
      } else if (action === Action.NEXT_QUESTION) {
        if (session.metadata.numQuestions === session.atQuestion) {
          throw new ActionUnavailable();
        } else {
          session.atQuestion++;
          session.state = State.QUESTION_COUNTDOWN;
          countdownsAndTimers[sessionId] = setTimer(null, session, data);
        }
      } else {
        throw new ActionUnavailable();
      }
      break;

    case State.ANSWER_SHOW:
      if (action === Action.GO_TO_FINAL_RESULTS) {
        session.state = State.FINAL_RESULTS;
      } else if (action === Action.END) {
        updateDataAtEnd(session, data);
      } else if (action === Action.NEXT_QUESTION) {
        if (session.metadata.numQuestions === session.atQuestion) {
          throw new ActionUnavailable();
        } else {
          session.atQuestion++;
          session.state = State.QUESTION_COUNTDOWN;
          countdownsAndTimers[sessionId] = setTimer(null, session, data);
        }
      } else {
        throw new ActionUnavailable();
      }
      break;

    case State.FINAL_RESULTS:
      if (action === Action.END) {
        updateDataAtEnd(session, data);
      } else {
        throw new ActionUnavailable();
      }
      break;
  }

  setData(data);
  return {};
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @returns
 *
 * Retrieves active and inactive session ids (sorted in ascending order) for a quiz.
 *    Active sessions are sessions that are not in the END state.
 *    Inactive sessions are sessions in the END state.
 */
export function adminSessionList(token: string, quizId: number): { activeSessions: number[], inactiveSessions: number[] } {
  // Check if token is a valid session ID related to a registered user.
  const checkSession = isValidToken(token);
  let authUserId: number;
  if (checkSession) {
    authUserId = checkSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Check if the quiz ID is valid
  const quiz: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);
  isQuizIdValid(quiz, authUserId);

  // No errors, return list.
  return {
    activeSessions: quiz.currentSessions.sort((a, b) => a - b),
    inactiveSessions: quiz.inactiveSessions.sort((a, b) => a - b),
  };
}

/**
 * Retrieve the status of a particular quiz session.
 *
 * @param {string} token - Authentication token.
 * @param {number} quizId - ID of the quiz.
 * @param {number} sessionId - ID of the session.
 * @returns {Object} The status of the quiz session.
 */
export function adminSessionStatus(token: string, quizId: number, sessionId: number): object {
  // Check if token is a valid session ID related to a registered user.
  const checkSession = isValidToken(token);
  let authUserId: number;
  if (checkSession) {
    authUserId = checkSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Check if the quiz ID is valid
  const quiz: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);
  isQuizIdValid(quiz, authUserId);

  // Session Id does not refer to a valid session within this quiz
  const session: Session = data.sessions.find(s => s.sessionId === sessionId);
  if (!session || session.metadata.quizId !== quizId) {
    throw new Error('Session Id does not refer to a valid session within this quiz');
  }

  // Extract relevant session status information
  const sessionStatus = {
    state: session.state,
    atQuestion: session.atQuestion,
    players: session.usersRankedByScore.map(player => player.name),
    metadata: {
      quizId: session.metadata.quizId,
      name: session.metadata.name,
      timeCreated: session.metadata.timeCreated,
      timeLastEdited: session.metadata.timeLastEdited,
      description: session.metadata.description,
      numQuestions: session.metadata.numQuestions,
      questions: session.metadata.questions,
      duration: session.metadata.duration,
      thumbnailUrl: session.metadata.thumbnailUrl || '',
    }
  };

  return sessionStatus;
}

/**
 * Retrieve the final results for all players for a completed quiz session.
 *
 * @param {string} token - Authentication token.
 * @param {number} quizId - ID of the quiz.
 * @param {number} sessionId - ID of the session.
 * @returns {Object} The final results of the quiz session.
 */
export function adminSessionResults(token: string, quizId: number, sessionId: number): object {
  // Check if token is a valid session ID related to a registered user.
  const checkSession = isValidToken(token);
  let authUserId: number;
  if (checkSession) {
    authUserId = checkSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Check if the quiz ID is valid
  const quiz: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);
  isQuizIdValid(quiz, authUserId);

  // Session Id does not refer to a valid session within this quiz
  const session: Session = data.sessions.find(s => s.sessionId === sessionId);
  if (!session || session.metadata.quizId !== quizId) {
    throw new Error('Session Id does not refer to a valid session within this quiz');
  }

  // Check if session is in FINAL_RESULTS state
  if (session.state !== State.FINAL_RESULTS) {
    throw new Error('Session is not in FINAL_RESULTS state');
  }

  // Transform results to questionResults
  const questionResults: QuestionResults[] = session.results.map((result, index) => {
    // Extract questionId from questions array
    const questionId = session.metadata.questions[index].questionId;

    // Extract names of players who answered correctly
    const playersCorrectList = result.playerResults
      .filter(playerResult => playerResult.correct)
      .map(playerResult => playerResult.name);

    // Construct each question result object
    return {
      questionId,
      playersCorrectList,
      averageAnswerTime: result.averageAnswerTime,
      percentCorrect: result.percentCorrect,
    };
  });

  return {
    usersRankedByScore: session.usersRankedByScore.map(user => ({
      name: user.name,
      score: user.score
    })),
    questionResults: questionResults
  };
}

/**
 * Retrieve the final results for all players for a completed quiz session in CSV format.
 *
 * @param {string} token - Authentication token.
 * @param {number} quizId - ID of the quiz.
 * @param {number} sessionId - ID of the session.
 * @returns { url: string } URL to the CSV file.
 */
export function adminSessionResultsCSV(token: string, quizId: number, sessionId: number): { url: string } {
  // Check if token is a valid session ID related to a registered user.
  const checkSession = isValidToken(token);
  let authUserId: number;
  if (checkSession) {
    authUserId = checkSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Check if the quiz ID is valid
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  isQuizIdValid(quiz, authUserId);

  // Session Id does not refer to a valid session within this quiz
  const session = data.sessions.find(s => s.sessionId === sessionId);
  if (!session || session.metadata.quizId !== quizId) {
    throw new Error('Session Id does not refer to a valid session within this quiz');
  }

  // Check if session is in FINAL_RESULTS state
  if (session.state !== State.FINAL_RESULTS) {
    throw new Error('Session is not in FINAL_RESULTS state');
  }

  // Extract session results
  const sessionResults = adminSessionResults(token, quizId, sessionId) as {
    usersRankedByScore: { name: string; score: number; }[];
    questionResults: { playersCorrectList: { name: string; score: number; rank: number; }[]; averageAnswerTime: number; percentCorrect: number; }[];
  };

  // Convert session results to CSV format
  const csvContent = convertToCSV(sessionResults);

  // Generate the CSV URL
  const csvUrl = generateCSVUrl(session, csvContent);

  return { url: csvUrl };
}
