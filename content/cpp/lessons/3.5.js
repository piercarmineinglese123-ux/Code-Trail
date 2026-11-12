module.exports = {
  exercises: [
    {
      type: 'choice',
      prompt: 'Your program crashes, but the debug message you printed just before the crash never appears on screen. What is the most likely explanation?',
      options: [
        'The line never ran, because the crash happened earlier in the file',
        'The output was buffered and was lost when the program crashed',
        'std::cout cannot be used for debugging',
        'The compiler removed the line because it was a comment'
      ],
      answer: 1,
      explain: 'Normal output is buffered and may not be written before a crash. `std::cerr` is unbuffered, and `std::endl` flushes, so debug messages sent that way show up even if the program dies right afterwards.'
    }
  ]
};
