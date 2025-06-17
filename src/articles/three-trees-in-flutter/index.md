---
title: Understanding the three trees in Flutter - Widget tree, Element tree and RenderObject tree
description: >-
  Flutter's UI rendering relies on three interconnected trees: Widget, Element,
  and RenderObject. The Widget tree describes the UI, the Element tree manages
  the lifecycle and connects Widgets to RenderObjects, and the RenderObject tree
  handles the actual rendering process. This architecture allows for efficient
  UI updates by minimizing the need to rebuild the mutable Element and
  RenderObject trees.
released: '2023-07-11T09:12:26.288Z'
cover: images/cover.png
author: Gabriel Duss
tags:
  - Flutter
  - Flutter Widgets
---
Flutter, Google's powerful UI framework, operates on a unique architecture that efficiently renders user interfaces. At the core of this architecture are three interconnected trees: the Widget tree, Element tree, and RenderObject tree.

In this blog post, we will dive into the inner workings of Flutter's three trees and understand their relationships. These trees play a vital role in constructing and rendering UI components, enabling developers to create visually stunning and performant applications.

## The Widget tree

In Flutter, a Widget tree refers to the hierarchical structure of Widgets that are used to compose the user interface of an application. The Widget tree represents the visual components of the app and their relationships with each other.

At its core, Flutter follows a declarative approach, where the user interface is described using a tree of immutable Widgets. Each Widget represents a specific UI element, such as a button, text, image, or even a complex layout. Widgets can be combined and nested within each other to create more complex user interfaces.

Let's make a small example of a Widget tree. The following example draws a red container with the text "Hello" in it.

```dart
class MyWidget extends StatelessWidget {
  const MyWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.red,
      padding: const EdgeInsets.all(8.0),
      child: const Text("Hello"),
    );
  }
}
```

The Widget tree of this example is very simple as the following image visualizes.
![Example Widget tree](images/1749947889615-1lpagswuiz4.png)

The first tree shows the defined Widget tree, but Flutter created a refined Widget tree, that is illustrated on the right side. But why is Flutter adding three additional Widgets to the Widget tree? To address this question, it's crucial to understand Flutter's two categories of widgets for defining UI elements: StatefulWidgets/StatelessWidgets and RenderObjectWidgets. RenderObjectWidgets are responsible for rendering Elements on the screen, while StatefulWidgets/StatelessWidgets simplify their usage. As a developer, you typically combine and configure existing Widgets within a StatefulWidget/StatelessWidget, rarely creating RenderObjectWidgets directly. Many Widgets provided by Flutter are themselves StatefulWidget/StatelessWidget, but ultimately, each of these widgets contributes at least one RenderObjectWidget to the tree, as only RenderObjectWidgets have the knowledge to render Elements on the canvas.

The following illustration shows all types of Widgets.

![Different Widget types](images/1749947889619-in609wwdh3.png)

The previous example shows a popular example: the container Widget. You can set a color and padding on the widget. Flutter will transform it to a ColoredBox and a Padding RenderObjectWidget. The ColoredBox will be responsible to draw the color, the Padding will be responsible to draw the padding. It is also possible to use the RenderObjectWidget directly, as the following code shows.

```dart
 class MyWidget extends StatelessWidget {
  const MyWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.red,
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: RichText(text: const TextSpan(text: "Hello")),
      ),
    );
  }
}
```

In Flutter, a Widget gets rebuilt when its internal state changes or when its parent widget requests a rebuild. Here are some common scenarios that trigger widget rebuilds:

* Initial build: When a Widget is first inserted into the widget tree.
* State changes: If a Widget's internal state changes, because of user interactions or a network response.
* InheritedWidget changes: Widgets can receive data changes from ancestor widgets.
* Layout changes: If the layout constraints of a widget change, e.g. the orientation of a device changes.
* Widget tree updates: If a Widget's parent requests a rebuild.
* Animation updates: If a Widget includes an animation, it typically rebuilds on every frame.

As you can see, Widgets get rebuilt a lot. That's why they need to be extremely lightweight.

## The three trees in Flutter

To keep the widgets lightweight Flutter has two additional trees: the element tree and the RenderObject tree. Those three trees are connected.

Let's check the first example again and take a look at what their Element and RenderObject trees look like.

![The three trees in Flutter](images/1749947889621-c2dfwmp76iu.png)

As the Widget tree is immutable it gets rebuilt a lot. The Element and RenderObject trees are mutable and do not get recreated that frequently. The Element tree is responsible for the lifecycle and connects the Widget tree with the RenderObject tree. As you can see, every widget generates an Element, but not every Element has a RenderObject. Only RenderObjectElements generate RenderObjects, all other elements send their configuration down to the next RenderObjectElement. The following illustration shows the two different Element types.

![Element types](images/1749947889623-l4ovkuoxv4.png)

The previous illustration includes another interesting detail. The Element implements the BuildContext. That means that the BuildContext included in every build method is nothing other than an Element with restricted access. That's why the BuildContext has all the knowledge of an Element, like the lifecycle state or its position in the tree. As the following code shows, the BuildContext can be casted to an Element.

```dart
Widget build(BuildContext context) {
    var element = context as Element;

    return GestureDetector(
      child: isRed ? widgetRed : widgetBlue,
      onTap: () {
        isRed = !isRed;
        element.markNeedsBuild();
      },
    );
  }
```

The cast to an Element lets you access all the properties of an Element. This can be very interesting for educational reasons, but it's not recommended in production. This is the reason why Flutter does not allow direct access. The following table summarizes the most important attributes of the three objects.

|                  | Widget              | Element                                                                        | RenderObject |
| ---------------- | ------------------- | ------------------------------------------------------------------------------ | ------------ |
| Mutable          | false               | true                                                                           | true         |
| Lightweight      | true                | false                                                                          | false        |
| Responsibilities | Holds configuration | Lifecycle, holds state of StatefulWidgets, connects Widgets with RenderObjects | Rendering    |

## Conclusion

In conclusion, the Widget tree, Element tree, and RenderObject tree are three interconnected trees in Flutter that are vital for constructing and rendering UI components efficiently. The Widget tree represents the hierarchical structure of immutable Widgets that describe the UI elements. RenderObjects handle the rendering, while Elements are responsible for the lifecycle and connect the Widget tree with the RenderObject tree.
