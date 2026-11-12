module.exports = {
  exercises: [
    {
      type: 'multi',
      prompt: 'Select **all** the valid identifiers (names the compiler will accept for a variable).',
      options: ['total_score', '2nd_place', 'userAge', 'my-value', 'return'],
      answers: [0, 2],
      explain: '`total_score` and `userAge` follow the rules. `2nd_place` starts with a digit, `my-value` contains a hyphen (the minus operator), and `return` is a keyword.'
    }
  ]
};
