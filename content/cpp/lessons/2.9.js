module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'In `Game::value()`, what is `::` called and what does it do?',
      options: [
        'The insertion operator; it sends data to the console',
        'The scope resolution operator; it says that `value` is found inside the namespace `Game`',
        'The assignment operator; it stores a function in a namespace',
        'A comment marker; everything after it is ignored'
      ],
      answer: 1,
      explain: '`::` is the scope resolution operator. `Game::value` means "the `value` that belongs to namespace `Game`", so it cannot collide with a `value` in another namespace.'
    }
  ]
};
