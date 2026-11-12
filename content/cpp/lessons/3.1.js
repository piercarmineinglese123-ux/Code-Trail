module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Fix the syntax error',
      prompt: 'This program does not compile. Fix the syntax error so it prints:\n\n```\n10\n```',
      starter: `#include <iostream>

int main()
{
    int x{ 5 }
    std::cout << x * 2 << '\\n';
    return 0;
}
`,
      tests: [{ input: '', expected: '10' }],
      hint: 'Look at the end of the line that defines `x`. The error is reported on the line after it.',
      solution: `#include <iostream>

int main()
{
    int x{ 5 };
    std::cout << x * 2 << '\\n';
    return 0;
}
`
    }
  ]
};
