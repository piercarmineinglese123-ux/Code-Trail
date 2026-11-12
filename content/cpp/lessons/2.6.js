module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'The same 5 lines of code appear in three places in your program. What is the best reason to move them into one function?',
      options: [
        'The program will compile faster',
        'A future fix or change only has to be made in one place',
        'Functions are required for any code that prints text',
        'The compiler refuses duplicated lines'
      ],
      answer: 1,
      explain: 'Duplicated code must be changed everywhere when something needs fixing, and it is easy to miss a copy. One function means one place to fix. The duplicate lines would compile fine, so the other options are false.'
    }
  ]
};
