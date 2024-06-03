---
title: How to test a .NET MAUI App Part 1
domain: software-engineering-corner.zuehlke.com
tags: dotnet,mvvm,xaml,net-maui,csharp,xunit,testing,moq
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1717407950103/iIGzEXJ1M.jpg?auto=format
publishAs: NiZarper
hideFromHashnodeCommunity: false
saveAsDraft: true
enableToc: true
---

# How to test a .NET MAUI App Part 1

This blog post is the first part of a two-part series on testing a .NET MAUI application. This first post focuses on the service and view model layers, while the second will focus on the UI testing aspect.

## Setup

This chapter provides a practical guide to the setup process for testing a .NET MAUI project.

1. Add a new test project. In our case, we used XUnit.
2. Add a reference to the .NET MAUI project you want to test.
3. Add a UseMauiEssentials element to the project file of the test project. This will give you access to the .NET MAUI APIs inside our tests.
4. Install wanted NuGets. In our case, we added the FluentAssertions and Moq libraries.

Your project file should look similar to this:

```xml
 <Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
        <TargetFramework>net7.0</TargetFramework>
        <RootNamespace>CatFinder.Tests</RootNamespace>
        <IsPackable>false</IsPackable>
        <IsTestProject>true</IsTestProject>
        <UseMauiEssentials>true</UseMauiEssentials>
    </PropertyGroup>

    <ItemGroup>
        <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.7.1" />
        <PackageReference Include="Moq" Version="4.20.70" />
        <PackageReference Include="xunit" Version="2.4.2" />
        <PackageReference Include="xunit.runner.visualstudio" Version="2.4.5" />
        <PackageReference Include="FluentAssertions" Version="6.12.0" />
    </ItemGroup>

    <ItemGroup>
        <ProjectReference Include="..\CatFinder\CatFinder.csproj" />
    </ItemGroup>

</Project>
```

5. Add a GlobalUsing.cs. With this we can centralize the needed usings in one file.

``` C#

global using CatFinder.Services.CatServices;
global using CatFinder.Services.FileSystemServices;

global using CatFinder.ViewModels;
global using CatFinder.Models;

global using FluentAssertions;
global using Xunit;
global using Moq;

global using static CatFinder.Tests.MockHelper;
```

## Testing of a service

Let us now look at how we can test a service that uses the .NET MAUI [filesystem](https://learn.microsoft.com/en-us/dotnet/maui/platform-integration/storage/file-system-helpers?view=net-maui-8.0&tabs=android), the abstraction to files that MAUI provides to access files in the app package

Consider the following class:

``` C#
namespace CatFinder.Services.FileSystemServices;

public sealed class FileSystemCsvService : ICsvService
{

    private const string CountriesCsvFileName = "countries.csv";
    private readonly IFileSystem _fileSystem;

    public FileSystemCsvService(IFileSystem fileSystem)
    {
        _fileSystem = fileSystem;
    }

    public async Task<IList<Country>> GetCountriesAsync()
    {
        try
        {
            const char csvSplitChar = ',';
            const int expectedCsvRowsCount = 4;
            using var stream = await _fileSystem.OpenAppPackageFileAsync(CountriesCsvFileName);
            using var reader = new StreamReader(stream);
            var line = reader.ReadLine();
            var results = new List<Country>();
            while (!reader.EndOfStream)
            {
                line = reader.ReadLine();
                var values = line.Split(csvSplitChar);
                if(values.Length != 4) throw new ArgumentException($"{CountriesCsvFileName} needs to have {expectedCsvRowsCount} rows.");
                results.Add(new Country(values[0], double.Parse(values[1]), double.Parse(values[2]), values[3]));
            }
            return results;
        }
        catch (Exception ex)
        {
            throw new FileSystemCsvServiceException(ex.Message, ex);

        }

    }
}
```

The class above shows a class with one method. This method reads a CSV file which contains 244 countries and maps them to Country objects. The CSV file entries look like this:

```
country,latitude,longitude,name
AD,42.546245,1.601554,Andorra
AE,23.424076,53.847818,United Arab Emirates
AF,33.93911,67.709953,Afghanistan
...
```

Now, let us test whether the method loads the correct number of countries and throws the correct exception.

``` C#
namespace CatFinder.Tests.Services;

public sealed class FileSystemCsvServiceTests
{

    [Fact]
    public async void GetCountriesAsync()
    {
        var fileSystemMock = GetFileSystemMock();
        var fileSystemCsvService = new FileSystemCsvService(fileSystemMock.Object);

        var countries = await fileSystemCsvService.GetCountriesAsync();

        const int expectedCountriesCount = 244;
        countries.Should().NotBeNull();
        countries.Should().HaveCount(expectedCountriesCount);
        fileSystemMock.Verify(fileSystem => fileSystem.OpenAppPackageFileAsync(It.IsAny<string>()), Times.Once());
    }
}
```

The first test above checks whether the method loads the correct number of countries. For this, a filesystem mock is needed. You can not access a file via the filesystem of .NET MAUI this will lead to an exception. The reason is that, unlike UI tests, the test is run as a unit test without using the platform. To circumvent this, we created a mock object and extracted it to a static class called MockHelper.

``` C#
namespace CatFinder.Tests
{
    public static class MockHelper
    {

        public static Mock<IFileSystem> GetFileSystemMock()
        {
            const string countriesCsvResoureFileName = "CatFinder.Tests.countries.csv";
            const string countriesCsvFileName = "countries.csv";
            var testStream = typeof(MockHelper).Assembly.GetManifestResourceStream(countriesCsvResoureFileName);
            var fileSystemMock = new Mock<IFileSystem>();
            fileSystemMock.Setup(fileSystem => fileSystem.OpenAppPackageFileAsync(countriesCsvFileName))
                .Returns(Task.FromResult(testStream));
            return fileSystemMock;
        }

    }
}
```

The method above shows how to mock the IFileSystem interface of .NET MAUI. It utilizes the Moq library and provides an in-memory stream via the assembly method GetManifestResourceStream.

Now, let us test whether the method throws the correct exception. We introduced another mock for this.

``` C#
   public static Mock<IFileSystem> GetWronglyConfiguredFileSystemMock()
        {
            const string countriesCsvResoureFileName = "CatFinder.Tests.countries.csv";
            const string wronglyNamedCountriesCsvFileName = "countries2.csv";
            var testStream = typeof(MockHelper).Assembly.GetManifestResourceStream(countriesCsvResoureFileName);
            var fileSystemMock = new Mock<IFileSystem>();
            fileSystemMock.Setup(fileSystem => fileSystem.OpenAppPackageFileAsync(wronglyNamedCountriesCsvFileName))
                .Returns(Task.FromResult(testStream));
            return fileSystemMock;
        }
```

The mock above gets configured with a wrong file name, which causes an exception when trying to access the file.

Following the corresponding test method, which utilizes the wrongly configured mock:

``` C#
    [Fact]
    public async void GetCountries_Throws_FileSystemCsvServiceExceptionAsync()
    {
        var wronglyConfiguredFileSystemMock = GetWronglyConfiguredFileSystemMock();
        var fileSystemCsvService = new FileSystemCsvService(wronglyConfiguredFileSystemMock.Object);

        var getCountries = () => fileSystemCsvService.GetCountriesAsync();

        await getCountries.Should().ThrowAsync<FileSystemCsvServiceException>();
        wronglyConfiguredFileSystemMock.Verify(fileSystem => fileSystem.OpenAppPackageFileAsync(It.IsAny<string>()), Times.Once());

    }
```

At the end of this chapter, we emphasize the need for the IFileSystem mocks and the addition of the UseMauiEssentials element in the project file of the test. The mock is necessary to test any logic that performs IO operations. The IFileSystem abstracts the different application platforms. In a test environment, one must provide a custom implementation of this logic without a mock. The UseMauiEssentials element gives you access to the API of .NET MAUI.

Now, let us pivot our attention to the view model tests.

## Testing of a view model

In this chapter, we delve into testing a view model, focusing on two methods.
One method adds some cats to an observable list. The view renders the objects contained in this list.
The other method navigates from the cat list view to the details view of a cat.

Here is the first method:

``` C#
    [RelayCommand]
    public async Task GetCatsAsync()
    {
        if (IsBusy) return;
        try
        {
            await CheckNetworkConnectivity();
            IsBusy = true;
            var cats = await _catService.GetTenCatsAsync();
            foreach (var cat in cats)
            {
                Cats.Add(cat);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex);
            await Shell.Current.DisplayAlert("Error", "Unable to get cats", "Ok");
        }
        finally
        {
            IsBusy = false;
        }
    }
```

Sidenote: the method GetTenCatsAsync uses the method FileSystemCsvService under the hood.

The following test verifies whether the method adds exactly ten cats to the list and whether the method CheckNetworkConnectivity calls the connectivity mock exactly once.

``` C#

    [Fact]
    public async void GetCatsAsync()
    {
        var connectivtyMock = GetConnectivtyMock();
        var geolocationMock = GetGeolocationMock();
        var catServiceMock = GetCatServiceMock();
        var catsViewModel = new CatsViewModel(catServiceMock.Object, connectivtyMock.Object, geolocationMock.Object);

        await catsViewModel.GetCatsAsync();

        const int expectedCatsCount = 10;
        catsViewModel.Cats.Should().HaveCount(expectedCatsCount);
        catServiceMock.Verify(catService => catService.GetTenCatsAsync(), Times.Once());
        connectivtyMock.Verify(connectivity => connectivity.NetworkAccess, Times.Once());

    }
```

The following test verifies whether the method adds exactly ten cats to the list and whether the method invokes CatServiceMock and ConnectivityMock once.

Here is the second method of the view model:

``` C#
    [RelayCommand]
    public async Task GoToCatDetailsAsync(Cat cat)
    {
        if (cat is null) return;

        await Shell.Current.GoToAsync($"{nameof(DetailsPage)}", true, new Dictionary<string, object>
        {
            {$"{nameof(cat)}", cat}
        });
    }
```

The method uses the Shell to navigate to the details page. It passes down a cat object via a dictionary, which the details page can access.

Let us now test if the method navigates correctly to the DetailsPage.

``` C#
    [Fact]
    public async void GoToCatDetailsAsync()
    {
        var connectivtyMock = GetConnectivtyMock();
        var geolocationMock = GetGeolocationMock();
        var catServiceMock = GetCatServiceMock();
        var catsViewModel = new CatsViewModel(catServiceMock.Object, connectivtyMock.Object, geolocationMock.Object);
        var cat = new Cat(string.Empty, string.Empty, string.Empty, string.Empty, 0, 0, 0);
        var appMock = new Mock<App>();
        Application.Current = appMock.Object;

        await catsViewModel.GoToCatDetailsAsync(cat);

        Shell.Current.CurrentPage.Should().BeOfType(typeof(DetailsPage));
    }
 ```

The test above has one crucial aspect to pay attention to if you want to use the Shell inside the tests, namely the app mock.
The test setup does not configure the complete MAUI app. Therefore, platform-dependent features like the Shell are only usable when you set them up yourself. Without mocking the app, you can not utilize the Shell navigation. If you try, you will run into an exception.

## Takeaways

In this blog post, we showed you how you can test a service and a view model in .NET MAUI. We want to emphasize three essential parts to test your services and view models successfully:

1. Adding UseMauiEssentials in your test's project file. This will give you access to the API of .NET MAUI.
2. The test environment can not access .NET MAUI's IFileSystem due to its platform-specific implementation. A possible solution is to use a mock to circumvent this.
3. The test environment does not configure the whole .NET MAUI app. Here, you can approach the circumstance as you mentioned in point 2 with a mock.

In the second part of this two-part series, we will cover how to test the UI of a .NET MAUI app.