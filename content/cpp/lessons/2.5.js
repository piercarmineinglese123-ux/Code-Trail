module.exports = {
  exercises: [
    {
      type: 'text',
      prompt: 'What does this program print? Type the exact output (two values separated by one space).',
      code: `#include <iostream>

int add(int a, int b)
{
    int result{ a + b };
    return result;
}

int main()
{
    int result{ 10 };
    int x{ add(1, 2) };
    std::cout << result << ' ' << x;
    return 0;
}`,
      accept: ['10 3'],
      hint: 'The `result` inside `add` is a different variable from the `result` in `main`.',
      explain: '`main` has its own `result` (10). The `result` inside `add` is local to `add` and holds 3, which is returned and stored in `x`. So the output is `10 3`.'
    }
  ]
};
