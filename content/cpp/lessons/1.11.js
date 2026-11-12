module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Minutes to hours',
      prompt: 'Read a number of minutes and print it as hours and minutes. For input `130`:\n\n```\n2 h 10 min\n```',
      starter: `#include <iostream>

int main()
{
    int minutes{};
    std::cin >> minutes;

    // TODO: print "<hours> h <minutes> min"

    return 0;
}
`,
      tests: [
        { input: '130', expected: '2 h 10 min' },
        { input: '45', expected: '0 h 45 min' },
        { input: '60', expected: '1 h 0 min' },
        { input: '1000', expected: '16 h 40 min' }
      ],
      hint: 'Whole hours: `minutes / 60`. Minutes left over: `minutes % 60`.',
      solution: `#include <iostream>

int main()
{
    int minutes{};
    std::cin >> minutes;

    std::cout << minutes / 60 << " h " << minutes % 60 << " min\\n";

    return 0;
}
`
    }
  ]
};
