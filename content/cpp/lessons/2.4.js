module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Add with parameters',
      prompt: 'Complete `add` so it returns the sum of its two parameters. `main` reads two numbers and prints the result. For input `3 4`:\n\n```\n7\n```',
      starter: `#include <iostream>

int add(int x, int y)
{
    // TODO: return the sum
    return 0;
}

int main()
{
    int a{};
    int b{};
    std::cin >> a >> b;
    std::cout << add(a, b) << '\\n';

    return 0;
}
`,
      tests: [
        { input: '3 4', expected: '7' },
        { input: '10 -4', expected: '6' },
        { input: '0 0', expected: '0' },
        { input: '250 750', expected: '1000' }
      ],
      hint: 'Return an expression built from the parameters: `return x + y;`.',
      solution: `#include <iostream>

int add(int x, int y)
{
    return x + y;
}

int main()
{
    int a{};
    int b{};
    std::cin >> a >> b;
    std::cout << add(a, b) << '\\n';

    return 0;
}
`
    }
  ]
};
