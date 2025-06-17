---
title: Reducing boilerplate code with the MVVM Community Toolkit in .NET MAUI
description: >-
  The Model-View-ViewModel (MVVM) pattern separates an application's business
  and presentation logic from its user interface, improving maintainability and
  testability by decoupling UI controls from underlying logic. Implementing MVVM
  can involve boilerplate code, which the MVVM Community Toolkit addresses
  through source generators, reducing the amount of code developers need to
  write in XAML-based solutions. By using attributes like
  `INotifyPropertyChanged`, `ObservableProperty`, and `RelayCommand`, developers
  can significantly reduce code volume
released: '2023-09-04T09:13:05.544Z'
cover: images/cover.png
author: Nijaz Zaljevic
tags:
  - C#
  - dotnet
  - '#maui'
  - MVVM
  - xaml
---
# Reducing boilerplate code with the MVVM Community Toolkit in .NET MAUI

This blog post covers the basic MVVM principles and gives an introduction to the MVVM Community Toolkit with an example implemented in .NET MAUI.

## Table Of Contents

* Introduction to MVVM
* Basic MVVM Implementation in .NET MAUI
* Introduction to the MVVM Community Toolkit
* Takeaways

### Introduction to MVVM

This chapter covers the basics of MVVM and gives an overview of which issues MVVM solves.

MVVM is a design pattern that gets used to separate the business logic and presentation logic of an application from the user interface. The components involved in MVVM are the Model, View, and ViewModel hence the abbreviation MVVM.

Here is an image showing an overview of MVVM:

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1689944789630/U5s61XI6s.png?auto=format" width="750"/>

The above image illustrates how data flows in MVVM. The view raises events these events get handled in the view model which then knows how to interact with the model e.g. call business logic or interact with data objects. After the interaction with the model ended, the view model updates the bound properties. Bound properties are data objects that the UI elements e.g. a button, a label, etc. on the view bind to. Finally, this update will then lead to a re-render of the UI elements, which then display the new data.

In the following chapter, you can find a detailed explanation of the involved components with a code example implemented in .NET MAUI.

The issue that MVVM solves is the **tight coupling** between the UI controls and the business logic. This tight coupling prevents developers from modifying or extending the UI effortlessly.
In addition, the tight coupling leads to **increased unit testing complexity**.

With MVVM, this tight coupling can be overcome.

### Basic MVVM implementation in .NET MAUI

Let us now have a look at an example implemented in .NET MAUI.

This example was taken from a private project of mine. The project is called "Cat Finder". The example shows a details page of a cat. This page displays basic information about a cat. For the sake of simplicity, this example shows only one changeable property namely Nickname.

Here is a screenshot of it:

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1689865575390/6z7-TJFE3.png?auto=format" height="750"/>

The components involved in this example are:

1. CatDetailsPage.xaml

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="CatFinder.View.CatDetailsPage"
             xmlns:viewModel="clr-namespace:CatFinder.ViewModel"
             x:DataType="viewModel:CatDetailsViewModel">

    <ScrollView>
        <VerticalStackLayout>
            <Grid ColumnDefinitions="*,Auto,*"
                  RowDefinitions="160,Auto">
                <BoxView BackgroundColor="{StaticResource Primary}"
                         Grid.ColumnSpan="3"
                         HeightRequest="160"
                         HorizontalOptions="FillAndExpand"/>
                <Frame Grid.RowSpan="2"
                   Grid.Column="1"
                   HeightRequest="200"
                   WidthRequest="200"
                   CornerRadius="50"
                   HorizontalOptions="Center"
                   IsClippedToBounds="True"
                   Padding="0"
                   Margin="0,80,0,0">
                    <Image Aspect="AspectFill"
                           HeightRequest="200"
                           WidthRequest="200"
                           HorizontalOptions="Center"
                           Source="{Binding ImageUrl}"/>
                </Frame>
            </Grid>
            <VerticalStackLayout Padding="10" Spacing="10">
                <Label Text="{Binding Name, StringFormat='Breed: {0}'}"/>
                <Label Text="{Binding Temperament, StringFormat='Temperament code: {0}'}"/>
                <Label Text="{Binding CountryCodes, StringFormat='Country code: {0}'}"/>
                <Label Text="{Binding Intelligence, StringFormat='Intelligence score: {0}'}"/>
                <Label Text="{Binding Nickname, StringFormat='Nickname: {0}'}"/>
                <Entry Placeholder="Enter a nickname" Text="{Binding Nickname}"/>
                <Button Text="Reset nickname" Command="{Binding ResetNicknameCommand}"/>
            </VerticalStackLayout>
        </VerticalStackLayout>
    </ScrollView>
</ContentPage>
```

Describes how the page should look. Covers the V in MVVM. It uses XAML's data binding feature to connect the UI elements to a source object e.g. a property that provides data or a reference to a method that provides behavior.

1. CatDetailsPage.xaml.cs

```csharp
namespace CatFinder.View;

public partial class CatDetailsPage
{

 public CatDetailsPage(CatDetailsViewModel catDetailsViewModel)
    {
        InitializeComponent();
        BindingContext= catDetailsViewModel;
    }

}
```

This is the code behind file. It can be used to set the binding context of the view e.g. a view model.

1. CatDetailsPageViewModel.cs

```csharp
using System.Windows.Input;

namespace CatFinder.ViewModel;

public class CatDetailsViewModel : INotifyPropertyChanged
{
    private readonly Cat _cat;

    public CatDetailsViewModel()
    {
        _cat = new Cat("Abyssinian", "https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg",
            "Active, Energetic, Independent, Intelligent, Gentle", "EG", 5);
        ResetNicknameCommand = new Command(ResetNickname);
    }

    public ICommand ResetNicknameCommand { get; }

    public string Name => _cat.Name;

    public string ImageUrl => _cat.ImageUrl;

    public string Temperament => _cat.Temperament;

    public string CountryCodes => _cat.CountryCodes;

    public int Intelligence => _cat.Intelligence;

    public string Nickname
    {
        get => _cat.Nickname;
        set
        {
            if (_cat.Nickname == value) return;
            _cat.Nickname = value;
            OnPropertyChanged();
        }
    }

    public event PropertyChangedEventHandler PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    private void ResetNickname() => Nickname = string.Empty;
}
```

Describes how the data between the view and the model flows. Covers the MV characters in MVVM. In this file, I would like to emphasize some code pieces namely INotifyPropertyChanged, ResetNicknameCommand, the set block of the Nickname property, PropertyChanged and OnPropertyChanged.

#### INotifyPropertyChanged

This interface is needed to tell .NET MAUI that the implementing class has properties that can change and can trigger the rerendering of the view.

#### ResetNicknameCommand

This property encapsulates a behavior that can be triggered from interactable UI elements. In this case, it invokes the method ResetNickname.

#### Set block of Nickname property

Checks if the new value is different than the stored value. This check prevents unnecessary re-renders. Afterward sets the new value and invokes OnPropertyChanged.

#### PropertyChanged

Is an event that notifies .NET MAUI that the calling property has changed and that all bound UI elements need to be re-rendered.

#### OnPropertyChanged

The method that invokes the event PropertyChanged. Gets the name of the changed property via the attribute CallerMemberName.

1. Cat.cs

   Describes the data to display.

```csharp
namespace CatFinder.Model;

public record Cat(string Name, string ImageUrl, string Temperament, string CountryCodes, int Intelligence)
{
    public string Nickname { get; set; }
}
```

Covers the M character in MVVM. In this example, I used the record keyword to define the type. The record type is a feature that was released with C#9. A record brings a lot of benefits with it, like an override of Object.Equals(Object), methods for operator == and operator !=,  primary constructors, etc. These features make a record the perfect candidate for plain data objects.

### Introduction to the MVVM Community Toolkit

This chapter gives an overview of the MVVM Community Toolkit and shows how the cat details page from the previous chapter can be implemented with the MVVM Community Toolkit.

The [MVVM Community Toolkit](https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm) is a well-maintained and mature library developed by Microsoft and the .NET foundation.

The MVVM Community Toolkit can be installed via the NuGet installer in Visual Studio. It allows us developers to reduce the amount of code we need to write to implement MVVM in XAML-based solutions. The concept used to reduce the boilerplate code by the MVVM Community Toolkit is source generators. In short, using elements of the MVVM Community Toolkit in our code leads to generated code that is outsourced in different files. These generated files implement exactly the verbose behavior that we would need to write without the MVVM Community Toolkit. The topic source generators is too big to cover in this blog post. I will cover the topic in a future blog post so that I am able to explain it in all the details.

Now, let us have a look at the previous example and get rid of the boilerplate code. Here is the same example from before but now implemented with the MVVM Community Toolkit:

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

You can see that we could remove the code elements that I explained in detail in the last chapter namely INotifyPropertyChanged, ResetNicknameCommand, the set block of the Nickname property, PropertyChanged and OnPropertyChanged.

To keep the same behavior you only need to declare the class as partial and use the attributes INotifyPropertyChanged, ObservableProperty and RelayCommand. The declaration as a partial class allows the MVVM Community Toolkit to generate the code we removed.

With the help of the MVVM Community Toolkit, I was able to reduce the lines of code contained in this file from 47 to 28. That means roughly 40% less code to scroll through.

### Takeaways

MVVM is a simple design pattern that makes UI code more readable and maintainable. It decouples the view from the view model and model. Thus it is easier to unit test and extend. In addition, the MVVM Community Toolkit solves the problem with the boilerplate implementation that MVVM in XAML-based solutions introduces. The approach used by the MVVM Community Toolkit is very lightweight, intuitive and mature. These factors make the library a safe pick for me for every XAML-based project.
