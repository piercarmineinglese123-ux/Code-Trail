module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Split off the last digit',
      prompt: 'Read an integer `n` (at least 10). Use the `%` and `/` operators to print its last digit and the number that remains once that digit is removed. For input `472`:\n\n```\nLast digit: 2\nRest: 47\n```',
      starter: `#include <iostream>

int main()
{
    int n{};
    std::cin >> n;

    // TODO: print "Last digit: " and the last digit of n
    // TODO: print "Rest: " and n without its last digit

    return 0;
}
`,
      tests: [
        { input: '472', expected: 'Last digit: 2\nRest: 47' },
        { input: '90', expected: 'Last digit: 0\nRest: 9' },
        { input: '1234', expected: 'Last digit: 4\nRest: 123' }
      ],
      require: [
        { re: /%/, msg: 'Use the remainder operator % to get the last digit.' },
        { re: /\/\s*10/, msg: 'Use integer division by 10 to remove the last digit.' }
      ],
      hint: '`n % 10` is the last digit and `n / 10` (integer division) is everything else.',
      solution: `#include <iostream>

int main()
{
    int n{};
    std::cin >> n;

    std::cout << "Last digit: " << n % 10 << '\\n';
    std::cout << "Rest: " << n / 10 << '\\n';

    return 0;
}
`
    }
  ]
};
