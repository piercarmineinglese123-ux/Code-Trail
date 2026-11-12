module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'What happens when you try to compile this program?',
      code: `#include <iostream>

void printHi()
{
    std::cout << "Hi";
}

int main()
{
    std::cout << printHi();
    return 0;
}`,
      options: [
        'It prints Hi',
        'It prints Hi followed by 0',
        'It prints nothing',
        'It fails to compile: a void function has no value to print'
      ],
      answer: 3,
      explain: '`printHi()` returns `void`, which is not a value, so it cannot be sent to `std::cout`. Call it as its own statement instead: `printHi();`.'
    }
  ]
};
