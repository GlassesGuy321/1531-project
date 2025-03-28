import {
  getData,
  setData,
  State,
  DataStore,
  PlayerJoinReturn,
  countdownsAndTimers,
  EmptyObject,
  Session,
  QuestionResults,
} from './dataStore';
import {
  InvalidSessionError,
  SessionNotInLobbyError,
  NameAlreadyExist,
  InvalidPlayerError,
  InvalidQuestionPositionError,
  InvalidSessionStateError,
  InvalidMessageError
} from './errors';

/**
 * HELPER FUNCTION
 *
 * @param {number[]} existingId
 * @returns {number}
 * Generates a unique player ID that does not exist in the provided list.
 */
function generateUniqueNumber(existingIds: number[]): number {
  let uniqueNumber: number;
  do {
    uniqueNumber = Math.floor(Math.random() * 1000000);
  } while (existingIds.includes(uniqueNumber));
  return uniqueNumber;
}

/**
 * HELPER FUNCTION
 *
 * @returns {string}
 * Generates a random guest name in the format of 5 letters followed by 3 numbers.
 */
function randomGuestName(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let name = '';
  for (let i = 0; i < 5; i++) {
    name += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    name += Math.floor(Math.random() * 10).toString();
  }
  return name;
}

/**
 * HELPER FUNCTION
 *
 * @param {number[]} answerIds
 * @param {number} qPos
 * @param {Session} session
 * @returns {boolean}
 *
 * Checks whether the answerIds provided match the correct answers required for the current question.
 */
function checkAnswers(answerIds: number[], qPos: number, session: Session): boolean {
  const correctAnswerIds = session.metadata.questions[qPos - 1].answers
    .filter(answer => answer.correct) // Filter answers with correct = true
    .map(answer => answer.answerId); // Map to only answerId

  if (answerIds.length !== correctAnswerIds.length) {
    return false;
  }

  for (let i = 0; i < answerIds.length; i++) {
    if (answerIds[i] !== correctAnswerIds[i]) {
      return false;
    }
  }

  return true;
}

/**
 *
 * @param {number} sessionId
 * @param {string} name
 * @returns {PlayerJoinReturn}
 * Letting player to join a session
 */
export function playerJoin(sessionId: number, name: string): PlayerJoinReturn {
  const data = getData() as DataStore;
  const joinSession = data.sessions.find(session => session.sessionId === sessionId);

  if (joinSession === undefined) {
    throw new InvalidSessionError();
  }

  if (joinSession.state !== 'LOBBY') {
    throw new SessionNotInLobbyError();
  }

  const existingPlayer = joinSession.usersRankedByScore.find(player => player.name === name);
  if (existingPlayer) {
    throw new NameAlreadyExist();
  }

  let playerName = name;
  if (playerName === '') {
    playerName = randomGuestName();
  }

  const playerId = generateUniqueNumber(joinSession.usersRankedByScore.map(player => player.playerId));

  joinSession.usersRankedByScore.push({
    playerId: playerId,
    name: playerName,
    score: 0,
  });

  if (joinSession.autoStartNum > 0 && joinSession.usersRankedByScore.length === joinSession.autoStartNum) {
    joinSession.state = State.QUESTION_COUNTDOWN;
    joinSession.atQuestion++;
    countdownsAndTimers[sessionId] = setTimeout(() => {
      joinSession.state = State.QUESTION_OPEN;
      setData(data);
      delete countdownsAndTimers[sessionId];
    }, 3000);
  }

  setData(data);

  return { playerId: playerId };
}

/**
 *
 * @param playerId
 * @returns { state: State, numQuestions: number, atQuestion: number}
 *
 * Get the status of a guest player who has already joined a session.
 */
export function playerStatus(playerId: number): { state: State, numQuestions: number, atQuestion: number} {
  const data = getData();
  const player = data.sessions.flatMap(session => session.usersRankedByScore).find(player => player.playerId === playerId);

  if (!player) {
    throw new InvalidPlayerError();
  }

  const session = data.sessions.find(session => session.usersRankedByScore.some(p => p.playerId === playerId));

  return {
    state: session.state,
    numQuestions: session.metadata.questions.length,
    atQuestion: session.atQuestion,
  };
}

/**
 * Get the information about a question that the guest player is on.
 * @param playerId
 * @param questionPosition
 * @returns {QuestionInfo | ErrorMsg} - The information about the question or an error.
 */
export function playerQuestionInfo(playerId: number, questionPosition: number) {
  const data = getData();
  const player = data.sessions.flatMap(session => session.usersRankedByScore).find(player => player.playerId === playerId);
  const session = data.sessions.find(session => session.usersRankedByScore.some(p => p.playerId === playerId));

  if (!player) {
    throw new InvalidPlayerError();
  }

  if (questionPosition < 1 || questionPosition > session.metadata.questions.length) {
    throw new InvalidQuestionPositionError();
  }

  if (![State.QUESTION_OPEN, State.QUESTION_CLOSE, State.ANSWER_SHOW, State.FINAL_RESULTS].includes(session.state)) {
    throw new InvalidSessionStateError();
  }

  const question = session.metadata.questions[questionPosition - 1];

  return {
    questionId: question.questionId,
    question: question.question,
    duration: question.duration,
    thumbnailUrl: question.thumbnailUrl,
    points: question.points,
    answers: question.answers.map(answer => ({
      answerId: answer.answerId,
      answer: answer.answer,
      colour: answer.colour,
    })),
  };
}

/**
 *
 * @param {number} playerId
 * @returns {messages: messageBody[]}
 *
 * Return all messages that are in the same session as the player, in the order they were sent
 * In the repsonse, the timeSent is a unix timestamp that was recorded when the message was sent.
 */
export function playerSessionChat(playerId: number) {
  const data: DataStore = getData();

  const players = data.sessions.flatMap(session =>
    session.usersRankedByScore.map(user => ({
      playerId: user.playerId,
      playerName: user.name,
      sessionId: session.sessionId,
    }))
  );

  const player = players.find(curr => playerId === curr.playerId);

  if (!player) {
    throw new InvalidPlayerError();
  }
  const session = data.sessions.find(session => session.sessionId === player.sessionId);

  const messageLog = session.chat.messages;

  return {
    messages: messageLog,
  };
}

/**
 *
 * @param {number} playerId
 * @param {string} message
 * @returns { }
 * Allow player to send chat during a session
 */
export function playerSendChat(playerId: number, message: string) {
  const data: DataStore = getData();

  const players = data.sessions.flatMap(session =>
    session.usersRankedByScore.map(user => ({
      playerId: user.playerId,
      playerName: user.name,
      sessionId: session.sessionId,
    }))
  );

  const player = players.find(curr => playerId === curr.playerId);

  if (!player) {
    throw new InvalidPlayerError();
  } else if (message.length < 1 || message.length > 100) {
    throw new InvalidMessageError();
  }

  const session = data.sessions.find(session => session.usersRankedByScore.some(player => player.playerId === playerId));

  const messageObj = {
    messageBody: message,
    playerId: playerId,
    playerName: player.playerName,
    timeSent: new Date().getTime(),
  };

  session.chat.messages.push(messageObj);

  setData(data);

  return {};
}

/**
 *
 * @param {number} answerIds
 * @param {number[]} playerId
 * @param {number} questionPosition
 * @returns { }
 *
 * Allow the current player to submit answer(s) to the currently active question. Question position starts at 1
 * Note: An answer can be re-submitted once first selection is made, as long as game is in the right state
 */
export function playerSubmitAnswer(answerIds: number[], playerId: number, questionPosition: number): EmptyObject {
  const data: DataStore = getData();
  const session: Session = data.sessions.find(session =>
    session.usersRankedByScore.some(player => player.playerId === playerId)
  );

  if (!session) {
    throw new Error('Player ID does not exist');
  }

  if (questionPosition > session.metadata.numQuestions || questionPosition < 1) {
    throw new Error('Question Position is not valid for the session the player is in');
  }

  if (session.state !== State.QUESTION_OPEN) {
    throw new Error('Session is not in QUESTION_OPEN state');
  }

  if (questionPosition !== session.atQuestion) {
    throw new Error('Session is not currently on this question');
  }

  const minAnswerId: number = session.metadata.questions[questionPosition - 1].answers.reduce((minId, current) => {
    return current.answerId < minId ? current.answerId : minId;
  }, Infinity);
  const maxAnswerId: number = session.metadata.questions[questionPosition - 1].answers.reduce((maxId, current) => {
    return current.answerId > maxId ? current.answerId : maxId;
  }, 0);

  if (answerIds.some(num => num < minAnswerId || num > maxAnswerId)) {
    throw new Error('Answer IDs are not valid for this particular question');
  }

  const uniqueAnswers = new Set(answerIds);
  if (uniqueAnswers.size !== answerIds.length) {
    throw new Error('Duplicate Answer Ids are provided');
  }

  if (answerIds.length < 1) {
    throw new Error('Less than 1 answer ID was submitted');
  }

  // Update whether player got it correct or not
  const playerResult = session.results[questionPosition - 1].playerResults.find(p => p.playerId === playerId);
  if (checkAnswers(answerIds, questionPosition, session)) {
    playerResult.correct = true;
    playerResult.time = Math.floor(Date.now() / 1000);
  } else {
    playerResult.correct = false;
    playerResult.time = session.questionOpenTime + session.metadata.questions[questionPosition - 1].duration;
  }
  setData(data);
  return {};
}

/**
 *
 * @param {number} playerId
 * @param {number} questionPosition
 * @returns { QuestionResults }
 *
 * Get the results for a particular question of the session a player is playing in. Question position starts at 1
 */
export function playerResults(playerId: number, questionPosition: number): QuestionResults {
  const data: DataStore = getData();
  const session: Session = data.sessions.find(session =>
    session.usersRankedByScore.some(player => player.playerId === playerId)
  );

  if (!session) {
    throw new Error('Player ID does not exist');
  }

  if (questionPosition > session.metadata.numQuestions || questionPosition < 1) {
    throw new Error('Question Position is not valid for the session the player is in');
  }

  if (session.state !== 'ANSWER_SHOW') {
    throw new Error('Session is not in ANSWER_SHOW state');
  }

  if (questionPosition !== session.atQuestion) {
    throw new Error('Session is not currently on this question');
  }

  return {
    questionId: session.metadata.questions[questionPosition - 1].questionId,
    playersCorrectList: session.results[questionPosition - 1].playerResults.filter(p => p.correct).map(p => p.name),
    averageAnswerTime: session.results[questionPosition - 1].averageAnswerTime,
    percentCorrect: session.results[questionPosition - 1].percentCorrect
  };
}

/**
 *
 * @param {number} playerId
 * @returns { usersRankedByScore: {name: string, score: number,}[], questionResults: QuestionResults[]; }
 *
 * Get the final results for a whole session a player is playing in
 */
export function playerFinalResults(playerId: number): {
  usersRankedByScore: {
    name: string,
    score: number,
  }[],
  questionResults: QuestionResults[];
} {
  const data: DataStore = getData();
  const session: Session = data.sessions.find(session =>
    session.usersRankedByScore.some(player => player.playerId === playerId)
  );

  if (!session) {
    throw new Error('Player ID does not exist');
  }

  if (session.state !== 'FINAL_RESULTS') {
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
