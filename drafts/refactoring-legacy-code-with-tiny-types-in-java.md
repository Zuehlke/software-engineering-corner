---
title: Refactoring Legacy Code using Tiny Types and Data-Oriented Programming in Java
domain: software-engineering-corner.hashnode.dev
tags: functional-programming,java,legacy,legacy-systems,legacy-app-modernization
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1726831500748/c0V6Wtg-K.avif?auto=format
publishAs: KevZ
hideFromHashnodeCommunity: false
saveAsDraft: true
---

I love using **tiny types**, also called **micro types** or **value types**.
The concept is straightforward: you wrap all primitives and strings in your code with a class, ensuring you never pass raw primitives around.

The problem which we're trying to solve is to avoid illegal values entering your system.
For this, it's best to use strongly typed values, which allows you to both lean on the compiler and improve the developer experience by engaging with IDE tooling.

The [parse, don’t validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) mantra is all about parsing incoming data to a specific type, or failing in a controlled manner if the parsing fails.
It’s about using trusted, safe, and typed data structures inside your code and making sure all incoming data is handled at the **edges** of your system.
**Don’t pass incoming data deep into your code, parse it right away and fail fast if needed.**

Let's explore the power of tiny types and data-oriented programming in Java using the **Gilded Rose Kata**.

The [Gilded Rose Kata](https://github.com/emilybache/GildedRose-Refactoring-Kata) is a classic programming exercise that challenges developers to refactor a legacy codebase while maintaining its existing functionality.
The scenario revolves around a fictional shop, "Gilded Rose," that sells various items, each with distinct behaviours affecting their quality and value over time.

In the Gilded Rose code, items have properties like `sellIn` (the number of days left to sell the item) and `quality` (the value or condition of the item), which deteriorate as time progresses.
However, some items, like "*Aged Brie*" or "*Sulfuras, Hand of Ragnaros*" behave differently.
The challenge is to refactor the existing code, which is messy and difficult to maintain, and ensure it handles all the edge cases without breaking any functionality.

The kata is designed to help developers practice **refactoring** techniques, enhance **test-driven development (TDD)** skills, and improve their understanding of **clean code** principles.
The exercise is a fantastic way to engage with legacy code and showcase how careful refactoring, thoughtful design, and modern programming approaches can breathe new life into an aging codebase.

The following code from the exercise is used to update the inventory.
It iterates over a list of items and determines whether to adjust the `sellIn` and/or the `quality` property.
As you can see, it's hard to read and difficult to change.

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

We need a safety net before we can start refactoring the legacy code.
Instead of writing lots of small unit tests, a more broad "approval" test will give us the quickest feedback.
Approval tests are a type of test where you verify that the output of your code matches an "approved" or expected result.
Unlike traditional tests that assert specific values or behaviours, approval tests capture the output of a test run and compare it to a pre-approved baseline or "golden master."
If the current output differs from the approved version, the test fails, allowing you to review and either approve the new output or fix the code.


```text
-------- day 0 --------  
name, sellIn, quality  
+5 Dexterity Vest, 10, 20  
Aged Brie, 2, 0  
Elixir of the Mongoose, 5, 7  
Sulfuras, Hand of Ragnaros, 0, 80  
Sulfuras, Hand of Ragnaros, -1, 80  
Backstage passes to a TAFKAL80ETC concert, 15, 20  
Backstage passes to a TAFKAL80ETC concert, 10, 49  
Backstage passes to a TAFKAL80ETC concert, 5, 49  
Conjured Mana Cake, 3, 6
```

Once setup, our approval test will ensure that the above output remains unchanged while we make changes to the code.
At this stage, we're well-positioned to begin refactoring.

The [Gilded Rose requirements](https://github.com/emilybache/GildedRose-Refactoring-Kata/blob/main/GildedRoseRequirements.md) state that:

* The `Quality` of an item is never negative
* The `Quality` of an item is never more than `50`

The original `Item` class in the exercise is a mutable data structure and bound-checks are littered throughout the code base to ensure the above requirements are not violated.

```java
if (items[i].quality < 50) {
  items[i].quality = items[i].quality + 1;
}

if (items[i].quality > 0) {
  items[i].quality = items[i].quality - 1;
}
```

A much better design is to introduce a tiny type to encompass the constraints.
In this instance we've used a Java Record.
[Java Records](https://openjdk.org/jeps/395), introduced in Java 16, are a concise way to define immutable data classes.
A record automatically generates the boilerplate code that’s typical for simple data-holding classes - such as constructors, getters, `equals()`, `hashCode()`, and `toString()` - while making the intent clear that the class is purely for storing data.

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

Whenever a method receives a `BoundedQuality` we know for a fact that the integrity of the data is intact and we can stop adding defensive checks.
Also, the `adjust` method allows us to manipulate the quality amount in a safe way.
Furthermore, we fail fast if we're trying to create a `BoundedQuality`with invalid data, such as a negative amount.


Before the introduction of our `BoundedQuality` type, both the `quality` and the `sellIn` amount where modelled as primitive integers.
The compiler can't help us to distinguish between the two numbers, given they have the same type.
This can lead to bugs when they accidentally get out-of-order when passed to a function such as `doSomething(int, int)`.

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

As you can see we're using a `sealed` interface, introduced with Java 17.
[Sealed interfaces](https://openjdk.org/jeps/409) work well with Java's enhanced [pattern matching](https://openjdk.org/jeps/441), providing exhaustive case handling which the compiler will enforce.
This leads us to another topic which I'd like to cover: [Data Oriented Programming in Java](https://www.infoq.com/articles/data-oriented-programming-java/) as explained in an InfoQ article by Brian Goetz.

> _Data-oriented programming_ encourages us to model data as (immutable) data, and keep the code that embodies the business logic of how we act on that data separately.
Records, sealed classes, and pattern matching are designed to work together to support data-oriented programming.
Using the combination of records and sealed classes also makes it easier to _make illegal states unrepresentable_, further improving safety and maintainability.

In the spirit of making illegal states unrepresentable, let's start modelling our purchasable items from the shop.
For example, we know that *"Sulfuras"* has a quality of `80` and it's quality can never change.
We can model our legendary item as a Java Record because they're immutable by default and we can hard-code the quality.


Sealed interfaces lend itself also very nicely to create a lightweight type-hierarchy in case we want to lump all the legendary items together for processing.


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

public record Sulfuras(FixedSellIn sellIn) implements LegendaryItem {

  private static final FixedQuality quality = FixedQuality.of(80);

  @Override
  public String name() { return "Sulfuras, Hand of Ragnaros"; }

  @Override
  public Quality quality() { return quality; }
}

// ...
```

Using Java's pattern matching and [record patterns](https://openjdk.org/jeps/440) (as of Java 21+) our code for processing the purchasable items can be neatly separated into individual code paths.

```java
PurchasableItem item = // ...

var updated = switch (item) {  
  case CommonItem common when common.sellIn().isExpired() -> {}
  case CommonItem common -> { /* ... */ }  
  case Sulfuras(SellIn sellIn) -> { /* ... */ }  
  case AgedBrie(SellIn sellIn, Quality quality) -> { /* ... */ }  
}
```

Record patterns allows you to deconstruct records directly in patterns, enabling more expressive and concise ways to access the fields of a record.
The compiler ensures that you handle all fields in the record pattern, which can help prevent bugs from incomplete data extraction.

In conclusion, Tiny Types and Data-Oriented Programming are a powerful combination to enhance code clarity, enforce stronger type safety, and ensure data integrity by preventing invalid states, all while keeping business logic separate from the data itself.

You can't go wrong if you follow these 4 principles (as outlined in the blog post by Brian Goetz):

- **Model the data** Records should model data. Make each record model one thing, make it clear what each record models, and choose clear names for its components.
- **Data is immutable.** Ensure your records and classes are immutable.
- **Validate at the boundary.** Before injecting data into our system, we should ensure that it is valid.
- **Make illegal states unrepresentable.** Records and sealed types make it easy to model our domains in such a way that erroneous states simply can't be represented. This is much better than having to check for validity all the time!

Full source code can be found on [GitHub](https://github.com/ToastShaman/gilded-rose-experiments/tree/add-tiny-types).