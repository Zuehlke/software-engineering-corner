---
title: Refactoring Legacy Code using Tiny Types and Data Oriented Programming in Java
domain: software-engineering-corner.hashnode.dev
tags: functional-programming,java,legacy,legacy-systems,legacy-app-modernization
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1726831500748/c0V6Wtg-K.avif?auto=format
publishAs: KevZ
hideFromHashnodeCommunity: false
saveAsDraft: true
---

Legacy systems are often very procedural and rely heavily on mutable state, which makes them difficult to maintain and extend.
This reliance on mutable data structures can lead to issues like unintended side effects and bugs, especially when multiple parts of the system interact with shared state.
The [Gilded Rose Kata](https://github.com/emilybache/GildedRose-Refactoring-Kata) is a perfect example of this: it’s messy, hard to refactor, and prone to bugs due to inadequate constraints on primitive values.

The Gilded Rose Kata is a programming exercise that challenges developers to refactor a legacy codebase while maintaining its existing functionality.
The scenario revolves around a fictional shop, "Gilded Rose," that sells various items, each with distinct behaviours affecting their quality and value over time.
Items have properties such as `sellIn`, which represents the number of days left to sell the item, and `quality`, which reflects the value or condition of the item. Both properties deteriorate as time progresses.
However, some items, like "*Aged Brie*" or "*Sulfuras, Hand of Ragnaros*" behave differently.

Tiny Types and Data Oriented Programming offer a solution to these challenges by encouraging a shift away from procedural and mutable designs.
Tiny Types encapsulate primitive values, like `sellIn` and `quality`, in strongly typed classes, ensuring that the integrity of these values is preserved throughout the system.
This reduces the risk of invalid states and eliminates the need for repetitive defensive checks. 

Meanwhile, Data Oriented Programming promotes the separation of business logic from data, making the code easier to reason about and maintain.
By modeling data as immutable records and using sealed interfaces to ensure exhaustive case handling, we can minimise side effects and ensure that all code paths are predictable and safe.
Together, these techniques lead to a cleaner, more maintainable codebase where illegal states are unrepresentable, and extending functionality becomes straightforward.

Let's explore both concepts in Java using the **Gilded Rose Kata**.

The following code updates the inventory by iterating over a list of items and determining whether to adjust the `sellIn` or `quality` properties. 
As you can see, it’s hard to read and difficult to change.

```java
public void updateQuality() {
  for (int i = 0; i < items.length; i++) {
    if (!items[i].name.equals("Aged Brie")
        && !items[i].name.equals("Backstage passes to a TAFKAL80ETC concert")) {
      if (items[i].quality > 0) {
        if (!items[i].name.equals("Sulfuras, Hand of Ragnaros")) {
          items[i].quality = items[i].quality - 1;
        }
      }
    } else {
      if (items[i].quality < 50) {
        items[i].quality = items[i].quality + 1;

        if (items[i].name.equals("Backstage passes to a TAFKAL80ETC concert")) {
          if (items[i].sellIn < 11) {
            if (items[i].quality < 50) {
              items[i].quality = items[i].quality + 1;
            }
          }

          if (items[i].sellIn < 6) {
            if (items[i].quality < 50) {
              items[i].quality = items[i].quality + 1;
            }
          }
        }
      }
    }

    if (!items[i].name.equals("Sulfuras, Hand of Ragnaros")) {
      items[i].sellIn = items[i].sellIn - 1;
    }

    if (items[i].sellIn < 0) {
      if (!items[i].name.equals("Aged Brie")) {
        if (!items[i].name.equals("Backstage passes to a TAFKAL80ETC concert")) {
          if (items[i].quality > 0) {
            if (!items[i].name.equals("Sulfuras, Hand of Ragnaros")) {
              items[i].quality = items[i].quality - 1;
            }
          }
        } else {
          items[i].quality = items[i].quality - items[i].quality;
        }
      } else {
        if (items[i].quality < 50) {
          items[i].quality = items[i].quality + 1;
        }
      }
    }
  }
}
```

Before diving into refactoring the legacy code, it’s best to have some kind of safety net in place.
Instead of writing tons of tiny unit tests, we can go for a broader 'approval' test that gives us quick feedback.
Approval tests verify if the output from our code matches an 'approved' result.
Unlike the usual tests that assert specific values or behaviors, these tests capture the output and compare it to a pre-approved baseline or 'golden master.'
If the current output strays from what’s approved, the test fails, letting us decide whether to approve the new output or tweak the code.

In the Gilded Rose Kata, we can implement an approval test by printing the `sellIn` and `quality` of each item to a file at the end of each day.
This approach allows us to capture the state of our inventory over time and compare it against an expected output.

Once setup, our approval test will verify that the output remains consistent as we modify the code.
At this point, we are ready to start refactoring.

The [Gilded Rose requirements](https://github.com/emilybache/GildedRose-Refactoring-Kata/blob/main/GildedRoseRequirements.md) state that:

* The `Quality` of an item is never negative
* The `Quality` of an item is never more than `50`

The original `Item` class in the exercise serves as a mutable data structure, and the codebase includes a great deal of bound-checks to ensure that the requirements aren't violated.

```java
if (items[i].quality < 50) {
  items[i].quality = items[i].quality + 1;
}

if (items[i].quality > 0) {
  items[i].quality = items[i].quality - 1;
}
```

A much better design involves introducing a tiny type to encompass the constraints.
In this instance, we use a Java Record.
[Java Records](https://openjdk.org/jeps/395), introduced in Java 16, provide a concise way to define immutable data classes.
A record automatically generates the boilerplate code typical of simple data holding classes - such as constructors, getters, `equals()`, `hashCode()`, and `toString()` - while indicating that the class serves solely to store data.

```java
public record BoundedQuality(int value) {
  public BoundedQuality {
    if (value < 0 || value > 50) {
      throw new IllegalArgumentException("quality must be between 0-50");
    }
  }

  public static UnaryOperator<BoundedQuality> adjustQuality(int adjustment) {
    return it -> new BoundedQuality(Math.max(0, Math.min(50, it.value + adjustment)));
  }
}
```

Whenever a method receives a `BoundedQuality`, we can confidently assert that the data's integrity remains intact, allowing us to remove unnecessary defensive checks.
Additionally, the `adjust` method enables safe manipulation of the quality amount.
Moreover, if we attempt to create a `BoundedQuality` with invalid data, such as a negative amount, the system fails fast.

Before we introduced the `BoundedQuality` type, we modeled both the `quality` and `sellIn` amounts as primitive integers.
The compiler couldn’t help us distinguish between these two numbers since they share the same type.
This situation could lead to bugs if we passed them out of order to a function like `doSomething(int, int)` by accident.

But hang on! What do we do with this new requirement?

* *"Sulfuras"* is a legendary item and as such its `Quality` is `80` and it never alters
* *"Sulfuras"* is a legendary item, never has to be sold or decreases in `Quality`

We can introduce yet another tiny type, how about a `FixedQuality`? Most likely we want to use the qualities interchangeably and introduce an interface as well.

```java
public sealed interface Quality permits BoundedQuality, FixedQuality {
  int value();
}

record BoundedQuality(int value) implements Quality { /* ... */ }

record FixedQuality(int value) implements Quality { 
  public static final FixedQuality EIGHTY = new FixedQuality(80);
}
```

As you can see, we use a `sealed` interface introduced with Java 17.
[Sealed interfaces](https://openjdk.org/jeps/409) complement Java's enhanced [pattern matching](https://openjdk.org/jeps/441) by providing exhaustive case handling that the compiler enforces.
This discussion naturally leads us to another topic I'd like to cover: [Data Oriented Programming in Java](https://www.infoq.com/articles/data-oriented-programming-java/), as explained in an InfoQ article by Brian Goetz.

> _Data-oriented programming_ encourages us to model data as (immutable) data, and keep the code that embodies the business logic of how we act on that data separately.
Records, sealed classes, and pattern matching are designed to work together to support data-oriented programming.
Using the combination of records and sealed classes also makes it easier to _make illegal states unrepresentable_, further improving safety and maintainability.

In the spirit of making illegal states unrepresentable, modeling our purchasable items from the shop begins here.
For example, *"Sulfuras"* has a quality of `80` that never changes.
We model our legendary item as a Java Record because these records are immutable by default, allowing us to hard-code the quality.

Sealed interfaces help with the creation of a lightweight type hierarchy, allowing us to group all the items together for processing.

```java
public sealed interface PurchasableItem 
  permits LegendaryItem, AgedBrie, CommonItem {
  String name();
  SellIn sellIn();
  Quality quality();
}

public sealed interface LegendaryItem 
  extends PurchasableItem 
  permits Sulfuras {}

public record AgedBrie(
  UnboundedSellIn sellIn, 
  BoundedQuality quality
) implements MaturedCheese {
  @Override public String name() { return "Aged Brie"; }
}

public record Sulfuras(
  FixedSellIn sellIn
) implements LegendaryItem {

  private static final FixedQuality quality = FixedQuality.of(80);

  @Override
  public String name() { return "Sulfuras, Hand of Ragnaros"; }

  @Override
  public Quality quality() { return quality; }
}

// ...
```

By utilising Java's pattern matching and [record patterns](https://openjdk.org/jeps/440) (available in Java 21 and later), we can separate our code for processing purchasable items into distinct code paths.

```java
PurchasableItem item = // ...

var updated = switch (item) {  
  case CommonItem common when common.sellIn().isExpired() -> {}
  case CommonItem common -> { /* ... */ }  
  case Sulfuras(SellIn sellIn) -> { /* ... */ }  
  case AgedBrie(SellIn sellIn, Quality quality) -> { /* ... */ }  
}
```

Record patterns let you deconstruct records right in the patterns, giving you a more expressive and concise way to access record fields.
Plus, the compiler makes sure you handle all the fields in the record pattern, which helps catch bugs that might pop up from incomplete data extraction.

In conclusion, Tiny Types and Data Oriented Programming make a powerful duo for boosting code clarity, enforcing stronger type safety, and ensuring data integrity by preventing invalid states—all while keeping business logic separate from the data itself.

You can’t go wrong by sticking to these four principles as outlined in Brian Goetz's blog post:

- **Model the data.** Records should represent data. Each record should focus on one thing, make it obvious what each record models, and pick clear names for its components.
- **Data is immutable.** Keep your records and classes immutable.
- **Validate at the boundary.** Before you inject data into the system, make sure it’s valid.
- **Make illegal states unrepresentable.** Use records and sealed types to model your domains so that erroneous states can’t exist. This beats checking for validity all the time!

You can find the full source code over on [GitHub](https://github.com/ToastShaman/gilded-rose-experiments/tree/add-tiny-types).
