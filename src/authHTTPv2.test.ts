import { requestClear } from './otherHTTP.test';
import { Token } from './dataStore';
import {
  requestRegister,
  requestLogin,
  requestUserDetailsv2,
  requestPasswordUpdatev2,
  requestLogoutv2,
  requestUserDetailsUpdatev2,
} from './HTTPHelper';

afterEach(() => {
  // Reset the state of our data so that each tests can run independently
  requestClear();
});

describe('test GET /v2/admin/user/details', () => {
  let u1: Token;
  beforeEach(() => {
    u1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3AtPassw0rD', 'John', 'Smith').body;
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestUserDetailsv2('');
      expect(ret.body).toStrictEqual({ error: 'Token provided is invalid' });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestUserDetailsv2(u1.token + '1');
      expect(ret.body).toStrictEqual({ error: 'Token provided is invalid' });
      expect(ret.code).toStrictEqual(401);
    });
  });

  test('Returns correct user details', () => {
    const ret = requestUserDetailsv2(u1.token);
    expect(ret.body).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'John Smith',
        email: 'z5555555@ad.unsw.edu.au',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
    expect(ret.code).toStrictEqual(200);
  });

  test('numFailedPasswordsSinceLastLogin increments and resets correctly', () => {
    requestLogin('z5555555@ad.unsw.edu.au', 'wrongpassword');
    requestLogin('z5555555@ad.unsw.edu.au', 'wrongpassword');
    let ret = requestUserDetailsv2(u1.token);
    expect(ret.body.user.numFailedPasswordsSinceLastLogin).toBe(2);

    requestLogin('z5555555@ad.unsw.edu.au', 'Gr3AtPassw0rD');
    ret = requestUserDetailsv2(u1.token);
    expect(ret.body.user.numFailedPasswordsSinceLastLogin).toBe(0);
    expect(ret.body.user.numSuccessfulLogins).toBe(2);
  });
});

describe('test PUT /v2/admin/user/details', () => {
  let u1: Token;
  beforeEach(() => {
    u1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3AtPassw0rD', 'John', 'Smith').body;
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestUserDetailsUpdatev2('', 'newemail@domain.com', 'NewFirstName', 'NewLastName');
      expect(ret.body).toStrictEqual({ error: 'Token provided is invalid' });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestUserDetailsUpdatev2(u1.token + '1', 'newemail@domain.com', 'NewFirstName', 'NewLastName');
      expect(ret.body).toStrictEqual({ error: 'Token provided is invalid' });
      expect(ret.code).toStrictEqual(401);
    });
  });

  describe('Error code 400 cases', () => {
    test('Email is already in use', () => {
      requestRegister('z6666666@ad.unsw.edu.au', 'Password1', 'Jane', 'Doe');
      const ret = requestUserDetailsUpdatev2(u1.token, 'z6666666@ad.unsw.edu.au', 'NewFirstName', 'NewLastName');
      expect(ret.body).toStrictEqual({ error: 'Email is currently used by another user' });
      expect(ret.code).toStrictEqual(400);
    });
    test('Email is invalid', () => {
      const ret = requestUserDetailsUpdatev2(u1.token, 'invalidemail', 'NewFirstName', 'NewLastName');
      expect(ret.body).toStrictEqual({ error: 'Email does not satisfy validator' });
      expect(ret.code).toStrictEqual(400);
    });
    test('First name is invalid', () => {
      const ret = requestUserDetailsUpdatev2(u1.token, 'newemail@domain.com', 'J@hn', 'NewLastName');
      expect(ret.body).toStrictEqual({ error: 'Invalid first name provided' });
      expect(ret.code).toStrictEqual(400);
    });
    test('Last name is invalid', () => {
      const ret = requestUserDetailsUpdatev2(u1.token, 'newemail@domain.com', 'NewFirstName', 'Sm!th');
      expect(ret.body).toStrictEqual({ error: 'Invalid last name provided' });
      expect(ret.code).toStrictEqual(400);
    });
  });

  test('Successfully updates user details', () => {
    const ret = requestUserDetailsUpdatev2(u1.token, 'newemail@domain.com', 'NewFirstName', 'NewLastName');
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
  });
});

describe('test PUT /v2/admin/user/password', () => {
  afterEach(() => {
    requestClear();
  });

  let u1: Token;
  beforeEach(() => {
    u1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3AtPassw0rD', 'John', 'Smith').body;
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestPasswordUpdatev2('', '0ldpAssw0rd', 'n3wpAssw0rd');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestPasswordUpdatev2(u1.token + '1', '0ldpAssw0rd', 'n3wpAssw0rd');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  test('old password does not match', () => {
    const r1 = requestPasswordUpdatev2(u1.token, '0ldpAssw0rd', 'n3wpAssw0rd');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);
  });

  test('old and new password match', () => {
    const r1 = requestPasswordUpdatev2(u1.token, 'Gr3AtPassw0rD', 'Gr3AtPassw0rD');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);
  });

  test('newPassword has been in history of user\'s passwords', () => {
    requestPasswordUpdatev2(u1.token, 'Gr3AtPassw0rD', 'n3wpAssw0rd');
    const r1 = requestPasswordUpdatev2(u1.token, 'n3wpAssw0rd', 'Gr3AtPassw0rD');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);

    requestPasswordUpdatev2(u1.token, 'n3wpAssw0rd', 'ev3nGr3at3r');
    requestPasswordUpdatev2(u1.token, 'ev3nGr3at3r', 'sti11G0ing');
    const r2 = requestPasswordUpdatev2(u1.token, 'sti11G0ing', 'ev3nGr3at3r');
    expect(r2.body).toStrictEqual({ error: expect.any(String) });
    expect(r2.code).toStrictEqual(400);
  });

  test('newPassword less than 8 characters', () => {
    const r1 = requestPasswordUpdatev2(u1.token, 'Gr3AtPassw0rD', 'p4ssWrd');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);
  });

  test('newPassword does not contain at least one number and at least one letter', () => {
    const r1 = requestPasswordUpdatev2(u1.token, 'Gr3AtPassw0rD', 'password');
    const r2 = requestPasswordUpdatev2(u1.token, 'Gr3AtPassw0rD', '12345678');
    const r3 = requestPasswordUpdatev2(u1.token, 'Gr3AtPassw0rD', 'p4ssword');
    const r4 = requestPasswordUpdatev2(u1.token, 'p4ssword', '12e45678');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r2.body).toStrictEqual({ error: expect.any(String) });
    expect(r3.body).toStrictEqual({});
    expect(r4.body).toStrictEqual({});
  });

  test('correct password and history update', () => {
    requestPasswordUpdatev2(u1.token, 'Gr3AtPassw0rD', 'n3wpAssw0rd');
    expect(requestLogin('z5555555@ad.unsw.edu.au', 'n3wpAssw0rd').body).toStrictEqual({ token: expect.any(String) });
    requestPasswordUpdatev2(u1.token, 'n3wpAssw0rd', 'ev3nGr3at3r');
    expect(requestLogin('z5555555@ad.unsw.edu.au', 'ev3nGr3at3r').body).toStrictEqual({ token: expect.any(String) });
    requestPasswordUpdatev2(u1.token, 'ev3nGr3at3r', 'sti11G0ing');
    expect(requestLogin('z5555555@ad.unsw.edu.au', 'sti11G0ing').body).toStrictEqual({ token: expect.any(String) });
  });

  test('multiple correct password updates', () => {
    requestPasswordUpdatev2(u1.token, 'Gr3AtPassw0rD', 'n3wpAssw0rd');
    const u2 = requestRegister('z6666666@ad.unsw.edu.au', '12e456L8', 'Tony', 'Stark');
    requestPasswordUpdatev2(u2.body.token, '12e456L8', '1AmIr0nMan');
    requestPasswordUpdatev2(u1.token, '1AmIr0nMan', '3ndGam35');
    requestRegister('z7777777@ad.unsw.edu.au', 'passw0rD', 'Thor', 'Odinson');
    expect(requestLogin('z5555555@ad.unsw.edu.au', 'n3wpAssw0rd').body).toStrictEqual({ token: expect.any(String) });
    expect(requestLogin('z6666666@ad.unsw.edu.au', '1AmIr0nMan').body).toStrictEqual({ token: expect.any(String) });
    expect(requestLogin('z7777777@ad.unsw.edu.au', 'passw0rD').body).toStrictEqual({ token: expect.any(String) });
  });
});

describe('test POST /v2/admin/auth/logout', () => {
  let u1t1: Token;
  beforeEach(() => {
    requestClear();
    u1t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith').body;
  });
  describe('invalid token provided', () => {
    test('no token provided', () => {
      const ret = requestLogoutv2('');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('token invalid', () => {
      const ret = requestLogoutv2(u1t1.token + '1');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });
  test('returns correct structure', () => {
    const ret = requestLogoutv2(u1t1.token);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
  });
  test('multiple correct logouts', () => {
    const { body: u1t2 } = requestLogin('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd');
    const { body: u2t1 } = requestRegister('z5109876@ad.unsw.edu.au', 'IamB3n10', 'Ben\'s', 'Ten-n-yson');
    const { body: u1t3 } = requestLogin('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd');

    let ret = requestLogoutv2(u1t1.token);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);

    ret = requestLogoutv2(u2t1.token);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);

    ret = requestLogoutv2(u1t2.token);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);

    ret = requestLogoutv2(u1t3.token);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
  });
});
