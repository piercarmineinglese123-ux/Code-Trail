module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Find the off-by-one bug',
      prompt: 'This program should print the sum of all whole numbers from `1` to `n` (inclusive). For input `4` it must print `10`, but it prints a different number. Find the bug and fix it.',
      starter: `#include <iostream>

int main()
{
    int n{};
    std::cin >> n;

    int sum{ 0 };
    for (int i{ 1 }; i < n; ++i)
    {
        sum += i;
    }

    std::cout << sum << '\\n';
    return 0;
}
`,
      tests: [
        { input: '4', expected: '10' },
        { input: '1', expected: '1' },
        { input: '10', expected: '55' },
        { input: '100', expected: '5050' }
      ],
      hint: 'Print `i` inside the loop. Does it ever reach `n`? Look at the loop condition.',
      solution: `#include <iostream>

int main()
{
    int n{};
    std::cin >> n;

    int sum{ 0 };
    for (int i{ 1 }; i <= n; ++i)
    {
        sum += i;
    }

    std::cout << sum << '\\n';
    return 0;
}
`
    }
  ]
};
