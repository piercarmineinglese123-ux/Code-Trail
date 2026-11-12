module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'One statement, several lines',
      prompt: 'This program compiles, but it is cramped and prints `HelloWorld` on a single line. Add the missing piece inside the statement so it prints two lines:\n\n```\nHello\nWorld\n```\n\nBonus: reformat the code so it is easy to read. Whitespace does not change the result.',
      starter: `#include <iostream>
int main(){std::cout
<<"Hello"
// TODO: break the line here
<<"World"<<"\\n";return 0;}
`,
      tests: [{ input: '', expected: 'Hello\nWorld' }],
      hint: 'Insert another `<<` with a newline, for example `<< "\\n"`, between the two words.',
      solution: `#include <iostream>

int main()
{
    std::cout << "Hello"
              << "\\n"
              << "World"
              << "\\n";

    return 0;
}
`
    }
  ]
};
