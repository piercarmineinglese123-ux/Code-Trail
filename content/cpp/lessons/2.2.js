module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Return what was typed',
      prompt: 'Complete `readNumber` so it reads an integer from `std::cin` and **returns** it. `main` then prints it. For input `7`:\n\n```\nYou entered: 7\n```',
      starter: `#include <iostream>

int readNumber()
{
    // TODO: read an integer and return it
    return 0;
}

int main()
{
    int n{ readNumber() };
    std::cout << "You entered: " << n << '\\n';

    return 0;
}
`,
      tests: [
        { input: '7', expected: 'You entered: 7' },
        { input: '-3', expected: 'You entered: -3' },
        { input: '100', expected: 'You entered: 100' }
      ],
      require: [{ re: /cin\s*>>/, msg: 'Read the value inside readNumber with std::cin >> ...' }],
      hint: 'Define a local `int x{};`, read into it with `std::cin >> x;`, then `return x;`.',
      solution: `#include <iostream>

int readNumber()
{
    int x{};
    std::cin >> x;
    return x;
}

int main()
{
    int n{ readNumber() };
    std::cout << "You entered: " << n << '\\n';

    return 0;
}
`
    }
  ]
};
