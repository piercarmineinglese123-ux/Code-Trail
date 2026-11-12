module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'In the debugging process, which step comes **first**?',
      options: [
        'Repair the issue',
        'Retest the program',
        'Find the root cause of the problem',
        'Rewrite the whole function'
      ],
      answer: 2,
      explain: 'You must first locate where the real problem starts (the root cause), then understand it, decide on a fix, repair it and finally retest. Repairing before you understand the cause usually hides the symptom and leaves the bug in place.'
    }
  ]
};
