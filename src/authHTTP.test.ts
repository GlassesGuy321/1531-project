import { requestClear } from './otherHTTP.test';
import { Token } from './dataStore';
import {
  requestRegister,
  requestLogin,
  requestUserDetails,
  requestUserDetailsUpdate,
  requestPasswordUpdate,
  requestLogout,
} from './HTTPHelper';

afterEach(() => {
  // Reset the state of our data so that each test can run independently
  requestClear();
});

describe('test solo adminAuthRegister', () => {
  afterEach(() => {
    requestClear();
  });

  test('has the correct return type', () => {
    const response = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith');
    expect(response.code).toStrictEqual(200);
    expect(response.body).toStrictEqual({ token: expect.any(String) });
  });

  test.each([
    { email: 'z5555555@ad.unsw.edu.au', password: '', nameFirst: '', nameLast: '' },
    { email: '', password: '12345678', nameFirst: '', nameLast: '' },
    { email: '', password: '', nameFirst: 'John', nameLast: '' },
    { email: '', password: '', nameFirst: '', nameLast: 'Smith' },
  ])('returns an error for any parameter being blank', ({ email, password, nameFirst, nameLast }) => {
    const response = requestRegister(email, password, nameFirst, nameLast);
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('cannot add two users with the same email', () => {
    requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith');
    const response = requestRegister('z5555555@ad.unsw.edu.au', 'Qwertyu1', 'Impasta', 'Smith');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  test('email does not satisfy validator', () => {
    const response = requestRegister('z5555555ad.unsw.edu.au', '12345678', 'Impasta', 'Smith');
    expect(response.body).toStrictEqual({ error: expect.any(String) });
    expect(response.code).toStrictEqual(400);
  });

  describe('nameFirst errors', () => {
    test('invalid symbols', () => {
      const r1 = requestRegister('z5555555@ad.unsw.edu.au', 'qwertyui', '1mpasta', 'Smith');
      expect(r1.body).toStrictEqual({ error: expect.any(String) });
      expect(r1.code).toStrictEqual(400);

      const r2 = requestRegister('z5555555@ad.unsw.edu.au', 'qwertyui', 'Imp@st@', 'Smith');
      expect(r2.body).toStrictEqual({ error: expect.any(String) });
      expect(r2.code).toStrictEqual(400);
    });
    test('incorrect length', () => {
      const r1 = requestRegister('z5555555@ad.unsw.edu.au', 'qwertyui', 'I', 'Smith');
      expect(r1.body).toStrictEqual({ error: expect.any(String) });
      expect(r1.code).toStrictEqual(400);

      const r2 = requestRegister('z5555555@ad.unsw.edu.au', 'qwertyui', 'Imabcdefghijklmopqrst', 'Smith');
      expect(r2.body).toStrictEqual({ error: expect.any(String) });
      expect(r2.code).toStrictEqual(400);
    });
  });

  describe('nameLast errors', () => {
    test('invalid symbols', () => {
      const r1 = requestRegister('z5555555@ad.unsw.edu.au', 'qwertyui', 'Impasta', '5m1th');
      expect(r1.body).toStrictEqual({ error: expect.any(String) });
      expect(r1.code).toStrictEqual(400);

      const r2 = requestRegister('z5555555@ad.unsw.edu.au', 'qwertyui', 'Impasta', 'Smit#@!');
      expect(r2.body).toStrictEqual({ error: expect.any(String) });
      expect(r2.code).toStrictEqual(400);
    });
    test('incorrect length', () => {
      const r1 = requestRegister('z5555555@ad.unsw.edu.au', 'qwertyui', 'Impasta', 'S');
      expect(r1.body).toStrictEqual({ error: expect.any(String) });
      expect(r1.code).toStrictEqual(400);

      const r2 = requestRegister('z5555555@ad.unsw.edu.au', 'qwertyui', 'Impasta', 'Smabcdefghijklmopqrst');
      expect(r2.body).toStrictEqual({ error: expect.any(String) });
      expect(r2.code).toStrictEqual(400);
    });
  });

  describe('password errors', () => {
    test('incorrect length', () => {
      const r1 = requestRegister('z5555555@ad.unsw.edu.au', 'a', 'Impasta', 'Smith');
      expect(r1.body).toStrictEqual({ error: expect.any(String) });
      expect(r1.code).toStrictEqual(400);

      const r2 = requestRegister('z5555555@ad.unsw.edu.au', 'Qw3rtyu', 'Impasta', 'Smit#@!');
      expect(r2.body).toStrictEqual({ error: expect.any(String) });
      expect(r2.code).toStrictEqual(400);
    });
    test('does not have at least one number and one letter', () => {
      const r1 = requestRegister('z5555555@ad.unsw.edu.au', '12345678', 'Impasta', 'Smith');
      expect(r1.body).toStrictEqual({ error: expect.any(String) });
      expect(r1.code).toStrictEqual(400);

      const r2 = requestRegister('z5555555@ad.unsw.edu.au', 'qwertyui', 'Impasta', 'Smith');
      expect(r2.body).toStrictEqual({ error: expect.any(String) });
      expect(r2.code).toStrictEqual(400);
    });
  });

  test('multiple auth registers', () => {
    const r1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassword', 'John', 'Smith');
    expect(r1.body).toStrictEqual({ token: expect.any(String) });
    expect(r1.code).toStrictEqual(200);

    const r2 = requestRegister('z5109876@ad.unsw.edu.au', 'IamB3n10', 'Ben\'s', 'Ten-n-yson');
    expect(r2.body).toStrictEqual({ token: expect.any(String) });
    expect(r2.code).toStrictEqual(200);

    const r3 = requestRegister('z5666666@ad.unsw.edu.au', '5P103RMAN', 'Peter', 'Parker');
    expect(r3.body).toStrictEqual({ token: expect.any(String) });
    expect(r3.code).toStrictEqual(200);
  });
});

describe('test solo adminAuthLogin', () => {
  afterEach(() => {
    requestClear();
  });

  test.each([
    { email: 'z5555555@ad.unsw.edu.au', password: '' },
    { email: '', password: '12345678' },
  ])('returns an error for any parameter being blank', ({ email, password }) => {
    const r1 = requestLogin(email, password);
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);
  });

  test('email address does not exist', () => {
    const r1 = requestLogin('z5555555@ad.unsw.edu.au', 'Gr3AtPassw0rd');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);

    requestRegister('z5555555@ad.unsw.edu.au', 'Gr3AtPassw0rd', 'John', 'Smith');
    const r2 = requestLogin('z6666666@ad.unsw.edu.au', 'd0NT3X1ST');
    expect(r2.body).toStrictEqual({ error: expect.any(String) });
    expect(r2.code).toStrictEqual(400);
  });

  test('incorrect password', () => {
    requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    const r1 = requestLogin('z5555555@ad.unsw.edu.au', '1NC0RR3CT');
    const r2 = requestLogin('z5555555@ad.unsw.edu.au', 'GR3ATPASSW0RD');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);
    expect(r2.body).toStrictEqual({ error: expect.any(String) });
    expect(r2.code).toStrictEqual(400);
  });

  test('correct logins', () => {
    requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    const l1 = requestLogin('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd');
    expect(l1.body).toStrictEqual({ token: expect.any(String) });

    requestRegister('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd', 'Tobey', 'Maguire');
    requestRegister('z5678910@ad.unsw.edu.au', 'st1llv3ryg00d', 'Andrew', 'Garfield');
    const l2 = requestLogin('z5432109@ad.unsw.edu.au', 'An0th3rPassw0rd');
    const l3 = requestLogin('z5678910@ad.unsw.edu.au', 'st1llv3ryg00d');
    expect(l2.body).toStrictEqual({ token: expect.any(String) });
    expect(l3.body).toStrictEqual({ token: expect.any(String) });
  });

  test('successfully update numSuccessfulLogins of user', () => {
    const { body: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    let { body: r1 } = requestUserDetails(l1.token);
    expect(r1.user.numSuccessfulLogins).toStrictEqual(1);

    requestLogin('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd');
    r1 = requestUserDetails(l1.token).body;
    expect(r1.user.numSuccessfulLogins).toStrictEqual(2);

    requestLogin('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd');
    requestLogin('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd');
    r1 = requestUserDetails(l1.token).body;
    expect(r1.user.numSuccessfulLogins).toStrictEqual(4);

    requestLogin('z5555555@ad.unsw.edu.au', '1NC0RR3CT');
    r1 = requestUserDetails(l1.token).body;
    expect(r1.user.numSuccessfulLogins).toStrictEqual(4);
  });

  test('successfully update numFailedPasswordsSinceLastLogin of user', () => {
    const { body: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    let { body: r1 } = requestUserDetails(l1.token);
    expect(r1.user.numFailedPasswordsSinceLastLogin).toStrictEqual(0);

    requestLogin('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd');
    r1 = requestUserDetails(l1.token).body;
    expect(r1.user.numFailedPasswordsSinceLastLogin).toStrictEqual(0);

    requestLogin('z5555555@ad.unsw.edu.au', '1NC0RR3CT');
    r1 = requestUserDetails(l1.token).body;
    expect(r1.user.numFailedPasswordsSinceLastLogin).toStrictEqual(1);

    requestLogin('z5555555@ad.unsw.edu.au', 'N0TPassw0rd');
    requestLogin('z5555555@ad.unsw.edu.au', 'aga1nInc0rrect');
    r1 = requestUserDetails(l1.token).body;
    expect(r1.user.numFailedPasswordsSinceLastLogin).toStrictEqual(3);

    requestLogin('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd');
    r1 = requestUserDetails(l1.token).body;
    expect(r1.user.numFailedPasswordsSinceLastLogin).toStrictEqual(0);
  });
});

describe('test solo adminUserDetails', () => {
  afterEach(() => {
    requestClear();
  });

  test('returns user details correctly', () => {
    const { body: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    const userDetails = requestUserDetails(l1.token);
    expect(userDetails.code).toStrictEqual(200);
    expect(userDetails.body).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'John Smith',
        email: 'z5555555@ad.unsw.edu.au',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
  });

  test('returns error for empty token', () => {
    const userDetails = requestUserDetails('');
    expect(userDetails.code).toStrictEqual(401);
    expect(userDetails.body).toStrictEqual({ error: 'Token provided is invalid' });
  });

  test('returns error for invalid token', () => {
    const { body: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    const userDetails = requestUserDetails(l1.token + 'invalid');
    expect(userDetails.code).toStrictEqual(401);
    expect(userDetails.body).toStrictEqual({ error: 'Token provided is invalid' });
  });
});

describe('test solo adminUserDetailsUpdate', () => {
  afterEach(() => {
    requestClear();
  });

  test('successfully updates user details', () => {
    const { body: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    requestUserDetailsUpdate(l1.token, 'newemail@domain.com', 'NewFirstName', 'NewLastName');
    const userDetails = requestUserDetails(l1.token);
    expect(userDetails.code).toStrictEqual(200);
    expect(userDetails.body).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'NewFirstName NewLastName',
        email: 'newemail@domain.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
  });

  test('returns error for empty or invalid token', () => {
    const updateResponse = requestUserDetailsUpdate('', 'newemail@domain.com', 'NewFirstName', 'NewLastName');
    expect(updateResponse.code).toStrictEqual(401);
    expect(updateResponse.body).toStrictEqual({ error: 'Token provided is invalid' });
  });

  test('returns error for invalid token', () => {
    const updateResponse = requestUserDetailsUpdate('invalidtoken', 'newemail@domain.com', 'NewFirstName', 'NewLastName');
    expect(updateResponse.code).toStrictEqual(401);
    expect(updateResponse.body).toStrictEqual({ error: 'Token provided is invalid' });
  });

  test('returns error for email already in use', () => {
    const { body: l2 } = requestRegister('z5555556@ad.unsw.edu.au', 'Gr3atPassw0rd', 'Jane', 'Doe');
    requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    const updateResponse = requestUserDetailsUpdate(l2.token, 'z5555555@ad.unsw.edu.au', 'Jane', 'Doe');
    expect(updateResponse.code).toStrictEqual(400);
    expect(updateResponse.body).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error for invalid email', () => {
    const { body: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    const updateResponse = requestUserDetailsUpdate(l1.token, 'invalidemail', 'John', 'Smith');
    expect(updateResponse.code).toStrictEqual(400);
    expect(updateResponse.body).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error for invalid first name', () => {
    const { body: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    const updateResponse = requestUserDetailsUpdate(l1.token, 'z5555555@ad.unsw.edu.au', 'J@hn', 'Smith');
    expect(updateResponse.code).toStrictEqual(400);
    expect(updateResponse.body).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error for invalid last name', () => {
    const { body: l1 } = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith');
    const updateResponse = requestUserDetailsUpdate(l1.token, 'z5555555@ad.unsw.edu.au', 'John', 'Sm!th');
    expect(updateResponse.code).toStrictEqual(400);
    expect(updateResponse.body).toStrictEqual({ error: expect.any(String) });
  });
});

describe('test solo adminUserPasswordUpdate', () => {
  afterEach(() => {
    requestClear();
  });

  let u1: Token;
  beforeEach(() => {
    u1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3AtPassw0rD', 'John', 'Smith').body;
  });

  describe('Error code 401 cases', () => {
    test('Token is empty', () => {
      const ret = requestPasswordUpdate('', '0ldpAssw0rd', 'n3wpAssw0rd');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('Token is invalid', () => {
      const ret = requestPasswordUpdate(u1.token + '1', '0ldpAssw0rd', 'n3wpAssw0rd');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });

  test('old password does not match', () => {
    const r1 = requestPasswordUpdate(u1.token, '0ldpAssw0rd', 'n3wpAssw0rd');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);
  });

  test('old and new password match', () => {
    const r1 = requestPasswordUpdate(u1.token, 'Gr3AtPassw0rD', 'Gr3AtPassw0rD');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);
  });

  test('newPassword has been in history of user\'s passwords', () => {
    requestPasswordUpdate(u1.token, 'Gr3AtPassw0rD', 'n3wpAssw0rd');
    const r1 = requestPasswordUpdate(u1.token, 'n3wpAssw0rd', 'Gr3AtPassw0rD');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);

    requestPasswordUpdate(u1.token, 'n3wpAssw0rd', 'ev3nGr3at3r');
    requestPasswordUpdate(u1.token, 'ev3nGr3at3r', 'sti11G0ing');
    const r2 = requestPasswordUpdate(u1.token, 'sti11G0ing', 'ev3nGr3at3r');
    expect(r2.body).toStrictEqual({ error: expect.any(String) });
    expect(r2.code).toStrictEqual(400);
  });

  test('newPassword less than 8 characters', () => {
    const r1 = requestPasswordUpdate(u1.token, 'Gr3AtPassw0rD', 'p4ssWrd');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r1.code).toStrictEqual(400);
  });

  test('newPassword does not contain at least one number and at least one letter', () => {
    const r1 = requestPasswordUpdate(u1.token, 'Gr3AtPassw0rD', 'password');
    const r2 = requestPasswordUpdate(u1.token, 'Gr3AtPassw0rD', '12345678');
    const r3 = requestPasswordUpdate(u1.token, 'Gr3AtPassw0rD', 'p4ssword');
    const r4 = requestPasswordUpdate(u1.token, 'p4ssword', '12e45678');
    expect(r1.body).toStrictEqual({ error: expect.any(String) });
    expect(r2.body).toStrictEqual({ error: expect.any(String) });
    expect(r3.body).toStrictEqual({});
    expect(r4.body).toStrictEqual({});
  });

  test('correct password and history update', () => {
    requestPasswordUpdate(u1.token, 'Gr3AtPassw0rD', 'n3wpAssw0rd');
    expect(requestLogin('z5555555@ad.unsw.edu.au', 'n3wpAssw0rd').body).toStrictEqual({ token: expect.any(String) });
    requestPasswordUpdate(u1.token, 'n3wpAssw0rd', 'ev3nGr3at3r');
    expect(requestLogin('z5555555@ad.unsw.edu.au', 'ev3nGr3at3r').body).toStrictEqual({ token: expect.any(String) });
    requestPasswordUpdate(u1.token, 'ev3nGr3at3r', 'sti11G0ing');
    expect(requestLogin('z5555555@ad.unsw.edu.au', 'sti11G0ing').body).toStrictEqual({ token: expect.any(String) });
  });

  test('multiple correct password updates', () => {
    requestPasswordUpdate(u1.token, 'Gr3AtPassw0rD', 'n3wpAssw0rd');
    const u2 = requestRegister('z6666666@ad.unsw.edu.au', '12e456L8', 'Tony', 'Stark');
    requestPasswordUpdate(u2.body.token, '12e456L8', '1AmIr0nMan');
    requestPasswordUpdate(u1.token, '1AmIr0nMan', '3ndGam35');
    requestRegister('z7777777@ad.unsw.edu.au', 'passw0rD', 'Thor', 'Odinson');
    expect(requestLogin('z5555555@ad.unsw.edu.au', 'n3wpAssw0rd').body).toStrictEqual({ token: expect.any(String) });
    expect(requestLogin('z6666666@ad.unsw.edu.au', '1AmIr0nMan').body).toStrictEqual({ token: expect.any(String) });
    expect(requestLogin('z7777777@ad.unsw.edu.au', 'passw0rD').body).toStrictEqual({ token: expect.any(String) });
  });
});

describe('test /v1/admin/auth/logout', () => {
  let u1t1: Token;
  beforeEach(() => {
    requestClear();
    u1t1 = requestRegister('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd', 'John', 'Smith').body;
  });
  describe('invalid token provided', () => {
    test('no token provided', () => {
      const ret = requestLogout('');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
    test('token invalid', () => {
      const ret = requestLogout(u1t1.token + '1');
      expect(ret.body).toStrictEqual({ error: expect.any(String) });
      expect(ret.code).toStrictEqual(401);
    });
  });
  test('returns correct structure', () => {
    const ret = requestLogout(u1t1.token);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
  });
  test('multiple correct logouts', () => {
    const { body: u1t2 } = requestLogin('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd');
    const { body: u2t1 } = requestRegister('z5109876@ad.unsw.edu.au', 'IamB3n10', 'Ben\'s', 'Ten-n-yson');
    const { body: u1t3 } = requestLogin('z5555555@ad.unsw.edu.au', 'Gr3atPassw0rd');

    let ret = requestLogout(u1t1.token);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);

    ret = requestLogout(u2t1.token);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);

    ret = requestLogout(u1t2.token);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);

    ret = requestLogout(u1t3.token);
    expect(ret.body).toStrictEqual({});
    expect(ret.code).toStrictEqual(200);
  });
});
