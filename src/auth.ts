import {
  Token,
  UserInfo,
  PublicUserInfo,
  DataStore,
  getData,
  setData,
  EmptyObject
} from './dataStore';
import validator from 'validator';
import { InvalidTokenError, InvalidEmailError, EmailInUseError, InvalidNameError } from './errors';
import crypto from 'crypto';
const { v4: uuidv4 } = require('uuid');

/**
 * HELPER FUNCTION
 *
 * @param {string} plaintext
 * @returns {string}
 *
 * Returns the hash of the given string for security.
 */
function getHashOf(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

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
 *
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {Token}
 *
 * Function to register the Users information
 */
export function adminAuthRegister(email: string, password: string, nameFirst: string, nameLast: string): Token {
  // Check valid email
  if (!validator.isEmail(email)) {
    throw new InvalidEmailError();
  }

  // Helper Functions to check certain character types
  const invalidRegex = (str: string) => /[^a-zA-Z\s\-']/.test(str);
  const hasDigit = (str: string) => /[0-9]/.test(str);
  const hasLetter = (str: string) => /[a-zA-Z]/.test(str);

  // nameFirst errors
  if (invalidRegex(nameFirst) || nameFirst.length < 2 || nameFirst.length > 20) {
    throw new InvalidNameError();
  }

  // nameLast errors
  if (invalidRegex(nameLast) || nameLast.length < 2 || nameLast.length > 20) {
    throw new InvalidNameError();
  }

  // password errors
  if (!hasDigit(password) || !hasLetter(password) || password.length < 8) {
    throw new Error('Invalid password provided');
  }

  const data = getData() as DataStore;

  // Email address already in use
  for (const user of data.users) {
    if (user.email === email) {
      throw new EmailInUseError();
    }
  }

  // No errors - add user
  const authUserId: number = data.users.length;
  // Generate a unique session id
  const currSession = uuidv4();
  // Construct new user profile to push into dataStore
  const newUser: UserInfo = {
    userId: authUserId,
    name: nameFirst + ' ' + nameLast,
    email: email,
    password: getHashOf(password),
    oldPasswords: [],
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    currentSessionIds: []
  };
  newUser.currentSessionIds.push(currSession);
  data.users.push(newUser);
  setData(data);
  return {
    token: currSession
  };
}

/**
 * This function is used to check the user information, and return user id.
 * @param {string} email
 * @param {string} password
 * @returns { Token }
 *
 */
export function adminAuthLogin(email: string, password: string): Token {
  const data = getData() as DataStore;
  for (const user of data.users) {
    if (user.email === email) {
      if (user.password === getHashOf(password)) { // Successful Login - update numSuccessfulLogins
        user.numSuccessfulLogins += 1;
        user.numFailedPasswordsSinceLastLogin = 0;
        const currSession = uuidv4();
        user.currentSessionIds.push(currSession);
        setData(data);
        return { token: currSession };
      } else { // Failed password - update numFailedPasswordsSinceLastLogin
        user.numFailedPasswordsSinceLastLogin += 1;
        setData(data);
        throw new Error('Password does not match');
      }
    }
  }

  // Email address does not exist in data structure
  throw new Error('Email address does not exist');
}

/**
 * A function that return the detail of the user.
 * @param {string} token
 * @returns { PublicUserInfo }
 *
 */
export function adminUserDetails(token: string): { user?: PublicUserInfo } {
  if (!token) {
    throw new InvalidTokenError();
  }

  const isValidSession = isValidToken(token);
  if (!isValidSession) {
    throw new InvalidTokenError();
  }

  const authUserId = isValidSession.authUserId;
  const data = getData() as DataStore;
  const user = data.users.find(user => user.userId === authUserId);
  return {
    user: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    }
  };
}

/**
 * Given an admin user's authUserId and a set of properties, update the properties of this logged in admin user.
 *
 * @param {string} token
 * @param {string} email
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns { } empty object
 */
export function adminUserDetailsUpdate(token: string, email: string, nameFirst: string, nameLast: string): EmptyObject {
  // Check if token is a valid session ID related to a registered user.
  const isValidSession = isValidToken(token);
  let authUserId: number;
  if (isValidSession) {
    authUserId = isValidSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  // Find user
  const data = getData() as DataStore;
  const user = data.users.find(user => user.userId === authUserId);

  // Check for email errors
  if (email !== user.email) {
    if (data.users.some(user => user.email === email)) {
      throw new Error('Email is currently used by another user');
    }
    if (!validator.isEmail(email)) {
      throw new Error('Email does not satisfy validator');
    }
  }

  // Helper function to check valid name
  const invalidRegex = (str: string) => /[^a-zA-Z\s\-']/.test(str);

  // Check for nameFirst errors
  if (invalidRegex(nameFirst) || nameFirst.length < 2 || nameFirst.length > 20) {
    throw new Error('Invalid first name provided');
  }

  // Check for nameLast errors
  if (invalidRegex(nameLast) || nameLast.length < 2 || nameLast.length > 20) {
    throw new Error('Invalid last name provided');
  }

  // Update user details
  user.email = email;
  user.name = `${nameFirst} ${nameLast}`;
  setData(data);

  return {};
}

/**
 * Given details relating to a password change, update the password of a logged in user.
 *
 * @param {string} token
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns { } empty object
 */
export function adminUserPasswordUpdate(token: string, oldPassword: string, newPassword: string): EmptyObject {
  // Check if token is a valid session ID related to a registered user.
  const isValidSession = isValidToken(token);
  let authUserId: number;
  if (isValidSession) {
    authUserId = isValidSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  // New Password is less than 8 characters
  if (newPassword.length < 8) {
    throw new Error('newPassword is not at least 8 characters long');
  }

  // New Password does not contain at least one number and at least one letter
  const hasDigit = (str: string) => /[0-9]/.test(str);
  const hasLetter = (str: string) => /[a-zA-Z]/.test(str);
  if (!hasDigit(newPassword) || !hasLetter(newPassword)) {
    throw new Error('newPassword must contain at least one number and at least one letter');
  }

  // No need to analyse contents of either password anymore - can start using hashes of them for convenience and security.
  oldPassword = getHashOf(oldPassword);
  newPassword = getHashOf(newPassword);

  // Old Password and New Password match exactly
  if (oldPassword === newPassword) {
    throw new Error('oldPassword and newPassword match exactly');
  }

  const data = getData() as DataStore;
  for (const user of data.users) {
    if (user.userId === authUserId) {
      if (user.password === oldPassword) {
        for (const password of user.oldPasswords) {
          if (password === newPassword) { // New Password has already been used before by this user
            throw new Error('newPasword has already been used before by this user');
          }
        }
        user.oldPasswords.push(oldPassword);
        user.password = newPassword;
        setData(data);
        return {};
      } else { // Old Password is not the correct old password
        throw new Error('oldPassword is not the correct old password');
      }
    }
  }
}

/**
 *
 * @param {token}
 * @returns {}
 *
 * Given a valid token, removes the current sessionId from a registered user, hence "logging" them out. Error message is returned otherwise.
 */
export function adminAuthLogout(token: string): EmptyObject {
  // Check if token is a valid session ID related to a registered user.
  const isValidSession = isValidToken(token);
  let authUserId: number;
  if (isValidSession) {
    authUserId = isValidSession.authUserId;
  } else {
    throw new InvalidTokenError();
  }

  const data: DataStore = getData();
  // Find user profile
  const user = data.users.find(user => user.userId === authUserId);
  // Remove token from sessionId array
  user.currentSessionIds = user.currentSessionIds.filter(sessionId => sessionId !== token);
  // Update dataStore
  setData(data);

  return {};
}
