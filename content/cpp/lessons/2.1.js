module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Your first function',
      prompt: 'Define a function `void printGreeting()` that prints `Hi!` followed by a newline, and call it **twice** from `main`.\n\nExpected output:\n\n```\nHi!\nHi!\n```',
      starter: `#include <iostream>

// TODO: define printGreeting here

int main()
{
    // TODO: call it twice

    return 0;
}
`,
      tests: [{ input: '', expected: 'Hi!\nHi!' }],
      require: [
        { re: /void\s+printGreeting\s*\(\s*\)/, msg: 'Define the function as void printGreeting().' },
        { re: /printGreeting\s*\(\s*\)\s*;[\s\S]*printGreeting\s*\(\s*\)\s*;/, msg: 'Call printGreeting() twice from main.' }
      ],
      hint: 'Put `void printGreeting() { ... }` above `main`, then write `printGreeting();` two times inside `main`.',
      solution: `#include <iostream>

void printGreeting()
{
    std::cout << "Hi!\\n";
}

int main()
{
    printGreeting();
    printGreeting();

    return 0;
}
`
    }
  ]
};
