import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { clear } from './other';
import {
  adminAuthRegister,
  adminAuthLogin,
  adminUserDetails,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate,
  adminAuthLogout
} from './auth';
import {
  adminQuizList,
  adminQuizDescriptionUpdate,
  adminQuizCreate,
  adminQuizInfo,
  adminQuizNameUpdate,
  adminQuizRemove,
  adminQuizEmptyTrash,
  adminQuizRestore,
  adminQuizTransfer,
  adminQuizTrash,
  adminQuizThumbnailUpdate
} from './quiz';
import {
  adminQuestionCreate,
  adminQuestionUpdate,
  adminQuestionRemove,
  adminQuestionMove,
  adminQuestionDuplicate,
  validateThumbnailUrl,
} from './question';
import {
  ActiveSessionFoundError,
  CurrentLoggedInUserError,
  InvalidQuizIdError,
  UnauthorisedQuizIdError,
  InvalidTokenError,
  InvalidUserError,
  NonexistentQuizError,
  NotInTrashQuizError,
  QuizNameAlreadyInUseError,
  UnauthorizedQuizError,
  InvalidDescriptionError
} from './errors';
import {
  adminSessionList,
  adminSessionResults,
  adminSessionResultsCSV,
  adminSessionStart,
  adminSessionStatus,
  adminSessionUpdate
} from './quizSession';
import {
  playerJoin,
  playerStatus,
  playerQuestionInfo,
  playerSessionChat,
  playerSendChat,
  playerSubmitAnswer,
  playerResults,
  playerFinalResults,
} from './quizPlayer';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

export const PORT: number = parseInt(process.env.PORT || config.port);
export const HOST: string = process.env.IP || '127.0.0.1';

// Serve static files from the 'csv_files' directory
app.use('/csv_files', express.static(path.join(__dirname, 'csv_files')));

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const result = echo(req.query.echo as string);
  if ('error' in result) {
    res.status(400);
  }

  return res.json(result);
});

// clear
app.delete('/v1/clear', (req: Request, res: Response) => {
  return res.json(clear());
});

// ====================================================================
//  ============================== V2 ================================
// ====================================================================

//  ================= auth.ts ===================

// adminAuthLogout
app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  try {
    const ret = adminAuthLogout(token);
    res.json(ret);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

// adminUserDetails
app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  try {
    const ret = adminUserDetails(token);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    }
  }
});

// adminUserDetailsUpdate
app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { email, nameFirst, nameLast } = req.body;

  try {
    const ret = adminUserDetailsUpdate(token, email, nameFirst, nameLast);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminUserPasswordUpdate
app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { oldPassword, newPassword } = req.body;
  try {
    const ret = adminUserPasswordUpdate(token, oldPassword, newPassword);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

//  ================= quiz.ts ===================

// adminQuizEmptyTrash
app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const qArrString = req.query.quizIds as string;
  let qArr = JSON.parse(qArrString);
  qArr = qArr.map(Number);
  try {
    const ret = adminQuizEmptyTrash(token, qArr);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorizedQuizError || e instanceof NonexistentQuizError) {
      res.status(403).json({ error: e.message });
    } else if (e instanceof NotInTrashQuizError) {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizTrash
app.get('/v2/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  try {
    const ret = adminQuizTrash(token);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    }
  }
});

// adminQuizList
app.get('/v2/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  try {
    const response = adminQuizList(token);
    res.json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) { res.status(401).json({ error: e.message }); }
  }
});

// adminQuizDescriptionUpdate
app.put('/v2/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { description } = req.body;

  const quizId = parseInt(req.params.quizid);
  try {
    const response = adminQuizDescriptionUpdate(token, quizId, description);
    res.json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof InvalidQuizIdError || e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else if (e instanceof InvalidDescriptionError) {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizRestore
app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid as string);
  try {
    const ret = adminQuizRestore(token, quizId);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorizedQuizError || e instanceof NonexistentQuizError) {
      res.status(403).json({ error: e.message });
    } else if (e instanceof NotInTrashQuizError || e instanceof QuizNameAlreadyInUseError) {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizTransfer
app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { userEmail } = req.body;
  const quizId = parseInt(req.params.quizid as string);
  try {
    const ret = adminQuizTransfer(token, quizId, userEmail);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof InvalidQuizIdError || e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else if (
      e instanceof InvalidUserError ||
      e instanceof CurrentLoggedInUserError ||
      e instanceof QuizNameAlreadyInUseError ||
      e instanceof ActiveSessionFoundError
    ) {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizInfo
app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  try {
    const response = adminQuizInfo(token, quizId);
    res.json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      return res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError || e instanceof UnauthorizedQuizError) {
      return res.status(403).json({ error: e.message });
    } else {
      return res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizCreate
app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { name, description } = req.body;
  try {
    const response = adminQuizCreate(token, name, description);
    res.json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      return res.status(401).json({ error: e.message });
    } else {
      return res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizRemove
app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  try {
    const response = adminQuizRemove(token, quizId);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizNameUpdate
app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { name } = req.body;
  const { quizid } = req.params;
  try {
    const response = adminQuizNameUpdate(token, parseInt(quizid), name);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

//  ================= Question Routes ===================

// adminQuestionCreate
app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid as string);
  const { questionBody } = req.body;

  try {
    // Validate the thumbnail URL
    validateThumbnailUrl(questionBody.thumbnailUrl);

    const response = adminQuestionCreate(token, quizId, questionBody);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuestionUpdate
app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid as string);
  const questionId = parseInt(req.params.questionid as string);
  const { questionBody } = req.body;

  try {
    // Validate the thumbnail URL separately
    validateThumbnailUrl(questionBody.thumbnailUrl);

    const response = adminQuestionUpdate(token, quizId, questionId, questionBody);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuestionRemove
app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  try {
    const response = adminQuestionRemove(token, quizId, questionId);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuestionMove
app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { newPosition } = req.body;

  try {
    const response = adminQuestionMove(token, quizId, questionId, newPosition);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuestionDuplicate
app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  try {
    const response = adminQuestionDuplicate(token, quizId, questionId);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// ====================================================================
//  ============================== V1 ================================
// ====================================================================

//  ================= auth.ts ===================

// adminAuthRegister
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;
  try {
    const ret = adminAuthRegister(email, password, nameFirst, nameLast);
    res.json({
      token: encodeURIComponent(ret.token)
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// adminAuthLogin
app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const ret = adminAuthLogin(email, password);
    res.json({
      token: encodeURIComponent(ret.token)
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// adminUserDetails
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const token = req.query.token as string;

  try {
    const ret = adminUserDetails(decodeURIComponent(token));
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    }
  }
});

// adminUserDetailsUpdate
app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { token, email, nameFirst, nameLast } = req.body;
  try {
    const ret = adminUserDetailsUpdate(decodeURIComponent(token), email, nameFirst, nameLast);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminUserPasswordUpdate
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;
  try {
    const ret = adminUserPasswordUpdate(decodeURIComponent(token), oldPassword, newPassword);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminAuthLogout
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const { token } = req.body;
  try {
    const ret = adminAuthLogout(decodeURIComponent(token));
    res.json(ret);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

//  ================= quiz.ts and quizSession.ts ===================

// adminQuizEmptyTrash
app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const qArrString = req.query.quizIds as string;
  let qArr = JSON.parse(qArrString);
  qArr = qArr.map(Number);
  try {
    const ret = adminQuizEmptyTrash(decodeURIComponent(token), qArr);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorizedQuizError || e instanceof NonexistentQuizError) {
      res.status(403).json({ error: e.message });
    } else if (e instanceof NotInTrashQuizError) {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizTrash
app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.query.token as string;
  try {
    const ret = adminQuizTrash(decodeURIComponent(token));
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    }
  }
});

// adminQuizList
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.query.token as string;
  try {
    const response = adminQuizList(decodeURIComponent(token));
    res.json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) { res.status(401).json({ error: e.message }); }
  }
});

// adminSessionUpdate
app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const { action } = req.body;
  try {
    const ret = adminSessionUpdate(token, quizId, sessionId, action);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof InvalidQuizIdError || e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminSessionStart
app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const { autoStartNum } = req.body;
  try {
    const ret = adminSessionStart(token, quizId, autoStartNum);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof InvalidQuizIdError || e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizThumbnailUpdate
app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid as string);
  const { imgUrl } = req.body;
  try {
    const ret = adminQuizThumbnailUpdate(token, quizId, imgUrl);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof InvalidQuizIdError || e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminSessionList
app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  try {
    const ret = adminSessionList(token, quizId);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else {
      res.status(403).json({ error: e.message });
    }
  }
});

// adminQuizDescriptionUpdate
app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const { token, description } = req.body;

  const quizId = parseInt(req.params.quizid);
  try {
    const response = adminQuizDescriptionUpdate(decodeURIComponent(token), quizId, description);
    res.json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof InvalidQuizIdError || e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else if (e instanceof InvalidDescriptionError) {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizTransfer
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const { token, userEmail } = req.body;
  const quizId = parseInt(req.params.quizid as string);
  try {
    const ret = adminQuizTransfer(decodeURIComponent(token), quizId, userEmail);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof InvalidQuizIdError || e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else if (
      e instanceof InvalidUserError ||
      e instanceof CurrentLoggedInUserError ||
      e instanceof QuizNameAlreadyInUseError
    ) {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizRestore
app.post('/v1/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const quizId = parseInt(req.params.quizid as string);
  try {
    const ret = adminQuizRestore(decodeURIComponent(token), quizId);
    res.json(ret);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorizedQuizError || e instanceof NonexistentQuizError) {
      res.status(403).json({ error: e.message });
    } else if (e instanceof NotInTrashQuizError || e instanceof QuizNameAlreadyInUseError) {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizRemove
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizId = parseInt(req.params.quizid);
  try {
    const response = adminQuizRemove(decodeURIComponent(token), quizId);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizNameUpdate
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const { token, name } = req.body;
  const { quizid } = req.params;
  try {
    const response = adminQuizNameUpdate(decodeURIComponent(token), parseInt(quizid), name);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizInfo
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizId = parseInt(req.params.quizid);
  try {
    const response = adminQuizInfo(decodeURIComponent(token), quizId);
    res.json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      return res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError || e instanceof UnauthorizedQuizError) {
      return res.status(403).json({ error: e.message });
    } else {
      return res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizCreate
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const { token, name, description } = req.body;
  try {
    const response = adminQuizCreate(decodeURIComponent(token), name, description);
    res.json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      return res.status(401).json({ error: e.message });
    } else {
      return res.status(400).json({ error: e.message });
    }
  }
});

// adminSessionStatus
app.get('/v1/admin/quiz/:quizid/session/:sessionid', (req, res) => {
  const { quizid, sessionid } = req.params;
  const token = req.header('token');

  try {
    const result = adminSessionStatus(token, parseInt(quizid), parseInt(sessionid));
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      res.status(401).json({ error: error.message });
    } else if (error instanceof UnauthorisedQuizIdError || error instanceof InvalidQuizIdError) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// adminSessionResults
app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req, res) => {
  const { quizid, sessionid } = req.params;
  const token = req.header('token');

  try {
    const result = adminSessionResults(token, parseInt(quizid), parseInt(sessionid));
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      res.status(401).json({ error: error.message });
    } else if (error instanceof UnauthorisedQuizIdError || error instanceof InvalidQuizIdError) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// adminSessionResultsCSV
app.get('/v1/admin/quiz/:quizid/session/:sessionid/results/csv', (req, res) => {
  const { quizid, sessionid } = req.params;
  const token = req.header('token');

  try {
    const result = adminSessionResultsCSV(token, parseInt(quizid), parseInt(sessionid));
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      res.status(401).json({ error: error.message });
    } else if (error instanceof UnauthorisedQuizIdError || error instanceof InvalidQuizIdError) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

//  =================== Question Routes ===================

// adminQuestionCreate
app.post('/v1/admin/quiz/:quizId/question', (req: Request, res: Response) => {
  const { token, questionBody } = req.body;
  const quizId = parseInt(req.params.quizId);

  try {
    const response = adminQuestionCreate(decodeURIComponent(token), quizId, questionBody);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuestionUpdate
app.put('/v1/admin/quiz/:quizId/question/:questionId', (req: Request, res: Response) => {
  const { token, questionBody } = req.body;
  const quizId = parseInt(req.params.quizId);
  const questionId = parseInt(req.params.questionId);

  try {
    const response = adminQuestionUpdate(decodeURIComponent(token), quizId, questionId, questionBody);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuestionRemove
app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  try {
    const response = adminQuestionRemove(decodeURIComponent(token), quizId, questionId);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuestionMove
app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const newPosition = parseInt(req.body.newPosition);

  try {
    const response = adminQuestionMove(decodeURIComponent(token), quizId, questionId, newPosition);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

// adminQuestionDuplicate
app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  try {
    const response = adminQuestionDuplicate(decodeURIComponent(token), quizId, questionId);
    res.status(200).json(response);
  } catch (e) {
    if (e instanceof InvalidTokenError) {
      res.status(401).json({ error: e.message });
    } else if (e instanceof UnauthorisedQuizIdError) {
      res.status(403).json({ error: e.message });
    } else {
      res.status(400).json({ error: e.message });
    }
  }
});

//  =================== Player Routes ===================

// playerJoin
app.post('/v1/player/join', (req, res) => {
  const { sessionId, name } = req.body;
  try {
    const response = playerJoin(sessionId, name);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// submission answer
app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPos = parseInt(req.params.questionposition);
  const { answerIds } = req.body;
  answerIds.sort((a: number, b: number) => a - b);
  try {
    const result = playerSubmitAnswer(answerIds, playerId, questionPos);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// playerResults
app.get('/v1/player/:playerid/question/:questionposition/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  try {
    const response = playerResults(playerId, questionPosition);
    res.status(200).json(response);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET PlayerQuestionInfo
app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  try {
    const response = playerQuestionInfo(playerId, questionPosition);
    res.status(200).json(response);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// playerFinalResults
app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  try {
    const response = playerFinalResults(playerId);
    res.status(200).json(response);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Player return message
app.get('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  try {
    const response = playerSessionChat(playerId);
    res.status(200).json(response);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Player send chat
app.post('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const messageBody = req.body.message.messageBody;
  try {
    const response = playerSendChat(playerId, messageBody);
    res.status(200).json(response);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// getPlayerStatus
app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  try {
    const response = playerStatus(playerId);
    res.status(200).json(response);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(404).json({ error });
});

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});
