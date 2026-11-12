module.exports = {
  exercises: [
    {
      type: 'text',
      prompt: 'What does this program print? Type the exact output.',
      code: `#include <iostream>

int main()
{
    int x{ 2 };
    int y{ x + 3 };
    std::cout << y * 2;
    return 0;
}`,
      accept: ['10'],
      hint: 'First work out the value of `x + 3`, then use it to initialize `y`. Finally evaluate `y * 2`.',
      explain: '`x + 3` evaluates to 5, so `y` starts as 5. The expression `y * 2` then evaluates to 10, and that value is what gets printed.'
    }
  ]
};
