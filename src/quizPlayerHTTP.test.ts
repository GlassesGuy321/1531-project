import { requestClear } from './otherHTTP.test';
import {
  requestPlayerJoin,
  requestRegister,
  requestQuizCreatev2,
  requestSessionStart,
  requestQuestionCreatev2,
  requestSessionUpdate,
  requestSessionStatus,
  requestPlayerStatus,
  requestPlayerQuestionInfo,
  requestPlayerSendChat,
  requestPlayerSessionChat,
  requestPlayerSubmitAnswer,
  requestQuesionResult,
  requestPlayerResult
} from './HTTPHelper';
import {
  Token,
  quizId,
} from './dataStore';

import sleepSync from 'slync';
afterEach(() => {
  // Reset the state of our data so that each tests can run independently
  requestClear();
});

describe('test POST /v1/player/join', () => {
  let t1: string;
  let quizId: number;
  let sessionId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;
    requestQuestionCreatev2(
      t1,
      quizId,
      {
        question: 'What is the capital of France?',
        duration: 1,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
        correctAnswers: [0],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    const { sessionId: s1 } = requestSessionStart(t1, quizId, 0).body;
    sessionId = s1;
  });

  test('player joins successfully', () => {
    const response = requestPlayerJoin(sessionId, 'Player1');
    expect(response.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(response.code).toStrictEqual(200);
  });

  test('return error for duplicate name', () => {
    requestPlayerJoin(sessionId, 'Player1');
    const response = requestPlayerJoin(sessionId, 'Player1');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for session not in LOBBY state', () => {
    // Simulate moving the session out of LOBBY state
    requestPlayerJoin(sessionId, 'Player1');
    const ret = requestSessionUpdate(t1, quizId, sessionId, 'NEXT_QUESTION');
    const response = requestPlayerJoin(sessionId, 'Player2');
    expect(ret.body).toStrictEqual({ });
    expect(ret.code).toStrictEqual(200);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for session that does not exist', () => {
    const response = requestPlayerJoin(sessionId + 1, 'Player1');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('generate a random guest name when player name is empty', () => {
    const response = requestPlayerJoin(sessionId, '');
    expect(response.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(response.code).toStrictEqual(200);
  });

  test('transition to QUESTION_COUNTDOWN state when autoStartNum is reached', () => {
    // Register two users and create a quiz and session
    const { sessionId: s2 } = requestSessionStart(t1, quizId, 2).body;

    const response = requestPlayerJoin(s2, 'Player1');
    expect(response.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(response.code).toStrictEqual(200);

    // autoStartNum is 2, so 1 user will keep session in LOBBY
    expect(requestSessionStatus(t1, quizId, s2).body.state).toStrictEqual('LOBBY');

    const response2 = requestPlayerJoin(s2, 'Player2');
    expect(response2.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(response2.code).toStrictEqual(200);

    // 2 Users, so session will automatically transition to QUESTION_COUNTDOWN
    expect(requestSessionStatus(t1, quizId, s2).body.state).toStrictEqual('QUESTION_COUNTDOWN');

    // Ensuring playerJoin function also sets a timer to go to QUESTION_OPEN
    sleepSync(3000);
    expect(requestSessionStatus(t1, quizId, s2).body.state).toStrictEqual('QUESTION_OPEN');
  });
});

describe('test GET /v1/player/:playerid', () => {
  let t1: string;
  let quizId: number;
  let sessionId: number;
  let playerId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'Sample Description').body;
    quizId = q1;
    requestQuestionCreatev2(
      t1,
      quizId,
      {
        question: 'What is the capital of France?',
        duration: 1,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
        correctAnswers: [0],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    const { sessionId: s1 } = requestSessionStart(t1, quizId, 0).body;
    sessionId = s1;
    playerId = requestPlayerJoin(sessionId, 'Player1').body.playerId;
  });

  test('get status of a player who joined successfully', () => {
    const response = requestPlayerStatus(playerId);
    expect(response.body).toStrictEqual({
      state: 'LOBBY',
      numQuestions: 1,
      atQuestion: 0,
    });
    expect(response.code).toStrictEqual(200);
  });

  test('return error if player ID does not exist', () => {
    const response = requestPlayerStatus(playerId + 1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });
});

describe('test GET /v1/player/:playerid/question/:questionposition', () => {
  let t1: string;
  let quizId: number;
  let sessionId: number;
  let playerId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;
    requestQuestionCreatev2(
      t1,
      quizId,
      {
        question: 'What is the capital of France?',
        duration: 1,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true, colour: 'red' },
          { answer: 'Berlin', correct: false, colour: 'blue' },
        ],
        correctAnswers: [0],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    const { sessionId: s1 } = requestSessionStart(t1, quizId, 0).body;
    sessionId = s1;
    playerId = requestPlayerJoin(sessionId, 'Player1').body.playerId;
  });

  test('get question info successfully', () => {
    requestSessionUpdate(t1, quizId, sessionId, 'NEXT_QUESTION');
    sleepSync(3000);
    const response = requestPlayerQuestionInfo(playerId, 1);
    expect(response.body).toStrictEqual({
      questionId: expect.any(Number),
      question: 'What is the capital of France?',
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String),
      points: 5,
      answers: [
        {
          answerId: expect.any(Number),
          answer: expect.any(String),
          colour: expect.any(String),
        },
        {
          answerId: expect.any(Number),
          answer: expect.any(String),
          colour: expect.any(String),
        },
      ],
    });
    expect(response.code).toStrictEqual(200);
  });

  test('return error if player ID does not exist', () => {
    const response = requestPlayerQuestionInfo(playerId + 9999, 1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('return error if question position is invalid', () => {
    const response = requestPlayerQuestionInfo(playerId, 9999);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('return error if session is in an invalid state', () => {
    requestSessionUpdate(t1, quizId, sessionId, 'END');
    const response = requestPlayerQuestionInfo(playerId, 1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('return error if session is in LOBBY state', () => {
    const response = requestPlayerQuestionInfo(playerId, 1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('return error if session is in QUESTION_COUNTDOWN state', () => {
    requestSessionUpdate(t1, quizId, sessionId, 'QUESTION_COUNTDOWN');
    const response = requestPlayerQuestionInfo(playerId, 1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });
});

describe('test /v1/player/:playerid/question/:questionposition/answer', () => {
  let t1: Token;
  let q1: quizId;
  let s1: { sessionId: number };
  let p1: { playerId: number };
  let qPos: number;
  let a1: number[];
  beforeEach(() => {
    requestClear();
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreatev2(t1.token, 'Sample Quiz', 'Sample Description').body;
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
      {
        question: 'What is the capital of France?',
        duration: 3,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
        correctAnswers: [0],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
      {
        question: 'Is the capital of France Paris?',
        duration: 5,
        points: 1,
        answers: [
          { answer: 'True', correct: true },
          { answer: 'True, again', correct: true },
        ],
        correctAnswers: [0, 1],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
      {
        question: 'Who is the Monarch of England?',
        duration: 15,
        points: 5,
        answers: [
          { answer: 'Queen Elizabeth II', correct: false },
          { answer: 'Prince Harry', correct: false },
          { answer: 'Prince Charles', correct: true },
          { answer: 'King T\'Challa', correct: false }
        ],
        correctAnswers: [2],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    s1 = requestSessionStart(t1.token, q1.quizId, 0).body;
    p1 = requestPlayerJoin(s1.sessionId, 'Player1').body;
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
    qPos = requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.atQuestion;
    a1 = [1];
  });

  test('correct return structure', () => {
    const ret = requestPlayerSubmitAnswer(p1.playerId, qPos, (a1));
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
  });

  test('playerId does not exist', () => {
    const ret = requestPlayerSubmitAnswer(p1.playerId + 1, qPos, (a1));
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });

  test('question position is not valid for the session this player is in', () => {
    const numQuestions: number = requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.metadata.numQuestions;
    const ret = requestPlayerSubmitAnswer(p1.playerId, numQuestions + 1, (a1));
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });

  test('Session is not in QUESTION_OPEN state', () => {
    // ANSWER_SHOW
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
    let ret = requestPlayerSubmitAnswer(p1.playerId, qPos, (a1));
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);

    // QUESTION_COUNTDOWN for next question
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    const a2: number[] = [1, 2];
    qPos = requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.atQuestion;
    ret = requestPlayerSubmitAnswer(p1.playerId, qPos, (a2));
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });

  test('session not currently on this question', () => {
    // Answering future question
    const a2: number[] = [1, 2];
    let ret = requestPlayerSubmitAnswer(p1.playerId, qPos + 1, (a2));
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);

    // Answering previous question
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    ret = requestPlayerSubmitAnswer(p1.playerId, qPos, (a1));
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });

  test('Answer IDs are not valid for this particular question', () => {
    const numQuestions: number = requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.metadata.numQuestions;
    let aError: number[] = [numQuestions + 1];
    let ret = requestPlayerSubmitAnswer(p1.playerId, qPos, (aError));
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);

    aError = [-1, 1, numQuestions + 1];
    ret = requestPlayerSubmitAnswer(p1.playerId, qPos, (aError));
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });

  test('There are duplicate answer IDs provided', () => {
    const aError: number[] = [1, 1];
    const ret = requestPlayerSubmitAnswer(p1.playerId, qPos, (aError));
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });

  test('Less than 1 answerId was submitted', () => {
    const aError: number[] = [];
    const ret = requestPlayerSubmitAnswer(p1.playerId, qPos, (aError));
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });
});

describe('test GET /v1/player/:playerid/question/:questionposition/results', () => {
  let t1: Token;
  let q1: quizId;
  let s1: { sessionId: number };
  let p1: { playerId: number };
  let p2: { playerId: number };
  let qPos: number;
  beforeEach(() => {
    requestClear();
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreatev2(t1.token, 'Sample Quiz', 'Sample Description').body;
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
      {
        question: 'What is the capital of France?',
        duration: 3,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
        correctAnswers: [0],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
      {
        question: 'Is the capital of France Paris?',
        duration: 5,
        points: 1,
        answers: [
          { answer: 'True', correct: true },
          { answer: 'True, again', correct: true },
        ],
        correctAnswers: [0, 1],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
      {
        question: 'Who is the Monarch of England?',
        duration: 15,
        points: 5,
        answers: [
          { answer: 'Queen Elizabeth II', correct: false },
          { answer: 'Prince Harry', correct: false },
          { answer: 'Prince Charles', correct: true },
          { answer: 'King T\'Challa', correct: false }
        ],
        correctAnswers: [2],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    s1 = requestSessionStart(t1.token, q1.quizId, 0).body;
    p1 = requestPlayerJoin(s1.sessionId, 'Player1').body;
    p2 = requestPlayerJoin(s1.sessionId, 'Player2').body;
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
    qPos = requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.atQuestion;
  });

  test('correct return structure', () => {
    requestPlayerSubmitAnswer(p1.playerId, qPos, [1]);
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
    const ret = requestQuesionResult(p1.playerId, qPos);
    expect(ret.body).toStrictEqual({
      questionId: requestPlayerQuestionInfo(p1.playerId, qPos).body.questionId,
      playersCorrectList: ['Player1'],
      averageAnswerTime: expect.any(Number),
      percentCorrect: expect.any(Number),
    });
    expect(ret.code).toStrictEqual(200);
  });

  test('playerId does not exist', () => {
    const ret = requestQuesionResult(p1.playerId + 1, qPos);
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });

  test('question position is not valid for the session this player is in', () => {
    const numQuestions: number = requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.metadata.numQuestions;
    const ret = requestQuesionResult(p1.playerId, numQuestions + 1);
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });

  test('Session is not in ANSWER_SHOW state', () => {
    let ret = requestQuesionResult(p1.playerId, qPos);
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);

    // ANSWER_SHOW
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');

    // QUESTION_COUNTDOWN for next question
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    qPos = requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.atQuestion;
    ret = requestQuesionResult(p1.playerId, qPos);
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);

    // QUESTION_OPEN
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
    ret = requestQuesionResult(p1.playerId, qPos);
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });

  test('session not currently on this question', () => {
    // Answers for future question
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
    let ret = requestQuesionResult(p1.playerId, qPos + 1);
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);

    // Answers for previous question
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
    ret = requestQuesionResult(p1.playerId, qPos);
    expect(ret.body).toStrictEqual({ error: expect.any(String) });
    expect(ret.code).toStrictEqual(400);
  });

  test('multiple results from multiple users', () => {
    // P1 gets it right, P2 gets it wrong
    requestPlayerSubmitAnswer(p1.playerId, qPos, [1]);
    requestPlayerSubmitAnswer(p2.playerId, qPos, [2]);
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');

    // Results requested from either player returns the same object
    let ret = requestQuesionResult(p1.playerId, qPos);
    expect(ret.body).toStrictEqual({
      questionId: requestQuesionResult(p1.playerId, qPos).body.questionId,
      playersCorrectList: ['Player1'],
      averageAnswerTime: expect.any(Number),
      percentCorrect: expect.any(Number),
    });
    expect(ret.code).toStrictEqual(200);
    ret = requestQuesionResult(p2.playerId, qPos);
    expect(ret.body).toStrictEqual({
      questionId: requestQuesionResult(p1.playerId, qPos).body.questionId,
      playersCorrectList: ['Player1'],
      averageAnswerTime: expect.any(Number),
      percentCorrect: expect.any(Number),
    });
    expect(ret.code).toStrictEqual(200);

    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
    qPos = requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.atQuestion;

    // P2 gets it right, P1 gets it wrong
    requestPlayerSubmitAnswer(p1.playerId, qPos, [1]);
    requestPlayerSubmitAnswer(p2.playerId, qPos, [1, 2]);
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');

    ret = requestQuesionResult(p1.playerId, qPos);
    expect(ret.body).toStrictEqual({
      questionId: requestPlayerQuestionInfo(p1.playerId, qPos).body.questionId,
      playersCorrectList: ['Player2'],
      averageAnswerTime: expect.any(Number),
      percentCorrect: expect.any(Number),
    });
    expect(ret.code).toStrictEqual(200);
  });
});

describe('test GET /v1/player/:playerid/results', () => {
  let t1: string;
  let quizId: number;
  let sessionId: number;
  let playerId: number;
  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;
    requestQuestionCreatev2(
      t1,
      quizId,
      {
        question: 'What is the capital of France?',
        duration: 10,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
        correctAnswers: [0],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    const { sessionId: s1 } = requestSessionStart(t1, quizId, 0).body;
    sessionId = s1;
    playerId = requestPlayerJoin(sessionId, 'Player1').body.playerId;
    requestSessionUpdate(t1, quizId, sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1, quizId, sessionId, 'SKIP_COUNTDOWN');
  });

  test('Error case: playerId DNE', () => {
    const result = requestPlayerResult(playerId + 1);
    expect(result.body).toStrictEqual({ error: expect.any(String) });
    expect(result.code).toStrictEqual(400);
  });

  test('Error case: session not in FINAL_RESULTS state', () => {
    requestSessionUpdate(t1, quizId, sessionId, 'END');
    const result = requestPlayerResult(playerId);
    expect(result.body).toStrictEqual({ error: expect.any(String) });
    expect(result.code).toStrictEqual(400);
  });

  test('Success Case', () => {
    requestSessionUpdate(t1, quizId, sessionId, 'SKIP_COUNTDOWN');
    requestPlayerSubmitAnswer(playerId, 1, [1]);
    requestSessionUpdate(t1, quizId, sessionId, 'GO_TO_ANSWER');
    requestSessionUpdate(t1, quizId, sessionId, 'GO_TO_FINAL_RESULTS');
    const result = requestPlayerResult(playerId);

    expect(result.body).toStrictEqual({
      usersRankedByScore: [
        {
          name: 'Player1',
          score: expect.any(Number),
        },
      ],
      questionResults: [
        {
          averageAnswerTime: expect.any(Number),
          percentCorrect: expect.any(Number),
          playersCorrectList: expect.any(Array),
          questionId: expect.any(Number),
        },
      ],
    });
    expect(result.code).toStrictEqual(200);
  });
});

describe('playerSessionChatHTTP', () => {
  let t1: string;
  let quizId: number;
  let sessionId: number;
  let playerId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;
    requestQuestionCreatev2(
      t1,
      quizId,
      {
        question: 'What is the capital of France?',
        duration: 1,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
        correctAnswers: [0],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    const { sessionId: s1 } = requestSessionStart(t1, quizId, 0).body;
    sessionId = s1;
    playerId = requestPlayerJoin(sessionId, 'Player1').body.playerId;
  });

  test('Success case', () => {
    requestPlayerSendChat(playerId, 'Hello, everyone!');
    const response = requestPlayerSessionChat(playerId);
    expect(response.body).toStrictEqual({
      messages: [
        {
          messageBody: 'Hello, everyone!',
          playerId: playerId,
          playerName: 'Player1',
          timeSent: expect.any(Number),
        },
      ],
    });
    expect(response.code).toStrictEqual(200);
  });

  test('Error: PlayerId does not exist', () => {
    const response = requestPlayerSessionChat(playerId + 1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('retrieve multiple chat messages in order', () => {
    requestPlayerSendChat(playerId, 'First message');
    requestPlayerSendChat(playerId, 'Second message');
    requestPlayerSendChat(playerId, 'Third message');

    const response = requestPlayerSessionChat(playerId);
    expect(response.body).toStrictEqual({
      messages: [
        {
          messageBody: 'First message',
          playerId: playerId,
          playerName: 'Player1',
          timeSent: expect.any(Number),
        },
        {
          messageBody: 'Second message',
          playerId: playerId,
          playerName: 'Player1',
          timeSent: expect.any(Number),
        },
        {
          messageBody: 'Third message',
          playerId: playerId,
          playerName: 'Player1',
          timeSent: expect.any(Number),
        },
      ],
    });
    expect(response.code).toStrictEqual(200);
  });
});

describe('playerSandChatHTTP', () => {
  let t1: string;
  let quizId: number;
  let sessionId: number;
  let playerId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;
    requestQuestionCreatev2(
      t1,
      quizId,
      {
        question: 'What is the capital of France?',
        duration: 1,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
        correctAnswers: [0],
        thumbnailUrl: 'https://example.com/image.jpg',
      }
    );
    const { sessionId: s1 } = requestSessionStart(t1, quizId, 0).body;
    sessionId = s1;
    playerId = requestPlayerJoin(sessionId, 'Player1').body.playerId;
  });

  test('Success case', () => {
    const response = requestPlayerSendChat(playerId, 'Greetings opponents! You will lose!');
    expect(response.body).toStrictEqual({});
    expect(response.code).toStrictEqual(200);
  });

  test.each(['', 'gg'.repeat(100)])(
    'Error: Message body too long or short',
    (messageBody) => {
      const response = requestPlayerSendChat(playerId, messageBody);
      expect(response.body).toStrictEqual({ error: expect.any(String) });
      expect(response.code).toStrictEqual(400);
    }
  );

  test('Error: PlayerId does not exist', () => {
    const messageBody1 = 'Greetings opponents! You will lose!';
    const response = requestPlayerSendChat(12, messageBody1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });
});
