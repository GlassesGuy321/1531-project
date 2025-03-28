import request from 'sync-request-curl';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// Wrapper function to request DELETE /v1/clear
function requestClear() {
  const res = request(
    'DELETE',
    SERVER_URL + '/v1/clear',
    {
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

// Wrapper function to request POST adminAuthRegister
function requestRegister(email: string, password: string, nameFirst: string, nameLast: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/register',
    {
      json: {
        email: email,
        password: password,
        nameFirst: nameFirst,
        nameLast: nameLast,
      },
      timeout: TIMEOUT_MS,
    }
  );

  return {
    code: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
}

afterEach(() => {
  // Reset the state of our data so that each tests can run independently
  requestClear();
});

describe('Clear function', () => {
  beforeEach(() => {
    // Before each test, reset the state and register an initial user
    requestClear();
    requestRegister('initial@user.com', 'Initial1', 'Initial', 'User');
  });

  test('Clear resets data to initial state', () => {
    requestClear();
    const response1 = requestRegister('newuser@domain.com', 'Password1', 'New', 'User');
    expect(response1.code).toStrictEqual(200);
    expect(response1.body).toStrictEqual({ token: expect.any(String) });

    const response2 = requestRegister('anotheruser@domain.com', 'Password1', 'Another', 'User');
    expect(response2.code).toStrictEqual(200);
    expect(response2.body).toStrictEqual({ token: expect.any(String) });
  });
});

describe('GET /', () => {
  test('404 when wrong method', () => {
    const res = request('POST', SERVER_URL + '/', { timeout: TIMEOUT_MS });
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
});

export { requestClear };
