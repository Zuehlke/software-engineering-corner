---
title: Web Development Tools
subtitle: "Products that can support web developers"
domain: software-engineering-corner.zuehlke.com
tags: web-development, learning, webdev, software-development
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1720188778562/-x_swn6Tg.jpg?auto=format
publishAs: erdelyilivia
hideFromHashnodeCommunity: false
saveAsDraft: true
---

# What are Web Development Tools?
Web development tools support us in developing applications. They are available in various forms, like Browser extensions, plugins, or an IDE.
Which one can best support our daily development tasks? Let's have a closer look!
Finding the right tool can be tricky. There are multiple factors that we should consider when choosing a tool.
Complexity, security, scalability, cost, supported programming languages, and platform support are the factors recommended to check in advance.

## 1. Chrome Developer Tools
When we generally speak about dev tools, the first that comes into everybody’s mind are the Chrome Developer Tools.
And that’s all right. That is one of the most known and used web dev tools.
The tool has a set of web editing and debugging utilities built into the Google Chrome browser.
It helps view and update webpages and styles, debug Javascript code, and optimize websites from within the browser.
It has a tool called Lighthouse, which can perform audits on web pages and auto-generate reports based on performance, accessibility, progressive web apps (PWA), and SEO. 
Chrome DevTool can also perform local overrides and has web design features, like its inspect element tool or color picker.
It also has built-in security features, console utility, and device model.

Let's have a look at features worth mentioning.

#### View and change Page Content and Styles
Sometimes, we want to change the style or content of a page and immediately see the visual response, for example, to update paddings or to pick a good-looking background color.
Using the Chrome Dev Tools, you can directly accomplish this from the browser, without page refreshes or re-compilation, either by targeting HTML elements using the built-in console or by selecting the element in the HTML panel.
CSS prototyping is also possible. For this, you just need to select the element in the DOM tree and add declarations to it in the styles panel.
We can change font color, size, and type. We can change background and button colors, images, and so on.

![Changing the font color using the Chrom Dev Tools](https://cdn.hashnode.com/res/hashnode/image/upload/v1721715345327/3Cx53U-QB.gif?auto=format)

#### Debugging Javascript
The dev tools provide a solution for debugging a web application.
Hence, all our javascript code is accessible and can be debugged directly in the browser.
That allows us to quickly locate problems, dig deeper into code, and debug and test out new code directly in the browser.
It has all the classical features you need from a debugger, like stepping over or into function calls or seeing values of specific variables.
And everything without log statements. We can also edit code on the fly without switching to an editor or IDE.

*One note, in applications where a bundler is used (webpack, vite, etc.), this feature only becomes useful once the source maps are sent to the browser as well.*

![Debugging a feature in the Chrome Dev Tools](https://cdn.hashnode.com/res/hashnode/image/upload/v1721716297696/UeNR_oLJp.gif?auto=format)


#### Running JS and viewing messages in the Console
It is also possible to run code directly in the built-in console or send messages to the console for testing purposes.
When we quickly want to try some code snippets, method calls, or testing selectors, the console comes in handy.

## 2. Visual Studio Code
Visual Studio Code is an open-source code editor that runs on Windows, Linux, and macOS.
The built-in features include syntax highlighting, auto-complete, and Git commands to make coding faster and easier.
The most common programming languages are all supported.
A huge variety of extensions are available in the application.
The user interface is customizable and offers the possibility to split the view and work on two projects at the same time.

Let's have a look at some features I use every day.

#### Command Palette
The most important key combination is Shift+Command+P (Mac) or Ctrl+Shift+P (Windows /Linux), which brings up the Command Palette.
From here, we have access to all functionality within VS Code, including keyboard shortcuts for the most common operations.
For example, we can run editor commands, open files, search for symbols, or see a quick view of a file, all in the same interactive window.
VS Code already has many commands out of the box, like save file, format file, git commands, and many others.
But the list of possibilities doesn't end here.
VS Code allows us to create new commands, and see them in this list of possible ones.
More extensions use this feature to expose their commands and enable their features.
The commands typically are grouped by topic, for instance, all the commands that work with the terminal have the prefix Terminal, those that work with git have the prefix Git, and so on.

![A demonstration of the command palette](https://cdn.hashnode.com/res/hashnode/image/upload/v1721716938015/2fBw6qlLJ.gif?auto=format)

#### Zen Mode
Zen Mode is a distraction-free view. All extra toolboxes and bars in the window are removed, allowing developers to focus completely on the code.
Center-align the code is possible as well, for an experience a view like a document editor.

![A demonstration of the zen mode](https://cdn.hashnode.com/res/hashnode/image/upload/v1721717169057/CEiUzo-U3.gif?auto=format)

#### Tag wrapping
Emmet is a set of plugins for text editors that allows for high-speed coding and editing in HTML, XML, XSLT, and other structured code formats via content assist.
Emmet can save time and improve developer productivity by helping to type less and generate more code.
For example, we can type "!" and press the enter key, and it will automatically generate the HTML snippet.
Another possible use case is, that if we are working on a Navbar with a few Nav links inside it, a snippet of a Navbar can be generated automatically by using a few keystrokes.
Whenever we write a valid tag, the Emmet abbreviation shows the preview of a code which is the final result in the editor.
By using shorthand CSS properties, it would be easy to generate styles by using Emmet.
Emmet comes in handy to write component snippets by just pressing a few keystrokes.
Emmet provides an ES7 module system, React, Redux, GraphQL, and React-Native snippets.

![A demonstration of emmet](https://cdn.hashnode.com/res/hashnode/image/upload/v1721717918589/74InOqnYO.gif?auto=format)

## 3. Marvel
Next on the list is Marvel, and no I am not talking about the superhero movies. Marvel is a design tool with many features.
It can create high-quality mockups and design specifications for web applications. It can generate CSS, Swift, and Android XML code for elements.
It can record screen, audio, and video for easier testing and feedback handling. It also has hundreds of customizable templates.

### Feature overview
- Marvel's interactive prototyping allows designers to create simulations of an app or website.
- Vector edition allows precise design creation.
- With real-time collaboration teams can design together in real time.
- Direct user feedback can be added, allowing insight into user preferences and needs.
- Handoff and inspect mode ensures a smooth transition between design and development.
- Version history stores past versions, to ensure no iteration is lost.
- Asset Library is a central storage of design assets, that can ensure consistency across designs.
- Responsive design mode allows designs across multiple device types and screen sizes.
- Supports plugins, its capabilities can be extended endlessly based on specific needs.
- Marvel provides native integrations with tools like Dropbox, Jira, or Slack. With its API, we can create custom integrations.


## 4. Figma
In my opinion Figma is currently the best design tool out there. 
It can create simple animations and clickable prototypes and supports cloud collaboration.

### Feature overview
- Figma's vector tools are pixel-perfect and precise, specifically for high-quality graphic design. It makes it simpler to craft detailed icons and illustrations.
- Artboards allow designers to create multiple boards into a single file, streamlining the web page and iOS app design process by organizing different screens and states efficiently.
  It also provides scrolling artboards that simulate the scrolling experience of web pages and iOS interfaces, helping create realistic prototypes and mockups.
- Components in Figma enable reusable elements, such as buttons and icons, ensuring consistency across the designed web application or mobile design.
  At the same time, it allows rapid updates across multiple instances.
- CSS can be generated directly from design elements, speeding up the transition from design to development.
- Figma supports real-time collaboration, which allows the team members to work together synchronously on the same sketch file and enhances workflow efficiency.
- The extensive plugin ecosystem is user-friendly and can fulfill specific design needs, from automating repetitive tasks to integrating with social media platforms.
- Figma's export options are robust, allowing designers to output designs in multiple formats, resolutions, and configurations, which is crucial when preparing designs for web pages, apps, and social media.
- It integrates with other tools like InVision, Zeplin, and Jira.
- It provides an API, which allows custom plugin development to expand its functionalities further.
- A wide range of available add-ons can significantly extend the utility, enabling users to integrate with additional services and automate various aspects of the design flow.

## 5. +1 Github
We also have Github on the list. It is a cloud-based Git repository hosting service.
It also offers a web-based graphic interface.
In my opinion, it is not a real web development tool, but it can support the productive development lifecycle very well.
Its key features are Github Copilot, pull requests and code reviews, codespaces, automation like CI / CD support, and many others.
