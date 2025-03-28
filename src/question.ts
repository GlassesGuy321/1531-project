import {
  QuizInfo,
  DataStore,
  getData,
  setData,
  EmptyObject,
  Questions,
  QuestionBody,
  State
} from './dataStore';
import {
  InvalidQuizIdError,
  UnauthorisedQuizIdError,
  InvalidTokenError,
} from './errors';

/**
 * HELPER FUNCTION
 *
 * @param {string} token
 * @returns {{ authUserId: number }} will return userId of the user who has the valid token, else a error message
 *
 * Checks whether the token provided is a valid sessionId linked to a currently registered user. Returns the user
 * if found, else a null object.
 */
function isValidToken(token: string): { authUserId: number } {
  const data = getData() as DataStore;
  for (const user of data.users) {
    if (user.currentSessionIds.includes(token)) {
      return { authUserId: user.userId };
    }
  }
  return null;
}

/**
 * HELPER FUNCTION (v2 because some other functions cannot use it yet, but will eventually replace the older one)
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
 * @param {string} thumbnailUrl - The URL of the thumbnail image.
 * @returns {ErrorMsg} An error message if validation fails, otherwise null.
 *
 * Validates the thumbnail URL.
 */
export function validateThumbnailUrl(thumbnailUrl: string): void {
  if (thumbnailUrl === '') {
    throw new Error('The thumbnailUrl is an empty string');
  }

  const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg))$/i;
  if (!urlRegex.test(thumbnailUrl)) {
    throw new Error('The thumbnailUrl does not begin with "http://" or "https://" or does not end with one of the following filetypes (case insensitive): jpg, jpeg, png');
  }
}

/**
 * HELPER FUNCTION
 *
 * @param {string} question - The question string to validate.
 * @returns {void}
 *
 * Validates the length of the question string.
 */
function validateQuestionString(question: string): void {
  if (question.length < 5 || question.length > 50) {
    throw new Error('Question string is less than 5 characters in length or greater than 50 characters in length');
  }
}

/**
 * HELPER FUNCTION
 *
 * @param {Answer[]} answers - The answers array to validate.
 * @returns {void}
 *
 * Validates the answers array for a question.
 */
function validateAnswers(answers: { answer: string; correct: boolean }[]): void {
  if (answers.length < 2 || answers.length > 6) {
    throw new Error('The question has more than 6 answers or less than 2 answers');
  }

  if (answers.some((answer: { answer: string }) => answer.answer.length < 1 || answer.answer.length > 30)) {
    throw new Error('The length of any answer is shorter than 1 character long, or longer than 30 characters long');
  }

  const uniqueAnswers = new Set(answers.map((answer: { answer: string }) => answer.answer));
  if (uniqueAnswers.size !== answers.length) {
    throw new Error('Any answer strings are duplicates of one another (within the same question)');
  }

  if (!answers.some((answer: { correct: boolean }) => answer.correct)) {
    throw new Error('There are no correct answers');
  }
}

/**
 * HELPER FUNCTION
 *
 * @param {number} duration - The duration of the question.
 * @param {number} currentTotalDuration - The current total duration of all questions in the quiz.
 * @returns {void}
 *
 * Validates the duration of a question.
 */
function validateDuration(duration: number, currentTotalDuration: number): void {
  if (duration <= 0) {
    throw new Error('The question duration is not a positive number');
  }

  if (currentTotalDuration + duration > 180) {
    throw new Error('The sum of the question durations in the quiz exceeds 3 minutes');
  }
}

/**
 * HELPER FUNCTION
 *
 * @param {number} points - The points assigned to the question.
 * @returns {void}
 *
 * Validates the points assigned to a question.
 */
function validatePoints(points: number): void {
  if (points < 1 || points > 10) {
    throw new Error('The points awarded for the question are less than 1 or greater than 10');
  }
}

/**
 * HELPER FUNCTION
 *
 * @returns {string} A random color code in hexadecimal format.
 *
 * Generates a random color code in hexadecimal format.
 */
function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * HELPER FUNCTION
 *
 * @param {QuestionBody} questionBody - The question body containing question details.
 * @param {QuizInfo} quiz - The quiz information containing existing questions.
 * @returns {Questions} A new question object.
 *
 * Creates a new question object with unique answer IDs across the entire quiz.
 */
function createNewQuestion(questionBody: QuestionBody, quiz: QuizInfo): Questions {
  const { question, duration, points, answers, correctAnswers, thumbnailUrl } = questionBody;
  const questionId = quiz.questions.length + 1;
  const currentTime = Math.floor(Date.now() / 1000);

  // Calculate the starting answerId based on the total number of existing answers in all questions

  return {
    questionId,
    question,
    duration,
    points,
    timeCreated: currentTime,
    timeLastEdited: currentTime,
    answers: answers.map((answer, index) => ({
      ...answer,
      colour: generateRandomColor(),
      answerId: index + 1
    })),
    correctAnswers,
    thumbnailUrl
  };
}

/**
 * Creates a new question in a quiz.
 *
 * @param {string} token - Authentication token.
 * @param {number} quizId - ID of the quiz where the question will be added.
 * @param {QuestionBody} questionBody - Details of the question to be created.
 * @returns {ErrorMsg | { questionId: number }} Error message or object with created question ID.
 */
export function adminQuestionCreate(token: string, quizId: number, questionBody: QuestionBody): { questionId: number } {
  const isValidSession = isValidToken(token);
  if (!isValidSession) {
    throw new InvalidTokenError();
  }

  const authUserId = isValidSession.authUserId;
  const data = getData() as DataStore;
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  isQuizIdValid(quiz, authUserId);

  const { question, duration, points, answers, thumbnailUrl } = questionBody;

  validateQuestionString(question);
  validateAnswers(answers);

  const currentTotalDuration = quiz.questions.reduce((sum, q) => sum + q.duration, 0);
  validateDuration(duration, currentTotalDuration);
  validatePoints(points);

  if (thumbnailUrl) {
    validateThumbnailUrl(thumbnailUrl); // This will throw an error if invalid
  }

  const newQuestion = createNewQuestion(questionBody, quiz);

  quiz.questions.push(newQuestion);
  quiz.numQuestions += 1;
  quiz.timeLastEdited = newQuestion.timeLastEdited;
  quiz.duration = quiz.questions.reduce((acc, question) => acc + question.duration, 0);
  setData(data);

  return { questionId: newQuestion.questionId };
}

/**
 * Updates an existing question in a quiz.
 *
 * @param {string} token - Authentication token.
 * @param {number} quizId - ID of the quiz containing the question.
 * @param {number} questionId - ID of the question to be updated.
 * @param {QuestionBody} questionBody - New details for the question.
 * @returns {EmptyObject} Empty object if successful.
 */
export function adminQuestionUpdate(token: string, quizId: number, questionId: number, questionBody: QuestionBody): EmptyObject {
  const isValidSession = isValidToken(token);
  if (!isValidSession) {
    throw new InvalidTokenError();
  }

  const authUserId = isValidSession.authUserId;
  const data = getData() as DataStore;
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  isQuizIdValid(quiz, authUserId);

  const question = quiz.questions.find(q => q.questionId === questionId);
  if (!question) {
    throw new Error('Question Id does not refer to a valid question within this quiz');
  }

  const { question: newQuestion, duration, points, answers, thumbnailUrl } = questionBody;

  validateQuestionString(newQuestion);
  validateAnswers(answers);

  const currentTotalDuration = quiz.questions.reduce((sum, q) => sum + q.duration, 0) - question.duration;
  validateDuration(duration, currentTotalDuration);
  validatePoints(points);

  if (thumbnailUrl) {
    validateThumbnailUrl(thumbnailUrl);
  }

  question.question = newQuestion;
  question.duration = duration;
  question.points = points;
  question.timeLastEdited = Math.floor(Date.now() / 1000);
  question.answers = answers.map((answer, index) => ({
    ...answer,
    colour: generateRandomColor(),
    answerId: index + 1 // Ensure unique IDs for each answer
  }));

  quiz.timeLastEdited = question.timeLastEdited;
  quiz.duration = quiz.questions.reduce((acc, question) => acc + question.duration, 0);
  setData(data);

  return {};
}

/**
 * Removes a question from a quiz.
 *
 * @param {string} token - The authentication token of the user.
 * @param {number} quizId - The ID of the quiz.
 * @param {number} questionId - The ID of the question to be removed.
 * @returns {EmptyObject} An empty object if the operation is successful.
 * @throws {InvalidTokenError} If the token is invalid.
 * @throws {UnauthorisedQuizIdError} If the user is not authorised to modify the quiz.
 * @throws {Error} If the question ID is invalid or any session is not in the END state.
 */
export function adminQuestionRemove(token: string, quizId: number, questionId: number): EmptyObject {
  const isValidSession = isValidToken(token);
  if (!isValidSession) {
    throw new InvalidTokenError();
  }

  const authUserId = isValidSession.authUserId;
  const data = getData() as DataStore;
  const quiz = data.quizzes.find(q => q.quizId === quizId);
  isQuizIdValid(quiz, authUserId);

  const questionIndex = quiz.questions.findIndex(q => q.questionId === questionId);
  if (questionIndex === -1) {
    throw new Error('Question Id does not refer to a valid question within this quiz');
  }

  const activeSession = data.sessions.find(session =>
    session.metadata.quizId === quizId && session.state !== State.END
  );
  if (activeSession) {
    throw new Error('Any session for this quiz is not in END state');
  }

  quiz.questions.splice(questionIndex, 1);
  quiz.numQuestions -= 1;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.duration = quiz.questions.reduce((acc, question) => acc + question.duration, 0);
  setData(data);

  return {};
}

/**
 *
 * @param {string} token - Authentication token.
 * @param {number} quizId - ID of the quiz containing the question.
 * @param {number} questionId - ID of the question to be moved.
 * @param {number} newPosition - New position index for the question.
 * @returns {EmptyObject | ErrorMsg} Empty object if successful, or error message.
 *
 * Moves a question to a new position within a quiz.
 */
export function adminQuestionMove(token: string, quizId: number, questionId: number, newPosition: number): EmptyObject {
  const isValidSession = isValidToken(token);
  if (!isValidSession) {
    throw new InvalidTokenError();
  }

  const authUserId = isValidSession.authUserId;
  const data = getData() as DataStore;
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  isQuizIdValid(quiz, authUserId);

  const questionIndex = quiz.questions.findIndex(q => q.questionId === questionId);
  if (questionIndex === -1) {
    throw new Error('Question Id does not refer to a valid question within this quiz');
  }

  const numQuestions = quiz.questions.length;
  if (newPosition < 0 || newPosition >= numQuestions || newPosition === questionIndex) {
    throw new Error('NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions, or NewPosition is the position of the current question');
  }

  const question = quiz.questions.splice(questionIndex, 1)[0];
  quiz.questions.splice(newPosition, 0, question);
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);

  return {};
}

/**
 *
 * @param {string} token - Authentication token.
 * @param {number} quizId - ID of the quiz containing the question.
 * @param {number} questionId - ID of the question to be duplicated.
 * @returns {{ newQuestionId: number }} Error message or object with new question ID.
 *
 * Duplicates a question within a quiz.
 */
export function adminQuestionDuplicate(
  token: string,
  quizId: number,
  questionId: number
): { newQuestionId?: number } {
  const data = getData();

  const user = data.users.find((user) => user.currentSessionIds.includes(token));
  if (!user) {
    throw new InvalidTokenError('Token provided is invalid');
  }

  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId && quiz.authUserId === user.userId);
  if (!quiz) {
    throw new UnauthorisedQuizIdError('Quiz ID does not refer to a quiz that this user owns.');
  }

  const questionIndex = quiz.questions.findIndex((q) => q.questionId === questionId);
  if (questionIndex === -1) {
    throw new Error('Question Id does not refer to a valid question within this quiz');
  }

  const newQuestionId = quiz.questions.length + 1;
  const currentTime = Math.floor(Date.now() / 1000);

  const newQuestion: Questions = {
    ...quiz.questions[questionIndex],
    questionId: newQuestionId,
    timeCreated: currentTime,
    timeLastEdited: currentTime,
    answers: quiz.questions[questionIndex].answers.map((answer, index) => ({
      ...answer,
      colour: generateRandomColor(),
      answerId: index + 1
    })),
  };

  quiz.questions.splice(questionIndex + 1, 0, newQuestion);
  quiz.numQuestions += 1;
  quiz.duration = quiz.questions.reduce((acc, question) => acc + question.duration, 0);
  quiz.timeLastEdited = currentTime;

  setData(data);

  return { newQuestionId: newQuestion.questionId };
}
