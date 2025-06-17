---
title: Source Generators in the MVVM Community Toolkit
description: >-
  Source Generators, introduced with .NET 5, analyze code and generate new code
  during compilation, offering performance advantages over runtime reflection.
  The MVVM Community Toolkit leverages Source Generators to minimize boilerplate
  code, exemplified by the `ObservablePropertyGenerator` which automatically
  creates properties and associated methods based on attributes. This approach
  streamlines development and enhances application performance by generating
  code at compile time.
released: '2023-10-30T10:10:29.349Z'
cover: images/cover.jpg
author: Nijaz Zaljevic
tags:
  - C#
  - dotnet
  - '#maui'
  - MVVM
  - xaml
---
# Source Generators in the MVVM Community Toolkit

This blog post is a continuation of the blog post [Reducing boilerplate code with the MVVM Community Toolkit in .NET MAUI](https://software-engineering-corner.hashnode.dev/reducing-boilerplate-code-with-the-mvvm-community-toolkit-in-net-maui). It covers the Source Generator aspect of the MVVM Community Toolkit. Firstly, I am going to explain you the fundaments with some theory. Afterwards you are going to see an example from the MVVM Community Toolkit. The final chapter is going to summarize the blog post.

## Table Of Contents

* Introduction to Source Generators
* Implementation of a Source Generator in the MVVM Community Toolkit
* Takeaways

### Introduction to Source Generators

This chapter covers the basics of Source Generators and compares it to Runtime Reflection.
Source Generators are a compiler feature which got released with .NET 5. Source Generators allow you to analyse compiled code and generate code based on it. You can also use files like CSV, JSON, XML, etc., as sources for code generation. Typically, Source Generators analyse the code for attributes or other conventions in the compiled code. The analysis happens via the Roslyn analysis APIs. The exciting part is that the generation occurs before the main code gets compiled. This means you can use the generated code inside the main code without any runtime overhead.

The following image illustrates the Soure Generator step.

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1696929088614/v1LId0lWu.png?auto=format"/>

\[1] Source Generator step

Typical usages for Source Generators are creating data classes from data files like CSV, JSON or XML and reducing boiler plate code, for instance, in XAML based solutions which use the interface INotifyPropertyChanged.
It is important to mention that currently, Source Generators can only be implemented as <b>.NET Standard 2.0 libraries</b>.

Before the introduction of Source Generators, generating code based on compiled code was already possible. This was done via Runtime Reflection.
ASP.NET uses this extensively in e.g. controller classes, etc. The difference between Source Generators and Reflection is the point of time when the generation of code happens and the performance impact. For example, ASP.NET uses Runtime Reflection, where the generation of code occurs during the start-up. This means you can only accept requests once all the Runtime Reflection code is finished. Compared to Source Generators, where the code generation happens during the compile time. This would reduce the start-up time of an ASP.NET application.

### Implementation of a Source Generator in the MVVM Community Toolkit

Let us now have a look at an example from the MVVM Community Toolkit.

The following code was taken from the last blog post mentioned in the first chapter of this blog post.
It shows an implementation of a view model with the MVVM Community Toolkit. If you are interested in the benefits of the MVVM Community Toolkit I highly recommend you to read the [first blog post](https://software-engineering-corner.hashnode.dev/reducing-boilerplate-code-with-the-mvvm-community-toolkit-in-net-maui).

```csharp
namespace CatFinder.ViewModel;

[INotifyPropertyChanged]
public partial class CatDetailsViewModel
{
    private readonly Cat _cat;

    public CatDetailsViewModel()
    {
        _cat = new Cat("Abyssinian", "https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg",
            "Active, Energetic, Independent, Intelligent, Gentle", "EG", 5);
    }

    public string Name => _cat.Name;

    public string ImageUrl => _cat.ImageUrl;

    public string Temperament => _cat.Temperament;

    public string CountryCodes => _cat.CountryCodes;

    public int Intelligence => _cat.Intelligence;

    [ObservableProperty] private string _nickname;

    [RelayCommand]
    private void ResetNickname() => Nickname = string.Empty;
}
```

The following attributes trigger the Source Generator step of the MVVM Community Toolkit:

* INotifyPropertyChanged
* ObservableProperty
* RelayCommand

Here are the corresponding Source Generator classes:

* INotifyPropertyChangedGenerator
* ObservablePropertyGenerator
* RelayCommandGenerator

These classes implement the logic for generating code that implements the INotifyPropertyChanged interface, creates observable properties from annotated fields, and creates relay commands from annotated methods.

Due to the fact that all Source Generators consist of the same two steps, namely the Initialize and Execute step, I am going to focus on the [ObservablePropertyGenerator](https://github.com/CommunityToolkit/dotnet/blob/main/src/CommunityToolkit.Mvvm.SourceGenerators/ComponentModel/ObservablePropertyGenerator.cs).

The code defines a class that implements the IIncrementalGenerator interface, which is a new feature in Roslyn 4.0 that enables writing incremental Source Generators. Incremental Source Generators are more efficient and scalable than regular Source Generators, as they only run when necessary and can cache intermediate results.

The code uses the Initialize method to register the logic for the Source Generator. It uses the context.SyntaxProvider to get all the syntax nodes that have the ObservablePropertyAttribute applied to them, and then uses a helper method to extract the semantic information about the annotated fields and their containing types. It also checks the language version and reports any diagnostics if there are errors.

The code then filters out any null results and groups them by their containing type. For each group, it generates the corresponding observable property and the partial methods for hooking into the property change logic. It uses another helper method to create the syntax nodes for these members. Finally, it inserts these members into a partial declaration of the same type and outputs the generated source code using context.AddSource.

This is what the ObservablePropertyGeneratorproduces based on the field \_nickname and its attribute.

```csharp
  partial class CatDetailsViewModel
    {
        /// <inheritdoc cref="_nickname"/>
        [global::System.CodeDom.Compiler.GeneratedCode("CommunityToolkit.Mvvm.SourceGenerators.ObservablePropertyGenerator", "8.2.0.0")]
        [global::System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage]
        public string Nickname
        {
            get => _nickname;
            [global::System.Diagnostics.CodeAnalysis.MemberNotNull("_nickname")]
            set
            {
                if (!global::System.Collections.Generic.EqualityComparer<string>.Default.Equals(_nickname, value))
                {
                    OnNicknameChanging(value);
                    OnNicknameChanging(default, value);
                    _nickname = value;
                    OnNicknameChanged(value);
                    OnNicknameChanged(default, value);
                    OnPropertyChanged(global::CommunityToolkit.Mvvm.ComponentModel.__Internals.__KnownINotifyPropertyChangedArgs.Nickname);
                }
            }
        }

        /// <summary>Executes the logic for when <see cref="Nickname"/> is changing.</summary>
        /// <param name="value">The new property value being set.</param>
        /// <remarks>This method is invoked right before the value of <see cref="Nickname"/> is changed.</remarks>
        [global::System.CodeDom.Compiler.GeneratedCode("CommunityToolkit.Mvvm.SourceGenerators.ObservablePropertyGenerator", "8.2.0.0")]
        partial void OnNicknameChanging(string value);
        /// <summary>Executes the logic for when <see cref="Nickname"/> is changing.</summary>
        /// <param name="oldValue">The previous property value that is being replaced.</param>
        /// <param name="newValue">The new property value being set.</param>
        /// <remarks>This method is invoked right before the value of <see cref="Nickname"/> is changed.</remarks>
        [global::System.CodeDom.Compiler.GeneratedCode("CommunityToolkit.Mvvm.SourceGenerators.ObservablePropertyGenerator", "8.2.0.0")]
        partial void OnNicknameChanging(string? oldValue, string newValue);
        /// <summary>Executes the logic for when <see cref="Nickname"/> just changed.</summary>
        /// <param name="value">The new property value that was set.</param>
        /// <remarks>This method is invoked right after the value of <see cref="Nickname"/> is changed.</remarks>
        [global::System.CodeDom.Compiler.GeneratedCode("CommunityToolkit.Mvvm.SourceGenerators.ObservablePropertyGenerator", "8.2.0.0")]
        partial void OnNicknameChanged(string value);
        /// <summary>Executes the logic for when <see cref="Nickname"/> just changed.</summary>
        /// <param name="oldValue">The previous property value that was replaced.</param>
        /// <param name="newValue">The new property value that was set.</param>
        /// <remarks>This method is invoked right after the value of <see cref="Nickname"/> is changed.</remarks>
        [global::System.CodeDom.Compiler.GeneratedCode("CommunityToolkit.Mvvm.SourceGenerators.ObservablePropertyGenerator", "8.2.0.0")]
        partial void OnNicknameChanged(string? oldValue, string newValue);
    }
```

The generated code above shows you how the ObservablePropertyGenerator creates a property Nickname with a get- and set-block from the field \_nickname. If you have experience with implementing MVVM patterns in XAML, you will immediately spot the boilerplate code. The partial methods are helpful additions which allow you to write custom logic to hook up into the notification process when a property is about to be updated and right after it is updated.

### Takeaways

In this blog post, you learned about the concept and benefits of Source Generators, a compiler feature that allows you to generate code based on the analysis of compiled code. You also saw an example of how the MVVM Community Toolkit uses Source Generators to reduce boilerplate code and improve performance in MVVM applications. You learned how the ObservablePropertyGenerator class implements the IIncrementalGenerator interface and uses the Roslyn analysis APIs to generate observable properties and partial methods from annotated fields. By using Source Generators, you can write less code, avoid Runtime Reflection, and enjoy a better developer experience.

\[1] https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/media/source-generators/source-generator-visualization.png#lightbox
