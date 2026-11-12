module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'What happens when this code runs?',
      code: `int x;
std::cout << x;`,
      options: [
        'It always prints 0, because C++ zeroes new variables',
        'It never compiles: reading a variable without a value is a syntax error',
        'It is undefined behavior: the printed value is unpredictable and the program may misbehave',
        'It prints -1 to show that x has no value'
      ],
      answer: 2,
      explain: 'C++ does not clear memory for local variables. Reading `x` before it has a value is undefined behavior, so the result can be garbage, the same wrong number every time, a crash, or (worst) something that looks fine. Initialize with `int x{};`.'
    }
  ]
};
