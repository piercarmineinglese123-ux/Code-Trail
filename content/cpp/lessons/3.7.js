module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'A loop runs 10,000 times and you only care about what happens when `i == 7500`. What is the most convenient debugger feature?',
      options: [
        'Step over, pressed 7,500 times',
        'A conditional breakpoint with the condition `i == 7500`',
        'Deleting the loop',
        'Printing `i` on every iteration and scrolling through the output'
      ],
      answer: 1,
      explain: 'A conditional breakpoint pauses only when its condition is true, so the program runs at full speed until the exact iteration you want to inspect.'
    }
  ]
};
