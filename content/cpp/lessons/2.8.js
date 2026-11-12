module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: '`main.cpp` declares `int add(int x, int y);` and calls it, but no file in the project defines `add`. Each file compiles fine on its own. What happens?',
      options: [
        'A compile error in main.cpp',
        'The program runs and add returns 0',
        'A linker error: undefined reference to add',
        'The compiler writes an empty add function for you'
      ],
      answer: 2,
      explain: 'The declaration satisfies the compiler, so `main.cpp` compiles. When the linker tries to connect the call to a definition it finds none, and reports an undefined reference.'
    }
  ]
};
