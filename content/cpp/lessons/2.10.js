module.exports = {
  exercises: [
    {
      type: 'multi',
      prompt: 'Select **all** the statements about the preprocessor that are true.',
      options: [
        'It runs before the compiler',
        '`#include` pastes the contents of another file into yours',
        'Preprocessor directives must end with a semicolon',
        'It understands C++ types and scope',
        '`#define` can create a macro that is replaced by text'
      ],
      answers: [0, 1, 4],
      explain: 'The preprocessor runs first, pastes files for `#include` and substitutes text for macros. Directives end at the end of the line with no semicolon, and the preprocessor knows nothing about C++ types or scope.'
    }
  ]
};
