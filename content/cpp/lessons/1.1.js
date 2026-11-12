module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Say hello',
      prompt: 'Complete `main` so the program prints exactly:\n\n```\nHello, world!\n```\n\nFinish with a newline (`\\n`).',
      starter: `#include <iostream>

int main()
{
    // TODO: print Hello, world! here

    return 0;
}
`,
      tests: [{ input: '', expected: 'Hello, world!' }],
      require: [{ re: /cout\s*<</, msg: 'Use std::cout << ... to print the text.' }],
      hint: 'A printing statement looks like `std::cout << "text";` and ends with a semicolon.',
      solution: `#include <iostream>

int main()
{
    std::cout << "Hello, world!\\n";

    return 0;
}
`
    }
  ]
};
