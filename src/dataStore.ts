import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'data.json');

//  ================= User Related ===================
export type Token = { token: string };

export interface UserInfo {
  userId: number,
  name: string,
  email: string,
  password: string,
  oldPasswords: string[],
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number,
  currentSessionIds: string[];
}

export interface PublicUserInfo {
  userId: number,
  name: string,
  email: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number,
}

//  ================= Return Types ===================
export interface EmptyObject {
  [key: string]: never;
}

//  ================= Quiz Related ===================
export interface QuizInfo {
  quizId: number,
  name: string,
  authUserId: number,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: Questions[],
  duration: number;
  thumbnailUrl?: string;
  currentSessions: number[],
  inactiveSessions: number[],
}
export interface quizId {
  quizId : number
}

export interface quizInfoReturn {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: Questions[],
  duration: number;
  thumbnailUrl?: string;
}

export interface quizListIndividual {
  quizId: number,
  name: string;
}

export interface quizListReturn {
  quizzes: quizListIndividual[];
}

//  ================= Question Related ===================
export interface Answers {
  answerId: number,
  answer: string,
  colour?: string,
  correct: boolean;
}

export interface Questions {
  questionId: number;
  question: string;
  duration: number;
  points: number;
  answers: Answers[];
  timeCreated: number;
  timeLastEdited: number;
  thumbnailUrl?: string;
  correctAnswers: number[];
}

export interface QuestionBody {
  question: string;
  answers: { answer: string; correct: boolean; colour?: string }[];
  correctAnswers: number[];
  duration: number;
  points: number;
  thumbnailUrl?: string;
}

//  ================= Session Related ===================
export enum State {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END'
}

export enum Action {
  NEXT_QUESTION = 'NEXT_QUESTION',
  SKIP_COUNTDOWN = 'SKIP_COUNTDOWN',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END'
}

export interface Session {
  sessionId: number,
  state: State,
  autoStartNum: number,
  atQuestion: number,
  questionOpenTime: number,
  usersRankedByScore: {
    playerId: number,
    name: string,
    score: number,
  }[],
  metadata: quizInfoReturn,
  results: {
    playerResults: {
      playerId: number,
      name: string,
      correct: boolean,
      time: number,
      rank: number,
      score: number,
    }[],
    averageAnswerTime: number,
    percentCorrect: number,
    numPlayersAnswered?: number,
  }[],
  chat: { messages:
    {
      messageBody: string,
      playerId: number,
      playerName: string,
      timeSent: number
    }[]
  },
}

// Map to link a countdown/question to a timer from setTimeout:
export const countdownsAndTimers: Record<number, ReturnType<typeof setTimeout>> = {};
export const questionsAndTimers: Record<number, ReturnType<typeof setTimeout>> = {};

//  ================= Player Related ===================
export interface PlayerJoinReturn {
  playerId: number;
}

export interface QuestionResults {
  questionId: number,
  playersCorrectList: string[],
  averageAnswerTime: number,
  percentCorrect: number,
}

//  ================= Data Store ===================
export interface DataStore {
  users: UserInfo[];
  quizzes: QuizInfo[];
  quizTrash: QuizInfo[];
  sessions: Session[];
}

/**
 *
 * @returns { DataStore } data object read from readDataStore
 *
 * Reads data from dataStore and returns it.
 */
export function getData(): DataStore {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 *
 * @param { DataStore } newData
 * @returns
 *
 * Use set(newData) to pass in the entire data object, with modifications made
 *
 */
export function setData(newData: DataStore) {
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
}
