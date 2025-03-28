```javascript
let data = {
    // TODO: insert your data structure that contains 
    // users + quizzes here
    users: {
      user1: {
          userId: 1,
          name: 'Hayden Smith',
          email: 'hayden.smith@unsw.edu.au',
          password: '123456789',
          numSuccessfulLogins: 3,
          numFailedPasswordsSinceLastLogin: 1,
      },
    },
  quizzes: {
      quiz1: {
          quizId: 1,
          name: 'My Quiz',
          timeCreated: '876786457',
          timeLastEdited: '876786458',
          description: 'The First Quiz',
      },
    }
}
```

**Short description:** Data is an object which contains 2 primary objects: the users and the quizzes. Each of these 
objects will be populated with all the available users and quizzes in the system respectively, as indicated by the sample
user1 and quiz1. They can be accessed with either Object.<> functions, or using array elements appropriately for ease of access yay.
