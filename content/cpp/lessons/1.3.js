module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'Which statement correctly defines two integer variables named `width` and `height`?',
      options: ['int width height;', 'int width, height;', 'int width; height;', 'width, height int;'],
      answer: 1,
      explain: 'The type comes first, then the identifiers separated by commas, then a semicolon: `int width, height;`. The other options break the grammar (a missing comma, a missing type for `height`, or the type placed last).'
    }
  ]
};
