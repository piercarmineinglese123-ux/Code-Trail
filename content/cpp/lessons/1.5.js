module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Add two numbers',
      prompt: 'Read two integers from the keyboard with `std::cin`, then print their sum like this (for input `3 4`):\n\n```\nSum: 7\n```',
      starter: `#include <iostream>

int main()
{
    int a{};
    int b{};

    // TODO: read a and b, then print "Sum: " followed by a + b

    return 0;
}
`,
      tests: [
        { input: '3 4', expected: 'Sum: 7' },
        { input: '10 25', expected: 'Sum: 35' },
        { input: '-5 5', expected: 'Sum: 0' },
        { input: '100\n200', expected: 'Sum: 300' }
      ],
      require: [{ re: /cin\s*>>/, msg: 'Read the numbers with std::cin >> ...' }],
      hint: 'Use `std::cin >> a >> b;` and then `std::cout << "Sum: " << a + b << \'\\n\';`.',
      solution: `#include <iostream>

int main()
{
    int a{};
    int b{};

    std::cin >> a >> b;
    std::cout << "Sum: " << a + b << '\\n';

    return 0;
}
`
    }
  ]
};
