module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'What does this program print?',
      code: `#include <iostream>

int main()
{
    std::cout << "A";
    // std::cout << "B";
    /* std::cout << "C"; */
    std::cout << "D";
    return 0;
}`,
      options: ['ABCD', 'AD', 'ACD', 'A'],
      answer: 1,
      explain: 'The `//` comment disables the statement printing B, and the `/* ... */` comment disables the one printing C. Only A and D run, so the output is `AD`.'
    }
  ]
};
