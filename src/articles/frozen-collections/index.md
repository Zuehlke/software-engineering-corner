---
title: Frozen Collections in .NET 8
description: >-
  .NET 8 introduces frozen collections, a new type of collection designed for
  performance gains in scenarios where the collection is initialized once and
  then remains unchanged. Unlike read-only collections, frozen collections are
  immutable after creation, allowing for optimizations that can significantly
  improve lookup speeds compared to lists, hash sets, and immutable hash sets.
  While creation of frozen collections is more expensive, their lookup
  performance makes them ideal for frequently accessed, static datasets.
released: '2022-12-15T06:32:06.501Z'
cover: images/cover.jpeg
author: Steven Giesel
tags:
  - C#
  - .NET
---
.NET 7 was freshly released but Microsoft does not sleep. .NET 8 is already in the making and I want to showcase to you one new area where the dotnet team is working on **Frozen collections**.

So let's have a look at what **frozen collections** are and how they work.

***

**Disclaimer**: I had a look at the alpha 1 build of .NET8, which means everything can change in the final stable release.

***

## Frozen collection

Let's discuss first what it means to be **frozen** for a list. And we do this with some code, which works with the .net8 alpha release:

```csharp
List normalList = new List { 1, 2, 3 }; 
ReadOnlyCollection readonlyList = normalList.AsReadOnly(); 
FrozenSet frozenSet = normalList.ToFrozenSet(); 
ImmutableList immutableList = normalList.ToImmutableList();

normalList.Add(4);

Console.WriteLine($"List count: {normalList.Count}"); Console.WriteLine($"ReadOnlyList count: {readonlyList.Count}"); Console.WriteLine($"FrozenSet count: {frozenSet.Count}"); Console.WriteLine($"ImmutableList count: {immutableList.Count}");
```

Which will print the following:

```plaintext
List count: 4
ReadOnlyList count: 4
FrozenSet count: 3
ImmutableList count: 3
```

Let's discuss the things one by one:

* A `ReadOnlyList` is just a "view" of the object it was created from. So if you update the list it was originally created from, the `ReadOnlyList` will also reflect that change. The user of a `ReadOnlyList` just has no means of mutating the internal state of the list itself.

* A freezable collection is a collection that can be mutated until, well, it gets frozen. Once it's frozen it does not reflect changes anymore. That is why we see the count is 3 instead of 4 (like the `ReadOnlyList`).

* The **immutable** list also holds only 3 items, so how does the **immutable** list differ from our **frozen** object?

In this given example there are 2 major differences. First, the **frozen\*\*** object is a `Set` and not a list (main reason: there is no `FrozenList` or `FrozenCollection` as off now). A set is unordered and can't contain duplicated elements. That might change in the future, see the disclaimer at the beginning. The second and major factor: Immutable collections have efficient ways of mutating the list by creating a new one:

```csharp
var immutableList = normalList.ToImmutableList();
// This will create a new immutable List
var newList = immutableList.Add(2);
```

We can't find this behavior with frozen collections. At the moment .NET8 knows basically two types of frozen collections:

* `FrozenSet`

* `FrozenDictionary`

## But why?

The question comes: **Why do we have to introduce this concept?**. And that is a good question. Can't we solve it with the current approach of read-only or immutable objects? Well yes and no. Frozen objects, as they have those restrictions, can bring some performance benefits with them. The framework gets more optimized with each increment and Microsoft continues that journey. Often times collections get initialized at some point but will never change their state.

### Benchmark

Let's have a look at the numbers and see where the frozen set as an example is outperforming our classical list:

```csharp
public class LookupBenchmark
{
    private const int Iterations = 1000;
    private readonly List<int> list = Enumerable.Range(0, Iterations).ToList();
    private readonly FrozenSet<int> frozenSet = Enumerable.Range(0, Iterations).ToFrozenSet();
    private readonly HashSet<int> hashSet = Enumerable.Range(0, Iterations).ToHashSet();
    private readonly ImmutableHashSet<int> immutableHashSet= Enumerable.Range(0, Iterations).ToImmutableHashSet();

    [Benchmark(Baseline = true)]
    public void LookupList()
    {
        for (var i = 0; i < Iterations; i++)
            _ = list.Contains(i);
    }

    [Benchmark]
    public void LookupFrozen()
    {
        for (var i = 0; i < Iterations; i++)
            _ = frozenSet.Contains(i);
    }

    [Benchmark]
    public void LookupHashSet()
    {
        for (var i = 0; i < Iterations; i++)
            _ = hashSet.Contains(i);
    }

    [Benchmark]
    public void LookupImmutableHashSet()
    {
        for (var i = 0; i < Iterations; i++)
            _ = immutableHashSet.Contains(i);
    }
}
```

And here are the results:

```plaintext
BenchmarkDotNet=v0.13.2, OS=macOS Monterey 12.6.1 (21G217) [Darwin 21.6.0]
Apple M1 Pro, 1 CPU, 10 logical and 10 physical cores
.NET SDK=8.0.100-alpha.1.22570.9
  [Host]     : .NET 8.0.0 (8.0.22.55902), Arm64 RyuJIT AdvSIMD
  DefaultJob : .NET 8.0.0 (8.0.22.55902), Arm64 RyuJIT AdvSIMD


|                 Method |      Mean |     Error |    StdDev | Ratio |
|----------------------- |----------:|----------:|----------:|------:|
|             LookupList | 57.561 us | 0.1346 us | 0.1124 us |  1.00 |
|           LookupFrozen |  1.963 us | 0.0119 us | 0.0093 us |  0.03 |
|          LookupHashSet |  2.997 us | 0.0314 us | 0.0294 us |  0.05 |
| LookupImmutableHashSet | 15.422 us | 0.3034 us | 0.6333 us |  0.26 |
```

Well, that thing is way faster than your regular `List`! And that is the prime example where we would use a `FrozenSet` or sets in general. The same would apply to `FrozenDictionary`.To be fair we have to compare against the regular `HashSet` and `ImmutableHashSet`. And also here we see, that the `FrozenSet` outperforms.

Info: `ImmutableHashSet` got some performance tweaks with .net8. If you would take the same benchmark with .net7, `ImmutableHashSet` would be slower!

If you want to have a deeper look into the topic, go to the GitHub tracker with the proposal: [*\[API Proposal\]: Provide optimized read-only collections*](https://github.com/dotnet/runtime/issues/67209)

## Creating the `FrozenSet`

Now of course showing lookups and stuff is nice, but it could be considered half the through. Creating sets is more expensive than let's say creating a simple `List<int>`. This also reflects the typical use case of `FrozenSet`s. You create them once at the beginning and then often times access them (via lookup for example). Here are some numbers. We will create those objects based on an already given array:

```csharp
private readonly int[] from = Enumerable.Range(0, 1000).ToArray();

[Benchmark(Baseline = true)]
public List<int> CreateList() => from.ToList();

[Benchmark]
public FrozenSet<int> CreateFrozenList() => from.ToFrozenSet();

[Benchmark]
public HashSet<int> CreateHashSet() => from.ToHashSet();

[Benchmark]
public ImmutableHashSet<int> CreateImmutableHashSet() => from.ToImmutableHashSet();
```

Results:

```plaintext
|                 Method |         Mean |     Error |    StdDev |  Ratio | RatioSD |
|----------------------- |-------------:|----------:|----------:|-------:|--------:|
|             CreateList |     251.9 ns |   2.41 ns |   2.14 ns |   1.00 |    0.00 |
|       CreateFrozenList |  57,626.2 ns | 973.67 ns | 910.77 ns | 228.94 |    4.17 |
|          CreateHashSet |   6,694.7 ns | 132.08 ns | 171.74 ns |  26.72 |    0.74 |
| CreateImmutableHashSet | 200,541.6 ns | 972.71 ns | 812.25 ns | 796.58 |    8.33 |
```

## Conclusion

The .NET Framework will get more and more specialized types which can help us to express our intent better and also help us with writing high-performant code. A new welcome entry to this is the **frozen** collections!
