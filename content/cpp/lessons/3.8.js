module.exports = {
  exercises: [
    {
      type: 'multi',
      prompt: 'Select **all** the things a debugger lets you do while the program is paused.',
      options: [
        'Look at the current value of a variable',
        'Watch an expression such as `total / count` update as you step',
        'Automatically rewrite your source code to fix the bug',
        'Temporarily change a variable\'s value to test a theory'
      ],
      answers: [0, 1, 3],
      explain: 'Debuggers show variable values, evaluate watch expressions and usually let you modify values for experiments. They do not fix your source code for you; that is your job.'
    }
  ]
};
