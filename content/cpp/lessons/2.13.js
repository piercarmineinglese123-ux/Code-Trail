module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Larger of two',
      prompt: '`main` is already written as an outline. Implement `larger` so it returns the bigger of its two arguments. For input `3 9`:\n\n```\nLarger: 9\n```',
      starter: `#include <iostream>

int readNumber()
{
    int x{};
    std::cin >> x;
    return x;
}

int larger(int a, int b)
{
    // TODO: return the bigger value
    return 0;
}

int main()
{
    int a{ readNumber() };
    int b{ readNumber() };
    std::cout << "Larger: " << larger(a, b) << '\\n';

    return 0;
}
`,
      tests: [
        { input: '3 9', expected: 'Larger: 9' },
        { input: '9 3', expected: 'Larger: 9' },
        { input: '-5 -8', expected: 'Larger: -5' },
        { input: '4 4', expected: 'Larger: 4' }
      ],
      hint: 'Use an `if`/`else`, or the conditional operator: `return a > b ? a : b;`.',
      solution: `#include <iostream>

int readNumber()
{
    int x{};
    std::cin >> x;
    return x;
}

int larger(int a, int b)
{
    if (a > b)
        return a;
    return b;
}

int main()
{
    int a{ readNumber() };
    int b{ readNumber() };
    std::cout << "Larger: " << larger(a, b) << '\\n';

    return 0;
}
`
    }
  ]
};
