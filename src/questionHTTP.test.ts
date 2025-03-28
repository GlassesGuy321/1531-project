import { requestClear } from './otherHTTP.test';
import {
  QuestionBody
} from './dataStore';
import {
  requestRegister,
  requestQuizCreate,
  requestQuestionCreate,
  requestQuestionUpdate,
  requestQuestionRemove,
  requestQuestionMove,
  requestQuestionDuplicate
} from './HTTPHelper';

afterEach(() => {
  // Reset the state of our data so that each tests can run independently
  requestClear();
});

describe('adminQuestionCreateHTTP', () => {
  let t1: string;
  let t2: string;
  let quizId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { token: l2 } = requestRegister('z6666666@ad.unsw.edu.au', 'Passw0rd', 'Jane', 'Doe').body;
    t2 = l2;
    const { quizId: q1 } = requestQuizCreate(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;
  });

  test('create question successfully', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
      ],
      correctAnswers: [0],
    };
    const response = requestQuestionCreate(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ questionId: expect.any(Number) });
    expect(response.code).toStrictEqual(200);
  });

  test('return error for empty or invalid token', () => {
    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
    };
    const response = requestQuestionCreate(t1 + '1', quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'Token provided is invalid' });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for not an owner of this quiz or quiz does not exist', () => {
    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
    };
    const response = requestQuestionCreate(t2, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a quiz that this user owns.' });
    expect(response.code).toStrictEqual(403);
  });

  test('return error for invalid question body', () => {
    const questionBody: QuestionBody = {
      question: '',
      duration: 0,
      points: 0,
      answers: [],
      correctAnswers: [],
    };
    const response = requestQuestionUpdate(t1, quizId, 1, questionBody);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('Return error if there are no correct answers', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'Paris', correct: false },
        { answer: 'Berlin', correct: false },
      ],
      correctAnswers: [],
    };
    const response = requestQuestionCreate(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'There are no correct answers' });
    expect(response.code).toStrictEqual(400);
  });

  test('Return error if the question duration is not a positive number', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 0,
      points: 5,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
      ],
      correctAnswers: [0],
    };
    const response = requestQuestionCreate(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The question duration is not a positive number' });
    expect(response.code).toStrictEqual(400);
  });

  test('Return error if the sum of the question durations in the quiz exceeds 3 minutes', () => {
    // Create a question to fill up the duration
    for (let i = 0; i < 6; i++) {
      requestQuestionCreate(t1, quizId, {
        question: `Question ${i + 1}`,
        duration: 30,
        points: 5,
        answers: [
          { answer: 'Answer 1', correct: true },
          { answer: 'Answer 2', correct: false },
        ],
        correctAnswers: [0],
      });
    }
    const questionBody: QuestionBody = {
      question: 'Another Question',
      duration: 1,
      points: 5,
      answers: [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false },
      ],
      correctAnswers: [0],
    };
    const response = requestQuestionCreate(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The sum of the question durations in the quiz exceeds 3 minutes' });
    expect(response.code).toStrictEqual(400);
  });

  test('Return error if the points awarded for the question are less than 1 or greater than 10', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 11,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
      ],
      correctAnswers: [0],
    };
    const response = requestQuestionCreate(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The points awarded for the question are less than 1 or greater than 10' });
    expect(response.code).toStrictEqual(400);
  });

  test('Return error if the question has more than 6 answers or less than 2 answers', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'Paris', correct: true },
      ],
      correctAnswers: [0],
    };
    const response = requestQuestionCreate(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The question has more than 6 answers or less than 2 answers' });
    expect(response.code).toStrictEqual(400);

    const questionBodyTooManyAnswers: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false },
        { answer: 'Rome', correct: false },
        { answer: 'Lisbon', correct: false },
        { answer: 'Vienna', correct: false },
        { answer: 'Prague', correct: false },
      ],
      correctAnswers: [0],
    };
    const responseTooMany = requestQuestionCreate(t1, quizId, questionBodyTooManyAnswers);
    expect(responseTooMany.body).toStrictEqual({ error: 'The question has more than 6 answers or less than 2 answers' });
    expect(responseTooMany.code).toStrictEqual(400);
  });

  test('Return error if the length of any answer is shorter than 1 character long, or longer than 30 characters long', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 5,
      answers: [
        { answer: '', correct: true },
        { answer: 'Berlin', correct: false },
      ],
      correctAnswers: [0],
    };
    const response = requestQuestionCreate(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The length of any answer is shorter than 1 character long, or longer than 30 characters long' });
    expect(response.code).toStrictEqual(400);

    const questionBodyTooLongAnswer: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'A'.repeat(31), correct: true },
        { answer: 'Berlin', correct: false },
      ],
      correctAnswers: [0],
    };
    const responseTooLong = requestQuestionCreate(t1, quizId, questionBodyTooLongAnswer);
    expect(responseTooLong.body).toStrictEqual({ error: 'The length of any answer is shorter than 1 character long, or longer than 30 characters long' });
    expect(responseTooLong.code).toStrictEqual(400);
  });

  test('Return error if any answer strings are duplicates of one another (within the same question)', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Paris', correct: false },
      ],
      correctAnswers: [0],
    };
    const response = requestQuestionCreate(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'Any answer strings are duplicates of one another (within the same question)' });
    expect(response.code).toStrictEqual(400);
  });
});

describe('adminQuestionUpdateHTTP', () => {
  let t1: string;
  let t2: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { token: l2 } = requestRegister('z6666666@ad.unsw.edu.au', 'Passw0rd', 'Jane', 'Doe').body;
    t2 = l2;
    const { quizId: q1 } = requestQuizCreate(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;

    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
    };
    const { questionId: qId } = requestQuestionCreate(t1, quizId, questionBody).body;
    questionId = qId;
  });

  test('update question successfully', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of Germany?',
      duration: 20,
      points: 7,
      answers: [
        { answer: 'Paris', correct: false },
        { answer: 'Berlin', correct: true },
      ],
      correctAnswers: [1],
    };
    const response = requestQuestionUpdate(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({});
    expect(response.code).toStrictEqual(200);
  });

  test('return error for empty or invalid token', () => {
    const questionBody: QuestionBody = {
      question: 'Updated question?',
      duration: 30,
      points: 5,
      answers: [
        { answer: 'Answer 1', correct: false },
        { answer: 'Answer 2', correct: true },
      ],
      correctAnswers: [1],
    };
    const response = requestQuestionUpdate(t1 + '1', quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'Token provided is invalid' });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for not an owner of this quiz or quiz doesn\'t exist', () => {
    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
    };
    const response = requestQuestionUpdate(t2, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a quiz that this user owns.' });
    expect(response.code).toStrictEqual(403);
  });

  test('return error for invalid question body', () => {
    const questionBody: QuestionBody = {
      question: '',
      duration: 30,
      points: 5,
      answers: [
        { answer: '5', correct: false },
        { answer: '6', correct: true },
      ],
      correctAnswers: [],
    };
    const response = requestQuestionUpdate(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });
});

describe('adminQuestionRemoveHTTP', () => {
  let t1: string;
  let t2: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { token: l2 } = requestRegister('z6666666@ad.unsw.edu.au', 'Passw0rd', 'Jane', 'Doe').body;
    t2 = l2;
    const { quizId: q1 } = requestQuizCreate(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;

    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
    };
    questionId = requestQuestionCreate(t1, quizId, questionBody).body.questionId;
  });

  test('remove question successfully', () => {
    const response = requestQuestionRemove(t1, quizId, questionId);
    expect(response.body).toStrictEqual({});
    expect(response.code).toStrictEqual(200);
  });

  test('return error for empty or invalid token', () => {
    const response = requestQuestionRemove(t1 + '1', quizId, questionId);
    expect(response.body).toStrictEqual({ error: 'Token provided is invalid' });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for not an owner of this quiz or quiz does not exist', () => {
    const response = requestQuestionRemove(t2, quizId, questionId);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a quiz that this user owns.' });
    expect(response.code).toStrictEqual(403);
  });

  test('return error for invalid questionId', () => {
    const response = requestQuestionRemove(t1, quizId, questionId + 1);
    expect(response.body).toStrictEqual({ error: 'Question Id does not refer to a valid question within this quiz' });
    expect(response.code).toStrictEqual(400);
  });
});

describe('adminQuestionMoveHTTP', () => {
  let t1: string;
  let t2: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    const { token: l2 } = requestRegister('z5555556@ad.unsw.edu.au', 'Passw0rd', 'Jane', 'Doe').body;
    t1 = l1;
    t2 = l2;
    const { quizId: q1 } = requestQuizCreate(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;

    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
    };
    const { questionId: qId } = requestQuestionCreate(t1, quizId, questionBody).body;
    questionId = qId;
  });

  test('move question successfully', () => {
    // Adding another question to have a valid newPosition
    const anotherQuestionBody: QuestionBody = {
      question: 'What is 3 + 3?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '5', correct: false },
        { answer: '6', correct: true },
      ],
      correctAnswers: [1],
    };
    requestQuestionCreate(t1, quizId, anotherQuestionBody);

    const response = requestQuestionMove(t1, quizId, questionId, 1);
    expect(response.body).toStrictEqual({});
    expect(response.code).toStrictEqual(200);
  });

  test('return error for empty or invalid token', () => {
    const response = requestQuestionMove(t1 + '1', quizId, questionId, 1);
    expect(response.body).toStrictEqual({ error: 'Token provided is invalid' });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for not an owner of this quiz or quiz does not exist', () => {
    const response = requestQuestionMove(t2, quizId, questionId, 1);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a quiz that this user owns.' });
    expect(response.code).toStrictEqual(403);
  });

  test('return error for invalid questionId', () => {
    const response = requestQuestionMove(t1, quizId, questionId + 1, 1);
    expect(response.body).toStrictEqual({ error: 'Question Id does not refer to a valid question within this quiz' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for invalid position', () => {
    const response = requestQuestionMove(t1, quizId, questionId, -1);
    expect(response.body).toStrictEqual({ error: 'NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions, or NewPosition is the position of the current question' });
    expect(response.code).toStrictEqual(400);
  });
});

describe('adminQuestionDuplicateHTTP', () => {
  let t1: string;
  let t2: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { token: l2 } = requestRegister('z5555556@ad.unsw.edu.au', 'Passw0rd', 'Jane', 'Doe').body;
    t2 = l2;
    const { quizId: q1 } = requestQuizCreate(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;

    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
    };
    questionId = requestQuestionCreate(t1, quizId, questionBody).body.questionId;
  });

  test('duplicate question successfully', () => {
    const response = requestQuestionDuplicate(t1, quizId, questionId);
    expect(response.body).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(response.code).toStrictEqual(200);
  });

  test('return error for invalid token', () => {
    const response = requestQuestionDuplicate(t1 + '1', quizId, questionId);
    expect(response.body).toStrictEqual({ error: 'Token provided is invalid' });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for invalid questionId', () => {
    const response = requestQuestionDuplicate(t1, quizId, questionId + 1);
    expect(response.body).toStrictEqual({ error: 'Question Id does not refer to a valid question within this quiz' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for not an owner of this quiz or quiz doesn\'t exist', () => {
    const response = requestQuestionDuplicate(t2, quizId, questionId);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a quiz that this user owns.' });
    expect(response.code).toStrictEqual(403);
  });

  test('Return generic error for invalid question duplication', () => {
    const response = requestQuestionDuplicate(t1, quizId, questionId + 1);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });
});
