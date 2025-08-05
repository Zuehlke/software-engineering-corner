---
title: 'Breaking the Line: The Benefits of Limited Line Lengths'
description: >-
  Limiting line length in code promotes readability by easing scanning and
  comprehension, aiding debugging by simplifying error identification, and
  improving collaboration through easier code referencing. Shorter lines also
  enhance accessibility for developers with visual impairments and facilitate
  efficient use of screen space when working with multiple files. Furthermore,
  restricting line length can encourage better code quality by prompting
  refactoring of overly complex lines, variables, or functions.
released: '2023-05-02T06:42:43.379Z'
cover: images/cover.jpg
author: Lucas Schnüriger
tags:
  - code style
  - development
  - lint
shortDescription: >-
  Limiting code line lengths enhances readability, debugging, collaboration, and
  accessibility. Optimal limits range from 80-120 characters for improved code
  quality.
---
"Everyone has widescreen monitors nowadays."
This is the argument I often hear when I bring up the idea of enforcing a maximum line length in our code.
And with that, the discussion is dismissed.
However, I believe that this stance misses the point completely.
Let me explain why we should at least discuss a sensible limit in 2023 to ensure that our code is readable, maintainable and accessible to all team members.

# Readability

As developers, we focus a lot on *writing* code, but the reality is that we spend more time *reading* it.
Whether we're looking at our own code from earlier in the day, a colleague's pull request, or a StackOverflow answer, each line of code is written once but read many times.
That's why it's essential to consider code readability, which is why tools like Prettier and linters exist in the first place.
After all, the code we write is meant to be understood and maintained by humans, not just machines.

Have you ever found yourself jumping to the wrong line after reading a long one?
Shorter lines of code can help to avoid that by making it easier to scan and understand code without having to scroll horizontally or mentally parse lengthy statements.
[Research by Edward Scott of the Baymard Institute](https://baymard.com/blog/line-length-readability) suggests an optimal line length of 50 to 75 characters for body text.
However, code isn't quite like English prose.
With additional syntactic symbols and a larger word length of variables and functions, a higher line length limit is reasonable.
The [PEP 8 style guide for Python](https://peps.python.org/pep-0008/#maximum-line-length) recommends a limit of 79 characters, Google suggests [80 for JavaScript](https://google.github.io/styleguide/jsguide.html#formatting-column-limit) and [100 for Java](https://google.github.io/styleguide/javaguide.html#s4.4-column-limit).
Somewhere in that range of 80 to 100 is likely the ideal limit for code readability.

While line wrapping in code editors can visually break long lines into multiple lines, it does not actually solve the problem.
It can still make the code difficult to read and understand as the logical flow and visual hierarchy can be disrupted by arbitrary line breaks.
Additionally, line wrapping can also create inconsistencies in indentation and make it harder to search for specific lines of code.
It's better to limit the length of lines of code from the start rather than relying on line wrapping as a band-aid solution.

# Debugging

Debugging is an essential aspect of software development, and it can be a time-consuming and frustrating task.
Shorter lines of code can make the debugging process easier and more efficient.
By keeping code on separate lines, it's easier to identify the exact line that may be causing issues.
When multiple statements and function calls are put on different lines, it's much easier to set breakpoints and step through the program.
Although IDEs can help with debugging, they can't take the entire mental overhead from you, and shorter lines can make a significant difference in the process. Pinpointing the exact location of the error is much easier, especially with the line numbers in the stacktrace.

# Collaboration

In any non-trivial software project, collaboration among the team of developers is key to success.
Effective communication is critical, and techniques like pair programming and code reviews are essential in facilitating communication.
When shorter lines of code are used, it's easier to refer to specific locations in the code during these collaborative activities.

Statistically speaking the chances of merge conflits should decrease when the code is split into more lines.
In my experience diffing tools manage changes on different lines much better than if they were on the same line.

# Accessibility

Accessability is an important consideration in software development not just when we talk about end users.
Shorter lines can aid individuals with visual impairments to read code more comfortably, especially when using larger font sizes.
However, accessibility is about all of us, regardless of our visual abilities.
Your own long lines may come back to haunt you while fixing a bug on a notebook during a train ride, during a presentation, or resolving a merge conflict in split view.

Many developers, including myself, find it beneficial to have multiple files open next to each other.
This allows for seamless navigation between files and aids in working on multiple aspects of a project simultaneously.
For instance, editing HTML side by side with the associated CSS file allows the developer to align changes in both more easily.
Similarly, when working on related files with code that is dependent on each other, having them open next to each other can make it easier to understand the relationships between them.
By having multiple files open next to each other, the famed wide screens are used more efficiently, instead of allowing long lines for lazy developers.

# Code Quality

I argue that limiting line length can lead to improved code quality.
We should consider long lines as a code smell.
Just as the single responsibility principle applies to classes and functions, it should also apply to lines of code.
Long lines could indicate that a line is doing too many different things.
This negatively impacts readability, as each line requires more mental effort to parse.
If variable and function names are too long to allow for shorter lines, it may be a sign that they are also doing too much and should be refactored.

# Conclusion

Limiting line lengths is key for better code quality, collaboration, readability, and accessibility.
However, defining the exact limit is an ongoing debate.
While some advocate for sticking to the old 80-column standard, others believe it is acceptable to double that number.
Ultimately, the ideal limit depends on several factors, such as the programming language, used frameworks and overall coding style.
In my experience, a reasonable compromise is to **target 80 columns but permit up to 120 columns.**

I would love to hear your opinion on this topic.
Are you already enforcing a limit on line lengths in your codebase?
If so, what limit do you find works best for you?
If not, do you think it's worth considering?
