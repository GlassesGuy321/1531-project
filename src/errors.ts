// Token is invalid
export class InvalidTokenError extends Error {
  constructor(message: string = 'Token provided is invalid') {
    super(message);
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

export class InvalidQuizIdError extends Error {
  constructor(message: string = 'Quiz ID does not refer to a valid quiz.') {
    super(message);
    Object.setPrototypeOf(this, InvalidQuizIdError.prototype);
  }
}

export class UnauthorisedQuizIdError extends Error {
  constructor(message: string = 'Quiz ID does not refer to a quiz that this user owns.') {
    super(message);
    Object.setPrototypeOf(this, UnauthorisedQuizIdError.prototype);
  }
}

export class UnauthorizedQuizError extends Error {
  constructor(message: string = 'One or more of the Quiz IDs refers to a quiz that you do not own') {
    super(message);
    Object.setPrototypeOf(this, UnauthorizedQuizError.prototype);
  }
}

export class NonexistentQuizError extends Error {
  constructor(message: string = 'One or more of the Quiz IDs refers to a quiz that doesn\'t exist') {
    super(message);
    Object.setPrototypeOf(this, NonexistentQuizError.prototype);
  }
}

export class NotInTrashQuizError extends Error {
  constructor(message: string = 'One or more of the Quiz IDs refers to a quiz that isn\'t in the trash') {
    super(message);
    Object.setPrototypeOf(this, NotInTrashQuizError.prototype);
  }
}

export class QuizNameAlreadyInUseError extends Error {
  constructor(message: string = 'One or more of the Quiz IDs refers to a quiz that isn\'t in the trash') {
    super(message);
    Object.setPrototypeOf(this, QuizNameAlreadyInUseError.prototype);
  }
}

export class InvalidUserError extends Error {
  constructor(message: string = 'Target user\'s email is not a real user') {
    super(message);
    Object.setPrototypeOf(this, InvalidUserError.prototype);
  }
}

export class CurrentLoggedInUserError extends Error {
  constructor(message: string = 'Target user\'s email is the current logged in user') {
    super(message);
    Object.setPrototypeOf(this, CurrentLoggedInUserError.prototype);
  }
}

export class ActiveSessionFoundError extends Error {
  constructor(message: string = 'A session not in END state was found for this quiz') {
    super(message);
    Object.setPrototypeOf(this, ActiveSessionFoundError.prototype);
  }
}

export class DescriptionLengthError extends Error {
  constructor(message: string = 'Description is more than 100 characters in length') {
    super(message);
    Object.setPrototypeOf(this, DescriptionLengthError.prototype);
  }
}

// Email is already in use
export class EmailInUseError extends Error {
  constructor(message: string = 'Email address already in use') {
    super(message);
    Object.setPrototypeOf(this, EmailInUseError.prototype);
  }
}

// Email is invalid
export class InvalidEmailError extends Error {
  constructor(message: string = 'Invalid email provided') {
    super(message);
    Object.setPrototypeOf(this, InvalidEmailError.prototype);
  }
}

// Name is invalid
export class InvalidNameError extends Error {
  constructor(message: string = 'Invalid name provided') {
    super(message);
    Object.setPrototypeOf(this, InvalidNameError.prototype);
  }
}

// Name contains invalid characters
export class NameCharactorError extends Error {
  constructor(message: string = 'Name contains invalid characters. Valid characters are alphanumeric and spaces.') {
    super(message);
    Object.setPrototypeOf(this, NameCharactorError.prototype);
  }
}

// Name length is invalid
export class NameLengthError extends Error {
  constructor(message: string = 'Name is either less than 3 characters long or more than 30 characters long.') {
    super(message);
    Object.setPrototypeOf(this, NameLengthError.prototype);
  }
}

// Name is already used by the current logged-in user for another quiz
export class NameUniError extends Error {
  constructor(message: string = 'Name is already used by the current logged in user for another quiz.') {
    super(message);
    Object.setPrototypeOf(this, NameUniError.prototype);
  }
}
// Action enum cannot be applied in the current state
export class ActionUnavailable extends Error {
  constructor(message: string = 'Action enum cannot be applied in the current state') {
    super(message);
    Object.setPrototypeOf(this, InvalidNameError.prototype);
  }
}

export class InvalidDescriptionError extends Error {
  constructor(message: string = 'description entered is too long (> 100 characters)') {
    super(message);
    Object.setPrototypeOf(this, InvalidDescriptionError.prototype);
  }
}

export class InvalidSessionError extends Error {
  constructor(message: string = 'Session does not exist') {
    super(message);
    Object.setPrototypeOf(this, InvalidSessionError.prototype);
  }
}

export class SessionNotInLobbyError extends Error {
  constructor(message: string = 'Session is not in the LOBBY state.') {
    super(message);
    Object.setPrototypeOf(this, SessionNotInLobbyError.prototype);
  }
}

export class NameAlreadyExist extends Error {
  constructor(message: string = 'The given name already exists') {
    super(message);
    Object.setPrototypeOf(this, NameAlreadyExist.prototype);
  }
}

// PlayerID ERROR
export class InvalidPlayerError extends Error {
  constructor(message: string = 'Player ID does not exist') {
    super(message);
    Object.setPrototypeOf(this, InvalidPlayerError.prototype);
  }
}

// Question position error
export class InvalidQuestionPositionError extends Error {
  constructor(message: string = 'Question position is not valid or is not yet reached by game') {
    super(message);
    Object.setPrototypeOf(this, InvalidQuestionPositionError.prototype);
  }
}

// Session state error
export class InvalidSessionStateError extends Error {
  constructor(message: string = 'Session is not currently on this question') {
    super(message);
    Object.setPrototypeOf(this, InvalidSessionStateError.prototype);
  }
}

export class InvalidMessageError extends Error {
  constructor(message: string = 'Invalid message') {
    super(message);
    Object.setPrototypeOf(this, InvalidMessageError.prototype);
  }
}
