module.exports = {
  exercises: [
    {
      type: 'code',
      title: 'Area with brace initialization',
      prompt: 'Define two `int` variables, `width` (value `7`) and `height` (value `3`), **using brace initialization**. Then print their product, `width * height`, followed by a newline.\n\nExpected output:\n\n```\n21\n```',
      starter: `#include <iostream>

int main()
{
    // 1. define width (7) and height (3) with braces
    // 2. print width * height

    return 0;
}
`,
      tests: [{ input: '', expected: '21' }],
      require: [
        { re: /width\s*\{\s*7\s*\}/, msg: 'Define width with brace initialization: int width{ 7 };' },
        { re: /height\s*\{\s*3\s*\}/, msg: 'Define height with brace initialization: int height{ 3 };' },
        { re: /width\s*\*\s*height/, msg: 'Print the product using the expression width * height.' }
      ],
      hint: 'Brace initialization looks like `int width{ 7 };`. Then use `std::cout << width * height << \'\\n\';`.',
      solution: `#include <iostream>

int main()
{
    int width{ 7 };
    int height{ 3 };

    std::cout << width * height << '\\n';

    return 0;
}
`
    }
  ]
};
