import { requestClear } from './otherHTTP.test';
import {
  QuestionBody,
  Token,
  quizId,
} from './dataStore';
import {
  requestRegister,
  requestQuizCreatev2,
  requestQuizRemovev2,
  requestQuestionCreatev2,
  requestSessionStart,
  requestQuestionRemoveV2,
  requestSessionUpdate,
  requestSessionList,
  requestSessionStatus,
  requestSessionResults,
  requestSessionResultsCSV,
  requestPlayerJoin,
  requestPlayerSubmitAnswer,
} from './HTTPHelper';
import sleepSync from 'slync';

afterEach(() => {
  // Reset the state of our data so that each tests can run independently
  requestClear();
});

afterAll(() => {
  // Reset the state of our data so that each tests can run independently
  requestClear();
});

describe('test POST /v1/admin/quiz/:quizid/session/start', () => {
  let t1: Token;
  let q1: quizId;
  let questionBody: QuestionBody;
  let a1: { questionId: number };
  beforeEach(() => {
    requestClear();
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreatev2(t1.token, 'Sample Quiz', 'Sample Description').body;
    questionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    a1 = requestQuestionCreatev2(t1.token, q1.quizId, questionBody).body;
  });

  test('correct return structure', () => {
    const ret = requestSessionStart(t1.token, q1.quizId, 3);
    expect(ret.body).toStrictEqual({ sessionId: expect.any(Number) });
    expect(ret.code).toStrictEqual(200);
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestSessionStart('', q1.quizId, 2);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestSessionStart(t1.token + 1, q1.quizId, 2);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Error code 403 cases', () => {
    test('Valid token is provided, but not of owner of quizId in trash', () => {
      requestQuizRemovev2(t1.token, q1.quizId);
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const ret = requestSessionStart(t2.token, q1.quizId, 2);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('quiz doesnt exist', () => {
      const ret = requestSessionStart(t1.token, q1.quizId + 1, 2);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('Valid token is provided, but not of owner of quizId in active quizzes', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const q2 = requestQuizCreatev2(t2.token, 'Another Quiz', 'Another Description').body;
      const ret = requestSessionStart(t1.token, q2.quizId, 2);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
  });

  describe('Error code 400 cases', () => {
    test('autoStartNum is greater than 50', () => {
      const ret = requestSessionStart(t1.token, q1.quizId, 51);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('10 active sessions already exist', () => {
      for (let i = 0; i < 10; i++) {
        const ret = requestSessionStart(t1.token, q1.quizId, 3);
        expect(ret.body).toStrictEqual({ sessionId: expect.any(Number) });
        expect(ret.code).toStrictEqual(200);
      }
      const ret = requestSessionStart(t1.token, q1.quizId, 3);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('quiz has no questions', () => {
      requestQuestionRemoveV2(t1.token, q1.quizId, a1.questionId);
      const ret = requestSessionStart(t1.token, q1.quizId, 3);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('quiz is in trash', () => {
      requestQuizRemovev2(t1.token, q1.quizId);
      const ret = requestSessionStart(t1.token, q1.quizId, 3);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
  });

  test('multiple quiz sessions open for multiple people', () => {
    // User 1 opening 1st session using quiz 1
    let ret = requestSessionStart(t1.token, q1.quizId, 3);
    expect(ret.body).toStrictEqual({ sessionId: expect.any(Number) });
    expect(ret.code).toStrictEqual(200);

    // User 1 opening 2nd session using quiz 2
    const q2 = requestQuizCreatev2(t1.token, 'Another Sample Quiz', 'Another Sample Description').body;
    requestQuestionCreatev2(t1.token, q2.quizId, questionBody);
    ret = requestSessionStart(t1.token, q2.quizId, 4);
    expect(ret.body).toStrictEqual({ sessionId: expect.any(Number) });
    expect(ret.code).toStrictEqual(200);

    // User 2 opening 1st session using quiz 3
    const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
    const q3 = requestQuizCreatev2(t2.token, 'Sample Quiz A', 'Sample Description A').body;
    requestQuestionCreatev2(t2.token, q3.quizId, questionBody);
    ret = requestSessionStart(t2.token, q3.quizId, 2);
    expect(ret.body).toStrictEqual({ sessionId: expect.any(Number) });
    expect(ret.code).toStrictEqual(200);

    // User 2 opening 2nd session using quiz 3 again
    ret = requestSessionStart(t2.token, q3.quizId, 1);
    expect(ret.body).toStrictEqual({ sessionId: expect.any(Number) });
    expect(ret.code).toStrictEqual(200);

    // User 1 opening 3rd session using quiz 1 again
    ret = requestSessionStart(t1.token, q1.quizId, 49);
    expect(ret.body).toStrictEqual({ sessionId: expect.any(Number) });
    expect(ret.code).toStrictEqual(200);
  });
});

describe('test PUT /v1/admin/quiz/:quizid/session/:sessionid', () => {
  let t1: Token;
  let q1: quizId;
  let s1: { sessionId: number };
  beforeEach(() => {
    requestClear();
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreatev2(t1.token, 'Sample Quiz', 'Sample Description').body;
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
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
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
      {
        question: 'Is the capital of France Paris?',
        duration: 5,
        points: 1,
        answers: [
          { answer: 'True', correct: true },
          { answer: 'Not False', correct: true },
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
  });

  test('Generic correct return structure', () => {
    const ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    expect(ret.body).toStrictEqual({ });
    expect(ret.code).toStrictEqual(200);
  });

  describe('Generic Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestSessionUpdate('', q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestSessionUpdate(t1.token + 1, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Generic Error code 403 cases', () => {
    test('quiz doesnt exist', () => {
      const ret = requestSessionUpdate(t1.token, q1.quizId + 1, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('Valid token is provided, but not of owner of quizId in active quizzes', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const ret = requestSessionUpdate(t2.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
  });

  describe('Generic Error code 400 cases', () => {
    test('session id is not valid', () => {
      const ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId + 1, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
    test('action provided is not a viable action', () => {
      const ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
    test('action cannot be applied in the current state', () => {
      const ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId + 1, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
  });

  describe('Extensive testing of invalid actions provided', () => {
    test('lobby --> GO_TO_FINAL_RESULTS', () => {
      const ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('lobby --> GO_TO_ANSWER', () => {
      const ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('lobby --> SKIP_COUNTDOWN', () => {
      const ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('question_countdown --> GO_TO_FINAL_RESULTS', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('question_countdown --> GO_TO_ANSWER', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('question_countdown --> NEXT_QUESTION', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('question_open --> NEXT_QUESTION', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('question_open --> SKIP_COUNTDOWN', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('question_open --> GO_TO_FINAL_RESULTS', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('question_close --> SKIP_COUNTDOWN', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_CLOSE
      sleepSync(1000);

      // Test SKIP_COUNTDOWN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('question_close --> NEXT_QUESTION but no next question', () => {
      // Create a new quiz and session with only one question
      const q2 = requestQuizCreatev2(t1.token, 'Another Quiz', 'Another Description').body;
      requestQuestionCreatev2(
        t1.token,
        q2.quizId,
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
      const s2: { sessionId: number } = requestSessionStart(t1.token, q2.quizId, 0).body;

      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q2.quizId, s2.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q2.quizId, s2.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_CLOSE
      sleepSync(1000);

      // Test NEXT_QUESTION
      ret = requestSessionUpdate(t1.token, q2.quizId, s2.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('answer_show --> GO_TO_ANSWER', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to ANSWER_SHOW
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Test GO_TO_ANSWER
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('answer_show --> SKIP_COUNTDOWN', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to ANSWER_SHOW
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Test SKIP_COUNTDOWN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('answer_show --> NEXT_QUESTION but no next question', () => {
      // Create a new quiz and session with only one question
      const q2 = requestQuizCreatev2(t1.token, 'Another Quiz', 'Another Description').body;
      requestQuestionCreatev2(
        t1.token,
        q2.quizId,
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
      const s2: { sessionId: number } = requestSessionStart(t1.token, q2.quizId, 0).body;

      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q2.quizId, s2.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q2.quizId, s2.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to ANSWER_SHOW
      ret = requestSessionUpdate(t1.token, q2.quizId, s2.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Test NEXT_QUESTION
      ret = requestSessionUpdate(t1.token, q2.quizId, s2.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('final_results --> anything but END', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to ANSWER_SHOW
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to FINAL_RESULTS
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Test NEXT_QUESTION
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);

      // Test SKIP_COUNTDOWN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);

      // Test GO_TO_ANSWER
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);

      // Test GO_TO_FINAL_RESULTS
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('end --> anything', () => {
      // Go to END
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'END');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Test NEXT_QUESTION
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);

      // Test SKIP_COUNTDOWN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);

      // Test GO_TO_ANSWER
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);

      // Test GO_TO_FINAL_RESULTS
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);

      // Test END
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'END');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
  });

  describe('correct singular updates not already tested', () => {
    test('question_countdown --> wait', () => {
      // Go to QUESTION_COUNTDOWN
      const ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN by waiting
      sleepSync(3 * 1000);

      // Check if QUESTION_OPEN state
      expect(requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.state).toStrictEqual('QUESTION_OPEN');
    });

    test('question_countdown --> END', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to END
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'END');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Check if in END state
      expect(requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.state).toStrictEqual('END');
    });

    test('question_open --> END', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to END
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'END');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Check if in END state
      expect(requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.state).toStrictEqual('END');
    });

    test('question_close --> GO_TO_ANSWER', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_CLOSE
      sleepSync(1000);

      // Go to ANSWER_SHOW
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Check if in ANSWER_SHOW state
      expect(requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.state).toStrictEqual('ANSWER_SHOW');
    });

    test('question_close --> GO_TO_FINAL_RESULTS', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_CLOSE
      sleepSync(1000);

      // Go to FINAL_RESULTS
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Check if in FINAL_RESULTS state
      expect(requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.state).toStrictEqual('FINAL_RESULTS');
    });

    test('question_close --> NEXT_QUESTION', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_CLOSE
      sleepSync(1000);

      // Go to QUESTION_COUNTDOWN (next question)
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Check if in QUESTION_COUNTDOWN state
      expect(requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.state).toStrictEqual('QUESTION_COUNTDOWN');
    });

    test('question_close --> END', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_CLOSE
      sleepSync(1000);

      // Go to END
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'END');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Check if in END state
      expect(requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.state).toStrictEqual('END');
    });

    test('answer_show --> NEXT_QUESTION', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to ANSWER_SHOW
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_COUNTDOWN (next question)
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Check if in QUESTION_COUNTDOWN state
      expect(requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.state).toStrictEqual('QUESTION_COUNTDOWN');
    });

    test('answer_show --> END', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to ANSWER_SHOW
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to END
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'END');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Check if in END state
      expect(requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.state).toStrictEqual('END');
    });

    test('final_results --> END', () => {
      // Go to QUESTION_COUNTDOWN
      let ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to QUESTION_OPEN
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to ANSWER_SHOW
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to FINAL_RESULTS
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Go to END
      ret = requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'END');
      expect(ret.body).toStrictEqual({ });
      expect(ret.code).toStrictEqual(200);

      // Check if in END state
      expect(requestSessionStatus(t1.token, q1.quizId, s1.sessionId).body.state).toStrictEqual('END');
    });
  });
});

describe('test GET /v1/admin/quiz/:quizid/sessions', () => {
  let t1: Token;
  let q1: quizId;
  let s1: { sessionId: number };
  beforeEach(() => {
    requestClear();
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreatev2(t1.token, 'Sample Quiz', 'Sample Description').body;
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
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
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
      {
        question: 'Is the capital of France Paris?',
        duration: 5,
        points: 1,
        answers: [
          { answer: 'True', correct: true },
          { answer: 'Not False', correct: true },
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
  });

  test('correct return structure', () => {
    const ret = requestSessionList(t1.token, q1.quizId);
    expect(ret.body).toStrictEqual(
      {
        activeSessions: [s1.sessionId],
        inactiveSessions: [],
      });
    expect(ret.code).toStrictEqual(200);
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestSessionList('', q1.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestSessionList(t1.token + 1, q1.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Error code 403 cases', () => {
    test('Valid token is provided, but not of owner of quizId in trash', () => {
      requestQuizRemovev2(t1.token, q1.quizId);
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const ret = requestSessionList(t2.token, q1.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('quiz doesnt exist', () => {
      const ret = requestSessionList(t1.token, q1.quizId + 1);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('Valid token is provided, but not of owner of quizId in active quizzes', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const q2 = requestQuizCreatev2(t2.token, 'Another Quiz', 'Another Description').body;
      const ret = requestSessionList(t1.token, q2.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
  });

  test('multiple sessions correctly displayed', async () => {
    // s1 will stay in lobby
    // s2 will go to question_close
    const s2: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 1).body;
    requestSessionUpdate(t1.token, q1.quizId, s2.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s2.sessionId, 'SKIP_COUNTDOWN');
    await new Promise((r) => setTimeout(r, 1000));

    // s3 will go to END
    const s3: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 2).body;
    requestSessionUpdate(t1.token, q1.quizId, s3.sessionId, 'END');

    // s4 will go to answer_show
    const s4: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 3).body;
    requestSessionUpdate(t1.token, q1.quizId, s4.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s4.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t1.token, q1.quizId, s4.sessionId, 'ANSWER_SHOW');

    // s5 will go to final_results
    const s5: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 4).body;
    requestSessionUpdate(t1.token, q1.quizId, s5.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s5.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t1.token, q1.quizId, s5.sessionId, 'ANSWER_SHOW');
    requestSessionUpdate(t1.token, q1.quizId, s5.sessionId, 'GO_TO_FINAL_RESULTS');

    // s7 will go to end
    const s7: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 5).body;
    requestSessionUpdate(t1.token, q1.quizId, s7.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s7.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t1.token, q1.quizId, s7.sessionId, 'END');

    let ret = requestSessionList(t1.token, q1.quizId);
    expect(ret.body).toStrictEqual(
      {
        activeSessions: [s1.sessionId, s2.sessionId, s4.sessionId, s5.sessionId],
        inactiveSessions: [s3.sessionId, s7.sessionId],
      });
    expect(ret.code).toStrictEqual(200);

    // s1 will now go to end
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'END');
    ret = requestSessionList(t1.token, q1.quizId);
    expect(ret.body).toStrictEqual(
      {
        activeSessions: [s2.sessionId, s4.sessionId, s5.sessionId],
        inactiveSessions: [s1.sessionId, s3.sessionId, s7.sessionId],
      });
    expect(ret.code).toStrictEqual(200);
  });

  test('different quizzes have different session lists', () => {
    // s2 created by another user at answer_show
    const t2 = requestRegister('z6666666@ad.unsw.edu.au', 'An0th3rUser', 'Peter', 'Peterson').body;
    const q2 = requestQuizCreatev2(t2.token, 'Another Quiz', 'Another Description').body;
    requestQuestionCreatev2(
      t2.token,
      q2.quizId,
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
    const s2: { sessionId: number } = requestSessionStart(t2.token, q2.quizId, 0).body;

    requestSessionUpdate(t2.token, q2.quizId, s2.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t2.token, q2.quizId, s2.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t2.token, q2.quizId, s2.sessionId, 'GO_TO_ANSWER');

    // s3 will be at end
    const s3: { sessionId: number } = requestSessionStart(t2.token, q2.quizId, 10).body;
    requestSessionUpdate(t2.token, q2.quizId, s3.sessionId, 'END');

    // s4 will be created by 1st user and will be inactive
    const s4: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 49).body;
    requestSessionUpdate(t1.token, q1.quizId, s4.sessionId, 'END');

    // q1
    let ret = requestSessionList(t1.token, q1.quizId);
    expect(ret.body).toStrictEqual(
      {
        activeSessions: [s1.sessionId],
        inactiveSessions: [s4.sessionId],
      });
    expect(ret.code).toStrictEqual(200);

    // q2
    ret = requestSessionList(t2.token, q2.quizId);
    expect(ret.body).toStrictEqual(
      {
        activeSessions: [s2.sessionId],
        inactiveSessions: [s3.sessionId],
      });
    expect(ret.code).toStrictEqual(200);
  });
});

describe('test GET /v1/admin/quiz/:quizid/sessions', () => {
  let t1: Token;
  let q1: quizId;
  let s1: { sessionId: number };
  beforeEach(() => {
    requestClear();
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreatev2(t1.token, 'Sample Quiz', 'Sample Description').body;
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
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
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
      {
        question: 'Is the capital of France Paris?',
        duration: 5,
        points: 1,
        answers: [
          { answer: 'True', correct: true },
          { answer: 'Not False', correct: true },
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
  });

  test('correct return structure', () => {
    const ret = requestSessionList(t1.token, q1.quizId);
    expect(ret.body).toStrictEqual(
      {
        activeSessions: [s1.sessionId],
        inactiveSessions: [],
      });
    expect(ret.code).toStrictEqual(200);
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestSessionList('', q1.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestSessionList(t1.token + 1, q1.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Error code 403 cases', () => {
    test('Valid token is provided, but not of owner of quizId in trash', () => {
      requestQuizRemovev2(t1.token, q1.quizId);
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const ret = requestSessionList(t2.token, q1.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('quiz doesnt exist', () => {
      const ret = requestSessionList(t1.token, q1.quizId + 1);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('Valid token is provided, but not of owner of quizId in active quizzes', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const q2 = requestQuizCreatev2(t2.token, 'Another Quiz', 'Another Description').body;
      const ret = requestSessionList(t1.token, q2.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
  });

  test('multiple sessions correctly displayed', async () => {
    // s1 will stay in lobby
    // s2 will go to question_close
    const s2: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 1).body;
    requestSessionUpdate(t1.token, q1.quizId, s2.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s2.sessionId, 'SKIP_COUNTDOWN');
    await new Promise((r) => setTimeout(r, 1000));

    // s3 will go to END
    const s3: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 2).body;
    requestSessionUpdate(t1.token, q1.quizId, s3.sessionId, 'END');

    // s4 will go to answer_show
    const s4: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 3).body;
    requestSessionUpdate(t1.token, q1.quizId, s4.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s4.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t1.token, q1.quizId, s4.sessionId, 'ANSWER_SHOW');

    // s5 will go to final_results
    const s5: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 4).body;
    requestSessionUpdate(t1.token, q1.quizId, s5.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s5.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t1.token, q1.quizId, s5.sessionId, 'ANSWER_SHOW');
    requestSessionUpdate(t1.token, q1.quizId, s5.sessionId, 'GO_TO_FINAL_RESULTS');

    // s7 will go to end
    const s7: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 5).body;
    requestSessionUpdate(t1.token, q1.quizId, s7.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s7.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t1.token, q1.quizId, s7.sessionId, 'END');

    let ret = requestSessionList(t1.token, q1.quizId);
    expect(ret.body).toStrictEqual(
      {
        activeSessions: [s1.sessionId, s2.sessionId, s4.sessionId, s5.sessionId],
        inactiveSessions: [s3.sessionId, s7.sessionId],
      });
    expect(ret.code).toStrictEqual(200);

    // s1 will now go to end
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'END');
    ret = requestSessionList(t1.token, q1.quizId);
    expect(ret.body).toStrictEqual(
      {
        activeSessions: [s2.sessionId, s4.sessionId, s5.sessionId],
        inactiveSessions: [s1.sessionId, s3.sessionId, s7.sessionId],
      });
    expect(ret.code).toStrictEqual(200);
  });

  test('different quizzes have different session lists', () => {
    // s2 created by another user at answer_show
    const t2 = requestRegister('z6666666@ad.unsw.edu.au', 'An0th3rUser', 'Peter', 'Peterson').body;
    const q2 = requestQuizCreatev2(t2.token, 'Another Quiz', 'Another Description').body;
    requestQuestionCreatev2(
      t2.token,
      q2.quizId,
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
    const s2: { sessionId: number } = requestSessionStart(t2.token, q2.quizId, 0).body;

    requestSessionUpdate(t2.token, q2.quizId, s2.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t2.token, q2.quizId, s2.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t2.token, q2.quizId, s2.sessionId, 'GO_TO_ANSWER');

    // s3 will be at end
    const s3: { sessionId: number } = requestSessionStart(t2.token, q2.quizId, 10).body;
    requestSessionUpdate(t2.token, q2.quizId, s3.sessionId, 'END');

    // s4 will be created by 1st user and will be inactive
    const s4: { sessionId: number } = requestSessionStart(t1.token, q1.quizId, 49).body;
    requestSessionUpdate(t1.token, q1.quizId, s4.sessionId, 'END');

    // q1
    let ret = requestSessionList(t1.token, q1.quizId);
    expect(ret.body).toStrictEqual(
      {
        activeSessions: [s1.sessionId],
        inactiveSessions: [s4.sessionId],
      });
    expect(ret.code).toStrictEqual(200);

    // q2
    ret = requestSessionList(t2.token, q2.quizId);
    expect(ret.body).toStrictEqual(
      {
        activeSessions: [s2.sessionId],
        inactiveSessions: [s3.sessionId],
      });
    expect(ret.code).toStrictEqual(200);
  });
});

describe('test GET /v1/admin/quiz/:quizid/session/:sessionid', () => {
  let t1: Token;
  let q1: quizId;
  let s1: { sessionId: number };
  beforeEach(() => {
    requestClear();
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreatev2(t1.token, 'Sample Quiz', 'Sample Description').body;
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
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
    s1 = requestSessionStart(t1.token, q1.quizId, 0).body;
  });

  test('correct return structure', () => {
    const ret = requestSessionStatus(t1.token, q1.quizId, s1.sessionId);
    expect(ret.body).toStrictEqual({
      state: expect.any(String),
      atQuestion: expect.any(Number),
      players: expect.any(Array),
      metadata: {
        quizId: q1.quizId,
        name: 'Sample Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Sample Description',
        numQuestions: 1,
        questions: expect.any(Array),
        duration: expect.any(Number),
        thumbnailUrl: expect.any(String),
      },
    });
    expect(ret.code).toStrictEqual(200);
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestSessionStatus('', q1.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestSessionStatus(t1.token + 1, q1.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Error code 403 cases', () => {
    test('Valid token is provided, but not of owner of quizId in trash', () => {
      requestQuizRemovev2(t1.token, q1.quizId);
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const ret = requestSessionStatus(t2.token, q1.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('quiz doesn\'t exist', () => {
      const ret = requestSessionStatus(t1.token, q1.quizId + 1, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('Valid token is provided, but not of owner of quizId in active quizzes', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const q2 = requestQuizCreatev2(t2.token, 'Another Quiz', 'Another Description').body;
      const ret = requestSessionStatus(t1.token, q2.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
  });

  describe('Error code 400 cases', () => {
    test('Session Id does not refer to a valid session within this quiz', () => {
      const ret = requestSessionStatus(t1.token, q1.quizId, s1.sessionId + 1);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
  });
});

describe('test GET /v1/admin/quiz/:quizid/session/:sessionid/results', () => {
  let t1: Token;
  let q1: quizId;
  let s1: { sessionId: number };
  beforeEach(() => {
    requestClear();
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreatev2(t1.token, 'Sample Quiz', 'Sample Description').body;
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
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
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
      {
        question: 'Is the capital of France Paris?',
        duration: 5,
        points: 1,
        answers: [
          { answer: 'True', correct: true },
          { answer: 'Not False', correct: true },
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
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
  });

  test('correct return structure', () => {
    s1 = requestSessionStart(t1.token, q1.quizId, 0).body;
    // 3 Players
    const p1: { playerId: number } = requestPlayerJoin(s1.sessionId, 'Player1').body;
    const p2: { playerId: number } = requestPlayerJoin(s1.sessionId, 'Player2').body;
    const p3: { playerId: number } = requestPlayerJoin(s1.sessionId, 'Player3').body;
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');

    // P1 and P2 get it right
    requestPlayerSubmitAnswer(p1.playerId, 1, [1]);
    requestPlayerSubmitAnswer(p2.playerId, 1, [1]);
    requestPlayerSubmitAnswer(p3.playerId, 1, [2]);

    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');

    // P3 get it right
    requestPlayerSubmitAnswer(p1.playerId, 2, [1]);
    requestPlayerSubmitAnswer(p2.playerId, 2, [1]);
    requestPlayerSubmitAnswer(p3.playerId, 2, [1, 2]);

    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');

    // P2 get it right
    requestPlayerSubmitAnswer(p1.playerId, 3, [4]);
    requestPlayerSubmitAnswer(p2.playerId, 3, [3]);
    requestPlayerSubmitAnswer(p3.playerId, 3, [2]);

    // Final Results
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
    const ret = requestSessionResults(t1.token, q1.quizId, s1.sessionId);
    expect(ret.body).toStrictEqual({
      usersRankedByScore: [
        {
          name: 'Player2',
          score: 8,
        },
        {
          name: 'Player1',
          score: 5,
        },
        {
          name: 'Player3',
          score: 1,
        }
      ],
      questionResults: [
        {
          questionId: expect.any(Number),
          playersCorrectList: ['Player1', 'Player2'],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 67,
        },
        {
          questionId: expect.any(Number),
          playersCorrectList: ['Player3'],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 33,
        },
        {
          questionId: expect.any(Number),
          playersCorrectList: ['Player2'],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 33,
        },
      ]
    });
    expect(ret.code).toStrictEqual(200);
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestSessionResults('', q1.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestSessionResults(t1.token + 1, q1.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Error code 403 cases', () => {
    test('Valid token is provided, but not of owner of quizId in trash', () => {
      requestQuizRemovev2(t1.token, q1.quizId);
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const ret = requestSessionResults(t2.token, q1.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('quiz doesn\'t exist', () => {
      const ret = requestSessionResults(t1.token, q1.quizId + 1, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('Valid token is provided, but not of owner of quizId in active quizzes', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const q2 = requestQuizCreatev2(t2.token, 'Another Quiz', 'Another Description').body;
      const ret = requestSessionResults(t1.token, q2.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
  });

  describe('Error code 400 cases', () => {
    test('Session Id does not refer to a valid session within this quiz', () => {
      const ret = requestSessionResults(t1.token, q1.quizId, s1.sessionId + 1);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
    test('Session is not in FINAL_RESULTS state', () => {
      const s2 = requestSessionStart(t1.token, q1.quizId, 0).body;
      const ret = requestSessionResults(t1.token, q1.quizId, s2.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
  });
});

describe('GET /v1/admin/quiz/:quizid/session/:sessionid/results/csv', () => {
  let t1: Token;
  let q1: quizId;
  let s1: { sessionId: number };
  beforeEach(() => {
    requestClear();
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreatev2(t1.token, 'Sample Quiz', 'Sample Description').body;
    requestQuestionCreatev2(
      t1.token,
      q1.quizId,
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
    s1 = requestSessionStart(t1.token, q1.quizId, 0).body;
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'NEXT_QUESTION');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'SKIP_COUNTDOWN');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_ANSWER');
    requestSessionUpdate(t1.token, q1.quizId, s1.sessionId, 'GO_TO_FINAL_RESULTS');
  });

  test('correct return structure', () => {
    const ret = requestSessionResultsCSV(t1.token, q1.quizId, s1.sessionId);
    expect(ret.body).toStrictEqual({
      url: expect.any(String),
    });
    expect(ret.code).toStrictEqual(200);
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestSessionResultsCSV('', q1.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestSessionResultsCSV(t1.token + 'invalid', q1.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Error code 403 cases', () => {
    test('Valid token is provided, but not of owner of quizId in trash', () => {
      requestQuizRemovev2(t1.token, q1.quizId);
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const ret = requestSessionResultsCSV(t2.token, q1.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('quiz doesn\'t exist', () => {
      const ret = requestSessionResultsCSV(t1.token, q1.quizId + 1, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('Valid token is provided, but not of owner of quizId in active quizzes', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const q2 = requestQuizCreatev2(t2.token, 'Another Quiz', 'Another Description').body;
      const ret = requestSessionResultsCSV(t1.token, q2.quizId, s1.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
  });

  describe('Error code 400 cases', () => {
    test('Session Id does not refer to a valid session within this quiz', () => {
      const ret = requestSessionResultsCSV(t1.token, q1.quizId, s1.sessionId + 1);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
    test('Session is not in FINAL_RESULTS state', () => {
      const s2 = requestSessionStart(t1.token, q1.quizId, 0).body;
      const ret = requestSessionResultsCSV(t1.token, q1.quizId, s2.sessionId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
  });
});
