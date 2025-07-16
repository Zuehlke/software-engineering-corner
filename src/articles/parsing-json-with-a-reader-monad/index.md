---
title: Parsing inconsistent JSON with a reader monad in Java
description: >-
  An inconsistent JSON API, which expresses missing values as nulls, empty
  strings, or empty arrays, can be handled with a functional approach. The
  reader monad provides a clean and composable way to process JSON and manage
  these inconsistencies. This method separates data extraction from
  transformation, allowing for modularity, easy chaining, and graceful error
  handling, ultimately improving code readability and maintainability.
released: '2025-03-03T16:08:48.871Z'
cover: images/cover.jpg
author: Kevin Denver
tags:
  - Functional Programming
  - Java
  - legacy
  - legacy app modernization
  - legacy-systems
shortDescription: >-
  Learn how to parse inconsistent JSON with a reader monad in Java. This
  approach handles varying representations of missing values, improving code
  clarity and maintainability.
---
Ever had an API response make you question its design choices?
Like when it gives you an empty array instead of just saying, 'This value is missing,' or throws in an empty string where a `null` would be way cleaner?
If this sounds familiar, you're not alone.

This is the story of wrestling with an inconsistent JSON API and finding a clean, functional approach.

## The problem: Inconsistent JSON

Here's the scenario: working with a JSON API that expressed missing values in the most unpredictable ways possible.
Sometimes, it returned a `null`. Other times, it would return an empty string. And to make matters worse, it threw in an empty array - all for the same field.

As you can imagine, there was no desire to change the legacy API and time was of the essence.
How do you handle this inconsistent behaviour without littering your code with dozens of `case` statements?

```java
record Person(Object name) {
    public String getNameOrNull() {
      return switch (name) {
        case String value -> value.isBlank() ? null : value;
        case List<?> value -> {
          if (value.isEmpty()) yield null;
          throw new IllegalArgumentException("Unexpected non-empty array");
        }
        case null, default -> null;
      };
    }
  }
```

## The solution: Enter the reader monad

This is where the reader monad comes in handy.
A reader monad is a functional programming construct that allows functions to access shared data in a clean, composable way without explicitly passing it around.
Also, the reader monad separates the act of setting up a computation from the act of executing it.
In this case, we're using it to process the JSON in a way that handles these pesky inconsistencies in an elegant way.

You might be thinking why can't we just write a custom deserializer for a popular JSON processing library such as [Jackson](https://github.com/FasterXML/jackson-databind)?
There's nothing wrong with leveraging your existing JSON processing library.
Personally, in this specific instance, I prefer using a monad since it offers a more modular approach.
It separates data extraction from transformation, allows for easy chaining with `map` and `flatMap`, and handles errors gracefully.
This makes the code more readable, flexible, and easier to maintain, without tightly coupling the code to a specific library or JSON structure.

Here's the core of the implementation using [JSON-java](https://github.com/stleary/JSON-java):

```java
public final class JsonReader<T> {
    private final Function<JSONObject, T> f;

    public JsonReader(Function<JSONObject, T> f) {
        this.f = requireNonNull(f);
    }

    public T apply(JSONObject json) {
        return f.apply(json);
    }

    // Additional methods like map, flatMap, orElse, and or go here

    public static JsonReader<String> maybeStringOrNull(String key) {
        return maybeStringOrNull(root -> root.opt(key));
    }

    public static JsonReader<String> maybeStringOrNull(JSONPointer pointer) {
        return maybeStringOrNull(root -> root.optQuery(pointer));
    }

    private static JsonReader<String> maybeStringOrNull(Function<JSONObject, Object> lookup) {
        return new JsonReader<>(root -> {
            var opt = lookup.apply(root);

            if (opt == null || NULL.equals(opt)) {
                return null;
            }
            
            if (opt instanceof String str) {
                return str.isEmpty() ? null : str;
            }

            if (opt instanceof JSONArray arr) {
                if (arr.isEmpty()) return null;
                throw new JsonParsingException("Unexpected non-empty array");
            }
            
            throw new JsonParsingException("Unexpected type: %s".formatted(opt.getClass()));
        });
  }
}
```

The `maybeStringOrNull` factory method creates a `JsonReader<String>` that safely extracts string values from a `JSONObject`, handling cases where the values are `null`, empty strings, or empty arrays.

To extract a person's middle name from a JSON object, which might be `null`, an empty array, or a string, you can create a reader using the `maybeStringOrNull` factory method:

```java
JsonReader<String> reader = JsonReader.maybeStringOrNull("middle_name");
```

Once you have your reader set up, you can apply it to a JSONObject:

```java
System.out.println(reader.apply(new JSONObject(""" { "middle_name": "John" } """))); // prints: "John"
System.out.println(reader.apply(new JSONObject(""" { "middle_name": "" } """))); // prints: null
System.out.println(reader.apply(new JSONObject(""" { "middle_name": null } """))); // prints: null
System.out.println(reader.apply(new JSONObject(""" { "middle_name": [] } """))); // prints: null
```

One of the more powerful aspects of using a monad is the ability to compose operations seamlessly using `map` and `flatMap`.
These methods enable you to build complex data transformation pipelines while keeping the code clean and readable.

Think of `map` as a way to post-process your reader's output.
You're not changing how the reader interacts with its shared data; you're just adjusting what it gives back after it's done its job.

```java
public <R> JsonReader<R> map(Function<T, R> mapper) {
    return new FusionJsonReader<>(f.andThen(value -> value == null ? null : mapper.apply(value)));
}
```

For example, if we want to extract a person's middle name and transform it to uppercase, we can do so using `map`:

```java
JsonReader.maybeStringOrNull("middle_name")
    .map(String::toUpperCase)
    .apply(new JSONObject("..."));
```

Similiarly, think of `flatMap` as a way to sequence operations, where each step can peek at the shared data and decide what to do next.

```java
public <R> JsonReader<R> flatMap(Function<T, JsonReader<R>> mapper) {
    return new JsonReader<>(root -> {
        var value = f.apply(root);
        if (value == null) return null;
        JsonReader<R> reader = mapper.apply(value);
        if (reader == null) return null;
        return reader.apply(root);
    });
  }
```

`flatMap` takes a reader and a function that generates another reader based on the result of the first.
It then combines them into a single, unified operation.

Consider a scenario where we want to extract a user's first and last names from a JSON object and combine them into a display name.

```java
// Assume our legacy API returns a user object:
// { "last_name": "Doe", "first_name": "Jane" }

JsonReader<String> firstName = JsonReader.maybeStringOrNull("first_name");
JsonReader<String> lastName = JsonReader.maybeStringOrNull("last_name");
JsonReader<String> displayName = firstName.flatMap(fn -> lastName.map(ln -> fn + " " + ln);

System.out.println(displayName.apply(new JSONObject("..."))); // prints: Jane Doe
```

## Wrapping up

With the reader monad, we turned a tangled mess of JSON inconsistencies into a clean, composable solution.
Not only did we handle the wacky ways this API communicated missing values, but we also did it in a way that's easy to understand and extend.

Next time you find yourself facing an API that's out to ruin your day, remember that a little functional programming magic can go a long way.
