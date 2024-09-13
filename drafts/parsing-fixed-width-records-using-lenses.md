---
title: Efficiently Parsing COBOL Fixed-Length Records with Functional Lenses
domain: software-engineering-corner.hashnode.dev
tags: functional-programming,java,mainframe,cobol,ibm,legacy,legacy-systems,legacy-app-modernization
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1725967073596/zuzeoPioj.jpg?auto=format
publishAs: KevZ
hideFromHashnodeCommunity: false
saveAsDraft: true
---

I have been lucky enough to work on more than one project that required integration with legacy mainframe applications throughout my career at Zühlke.
Integrating with legacy technologies can be challenging and requires innovative solutions to avoid exposing legacy abstractions through APIs and REST interfaces.
In this particular article I would like to focus on one aspect, namely the parsing of fixed-width COBOL records.
COBOL fixed-width records are a format used in data storage and processing, particularly on IBM mainframes, where each record (or row of data) has a predefined, fixed length.
This means that every record in a file occupies the exact same number of bytes, and each field within a record has a fixed position and size.
Unlike CSV (Comma-Separated Values) or other delimited formats, fixed-width records don't use characters like commas or tabs to separate fields.
Let’s say you have a record that contains the following fields:

- Employee ID (6 characters)
- Employee Name (20 characters)
- Date of Birth (8 characters)

A fixed-width record for this could look like:

```text
000123Alice Doe           19840929
000124Bob Doe             19840929
```

The employee ID is consistently 6 characters long, padded with leading zeros.
Likewise, the employee name is fixed at 20 characters, filled with trailing spaces. 


Parsing fixed width records require careful parsing since each field must be extracted based on its byte position, which can be cumbersome when the data schema changes.
Over the years, I have seen various approaches and libraries trying to provide a friendly API and developer experience with varying success.
Some libraries use annotations and mutable data structures to combine the schema with the data class.
Other libraries separate the schema from the data class by introducing JSON or XML files.
Personally, I don't like to use mutable data structures and  try to avoid them whenever I can.
I prefer immutable data structures which can be shared between threads and are straight forward to test and reason about.
Having the contract defined in a JSON or XML file alongside your code is not ideal either because it adds additional complexity of parsing and versioning the contract.


Taking inspiration from functional programming patterns, a lens can offer a more structured and composable way to handle the parsing.
But what is a lens in the context of functional programming?
Traditionally, a lens is a composable abstraction used to access and update specific parts of a data structure in an immutable way.
It consists of two key operations: a getter to extract a value from a structure and a setter to produce a new structure with a modified value.
Lenses exist independently of the data they transform.


Before defining our lens, we need a data structure to keep track of the number of bytes we've already read and processed from a fixed-width record.

```java
public interface ReadContext {
  String read(int length);

  static ReadContext of(String input) {
    return new ReadContext() {
      private int pos = 0;
        
      @Override
      public String read(int length) {
        var str = input.substring(pos, pos + length);
        pos += length;
        return str;
      }
    };
  }
}
```

As you can see, the `ReadContext` is an interface with a single method `read(int length)`, which reads a substring of the specified length.
It maintains a private variable `pos` to keep track of the current position in the input string.
The `read` method reads a substring of the specified length starting from the current position (`pos`), updates the position, and returns the substring.

```java
ReadContext context = ReadContext.of("000123Alice Doe           19840929"); 
System.out.println(context.read(6));  // Outputs: "000123"
System.out.println(context.read(20)); // Outputs: "Alice Doe           "
System.out.println(context.read(8));  // Outputs: "19840929"
```

Likewise, we need a data structure for writing fixed-width records.

```java
public interface WriteContext {
  void write(String value);

  static WriteContext create() {
    return new WriteContext() {
      private final StringBuilder out = new StringBuilder();
      
      @Override
      public void write(String value) {
        out.append(value);
      }
      
      @Override
      public String toString() {
        return out.toString();
      }
    };
  }
}
```

`WriteContext` is an interface with a single method `write(String value)`, which writes a string value.
It maintains a private `StringBuilder` to accumulate the written strings.
The `write` method appends the given string value to the `StringBuilder`.

```java
WriteContext context = WriteContext.create();
context.write("000123");
context.write("Alice Doe           ");
context.write("19840929");
System.out.println(context)); // Outputs: "000123Alice Doe           19840929"
```

This is all we need to read and write fixed-width records.
However, we want to go further by utilising the type system to build a more robust solution, where the employee ID is stored as a number and the date of birth as a date.


To read a fixed-width column, we need to know the column's width, how to convert the string value into the appropriate type (and vice-versa for writing), and the padding rules.
Next, we'll define a `FixedWidthLens<T>` which encapsulates the three required functions:


* `Function<String, T>` - a function for reading a `String` into a type `T`
* `Function<T, String>` - a function for writing a type `T` into a `String`
* `BiFunction<String, Integer, String>` - a function for either left or right padding our value when writing to a column

```java
public final class FixedWidthLens<T> {

  private final int columnWidth;  
  private final Function<String, T> decode;  
  private final Function<T, String> encode;  
  private final BiFunction<String, Integer, String> padding;

  public FixedWithLens(...) {
    // ...
  }

  public T apply(ReadContext ctx) {
    var text = ctx.read(columnWidth);
    var trimmed = text.trim();
    return trimmed.isEmpty() ? null : decode.apply(trimmed);
  }

  public void apply(WriteContext ctx, T value) {
    var encoded = value == null ? "" : encode.apply(value);
    var text = padding.apply(encoded, columnWidth);
    ctx.write(text);
  }
}
```

Our lens has two methods called `apply()` which can either be used to write or read a fixed-width column given the context.
Let's go ahead and define some factory methods for creating lenses that know how to read and write a `String`, `Integer` or a `LocalDate`.

```java
public static FixedWidthLens<String> stringify(int width) {
  return new FixedWidthLens<>(
    width,
    { it -> it },
    { it -> it },
    (text, length) -> StringUtils.rightPad(text, length));
}

public static FixedWidthLens<Integer> numberify(int width) {
  return new FixedWidthLens<>(
    width,
    Integer::parseInt,
    String::valueOf,
    (text, length) -> StringUtils.leftPad(text, length, '0'));
}

public static FixedWidthLens<LocalDate> dateify() {  
  var formatter = DateTimeFormatter.ofPattern("yyyyMMdd");

  return new FixedWidthLens<>(  
    8,  
    text -> LocalDate.parse(text, formatter),  
    date -> date.format(formatter),  
    (text, length) -> StringUtils.rightPad(text, length));  
}
```

In the preceding code snippet, we define three static methods for creating `FixedWidthLens` instances tailored to different data types.
For example, the `dateify` method creates a lens for reading and writing a `LocalDate`. In the employee example from earlier, the date of birth of an employee is encoded in the fixed-width record as `19840929`.
The lens uses a date-time formatter to convert between a `String` and a `LocalDate`.


Let's put it all together and read an employee fixed-width record.

```java
FixedWidthLens<Integer> idLens = FixedWidthLens.numberify(6);
FixedWidthLens<String> nameLens = FixedWidthLens.stringify(20);
FixedWidthLens<LocalDate> dobLens = FixedWidthLens.dateify();

ReadContext ctx = ReadContext.of("000123Alice Doe           19840929");

System.out.println(idLens.apply(ctx)); // Outputs: 123
System.out.println(nameLens.apply(ctx)); // Outputs: "Alice Doe"
System.out.println(dobLens.apply(ctx)); // Outputs: "1984-09-29"
```

The lenses are thread-safe and can be defined once and re-used throughout your codebase.
Writing a fixed-width record is equally straightforward.

```java
WriteContext ctx = WriteContext.create();

idLens.apply(ctx, 123);
nameLens.apply(ctx, "Alice Doe");
dobLens.apply(ctx, LocalDate.of(1984, 9, 29));

System.out.println(ctx); // Outputs: "000123Alice Doe           19840929"
```

When working with fixed-width columns, it's essential to preserve the order in which they're read and written.
The sequence of columns is important because it ensures that the data is processed correctly and aligns with the expected structure.
Any deviation from this order can lead to incorrect data interpretation or processing errors.

In the code snippet below, the `Person` record and its associated `Schema` class highlights a pattern we used successfully in our projects.
Closely coupling the schema with the record has proven to be the most flexible and developer-friendly approach.
This pattern provides a clear mapping between the fixed-width column schema and the data class, making data parsing and writing simpler.

```java
public record PersonRecord(Integer id, String name, LocalDate dob) {
  
  public PersonRecord {  
    requireNonNull(id, "id must not be null");  
    requireNonNull(name, "name must not be null");  
    requireNonNull(dob, "dob must not be null");  
  }
  
  public static final class Schema {
    public static final FixedWidthLens<Integer> idLens
      = FixedWidthLens.numberify(6);

    public static final FixedWidthLens<String> nameLens
      = FixedWidthLens.stringify(20);

    public static final FixedWidthLens<LocalDate> dobLens
      = FixedWidthLens.dateify();

    public static PersonRecord parse(ReadContext context) {
      return new PersonRecord(
        idLens.apply(context),
        nameLens.apply(context),
        dobLens.apply(context)
      );
    }

    public static void write(WriteContext context, PersonRecord person) {
      idLens.apply(context, person.id());
      nameLens.apply(context, person.name());
      dobLens.apply(context, person.dob());
    }
  }
}
```

Another scenario we haven't covered yet is how to deal with collection of items in fixed-width records.
How would we expand the employee record to include a list of projects they worked on?

```text
000123Alice Doe           1984092902Project A Project B 
```

Lists are typically prefixed with the number of items they contain, providing enough information to loop through the corresponding fixed-width columns.
Introducing a `RepeatableFixedWidthLens<T>` will allow us to encapsulate the necessary logic for handling repeated fields.

```java
public final class RepeatableFixedWidthLens<T> {
  private final int columnWidth;
  private final Function<ReadContext, T> reader;
  private final BiConsumer<WriteContext, T> writer;

  public RepeatableFixedWidthLens(
      int columnWidth,
      FixedWidthLens<T> lens
  ) {
    this(columnWidth, lens::apply, lens::apply);
  }

  public RepeatableFixedWidthLens(
      int columnWidth,
      Function<ReadContext, T> reader,
      BiConsumer<WriteContext, T> writer
  ) {
    this.columnWidth = columnWidth;
    this.reader = reader;
    this.writer = writer;
  }

  public List<T> apply(ReadContext context) {
    var numberOfItems = context.read(columnWidth);
    var maxSize = numberOfItems.isBlank() ? 0 : Integer.parseInt(numberOfItems);
    return Stream.generate(() -> reader.apply(context)).limit(maxSize).toList();
  }

  public void apply(WriteContext context, List<T> values) {
    var numberOfItems = String.valueOf(values.size());
    var padded = StringUtils.leftPad(numberOfItems, columnWidth, '0');
    context.write(padded);
    values.forEach(value -> writer.accept(context, value));
  }
}
```

This approach simplifies the process of parsing and writing lists within fixed-width formats while maintaining the same structured, type-safe approach we've used for individual fields.

```java
FixedWidthLens<String> projectLens = FixedWidthLens.stringify(10);

RepeatableFixedWidthLens<String> projectsLens = new RepeatableFixedWidthLens<>(2, projectLens);

WriteContext context = WriteContext.create();

projectsLens.apply(context, List.of("Project A", "Project B"));

System.out.println(context); // Output: "02Project A Project B "
```

In this blog post, we explored the challenges and solutions for working with fixed-width records, particularly in the context of COBOL data formats.
By utilising functional programming techniques such as lenses and leveraging a type-safe approach, we created a robust system for parsing and writing fixed-width columns.


We demonstrated how to define lenses for different data types, including strings, integers, and dates, and how to maintain clear and organised mappings between data classes and fixed-width schemas.
The pattern of closely coupling the schema with the data class has proven to be highly effective, offering a developer-friendly approach that simplifies data handling and integration.

By following this approach, developers can benefit from a well-structured solution that not only ensures data accuracy but also enhances code maintainability.
Embracing these patterns can lead to more efficient and reliable handling of fixed-width records, paving the way for cleaner and more robust data processing solutions.