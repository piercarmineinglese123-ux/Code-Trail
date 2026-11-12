module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: '`main` calls `a`, `a` calls `b`, and `b` calls `c`. The debugger is paused inside `c`. Which function is at the **top** of the call stack?',
      options: ['main', 'a', 'b', 'c'],
      answer: 3,
      explain: 'The most recent call is on top of the stack. The stack reads, from top to bottom: `c`, `b`, `a`, `main`.'
    }
  ]
};
