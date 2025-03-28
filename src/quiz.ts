import {
  QuizInfo,
  quizInfoReturn,
  DataStore,
  getData,
  setData,
  quizListReturn,
  EmptyObject,
  quizId,
} from './dataStore';

import {
  CurrentLoggedInUserError,
  InvalidQuizIdError,
  UnauthorisedQuizIdError,
  InvalidTokenError,
  InvalidUserError,
  NonexistentQuizError,
  NotInTrashQuizError,
  QuizNameAlreadyInUseError,
  UnauthorizedQuizError,
  NameCharactorError,
  NameLengthError,
  NameUniError,
  DescriptionLengthError,
  ActiveSessionFoundError,
  InvalidDescriptionError,
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
 * Provide a list of all quizzes that are owned by the currently logged in user.
 *
 * @param {string} token
 * @returns {
 *  Array<{
 *      quizId: integer
 *      name: string
 *  }>
 * }
 *
 */
export function adminQuizList(token: string): quizListReturn {
  // Check if token is a valid session ID related to a registered user.
  const isValidSession = isValidToken(token);
  let authUserId: number;
  if (isValidSession) {
    authUserId = isValidSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  const userQuizzes = data.quizzes.filter(function(quiz) {
    return quiz.authUserId === authUserId;
  });

  // Sort quizzes from oldest edited to most recently edited
  userQuizzes.sort((a, b) => a.timeLastEdited - b.timeLastEdited);

  // create quiz list
  const quizzesList = userQuizzes.map(function(quiz) {
    return {
      quizId: quiz.quizId,
      name: quiz.name,
    };
  });

  // return quiz list
  return { quizzes: quizzesList };
}

/**
 * Given basic details about a new quiz, create one for the logged in user.
 *
 * @param {string} token
 * @param {string} name
 * @param {string} description
 * @returns {
 *       quizId: integer
 * }
 *
 */
export function adminQuizCreate(token: string, name: string, description: string): quizId {
  // Check if token is a valid session ID related to a registered user.
  const isValidSession = isValidToken(token);
  let authUserId: number;
  if (isValidSession) {
    authUserId = isValidSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  // Validate name characters
  const validChar = /^[a-zA-Z0-9 ]+$/;
  if (!validChar.test(name)) {
    throw new NameCharactorError();
  }

  // Validate name length
  if (name.length < 3 || name.length > 30) {
    throw new NameLengthError();
  }

  const data = getData() as DataStore;
  // Check for duplicate quiz name for the same user
  if (data.quizzes.some(quiz => quiz.authUserId === authUserId && quiz.name === name)) {
    throw new NameUniError();
  }

  // Validate description length
  if (description.length > 100) {
    throw new DescriptionLengthError();
  }

  // Generate unique quizId
  const quizId: number = data.quizzes.length + data.quizTrash.length + 1;

  const createQuiz: QuizInfo = {
    quizId: quizId,
    name: name,
    authUserId: authUserId,
    timeCreated: Math.floor(Date.now() / 1000),
    timeLastEdited: Math.floor(Date.now() / 1000),
    description: description,
    numQuestions: 0,
    questions: [],
    duration: 0,
    currentSessions: [],
    inactiveSessions: [],
  };

  data.quizzes.push(createQuiz);
  setData(data);

  return { quizId: quizId };
}

/**
 * Given a particular quiz, permanently remove the quiz.
 *
 * @param {string} token
 * @param {integer} quizId
 * @returns {} empty object
 *
 */
export function adminQuizRemove(token: string, quizId: number): EmptyObject {
  // Check if token is a valid session ID related to a registered user.
  const isValidSession = isValidToken(token);
  let authUserId: number;
  if (isValidSession) {
    authUserId = isValidSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data: DataStore = getData();
  // Check if the quiz ID is valid
  const quiz: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    throw new InvalidQuizIdError();
  }

  if (quiz.authUserId !== authUserId) {
    throw new UnauthorisedQuizIdError();
  }

  // Move quiz to user's trash
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  data.quizTrash.push(quiz);

  // Remove the quiz
  data.quizzes = data.quizzes.filter(quiz => quiz.quizId !== quizId);
  setData(data);

  return {};
}

/**
 * Get all of the relevant information about the current quiz.
 *
 * @param {string} token
 * @param {integer} quizId
 * @returns {
*      quizId: integer
*      name: string
*      timeCreated: integer
*      timeLastEdited: integer
*      description: string
* }
*
*
*/
export function adminQuizInfo(token: string, quizId: number): quizInfoReturn {
  // Check if token is a valid session ID related to a registered user.
  const isValidSession = isValidToken(token);
  let authUserId: number;
  if (isValidSession) {
    authUserId = isValidSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Check if the quiz ID is valid (in quizzes)
  const quiz: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);
  // If quiz doesn't exist in current quizzes, check trash.
  if (!quiz) {
    const quizTrash: QuizInfo = data.quizTrash.find(quiz => quiz.quizId === quizId);
    if (!quizTrash) {
      throw new NonexistentQuizError();
    }
    if (quizTrash.authUserId !== authUserId) {
      throw new UnauthorisedQuizIdError();
    }

    return {
      quizId: quizTrash.quizId,
      name: quizTrash.name,
      timeCreated: quizTrash.timeCreated,
      timeLastEdited: quizTrash.timeLastEdited,
      description: quizTrash.description,
      numQuestions: quizTrash.numQuestions,
      questions: quizTrash.questions,
      duration: quizTrash.duration,
    };
  } else if (quiz.authUserId !== authUserId) {
    throw new UnauthorisedQuizIdError();
  } else {
    return {
      quizId: quiz.quizId,
      name: quiz.name,
      timeCreated: quiz.timeCreated,
      timeLastEdited: quiz.timeLastEdited,
      description: quiz.description,
      numQuestions: quiz.numQuestions,
      questions: quiz.questions,
      duration: quiz.duration,
    };
  }
}

/**
 * Update the name of the relevant quiz.
 *
 * @param {string} token
 * @param {integer} quizId
 * @param {string} name
 * @returns { } empty object
 *
 */
export function adminQuizNameUpdate(token: string, quizId: number, name: string): EmptyObject {
  // Check if token is a valid session ID related to a registered user.
  const isValidSession = isValidToken(token);
  let authUserId: number;
  if (isValidSession) {
    authUserId = isValidSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Check if the quiz ID is valid
  const quiz: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    throw new InvalidQuizIdError();
  }

  if (quiz.authUserId !== authUserId) {
    throw new UnauthorisedQuizIdError();
  }

  // Validate name characters
  const validChar = /^[a-zA-Z0-9 ]+$/;
  if (!validChar.test(name)) {
    throw new NameCharactorError();
  }

  // Validate name length
  if (name.length < 3 || name.length > 30) {
    throw new NameLengthError();
  }

  // Validate name uniqueness
  const nameExists = data.quizzes.some(q => q.authUserId === authUserId && q.name === name && q.quizId !== quizId);
  if (nameExists) {
    throw new NameUniError();
  }

  // Update quiz name
  quiz.name = name;
  setData(data);

  return {};
}

/**
 * Update the description of the relevant quiz.
 *
 * @param {string} token
 * @param {integer} quizId
 * @param {string} description
 * @returns { } empty object
 */
export function adminQuizDescriptionUpdate(token: string, quizId: number, description: string): EmptyObject {
  // Check if token is a valid session ID related to a registered user.
  const isValidSession = isValidToken(token);
  let authUserId: number;
  if (isValidSession) {
    authUserId = isValidSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Check if the quiz ID is valid
  const quiz: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);

  if (!quiz) {
    throw new InvalidQuizIdError();
  }

  if (quiz.authUserId !== authUserId) {
    throw new UnauthorisedQuizIdError();
  }

  // Checks if the description entered is over 100 characters long
  if (description.length > 100) {
    throw new InvalidDescriptionError();
  }

  // If no errors, then the description of the quiz is updated
  quiz.description = description;

  // Update datastore
  setData(data);

  return {};
}

export function adminQuizThumbnailUpdate(token: string, quizId: number, imgUrl: string): EmptyObject {
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

  // Check validity of imgUrl
  if (imgUrl === '') {
    throw new Error('The thumbnailUrl is an empty string');
  }

  const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg))$/i;
  if (!urlRegex.test(imgUrl)) {
    throw new Error('The thumbnailUrl does not begin with "http://" or "https://" or does not end with one of the following filetypes (case insensitive): jpg, jpeg, png');
  }

  // No errors, update URL
  quiz.thumbnailUrl = imgUrl;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);
  return {};
}

/**
 *
 * @param {string} token
 * @returns {quizListReturn} similar to adminQuizList
 *
 * Returns the quizList of a user's quiz trash - found using the provided token.
 * Return type is identical to adminQuizList return type.
 */
export function adminQuizTrash(token: string): quizListReturn {
  // Check if token is a valid session ID related to a registered user.
  const isValidSession = isValidToken(token);
  let authUserId: number;
  if (isValidSession) {
    authUserId = isValidSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;

  // Filter quizTrash array to only include quizzes with authUserId
  const userTrash = data.quizTrash.filter(function(quiz) {
    return quiz.authUserId === authUserId;
  });

  // Sort quizzes from oldest edited to most recently edited
  userTrash.sort((a, b) => a.timeLastEdited - b.timeLastEdited);

  // Create quiz list as per spec
  const quizTrash = userTrash.map(function(quiz) {
    return {
      quizId: quiz.quizId,
      name: quiz.name,
    };
  });

  // Return mapped quizTrash
  return { quizzes: quizTrash };
}

interface MultiErrorObject {
  error: string,
  code: number
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @returns { } Empty Object
 *
 * Restores the quiz referring to quizId in user's trash - provided by token - back into current quizzes.
 * Error cases also returns the HTTP error code required.
 */
export function adminQuizRestore(token: string, quizId: number): MultiErrorObject | EmptyObject {
  // Check if token is a valid session ID related to a registered user.
  const checkSession = isValidToken(token);
  let authUserId: number;
  if (checkSession) {
    authUserId = checkSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Quiz found in user's trash
  const quizTrash: QuizInfo = data.quizTrash.find(quiz => quiz.quizId === quizId);
  // Quiz with same quizId as provided found in non-deleted quizzes
  const quizCurrent: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);

  // Quiz ID refers to a quiz that current user does not own
  if (quizTrash && quizTrash.authUserId !== authUserId) {
    throw new UnauthorizedQuizError();
  }
  if (quizCurrent && quizCurrent.authUserId !== authUserId) {
    throw new UnauthorizedQuizError();
  }
  // Quiz ID refers to a quiz that doesn't exist
  if (!quizTrash && !quizCurrent) {
    throw new NonexistentQuizError();
  }
  // One or more of the Quiz IDs is not currently in the trash
  if (!quizTrash && quizCurrent) {
    throw new NotInTrashQuizError();
  }

  // Quiz name of the restored quiz is already used by another active quiz
  const identical: QuizInfo = data.quizzes.find(q => q.name === quizTrash.name);
  if (identical) {
    throw new QuizNameAlreadyInUseError();
  }

  // Restore quiz
  quizTrash.timeLastEdited = Math.floor(Date.now() / 1000);
  data.quizzes.push(quizTrash);
  const index = data.quizTrash.indexOf(quizTrash);
  data.quizTrash.splice(index, 1);
  setData(data);
  return {};
}

/**
 *
 * @param {string} token
 * @param {number[]} qArr
 * @returns { } Empty Object
 *
 * Empties user of token's quizTrash, provided a correct list of quizIds in said trash.
 * Error cases also returns the HTTP error code required.
 */
export function adminQuizEmptyTrash(token: string, qArr: number[]): MultiErrorObject | EmptyObject {
  // Check if token is a valid session ID related to a registered user.
  const checkSession = isValidToken(token);
  let authUserId: number;
  if (checkSession) {
    authUserId = checkSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data = getData() as DataStore;
  // Loop through each quizId of qArr
  for (const quizId of qArr) {
    // Quiz found in user's trash
    const quizTrash: QuizInfo = data.quizTrash.find(quiz => quiz.quizId === quizId);
    // Quiz with same quizId as provided found in non-deleted quizzes
    const quizCurrent: QuizInfo = data.quizzes.find(quiz => quiz.quizId === quizId);

    // Quiz ID refers to a quiz that current user does not own
    if (quizCurrent && quizCurrent.authUserId !== authUserId) {
      throw new UnauthorizedQuizError();
    }
    // Quiz ID refers to a quiz that doesn't exist
    if (!quizTrash && !quizCurrent) {
      throw new NonexistentQuizError();
    }
    // One or more of the Quiz IDs is not currently in the trash
    if (!quizTrash && quizCurrent) {
      throw new NotInTrashQuizError();
    }
    // If no errors, delete quiz from trash
    data.quizTrash = data.quizTrash.filter(quiz => quiz.quizId !== quizId);
  }
  setData(data);
  return {};
}

/**
 *
 * @param {string} token
 * @param {number} quizId
 * @param {string} userEmail
 * @returns { } empty object
 *
 * Transfers the quiz with provided quizId to user with provided userEmail
 */
export function adminQuizTransfer(token: string, quizId: number, userEmail: string): MultiErrorObject | EmptyObject {
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

  // userEmail is not a real user
  const targetUser = data.users.find(user => user.email === userEmail);
  if (!targetUser) {
    throw new InvalidUserError();
  }
  // userEmail is the current logged in user
  if (targetUser.userId === authUserId) {
    throw new CurrentLoggedInUserError();
  }
  // Quiz ID refers to a quiz that has a name that is already used by the target user
  const duplicateQuiz = data.quizzes.find(q => q.name === quiz.name && q.authUserId === targetUser.userId);
  if (duplicateQuiz) {
    throw new QuizNameAlreadyInUseError();
  }

  // Any session for this quiz is not in END state
  if (quiz.currentSessions.length > 0) {
    throw new ActiveSessionFoundError();
  }

  // Transfer
  quiz.authUserId = targetUser.userId;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);
  return {};
}
