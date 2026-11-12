module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Add a forward declaration',
      prompt: 'This program does not compile because `multiply` is called before it is defined. **Without moving the function**, add a forward declaration so it prints:\n\n```\n42\n```',
      starter: `#include <iostream>

// TODO: add a forward declaration for multiply here

int main()
{
    std::cout << multiply(6, 7) << '\\n';
    return 0;
}

int multiply(int x, int y)
{
    return x * y;
}
`,
      tests: [{ input: '', expected: '42' }],
      require: [{ re: /int\s+multiply\s*\([^)]*\)\s*;/, msg: 'Add a forward declaration ending with a semicolon: int multiply(int x, int y);' }],
      hint: 'Copy the function header and end it with a semicolon: `int multiply(int x, int y);`',
      solution: `#include <iostream>

int multiply(int x, int y);

int main()
{
    std::cout << multiply(6, 7) << '\\n';
    return 0;
}

int multiply(int x, int y)
{
    return x * y;
}
`
    }
  ]
};
