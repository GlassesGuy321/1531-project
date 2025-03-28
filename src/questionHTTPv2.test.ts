import { requestClear } from './otherHTTP.test';
import {
  QuestionBody,
} from './dataStore';
import {
  requestRegister,
  requestQuizCreatev2,
  requestQuestionCreatev2,
  requestQuestionUpdatev2,
  requestQuestionRemoveV2,
  requestSessionStart,
  requestQuestionMoveV2,
  requestQuestionDuplicateV2,
} from './HTTPHelper';

afterEach(() => {
  // Reset the state of our data so that each test can run independently
  requestClear();
});

describe('adminQuestionCreateHTTPv2', () => {
  let t1: string;
  let t2: string;
  let quizId: number;

  beforeEach(() => {
    requestClear();
    const { token: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Passw0rd', 'John', 'Smith').body;
    t1 = l1;
    const { token: l2 } = requestRegister('z6666666@ad.unsw.edu.au', 'Passw0rd', 'Jane', 'Doe').body;
    t2 = l2;
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'A basic math quiz').body;
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
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionCreatev2(t1, quizId, questionBody);
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
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionCreatev2(t1 + '1', quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'Token provided is invalid' });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for empty thumbnailUrl', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of Spain?',
      duration: 15,
      points: 5,
      answers: [
        { answer: 'Madrid', correct: true },
        { answer: 'Barcelona', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: '',
    };
    const response = requestQuestionCreatev2(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The thumbnailUrl is an empty string' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for invalid thumbnailUrl', () => {
    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
      thumbnailUrl: 'invalid-url',
    };
    const response = requestQuestionCreatev2(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The thumbnailUrl does not begin with "http://" or "https://" or does not end with one of the following filetypes (case insensitive): jpg, jpeg, png' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for unauthorized user', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of Italy?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'Rome', correct: true },
        { answer: 'Venice', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionCreatev2(t2, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a quiz that this user owns.' });
    expect(response.code).toStrictEqual(403);
  });

  test('return error for invalid question ID', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of Germany?',
      duration: 15,
      points: 5,
      answers: [
        { answer: 'Berlin', correct: true },
        { answer: 'Munich', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionCreatev2(t1, 9999, questionBody);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a valid quiz.' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for unsupported thumbnailUrl filetype', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.gif',
    };
    const response = requestQuestionCreatev2(t1, quizId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The thumbnailUrl does not begin with "http://" or "https://" or does not end with one of the following filetypes (case insensitive): jpg, jpeg, png' });
    expect(response.code).toStrictEqual(400);
  });
});

describe('adminQuestionUpdateHTTPv2', () => {
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
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'A basic math quiz').body;
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
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionCreatev2(t1, quizId, questionBody);
    questionId = response.body.questionId;
  });

  test('update question successfully', () => {
    const questionBody: QuestionBody = {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'Prince Charles', correct: true },
        { answer: 'Prince William', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
    };
    const response = requestQuestionUpdatev2(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({});
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
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionUpdatev2(t1 + '1', quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'Token provided is invalid' });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for empty thumbnailUrl', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of Spain?',
      duration: 15,
      points: 5,
      answers: [
        { answer: 'Madrid', correct: true },
        { answer: 'Barcelona', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: '',
    };
    const response = requestQuestionUpdatev2(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The thumbnailUrl is an empty string' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for invalid thumbnailUrl', () => {
    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
      thumbnailUrl: 'invalid-url',
    };
    const response = requestQuestionUpdatev2(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The thumbnailUrl does not begin with "http://" or "https://" or does not end with one of the following filetypes (case insensitive): jpg, jpeg, png' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for unauthorized user', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of Italy?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'Rome', correct: true },
        { answer: 'Venice', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionUpdatev2(t2, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a quiz that this user owns.' });
    expect(response.code).toStrictEqual(403);
  });

  test('return error for invalid question ID', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of Germany?',
      duration: 15,
      points: 5,
      answers: [
        { answer: 'Berlin', correct: true },
        { answer: 'Munich', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionUpdatev2(t1, quizId, 9999, questionBody);
    expect(response.body).toStrictEqual({ error: 'Question Id does not refer to a valid question within this quiz' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for unsupported thumbnailUrl filetype', () => {
    const questionBody: QuestionBody = {
      question: 'What is the capital of France?',
      duration: 10,
      points: 5,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.gif',
    };
    const response = requestQuestionUpdatev2(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The thumbnailUrl does not begin with "http://" or "https://" or does not end with one of the following filetypes (case insensitive): jpg, jpeg, png' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for invalid points', () => {
    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 15, // Invalid points
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionUpdatev2(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The points awarded for the question are less than 1 or greater than 10' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for too few answers', () => {
    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '4', correct: true },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionUpdatev2(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The question has more than 6 answers or less than 2 answers' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for too many answers', () => {
    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '1', correct: false },
        { answer: '2', correct: false },
        { answer: '3', correct: false },
        { answer: '4', correct: true },
        { answer: '5', correct: false },
        { answer: '6', correct: false },
        { answer: '7', correct: false },
      ],
      correctAnswers: [3],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionUpdatev2(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'The question has more than 6 answers or less than 2 answers' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for duplicate answers', () => {
    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '4', correct: true },
        { answer: '4', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionUpdatev2(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'Any answer strings are duplicates of one another (within the same question)' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for no correct answers', () => {
    const questionBody: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: false },
      ],
      correctAnswers: [],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const response = requestQuestionUpdatev2(t1, quizId, questionId, questionBody);
    expect(response.body).toStrictEqual({ error: 'There are no correct answers' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for total duration exceeding limit', () => {
    // First, create questions to fill up the duration to the limit
    const questionBody1: QuestionBody = {
      question: 'First question',
      duration: 120, // 2 minutes
      points: 5,
      answers: [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    const questionBody2: QuestionBody = {
      question: 'Second question',
      duration: 60, // 1 minute
      points: 5,
      answers: [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.jpg',
    };

    // Create the first two questions
    requestQuestionCreatev2(t1, quizId, questionBody1);
    requestQuestionCreatev2(t1, quizId, questionBody2);

    // Now try to update the first question to exceed the total duration limit
    const updatedQuestionBody: QuestionBody = {
      question: 'First question updated',
      duration: 61, // 1 minute 1 second, total exceeds 3 minutes now
      points: 5,
      answers: [
        { answer: 'Updated answer 1', correct: true },
        { answer: 'Updated answer 2', correct: false },
      ],
      correctAnswers: [0],
      thumbnailUrl: 'https://example.com/image.jpg',
    };

    // Assuming questionId is the ID of the first question created
    const response = requestQuestionUpdatev2(t1, quizId, questionId, updatedQuestionBody);
    expect(response.body).toStrictEqual({ error: 'The sum of the question durations in the quiz exceeds 3 minutes' });
    expect(response.code).toStrictEqual(400);
  });
});

describe('adminQuestionRemoveHTTPv2', () => {
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
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'A basic math quiz').body;
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
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    questionId = requestQuestionCreatev2(t1, quizId, questionBody).body.questionId;
  });

  test('remove question successfully', () => {
    const response = requestQuestionRemoveV2(t1, quizId, questionId);
    expect(response.body).toStrictEqual({});
    expect(response.code).toStrictEqual(200);
  });

  test('return error for empty or invalid token', () => {
    const response = requestQuestionRemoveV2(t1 + '1', quizId, questionId);
    expect(response.body).toStrictEqual({ error: 'Token provided is invalid' });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for not an owner of this quiz or quiz does not exist', () => {
    const response = requestQuestionRemoveV2(t2, quizId, questionId);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a quiz that this user owns.' });
    expect(response.code).toStrictEqual(403);
  });

  test('return error for invalid questionId', () => {
    const response = requestQuestionRemoveV2(t1, quizId, questionId + 1);
    expect(response.body).toStrictEqual({ error: 'Question Id does not refer to a valid question within this quiz' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error if any session for this quiz is not in END state', () => {
    // Start a session to set its state to LOBBY
    requestSessionStart(t1, quizId, 0);

    const response = requestQuestionRemoveV2(t1, quizId, questionId);
    expect(response.body).toStrictEqual({ error: 'Any session for this quiz is not in END state' });
    expect(response.code).toStrictEqual(400);
  });
});

describe('adminQuestionMoveHTTPv2', () => {
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
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'A basic math quiz').body;
    quizId = q1;

    const questionBody1: QuestionBody = {
      question: 'What is 2 + 2?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '3', correct: false },
        { answer: '4', correct: true },
      ],
      correctAnswers: [1],
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    questionId = requestQuestionCreatev2(t1, quizId, questionBody1).body.questionId;

    const questionBody2: QuestionBody = {
      question: 'What is 3 + 3?',
      duration: 30,
      points: 5,
      answers: [
        { answer: '5', correct: false },
        { answer: '6', correct: true },
      ],
      correctAnswers: [1],
      thumbnailUrl: 'http://example.com/image2.jpg'
    };
    requestQuestionCreatev2(t1, quizId, questionBody2);
  });

  test('move question successfully', () => {
    const response = requestQuestionMoveV2(t1, quizId, questionId, 1);
    expect(response.body).toStrictEqual({});
    expect(response.code).toStrictEqual(200);
  });

  test('return error for empty or invalid token', () => {
    const response = requestQuestionMoveV2(t1 + '1', quizId, questionId, 1);
    expect(response.body).toStrictEqual({ error: 'Token provided is invalid' });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for unauthorized user', () => {
    const response = requestQuestionMoveV2(t2, quizId, questionId, 1);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a quiz that this user owns.' });
    expect(response.code).toStrictEqual(403);
  });

  test('return error for invalid questionId', () => {
    const response = requestQuestionMoveV2(t1, quizId, questionId + 999, 1);
    expect(response.body).toStrictEqual({ error: 'Question Id does not refer to a valid question within this quiz' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for invalid newPosition', () => {
    const response = requestQuestionMoveV2(t1, quizId, questionId, -1);
    expect(response.body).toStrictEqual({ error: 'NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions, or NewPosition is the position of the current question' });
    expect(response.code).toStrictEqual(400);
  });

  test('return error for newPosition equal to current position', () => {
    const response = requestQuestionMoveV2(t1, quizId, questionId, 0);
    expect(response.body).toStrictEqual({ error: 'NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions, or NewPosition is the position of the current question' });
    expect(response.code).toStrictEqual(400);
  });
});

describe('adminQuestionDuplicateHTTPv2', () => {
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
    const { quizId: q1 } = requestQuizCreatev2(t1, 'Sample Quiz', 'A basic math quiz').body;
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
      thumbnailUrl: 'http://example.com/image.jpg'
    };
    questionId = requestQuestionCreatev2(t1, quizId, questionBody).body.questionId;
  });

  test('duplicate question successfully', () => {
    const response = requestQuestionDuplicateV2(t1, quizId, questionId);
    expect(response.body).toHaveProperty('newQuestionId');
    expect(response.code).toStrictEqual(200);
  });

  test('return error for empty or invalid token', () => {
    const response = requestQuestionDuplicateV2(t1 + '1', quizId, questionId);
    expect(response.body).toStrictEqual({ error: 'Token provided is invalid' });
    expect(response.code).toStrictEqual(401);
  });

  test('return error for unauthorized user', () => {
    const response = requestQuestionDuplicateV2(t2, quizId, questionId);
    expect(response.body).toStrictEqual({ error: 'Quiz ID does not refer to a quiz that this user owns.' });
    expect(response.code).toStrictEqual(403);
  });

  test('return error for invalid questionId', () => {
    const response = requestQuestionDuplicateV2(t1, quizId, questionId + 999);
    expect(response.body).toStrictEqual({ error: 'Question Id does not refer to a valid question within this quiz' });
    expect(response.code).toStrictEqual(400);
  });
});
