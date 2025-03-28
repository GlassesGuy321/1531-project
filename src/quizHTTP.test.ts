import { requestClear } from './otherHTTP.test';
import {
  Token,
  quizId,
} from './dataStore';
import {
  requestRegister,
  requestQuizCreate,
  requestQuizList,
  requestQuizDescriptionUpdate,
  requestQuizInfo,
  requestQuizNameUpdate,
  requestQuizRemove,
  requestQuizTrash,
  requestQuizRestore,
  requestEmpty,
  requestTransfer,
} from './HTTPHelper';
import sleepSync from 'slync';

afterEach(() => {
  // Reset the state of our data so that each tests can run independently
  requestClear();
});

describe('adminQuizCreateHTTP', () => {
  // Create user to authenticate quizzes
  let t1: string;

  beforeEach(() => {
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
  });

  afterEach(() => {
    requestClear();
  });

  test('Token is not a valid user', () => {
    const response = requestQuizCreate(t1 + '1', 'name', 'description');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(401);
  });

  describe('Invalid Name', () => {
    test('invalid symbols', () => {
      const response = requestQuizCreate(t1, 'b@te', 'description');
      expect(response.body).toStrictEqual({ error: expect.any(String) });
      expect(response.code).toStrictEqual(400);
    });
    test('invalid length', () => {
      const response = requestQuizCreate(t1, 'to', 'description');
      expect(response.body).toStrictEqual({ error: expect.any(String) });
      expect(response.code).toStrictEqual(400);
      const response2 = requestQuizCreate(t1, 'H'.repeat(40), 'description');
      expect(response2.body).toStrictEqual({ error: expect.any(String) });
      expect(response2.code).toStrictEqual(400);
    });
    test('Name already used by the same user', () => {
      requestQuizCreate(t1, 'Max', 'description');
      const response = requestQuizCreate(t1, 'Max', 'not a duplicate description');
      expect(response.body).toStrictEqual({ error: expect.any(String) });
      expect(response.code).toStrictEqual(400);
    });
    test('Name max length', () => {
      const response = requestQuizCreate(t1, 'A'.repeat(31), 'description');
      expect(response.body).toStrictEqual({ error: expect.any(String) });
      expect(response.code).toStrictEqual(400);
    });
  });

  test('Invalid description - too long', () => {
    expect(requestQuizCreate(t1, 'name', 'Hey'.repeat(120)).body).toStrictEqual({ error: expect.any(String) });
    expect(requestQuizCreate(t1, 'name', 'Hey'.repeat(120)).code).toStrictEqual(400);
  });

  test('Creates one quiz successfully', () => {
    const result = requestQuizCreate(t1, 'name', 'description');
    expect(result.body).toStrictEqual({ quizId: expect.any(Number) });
    expect(result.code).toStrictEqual(200);
  });

  test('Create multiple quizzes for the user', () => {
    const q1 = requestQuizCreate(t1, 'Quiz 1', 'This is Quiz 1').body;
    const q2 = requestQuizCreate(t1, 'Quiz 2', 'This is Quiz 2').body;
    const q3 = requestQuizCreate(t1, 'Quiz 3', 'This is Quiz 3').body;

    const response = requestQuizList(t1);

    expect(response.body).toStrictEqual({
      quizzes: [
        { quizId: q1.quizId, name: 'Quiz 1' },
        { quizId: q2.quizId, name: 'Quiz 2' },
        { quizId: q3.quizId, name: 'Quiz 3' },
      ],
    });
    expect(response.code).toStrictEqual(200);
    requestClear();
  });
});

describe('adminQuizListHTTP', () => {
  // Add a user to create quizzes with their authUserId
  let t1: string;
  let t2: string;
  beforeEach(() => {
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { token: l2 } = requestRegister('z6666666@ad.unsw.edu.au', 'Passw0rd2', 'Ben', 'Benson').body;
    t2 = l2;
  });

  // Clear data structure
  afterEach(() => {
    requestClear();
  });

  test('returns error for invalid token', () => {
    const response = requestQuizList(t1 + '1');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(401);
  });

  test('returns an empty list if no quizzes found', () => {
    const response = requestQuizList(t1);
    expect(response.code).toStrictEqual(200);
    expect(response.body).toStrictEqual({ quizzes: [] });
  });

  test('returns one quiz for one user', () => {
    const q1 = requestQuizCreate(t1, 'Sample Quiz', 'This is a sample Quiz').body;
    const response = requestQuizList(t1);
    expect(response.body).toStrictEqual(
      {
        quizzes: [
          {
            quizId: q1.quizId,
            name: 'Sample Quiz',
          }
        ]
      }
    );
    expect(response.code).toStrictEqual(200);
  });

  test('returns multiple quizzes for the user', () => {
    const q1 = requestQuizCreate(t1, 'Quiz 1', 'This is Quiz 1').body;
    const q2 = requestQuizCreate(t1, 'Quiz 2', 'This is Quiz 2').body;
    const q3 = requestQuizCreate(t1, 'Quiz 3', 'This is Quiz 3').body;

    const response = requestQuizList(t1);
    expect(response.body).toStrictEqual({
      quizzes: [
        { quizId: q1.quizId, name: 'Quiz 1' },
        { quizId: q2.quizId, name: 'Quiz 2' },
        { quizId: q3.quizId, name: 'Quiz 3' },
      ],
    });
    expect(response.code).toStrictEqual(200);
  });

  test('multiple and unique quizList calls are successful', () => {
    const q1 = requestQuizCreate(t1, 'Sample Quiz', 'This is a sample Quiz').body;
    // 1 User, 1 Quiz
    const response = requestQuizList(t1);
    expect(response.body).toStrictEqual(
      {
        quizzes: [
          {
            quizId: q1.quizId,
            name: 'Sample Quiz',
          }
        ]
      }
    );
    expect(response.code).toStrictEqual(200);

    const q2 = requestQuizCreate(t1, 'Sample Quiz2', 'This is another sample Quiz').body;
    const q3 = requestQuizCreate(t1, 'Sample Quiz3', 'This is yet another sample Quiz').body;
    // 1 User, 3 Quizzes
    const response2 = requestQuizList(t1);
    expect(response2.body).toStrictEqual(
      {
        quizzes: [
          {
            quizId: q1.quizId,
            name: 'Sample Quiz',
          },
          {
            quizId: q2.quizId,
            name: 'Sample Quiz2',
          },
          {
            quizId: q3.quizId,
            name: 'Sample Quiz3',
          }
        ]
      }
    );
    expect(response2.code).toStrictEqual(200);

    const q4 = requestQuizCreate(t2, 'Someone elses quiz', 'This is Bens Quiz').body;
    // 2 Users, 4 Quizzes - Display 1 quiz only
    const response3 = requestQuizList(t2);

    expect(response3.body).toStrictEqual(
      {
        quizzes: [
          {
            quizId: q4.quizId,
            name: 'Someone elses quiz',
          }
        ]
      }
    );
    expect(response3.code).toStrictEqual(200);

    const q5 = requestQuizCreate(t2, 'Someone elses quiz2', 'This is Bens Quiz2').body;
    // 2 Users, 5 Quizzes - Display 2 quizzes only
    const response4 = requestQuizList(t2);
    expect(response4.body).toStrictEqual(
      {
        quizzes: [
          {
            quizId: q4.quizId,
            name: 'Someone elses quiz',
          },
          {
            quizId: q5.quizId,
            name: 'Someone elses quiz2',
          }
        ]
      }
    );
    expect(response4.code).toStrictEqual(200);
  });
});

describe('adminQuizDescriptionUpdate HTTP', () => {
  // Add a user to create quizzes with their authUserId
  let t1: string;
  let quizId1: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('thisguy@hotmail.com', 'whous3shotmail', 'this', 'guy').body;
    t1 = l1;
    const { quizId: q1 } = requestQuizCreate(t1, 'quiz about quizzes', 'stinky quiz description').body;
    quizId1 = q1;
  });

  test('Invalid token - token does not exist', () => {
    expect(requestQuizDescriptionUpdate(t1 + '1', quizId1, 'the quiz of all quizzes frfr').body).toStrictEqual({ error: expect.any(String) });
    expect(requestQuizDescriptionUpdate(t1 + '1', quizId1, 'the quiz of all quizzes frfr').code).toStrictEqual(401);
  });

  test('Invalid QuizId - QuizId does not exist', () => {
    expect(requestQuizDescriptionUpdate(t1, quizId1 + 1, 'stinkiest description frfr').body).toStrictEqual({ error: expect.any(String) });
    expect(requestQuizDescriptionUpdate(t1, quizId1 + 1, 'stinkiest description frfr').code).toStrictEqual(403);
  });

  test('Invalid QuizId - QuizId does not belong to the user', () => {
    const { token: t2 } = requestRegister('mikehunt@gmail.com', 'm1ch@elhUntisdry', 'Michael', 'Hunt').body;
    expect(requestQuizDescriptionUpdate(t2, quizId1, 'the quiz of all time frfr').body).toStrictEqual({ error: expect.any(String) });
    expect(requestQuizDescriptionUpdate(t2, quizId1, 'the quiz of all time frfr').code).toStrictEqual(403);
  });

  test('Invalid Description - it is too long (>100 chars)', () => {
    expect(
      requestQuizDescriptionUpdate(
        t1,
        quizId1,
        'this quiz description is definitively over 100 characters long because i said so, for real, for real ._.'
      ).body
    ).toStrictEqual({ error: expect.any(String) });
    expect(
      requestQuizDescriptionUpdate(
        t1,
        quizId1,
        'this quiz description is definitively over 100 characters long because i said so, for real, for real ._.'
      ).code
    ).toStrictEqual(400);
  });

  test('Successful description update', () => {
    const response = requestQuizDescriptionUpdate(t1, quizId1, 'most eloquent description frfr');
    expect(requestQuizInfo(t1, quizId1).body).toStrictEqual({
      quizId: quizId1,
      name: 'quiz about quizzes',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'most eloquent description frfr',
      numQuestions: 0,
      questions: [],
      duration: 0
    });

    expect(response.code).toStrictEqual(200);
  });

  test('Successful Description Update - it is 100 chars', () => {
    expect(
      requestQuizDescriptionUpdate(
        t1,
        quizId1,
        'this quiz description is definitively just 100 characters long because i said so, for real, for real'
      ).body
    ).toStrictEqual({});
    expect(
      requestQuizDescriptionUpdate(
        t1,
        quizId1,
        'this quiz description is definitively just 100 characters long because i said so, for real, for real'
      ).code
    ).toStrictEqual(200);
  });

  test('Successful Description Update - it is empty', () => {
    expect(requestQuizDescriptionUpdate(t1, quizId1, '').body).toStrictEqual({});
    expect(requestQuizDescriptionUpdate(t1, quizId1, '').code).toStrictEqual(200);
  });
});

// Tests for adminQuizRemove
describe('adminQuizRemove HTTP', () => {
  let t1: string;
  let quizId: number;

  beforeEach(() => {
    const { token: l1 } = requestRegister('z5555555@example.com', 'Password123', 'John', 'Smith').body;
    t1 = l1;
    const { quizId: q1 } = requestQuizCreate(t1, 'Sample Quiz 1A', 'A basic math quiz').body;
    quizId = q1;
  });

  test('remove quiz successfully', () => {
    const response = requestQuizRemove(t1, quizId);
    expect(response.body).toStrictEqual({});
    expect(response.code).toStrictEqual(200);
  });

  test('return error for invalid token', () => {
    const response = requestQuizRemove(t1 + '1', quizId);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for invalid quiz', () => {
    const response = requestQuizRemove(t1, quizId - 1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('return error if user does not own the quiz', () => {
    const { token: t2 } = requestRegister('z5555556@example.com', 'Password123', 'Linlin', 'Lee').body;
    const response = requestQuizRemove(t2, quizId);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(403);
  });

  test('successfully remove multiple quizzes from different users until no more quizzes', () => {
    const { token: t2 } = requestRegister('z6666666@ad.unsw.edu.au', 'Amaz1ngPwd', 'Ben', 'Benson').body;
    const q2 = requestQuizCreate(t2, 'Sample Quiz 2A', 'Meticulate Message').body.quizId;
    const q3 = requestQuizCreate(t1, 'Sample Quiz 1B', 'Descriptive Description').body.quizId;

    requestQuizRemove(t2, q2);

    const q4 = requestQuizCreate(t2, 'Sample Quiz 2B', 'Exquisite Explanation').body.quizId;
    requestQuizRemove(t1, quizId);

    const q5 = requestQuizCreate(t2, 'Sample Quiz 2C', 'Immaculate Illustration').body.quizId;
    requestQuizRemove(t2, q4);
    requestQuizRemove(t2, q5);
    requestQuizRemove(t1, q3);
  });

  test('timeLastEdited timestamps are updated when removed', () => {
    const v1 = requestQuizInfo(t1, quizId).body.timeLastEdited;
    sleepSync(1000);
    const response = requestQuizRemove(t1, quizId);
    expect(response.body).toStrictEqual({});
    expect(response.code).toStrictEqual(200);
    const v2 = requestQuizInfo(t1, quizId).body.timeLastEdited;
    expect(v2).toBeGreaterThan(v1);
  });
});

describe('adminQuizNameUpdate HTTP', () => {
  let t1: string;
  let quizId: number;

  beforeEach(() => {
    const { token: l1 } = requestRegister('z5555555@example.com', 'Password123', 'John', 'Smith').body;
    t1 = l1;
    const { quizId: q1 } = requestQuizCreate(t1, 'Math Quiz', 'A basic math quiz').body;
    quizId = q1;
  });

  test('update quiz name successfully', () => {
    const response = requestQuizNameUpdate(t1, quizId, 'Updated Math Quiz');
    expect(response.body).toStrictEqual({});
    expect(response.code).toStrictEqual(200);
  });

  test('return error for invalid token', () => {
    const response = requestQuizNameUpdate(t1 + '1', quizId, 'New Name');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for invalid quiz', () => {
    const response = requestQuizNameUpdate(t1, quizId + 1, 'New Name');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('return error if user does not own the quiz', () => {
    const { token: t2 } = requestRegister('z5555556@example.com', 'Password123', 'Linlin', 'Lee').body;
    const response = requestQuizNameUpdate(t2, quizId, 'New Name');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(403);
  });

  test('Return error for invalid characters in name', () => {
    const response = requestQuizNameUpdate(t1, quizId, 'Invalid@Name');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('Return error for name being too short', () => {
    const response = requestQuizNameUpdate(t1, quizId, 'No');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('Return error for name being too long', () => {
    const response = requestQuizNameUpdate(t1, quizId, 'This name is way too long for a quiz');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('Return error if name is already used by the user for another quiz', () => {
    const q2 = requestQuizCreate(t1, 'Another Quiz', 'Another quiz').body.quizId;
    const response = requestQuizNameUpdate(t1, q2, 'Math Quiz');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });
});

describe('adminQuizInfoHTTP', () => {
  // Add a user to create quizzes with their authUserId
  let t1: string;
  let quizId1: number;

  beforeEach(() => {
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { quizId: q1 } = requestQuizCreate(t1, 'name', 'description').body;
    quizId1 = q1;
  });

  afterEach(() => {
    requestClear();
  });

  test('Invalid token.', () => {
    const response = requestQuizInfo(t1 + '1', quizId1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(401);
  });

  test('Invalid quizId', () => {
    const response = requestQuizInfo(t1, quizId1 - 1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('Returns error if quizId does not refer to a quiz that this user owns', () => {
    const { token: t2 } = requestRegister('z6666666@ad.unsw.edu.au', 'B3nsPassword', 'Ben', 'Johnson').body;
    const response = requestQuizInfo(t2, quizId1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(403);
  });

  // New test cases
  test('Unauthorized access to quiz in trash', () => {
    const { token: t2 } = requestRegister('z6666666@ad.unsw.edu.au', 'B3nsPassword', 'Ben', 'Johnson').body;
    requestQuizRemove(t1, quizId1);
    const response = requestQuizInfo(t2, quizId1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(403);
  });

  test('Returns one quiz successfully', () => {
    const response = requestQuizInfo(t1, quizId1);
    expect(response.body).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'description',
      numQuestions: 0,
      questions: [],
      duration: 0,
    });
    expect(response.code).toStrictEqual(200);
  });

  test('Multiple successful quiz info.', () => {
    const { token: t2 } = requestRegister('z6666666@ad.unsw.edu.au', 'B3nsPassword', 'Ben', 'Johnson').body;
    const { quizId: quizId2 } = requestQuizCreate(t1, 'will', 'description').body;
    const { quizId: quizId3 } = requestQuizCreate(t2, 'Math Quiz', 'Bens Math Quiz').body;
    const { quizId: quizId4 } = requestQuizCreate(t1, 'would', 'description').body;

    // Intentionally testing quizzes out of order to see if correct quizzes are displayed despite
    // order of quizCreate

    // 2nd Quiz
    const response2 = requestQuizInfo(t1, quizId2);
    expect(response2.body).toStrictEqual({
      quizId: quizId2,
      name: 'will',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'description',
      numQuestions: 0,
      questions: [],
      duration: 0,
    });
    expect(response2.code).toStrictEqual(200);

    // 3rd Quiz
    const response3 = requestQuizInfo(t2, quizId3);
    expect(response3.body).toStrictEqual({
      quizId: quizId3,
      name: 'Math Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Bens Math Quiz',
      numQuestions: 0,
      questions: [],
      duration: 0,
    });
    expect(response3.code).toStrictEqual(200);

    // 1st Quiz
    const response1 = requestQuizInfo(t1, quizId1);
    expect(response1.body).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'description',
      numQuestions: 0,
      questions: [],
      duration: 0,
    });
    expect(response1.code).toStrictEqual(200);

    // 4th Quiz
    const response4 = requestQuizInfo(t1, quizId4);
    expect(response4.body).toStrictEqual({
      quizId: quizId4,
      name: 'would',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'description',
      numQuestions: 0,
      questions: [],
      duration: 0,
    });
    expect(response4.code).toStrictEqual(200);
  });

  test('checks quizzes in trash too', () => {
    requestQuizRemove(t1, quizId1);
    const response = requestQuizInfo(t1, quizId1);
    expect(response.body).toStrictEqual({
      quizId: quizId1,
      name: 'name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'description',
      numQuestions: 0,
      questions: [],
      duration: 0,
    });
    expect(response.code).toStrictEqual(200);
  });
});

describe('test /v1/admin/quiz/trash', () => {
  let t1: Token;
  beforeEach(() => {
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
  });

  describe('invalid token provided', () => {
    test('no token provided', () => {
      const ret = requestQuizTrash('');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('token invalid', () => {
      const ret = requestQuizTrash(t1.token + '1');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  test('correct return structure', () => {
    const q1: quizId = requestQuizCreate(t1.token, 'Sample Quiz 1', 'Sample Description 1').body;
    requestQuizRemove(t1.token, q1.quizId);
    const ret = requestQuizTrash(t1.token);
    expect(ret.body).toStrictEqual({
      quizzes: [
        {
          quizId: q1.quizId,
          name: 'Sample Quiz 1'
        }
      ]
    });
    expect(ret.code).toStrictEqual(200);
  });

  test('single user has multiple quizzes in trash and not in trash', () => {
    const q1: quizId = requestQuizCreate(t1.token, 'Sample Quiz 1', 'Sample Description 1').body;
    const q2: quizId = requestQuizCreate(t1.token, 'Sample Quiz 2', 'Sample Description 2').body;
    const q3: quizId = requestQuizCreate(t1.token, 'Sample Quiz 3', 'Sample Description 3').body;
    const q4: quizId = requestQuizCreate(t1.token, 'Sample Quiz 4', 'Sample Description 4').body;

    requestQuizRemove(t1.token, q2.quizId);
    requestQuizRemove(t1.token, q4.quizId);

    expect(requestQuizList(t1.token).body).toStrictEqual({
      quizzes: [
        {
          quizId: q1.quizId,
          name: 'Sample Quiz 1'
        },
        {
          quizId: q3.quizId,
          name: 'Sample Quiz 3'
        },
      ]
    });
    const ret = requestQuizTrash(t1.token);
    expect(ret.body).toStrictEqual({
      quizzes: [
        {
          quizId: q2.quizId,
          name: 'Sample Quiz 2'
        },
        {
          quizId: q4.quizId,
          name: 'Sample Quiz 4'
        },
      ]
    });
    expect(ret.code).toStrictEqual(200);
  });

  test('multiple users and quizzes in trash', () => {
    // 1st user has 2 current quizzes and 1 deleted quiz
    const t1q1: quizId = requestQuizCreate(t1.token, 'Sample Quiz 1', 'Sample Description 1').body;
    const t1q2: quizId = requestQuizCreate(t1.token, 'Sample Quiz 2', 'Sample Description 2').body;
    const t1q3: quizId = requestQuizCreate(t1.token, 'Sample Quiz 3', 'Sample Description 3').body;
    requestQuizRemove(t1.token, t1q2.quizId);

    // 2nd User has 3 deleted quizzes
    const t2: Token = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
    const t2q1: quizId = requestQuizCreate(t2.token, 'Sample Quiz A', 'Sample Description A').body;
    const t2q2: quizId = requestQuizCreate(t2.token, 'Sample Quiz B', 'Sample Description B').body;
    const t2q3: quizId = requestQuizCreate(t2.token, 'Sample Quiz C', 'Sample Description C').body;
    requestQuizRemove(t2.token, t2q1.quizId);
    requestQuizRemove(t2.token, t2q2.quizId);
    requestQuizRemove(t2.token, t2q3.quizId);

    // 3rd User has 1 current quiz
    const t3: Token = requestRegister('z5678910@ad.unsw.edu.au', 'st1llv3ryg00d', 'Andrew', 'Garfield').body;
    const t3q1: quizId = requestQuizCreate(t3.token, 'My Only Quiz', 'Unique Description').body;

    // 1st User
    expect(requestQuizList(t1.token).body).toStrictEqual({
      quizzes: [
        {
          quizId: t1q1.quizId,
          name: 'Sample Quiz 1'
        },
        {
          quizId: t1q3.quizId,
          name: 'Sample Quiz 3'
        },
      ]
    });
    let ret = requestQuizTrash(t1.token);
    expect(ret.body).toStrictEqual({
      quizzes: [
        {
          quizId: t1q2.quizId,
          name: 'Sample Quiz 2'
        }
      ]
    });
    expect(ret.code).toStrictEqual(200);

    // 2nd User
    expect(requestQuizList(t2.token).body).toStrictEqual({
      quizzes: []
    });

    ret = requestQuizTrash(t2.token);
    expect(ret.body).toStrictEqual({
      quizzes: [
        {
          quizId: t2q1.quizId,
          name: 'Sample Quiz A'
        },
        {
          quizId: t2q2.quizId,
          name: 'Sample Quiz B'
        },
        {
          quizId: t2q3.quizId,
          name: 'Sample Quiz C'
        }
      ]
    });
    expect(ret.code).toStrictEqual(200);

    // 3rd User
    ret = requestQuizTrash(t3.token);
    expect(ret.body).toStrictEqual({
      quizzes: []
    });
    expect(ret.code).toStrictEqual(200);

    expect(requestQuizList(t3.token).body).toStrictEqual({
      quizzes: [
        {
          quizId: t3q1.quizId,
          name: 'My Only Quiz'
        }
      ]
    });
  });
});

describe('test /v1/admin/quiz/{quizid}/restore', () => {
  let t1: Token;
  let q1: quizId;
  beforeEach(() => {
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreate(t1.token, 'Sample Quiz', 'Sample Description').body;
    requestQuizRemove(t1.token, q1.quizId);
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestQuizRestore('', q1.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestQuizRestore(t1.token + '1', q1.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Error code 403 cases', () => {
    test('Valid token is provided, but not of owner of quizId in trash', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const ret = requestQuizRestore(t2.token, q1.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('quiz doesnt exist', () => {
      const ret = requestQuizRestore(t1.token, q1.quizId + 1);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('Valid token is provided, but not of owner of quizId in active quizzes', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const q2 = requestQuizCreate(t2.token, 'Another Quiz', 'Another Description').body;
      const ret = requestQuizRestore(t1.token, q2.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
  });

  describe('Error code 400 cases', () => {
    test('Quiz Id is not in users trash', () => {
      const q2 = requestQuizCreate(t1.token, 'Another Sample Quiz', 'Another Sample Description').body;

      const ret = requestQuizRestore(t1.token, q2.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
    test('Restoring quiz name is already in use by another user', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      requestQuizCreate(t2.token, 'Sample Quiz', 'Imposter Description');

      const ret = requestQuizRestore(t1.token, q1.quizId);
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
  });

  test('correct return structure', () => {
    const ret = requestQuizRestore(t1.token, q1.quizId);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
  });

  test('multiple quiz restores', () => {
    // t1 has 2 quizzes in trash, whilst t2 has 1 quiz in trash - all to be restored
    const q2 = requestQuizCreate(t1.token, 'Another Sample Quiz', 'Another Sample Description').body;
    const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
    const q3 = requestQuizCreate(t2.token, 'Sample Quiz A', 'Sample Description A').body;
    requestQuizRemove(t2.token, q3.quizId);
    requestQuizRemove(t1.token, q2.quizId);

    let ret = requestQuizRestore(t1.token, q1.quizId);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);

    ret = requestQuizRestore(t2.token, q3.quizId);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);

    ret = requestQuizRestore(t1.token, q2.quizId);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
  });

  test('check timeLastEdited timestamps are updated', () => {
    // t1 has 2 quizzes in trash, whilst t2 has 1 quiz in trash - all to be restored
    const q2 = requestQuizCreate(t1.token, 'Another Sample Quiz', 'Another Sample Description').body;
    const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
    const q3 = requestQuizCreate(t2.token, 'Sample Quiz A', 'Sample Description A').body;

    const q2v1 = requestQuizInfo(t1.token, q2.quizId).body.timeLastEdited;
    const q3v1 = requestQuizInfo(t2.token, q3.quizId).body.timeLastEdited;

    sleepSync(1000);
    requestQuizRemove(t2.token, q3.quizId);
    requestQuizRemove(t1.token, q2.quizId);

    let ret = requestQuizRestore(t2.token, q3.quizId);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
    const q3v2 = requestQuizInfo(t2.token, q3.quizId).body.timeLastEdited;
    expect(q3v2).toBeGreaterThan(q3v1);

    ret = requestQuizRestore(t1.token, q2.quizId);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
    const q2v2 = requestQuizInfo(t1.token, q2.quizId).body.timeLastEdited;
    expect(q2v2).toBeGreaterThan(q2v1);
  });
});

describe('test /v1/admin/quiz/trash/empty', () => {
  let t1: Token;
  let qArr: number[];
  let q1: quizId;
  beforeEach(() => {
    requestClear();
    // Reset qArr each time too
    qArr = [];
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreate(t1.token, 'Sample Quiz', 'Sample Description').body;
    requestQuizRemove(t1.token, q1.quizId);
    qArr.push(q1.quizId);
  });

  test('correct return structure', () => {
    const ret = requestEmpty(t1.token, JSON.stringify(qArr));
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);

    expect(requestQuizTrash(t1.token).body).toStrictEqual({ quizzes: [] });
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestEmpty('', JSON.stringify(qArr));
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestEmpty(t1.token + '1', JSON.stringify(qArr));
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Error code 403 cases', () => {
    test('Quiz Id refers to a quiz user does not own', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const q2 = requestQuizCreate(t2.token, 'Sample Quiz', 'Imposter Description').body;

      qArr.push(q2.quizId);
      const ret = requestEmpty(t1.token, JSON.stringify(qArr));
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('Quiz Id refers to a quiz that doesnt exist', () => {
      qArr.push(q1.quizId + 1);
      const ret = requestEmpty(t1.token, JSON.stringify(qArr));
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
  });

  describe('Error code 400 cases', () => {
    test('Quiz Id refers to a quiz not in trash', () => {
      const q2 = requestQuizCreate(t1.token, 'Sample Quiz', 'Imposter Description').body;
      qArr.push(q2.quizId);
      let ret = requestEmpty(t1.token, JSON.stringify(qArr));
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);

      requestQuizRemove(t1.token, q2.quizId);
      const q3 = requestQuizCreate(t1.token, 'Another Sample Quiz', 'Traitor Description').body;
      qArr.push(q3.quizId);
      ret = requestEmpty(t1.token, JSON.stringify(qArr));
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
  });

  test('multiple successful empty trashes', () => {
    // t1 has 2 quizzes in trash and 1 not, whilst t2 has 1 quiz in trash - all to be emptied
    const t1q2: quizId = requestQuizCreate(t1.token, 'Another Sample Quiz', 'Another Sample Description').body;
    const t1q3: quizId = requestQuizCreate(t1.token, 'Copied Sample Quiz', 'Copied Sample Description').body;
    const t2: Token = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
    const t2q1: quizId = requestQuizCreate(t2.token, 'Sample Quiz A', 'Sample Description A').body;
    requestQuizRemove(t2.token, t2q1.quizId);
    requestQuizRemove(t1.token, t1q3.quizId);
    qArr.push(t1q3.quizId);

    let ret = requestEmpty(t1.token, JSON.stringify(qArr));
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
    expect(requestQuizTrash(t1.token).body).toStrictEqual({ quizzes: [] });
    expect(requestQuizList(t1.token).body).toStrictEqual({
      quizzes: [
        {
          quizId: t1q2.quizId,
          name: 'Another Sample Quiz'
        }
      ]
    });

    ret = requestEmpty(t2.token, JSON.stringify([t2q1.quizId]));
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
    expect(requestQuizTrash(t2.token).body).toStrictEqual({ quizzes: [] });
    expect(requestQuizList(t2.token).body).toStrictEqual({ quizzes: [] });
  });
});

describe('test /v1/admin/quiz/:quizid/transfer', () => {
  let t1: Token;
  let q1: quizId;
  beforeEach(() => {
    t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith').body;
    q1 = requestQuizCreate(t1.token, 'Sample Quiz', 'Sample Description').body;
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestTransfer('', q1.quizId, 'z6666666@ad.unsw.edu.au');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestTransfer(t1.token + '1', q1.quizId, 'z6666666@ad.unsw.edu.au');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Error code 403 cases', () => {
    test('Valid token is provided, but not owner of quizId', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      const ret = requestTransfer(t2.token, q1.quizId, 'z5555555@ad.unsw.edu.au');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
    test('quiz doesnt exist', () => {
      const ret = requestTransfer(t1.token, q1.quizId + 1, 'z6666666@ad.unsw.edu.au');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(403);
    });
  });

  describe('Error code 400 cases', () => {
    test('userEmail is not a real user', () => {
      const ret = requestTransfer(t1.token, q1.quizId, 'z6666666@ad.unsw.edu.au');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('userEmail is the current logged in user', () => {
      const ret = requestTransfer(t1.token, q1.quizId, 'z5555555@ad.unsw.edu.au');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });

    test('Quiz ID refers to a quiz that has a name that is already used by the target user', () => {
      const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
      requestQuizCreate(t2.token, 'Sample Quiz', 'Imposter Description');

      const ret = requestTransfer(t1.token, q1.quizId, 'z5432109@ad.unsw.edu.au');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(400);
    });
  });

  test('correct return structure', () => {
    requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire');

    const ret = requestTransfer(t1.token, q1.quizId, 'z5432109@ad.unsw.edu.au');
    expect(ret.body).toStrictEqual({ });
    expect(ret.code).toStrictEqual(200);
  });

  test('check timeLastEdited timestamps are updated', () => {
    const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
    const q2 = requestQuizCreate(t2.token, 'Peter', 'Parker').body;

    const q1v1 = requestQuizInfo(t1.token, q1.quizId).body.timeLastEdited;
    const q2v1 = requestQuizInfo(t2.token, q2.quizId).body.timeLastEdited;

    sleepSync(1000);
    let ret = requestTransfer(t1.token, q1.quizId, 'z5432109@ad.unsw.edu.au');
    expect(ret.body).toStrictEqual({ });
    expect(ret.code).toStrictEqual(200);
    const q1v2 = requestQuizInfo(t2.token, q1.quizId).body.timeLastEdited;
    expect(q1v2).toBeGreaterThan(q1v1);

    sleepSync(1000);
    ret = requestTransfer(t2.token, q2.quizId, 'z5555555@ad.unsw.edu.au');
    expect(ret.body).toStrictEqual({ });
    expect(ret.code).toStrictEqual(200);
    const q2v2 = requestQuizInfo(t1.token, q2.quizId).body.timeLastEdited;
    expect(q2v2).toBeGreaterThan(q2v1);
    expect(q2v2).toBeGreaterThan(q1v2);
  });

  test('multiple transfers', () => {
    const t2 = requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire').body;
    const t2q1 = requestQuizCreate(t2.token, 'Peter', 'Parker').body;
    const t1q2 = requestQuizCreate(t1.token, 'Sample Quiz 2', 'Sample Description 2').body;

    let ret = requestTransfer(t1.token, q1.quizId, 'z5432109@ad.unsw.edu.au');
    expect(ret.body).toStrictEqual({ });
    expect(ret.code).toStrictEqual(200);
    expect(requestQuizList(t1.token).body).toStrictEqual({
      quizzes: [
        {
          quizId: t1q2.quizId,
          name: 'Sample Quiz 2',
        }
      ]
    });
    expect(requestQuizList(t2.token).body).toStrictEqual({
      quizzes: [
        {
          quizId: q1.quizId,
          name: 'Sample Quiz'
        },
        {
          quizId: t2q1.quizId,
          name: 'Peter'
        }
      ]
    });

    ret = requestTransfer(t2.token, t2q1.quizId, 'z5555555@ad.unsw.edu.au');
    expect(ret.body).toStrictEqual({ });
    expect(ret.code).toStrictEqual(200);
    expect(requestQuizList(t1.token).body).toStrictEqual({
      quizzes: [
        {
          quizId: t2q1.quizId,
          name: 'Peter',
        },
        {
          quizId: t1q2.quizId,
          name: 'Sample Quiz 2',
        },
      ]
    });
    expect(requestQuizList(t2.token).body).toStrictEqual({
      quizzes: [
        {
          quizId: q1.quizId,
          name: 'Sample Quiz'
        }
      ]
    });

    ret = requestTransfer(t2.token, q1.quizId, 'z5555555@ad.unsw.edu.au');
    expect(ret.body).toStrictEqual({ });
    expect(ret.code).toStrictEqual(200);
    expect(requestQuizList(t1.token).body).toStrictEqual({
      quizzes: [
        {
          quizId: q1.quizId,
          name: 'Sample Quiz'
        },
        {
          quizId: t2q1.quizId,
          name: 'Peter',
        },
        {
          quizId: t1q2.quizId,
          name: 'Sample Quiz 2',
        },
      ]
    });
    expect(requestQuizList(t2.token).body).toStrictEqual({
      quizzes: []
    });
  });
});
