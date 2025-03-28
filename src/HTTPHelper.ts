import request from 'sync-request-curl';
import { port, url } from './config.json';
import { QuestionBody } from './dataStore';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// ====================================================================
//  ============================== V2 ================================
// ====================================================================

//  ================= auth.ts ===================

// Wrapper function to request POST adminAuthLogout
export function requestLogoutv2(token: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v2/admin/auth/logout',
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET adminUserDetails
export function requestUserDetailsv2(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/v2/admin/user/details',
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    });

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
}

// Wrapper function to request PUT adminUserDetailsUpdate
export function requestUserDetailsUpdatev2(token: string, email: string, nameFirst: string, nameLast: string) {
  const res = request(
    'PUT',
    SERVER_URL + '/v2/admin/user/details',
    {
      headers: { token },
      json: {
        email,
        nameFirst,
        nameLast
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
}

// Wrapper function to request PUT adminUserPasswordUpdate
export function requestPasswordUpdatev2(token: string, oldPassword: string, newPassword: string) {
  const res = request(
    'PUT',
    SERVER_URL + '/v2/admin/user/password',
    {
      headers: { token },
      json: {
        oldPassword: oldPassword,
        newPassword: newPassword,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

//  ================= quiz.ts ===================

// Wrapper function to request DELETE adminQuizEmptyTrash
export function requestEmptyv2(token: string, quizIds: string) {
  const res = request(
    'DELETE',
    SERVER_URL + '/v2/admin/quiz/trash/empty',
    {
      headers: { token },
      qs: {
        quizIds: quizIds,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET adminQuizTrash
export function requestQuizTrashv2(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/v2/admin/quiz/trash',
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminQuizRestore
export function requestQuizRestorev2(token: string, quizId: number) {
  const res = request(
    'POST',
    SERVER_URL + `/v2/admin/quiz/${quizId}/restore`,
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminQuizTransfer
export function requestTransferv2(token: string, quizId: number, userEmail: string) {
  const res = request(
    'POST',
    SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`,
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      headers: { token },
      json: {
        userEmail: userEmail,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

export function requestQuizListv2(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/v2/admin/quiz/list',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

export function requestQuizDescriptionUpdatev2(token: string, quizId: number, description: string) {
  const url = `${SERVER_URL}/v2/admin/quiz/${quizId}/description`;
  const res = request(
    'PUT',
    url,
    {
      headers: { token },
      json: {
        description: description,
      }
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminQuizCreate
export function requestQuizCreatev2(token: string, name: string, description: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v2/admin/quiz',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      headers: { token },
      json: {
        name: name,
        description: description,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET adminQuizInfo
export function requestQuizInfov2(token: string, quizId: number) {
  const url = `${SERVER_URL}/v2/admin/quiz/` + quizId;
  const res = request(
    'GET',
    url,
    {
      headers: {
        token,
      }
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request DELETE adminQuizRemove
export function requestQuizRemovev2(token: string, quizId: number) {
  const res = request(
    'DELETE',
    SERVER_URL + `/v2/admin/quiz/${quizId}`,
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request PUT adminQuizNameUpdate
export function requestQuizNameUpdatev2 (token: string, quizId: number, name: string) {
  const res = request(
    'PUT',
    `${SERVER_URL}/v2/admin/quiz/${quizId}/name`,
    {
      headers: { token },
      json: { name: name },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

//  ================= Questions ===================

// Wrapper function to request POST adminQuestionCreate
export function requestQuestionCreatev2(token: string, quizId: number, questionBody: QuestionBody) {
  const res = request(
    'POST',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question`,
    {
      headers: { token },
      json: { questionBody },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
}

// Wrapper function to request PUT adminQuestionUpdate
export function requestQuestionUpdatev2(token: string, quizId: number, questionId: number, questionBody: QuestionBody) {
  const res = request(
    'PUT',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { token },
      json: { questionBody },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
}

// Wrapper function to request DELETE adminQuestionRemove
export function requestQuestionRemoveV2(token: string, quizId: number, questionId: number) {
  const res = request(
    'DELETE',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request PUT adminQuestionMove
export function requestQuestionMoveV2(token: string, quizId: number, questionId: number, newPosition: number) {
  const res = request(
    'PUT',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}/move`,
    {
      headers: { token },
      json: { newPosition },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminQuestionDuplicate
export function requestQuestionDuplicateV2(token: string, quizId: number, questionId: number) {
  const res = request(
    'POST',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}/duplicate`,
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// ====================================================================
//  ============================== V1 ================================
// ====================================================================

//  ================= auth.ts ===================

// Wrapper function to request POST adminAuthRegister
export function requestRegister(email: string, password: string, nameFirst: string, nameLast: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/register',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      json: {
        email: email,
        password: password,
        nameFirst: nameFirst,
        nameLast: nameLast
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminAuthLogin
export function requestLogin(email: string, password: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/login',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      json: {
        email: email,
        password: password,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET adminUserDetails
export function requestUserDetails(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/v1/admin/user/details',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      qs: {
        token: token,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request PUT adminUserDetailsUpdate
export function requestUserDetailsUpdate(token: string, email: string, nameFirst: string, nameLast: string) {
  const res = request(
    'PUT',
    SERVER_URL + '/v1/admin/user/details',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      json: {
        token,
        email,
        nameFirst,
        nameLast
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request PUT adminUserPasswordUpdate
export function requestPasswordUpdate(token: string, oldPassword: string, newPassword: string) {
  const res = request(
    'PUT',
    SERVER_URL + '/v1/admin/user/password',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      json: {
        token: token,
        oldPassword: oldPassword,
        newPassword: newPassword,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminAuthLogout
export function requestLogout(token: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/logout',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      json: {
        token: token
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

//  ================= quiz.ts ===================

// Wrapper function to request GET adminQuizList
export function requestQuizList(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/v1/admin/quiz/list',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      qs: {
        token: token,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminQuizCreate
export function requestQuizCreate(token: string, name: string, description: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/quiz',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      json: {
        token: token,
        name: name,
        description: description,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request PUT adminQuizDescriptionUpdate
export function requestQuizDescriptionUpdate(token: string, quizId: number, description: string) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/description`;
  const res = request(
    'PUT',
    url,
    {
      json: {
        token: token,
        description: description,
      }
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET adminQuizInfo
export function requestQuizInfo(token: string, quizId: number) {
  const url = `${SERVER_URL}/v1/admin/quiz/` + quizId;
  const res = request(
    'GET',
    url,
    {
      qs: {
        token,
      }
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request DELETE adminQuizRemove
export function requestQuizRemove(token: string, quizId: number) {
  const res = request(
    'DELETE',
    SERVER_URL + `/v1/admin/quiz/${quizId}`,
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      qs: {
        token: token,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request PUT adminQuizNameUpdate
export function requestQuizNameUpdate(token: string, quizId: number, name: string) {
  const res = request(
    'PUT',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/name`,
    {
      json: { token, name },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET adminQuizTrash
export function requestQuizTrash(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/v1/admin/quiz/trash',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      qs: {
        token: token,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminQuizRestore
export function requestQuizRestore(token: string, quizId: number) {
  const res = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quizId}/restore`,
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      json: {
        token: token,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request DELETE adminQuizEmptyTrash
export function requestEmpty(token: string, quizIds: string) {
  const res = request(
    'DELETE',
    SERVER_URL + '/v1/admin/quiz/trash/empty',
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      qs: {
        token: token,
        quizIds: quizIds,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminQuizTransfer
export function requestTransfer(token: string, quizId: number, userEmail: string) {
  const res = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`,
    {
      // Note that for PUT/POST requests, you should
      // use the key 'json' instead of the query string 'qs'
      json: {
        token: token,
        userEmail: userEmail,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminQuestionCreate
export function requestQuestionCreate(token: string, quizId: number, questionBody: QuestionBody) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/question`;
  const res = request(
    'POST',
    url,
    {
      json: { token, questionBody },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request PUT adminQuestionUpdate
export function requestQuestionUpdate(token: string, quizId: number, questionId: number, questionBody: QuestionBody) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`;
  const res = request(
    'PUT',
    url,
    {
      json: { token, questionBody },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request DELETE adminQuestionRemove
export function requestQuestionRemove(token: string, quizId: number, questionId: number) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`;
  const res = request(
    'DELETE',
    url,
    {
      qs: { token },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request PUT adminQuestionMove
export function requestQuestionMove(token: string, quizId: number, questionId: number, newPosition: number) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/move`;
  const res = request(
    'PUT',
    url,
    {
      json: { token, newPosition },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminQuestionDuplicate
export function requestQuestionDuplicate(token: string, quizId: number, questionId: number) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/duplicate`;
  const res = request(
    'POST',
    url,
    {
      json: { token },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminQuestionDuplicate
export function requestThumbnailUpdate(token: string, quizId: number, imgUrl: string) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/thumbnail`;
  const res = request(
    'PUT',
    url,
    {
      headers: { token },
      json: { imgUrl: imgUrl },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

//  ================= quizSession.ts ===================
// Wrapper function to request POST adminSessionStart
export function requestSessionStart(token: string, quizId: number, autoStartNum: number) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`;
  const res = request(
    'POST',
    url,
    {
      headers: { token },
      json: { autoStartNum: autoStartNum },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request PUT adminSessionUpdate
export function requestSessionUpdate(token: string, quizId: number, sessionId: number, action: string) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`;
  const res = request(
    'PUT',
    url,
    {
      headers: { token },
      json: { action: action },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET adminSessionStatus
export function requestSessionStatus(token: string, quizId: number, sessionId: number) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`;
  const res = request(
    'GET',
    url,
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET adminSessionList
export function requestSessionList(token: string, quizId: number) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/sessions`;
  const res = request(
    'GET',
    url,
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET adminSessionResults
export function requestSessionResults(token: string, quizId: number, sessionId: number) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}/results`;
  const res = request(
    'GET',
    url,
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET adminSessionResultsCSV
export function requestSessionResultsCSV(token: string, quizId: number, sessionId: number) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`;
  const res = request(
    'GET',
    url,
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

//  ================= quizPlayer.ts ===================
// Wrapper function to request POST requestPlayerJoin
export function requestPlayerJoin(sessionId: number, name: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v1/player/join',
    {
      json: { sessionId, name },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request GET player status
export function requestPlayerStatus(playerId: number) {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerId}`,
    {
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// GET question info
export function requestPlayerQuestionInfo(playerId: number, questionPosition: number) {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerId}/question/${questionPosition}`,
    {
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}
// Wrapper function to request GET requestPlayerSessionChat
export function requestPlayerSessionChat(playerId: number) {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerId}/chat`,
    {
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST requestPlayerSendChat
export function requestPlayerSendChat(playerId: number, messageBody: string) {
  const res = request(
    'POST',
    SERVER_URL + `/v1/player/${playerId}/chat`,
    {
      json: { message: { messageBody } },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

export function requestPlayerSubmitAnswer(playerId: number, questionPos: number, answerIds: number[]) {
  const res = request(
    'PUT',
    `${SERVER_URL}/v1/player/${playerId}/question/${questionPos}/answer`,
    {
      json: { answerIds },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

export function requestQuesionResult(playerId: number, questionposition: number) {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerId}/question/${questionposition}/results`,
    {
      json: {
        playerId,
        questionposition
      },
      timeout: TIMEOUT_MS,
    }

  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

export function requestPlayerResult(playerId: number) {
  const res = request(
    'GET',
    SERVER_URL + `/v1/player/${playerId}/results`,
    {
      json: {
        playerId,
      },
      timeout: TIMEOUT_MS,
    }

  );
  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}
