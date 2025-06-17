---
title: ASP.NET Core Integration Testing
description: >-
  Integration testing for an ASP.NET Core web API with EF Core can be achieved
  by mocking the database context to use an SQLite in-memory database. This
  approach allows for repeatable tests without leaving traces of previous
  executions. The process involves creating a web application factory and a
  design-time database context factory to replace the SQL Server database with
  an in-memory SQLite database at runtime and design time, respectively,
  enabling comprehensive testing of API endpoints.
released: '2023-06-26T09:14:35.577Z'
cover: images/cover.jpeg
author: Fabio Scagliola
tags:
  - asp.net core
  - integration
  - Software Testing
  - SQL Server
  - SQLite
  - Testing
  - Web API
---
# ASP.NET Core Integration Testing

This article describes how to implement integration testing of an ASP.NET Core web API that uses EF Core and Migrations with Microsoft SQL Server, mocking the database context in order to use an SQLite in-memory database.

## Introduction

The goal of integration testing is to assess that the components of an application work well together in order to produce the expected behavior.

While unit tests focus on individual units of work, typically methods, and *fake* the components they depend on, such as a database or a file system, integration tests broaden their scope to the whole "system under stress", including the component it depends on.

However, while performing integration testing of a system that depends on a database, replacing it with a volatile/in-memory one is quite handy, first and foremost because it makes integration tests easy to repeat without leaving any trace of their previous executions.

This is neither cheating nor *faking*, this is *mocking*: we can still make any kind of assertion against the mocked database, either directly or indirectly.

The solution presented in this article consists of two projects: **WebApi** and **WebApiTest**.

* **WebApi** is an ASP.NET Core web API that uses EF Core and Migrations with Microsoft SQL Server.
* **WebApiTest** is an NUnit test project responsible for the integration testing of the web API and for mocking the database context in order to use an SQLite in-memory database.

The complete source code of the solution is available [here](https://github.com/fabioscagliola/Integration-Testing).

# Web API

Let us start developing the “system under stress” by creating an ASP.NET Core web API that uses EF Core and Migrations with Microsoft SQL Server.

Add references to the following NuGet packages:

* FluentValidation
* Microsoft.AspNetCore.OpenApi
* Microsoft.EntityFrameworkCore.SqlServer
* Microsoft.EntityFrameworkCore.Tools
* Swashbuckle.AspNetCore
* Swashbuckle.AspNetCore.Annotations

Create a database context called **WebApiDbContext** containing one simple entity named **Person** including three attributes, fields, properties, or whatever you prefer calling them: identifier, first name, and last name.

Here is the code of the database context.

```csharp
using Microsoft.EntityFrameworkCore;

namespace com.fabioscagliola.IntegrationTesting.WebApi;

public class WebApiDbContext : DbContext
{
    public WebApiDbContext(DbContextOptions options) : base(options) { }

    public DbSet<Person> People { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Person>().ToTable(nameof(Person));
    }
}
```

And here is the code of the entity.

```csharp
#nullable disable

namespace com.fabioscagliola.IntegrationTesting.WebApi;

public class Person
{
    public int Id { get; set; }

    public string FName { get; set; }

    public string LName { get; set; }
}
```

Add the database context to the web application builder services in the `Program.cs` file.

```csharp
webApplicationBuilder.Services.AddDbContext<WebApiDbContext>(optionsAction =>
{
    optionsAction.UseSqlServer(webApplicationBuilder.Configuration.GetConnectionString("ConnectionString"));
});
```

Add the database connection string to the `appsettings.json` file.

```json
"ConnectionStrings": {
  "ConnectionString": "Server=databaseserver;User ID=WebApi;Password=XXXX;Initial Catalog=WebApi;TrustServerCertificate=True;"
},
```

Create a user on Microsoft SQL Server named "WebApi" using the "XXXX" password and assign the **dbcreator** server-level role to the user.

Now, let us use Migrations to create the database in Microsoft SQL Server by issuing the following commands using the Package Manager Console:

```powershell
Install-Package Microsoft.EntityFrameworkCore.Tools
Add-Migration Migration001
Update-Database
```

Or the following ones using the PowerShell from the **WebApi** project folder:

```powershell
dotnet tool install -g dotnet-ef
dotnet-ef migrations add Migration001
dotnet-ef database update
```

If you look at the source code of the solution, you will notice that I removed the timestamp from the beginning of the name of the migration file. Migrations are executed in alphabetical order anyway, and I prefer using a suffix rather than a prefix.

Finally, write a controller allowing to create, read, update, and delete people records – I will go into its implementation details while discussing its testing counterpart.

## Web API integration tests

Let us continue by creating an NUnit test project.

Add references to the following NuGet packages:

* FluentAssertions
* Microsoft.AspNetCore.Mvc.Testing
* Microsoft.EntityFrameworkCore.Design
* Microsoft.EntityFrameworkCore.Sqlite
* Microsoft.NET.Test.Sdk
* NUnit
* NUnit.Analyzers
* NUnit3TestAdapter
* coverlet.collector

And add a reference to the web API project, of course.

Create a web application factory that replaces the Microsoft SQL Server database with an SQLite in-memory database *at run-time*.

```csharp
using com.fabioscagliola.IntegrationTesting.WebApi;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Data.Common;

namespace com.fabioscagliola.IntegrationTesting.WebApiTest;

public class WebApiTestWebApplicationFactory<T> : WebApplicationFactory<T> where T : class
{
    protected override void ConfigureWebHost(IWebHostBuilder webHostBuilder)
    {
        webHostBuilder.ConfigureServices(configureServices =>
        {
            configureServices.Remove(configureServices.Single(d => d.ServiceType == typeof(DbContextOptions<WebApiDbContext>)));

            configureServices.AddSingleton((Func<IServiceProvider, DbConnection>)(implementationFactory =>
            {
                SqliteConnection sqliteConnection = new(Settings.Instance.SqliteConnectionString);
                sqliteConnection.Open();
                return sqliteConnection;
            }));

            configureServices.AddDbContext<WebApiDbContext>((serviceProvider, dbContextOptionBuilder) =>
            {
                DbConnection dbConnection = serviceProvider.GetRequiredService<DbConnection>();
                dbContextOptionBuilder.UseSqlite(dbConnection);
            });

            ServiceProvider serviceProvider = configureServices.BuildServiceProvider();
            IServiceScope serviceScope = serviceProvider.CreateScope();
            WebApiDbContext webApiDbContext = serviceScope.ServiceProvider.GetRequiredService<WebApiDbContext>();
            webApiDbContext.Database.EnsureCreated();
        });
    }
}
```

And create a design-time database context factory doing the same *at design-time*.

```csharp
using com.fabioscagliola.IntegrationTesting.WebApi;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace com.fabioscagliola.IntegrationTesting.WebApiTest;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<WebApiDbContext>
{
    public WebApiDbContext CreateDbContext(string[] args)
    {
        DbContextOptionsBuilder dbContextOptionsBuilder = new DbContextOptionsBuilder<WebApiDbContext>();
        dbContextOptionsBuilder.UseSqlite(Settings.Instance.SqliteConnectionString, sqliteOptionsAction => sqliteOptionsAction.MigrationsAssembly("WebApiTest"));
        return new(dbContextOptionsBuilder.Options);
    }
}
```

Both factories rely on a utility class that is responsible for retrieving some custom settings.

Here is the code of the utility class.

```csharp
using Microsoft.Extensions.Configuration;

#nullable disable

namespace com.fabioscagliola.IntegrationTesting.WebApiTest;

class Settings
{
    static Settings instance;

    public static Settings Instance
    {
        get
        {
            if (instance == null)
            {
                IConfiguration configuration = new ConfigurationBuilder().AddJsonFile("appsettings.json").AddEnvironmentVariables().Build();
                instance = configuration.GetSection(nameof(Settings)).Get<Settings>();
                if (instance == null)
                    throw new ApplicationException("Something went wrong while initializing the settings.");
            }

            return instance;
        }
    }

    public string WebApiUrl { get; set; }

    public string SqliteConnectionString { get; set; }
}
```

And here is the code of the custom settings.

```json
{
  "Settings": {
    "WebApiUrl": "https://localhost:65535",
    "SqliteConnectionString": "DataSource=file::memory:?cache=shared"
  }
}
```

Pay attention to the database connection string – more information can be found [here](https://sqlite.org/inmemorydb.html).

Now, you may use Migrations to create the SQLite in-memory database, by issuing the same commands you used to create the database in Microsoft SQL Server, using the Package Manager Console, or the PowerShell from the **WebApiTest** project folder. This would allow you to put the design-time database context factory to the test.

Be aware that an SQLite in-memory database is volatile: it ceases to exist as soon as the last connection to it is closed.

It is time to move on to the main event: the integration tests.

Create a base class for all the integration tests, which is responsible for initializing and disposing of the web application factory.

```csharp
using com.fabioscagliola.IntegrationTesting.WebApi;
using NUnit.Framework;

namespace com.fabioscagliola.IntegrationTesting.WebApiTest;

public abstract class BaseTest
{
    protected WebApiTestWebApplicationFactory<Program> WebApiTestWebApplicationFactory;

    [SetUp]
    public void Setup()
    {
        WebApiTestWebApplicationFactory = new();
    }

    [TearDown]
    public void TearDown()
    {
        WebApiTestWebApplicationFactory.Dispose();
    }
}
```

Implement integration tests to ensure that the web API allows to properly create, read, update, and delete people records.

### Create

First, consider the following web API method, responsible for creating a new person record.

```csharp
[HttpPost]
[Route("[action]")]
[SwaggerResponse(StatusCodes.Status200OK, Type = typeof(Person))]
[SwaggerResponse(StatusCodes.Status400BadRequest)]
public async Task<IActionResult> Create(PersonCreateData personCreateData)
{
    Person person = new() { FName = personCreateData.FName, LName = personCreateData.LName, };
    PersonValidation personValidation = new();
    ValidationResult validationResult = personValidation.Validate(person);
    if (!validationResult.IsValid)
        return BadRequest(validationResult.ToString());
    dbContext.People.Add(person);
    await dbContext.SaveChangesAsync();
    return Ok(person);
}
```

The following test ensures that the web API method returns a bad request error if the first name or the last name are null or empty.

Please note that the tests are named in compliance with the [Given-When-Then](https://en.wikipedia.org/wiki/Given-When-Then) convention.

```csharp
[Test]
[TestCase(" ", " ")]
[TestCase(" ", "")]
[TestCase(" ", null)]
[TestCase("", " ")]
[TestCase("", "")]
[TestCase("", null)]
[TestCase(null, " ")]
[TestCase(null, "")]
[TestCase(null, null)]
public async Task GivenFNameOrLNameAreNullOrEmpty_WhenCreatingPerson_ThenReturnsBadRequest(string fName, string lName)
{
    HttpClient httpClient = WebApiTestWebApplicationFactory.CreateClient();
    PersonCreateData personCreateData = new() { FName = fName, LName = lName };
    HttpResponseMessage httpResponseMessage = await httpClient.PostAsync($"{Settings.Instance.WebApiUrl}/Person/Create", JsonContent.Create(personCreateData));
    httpResponseMessage.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    string fNameOrLNameAreNullOrEmpty = await httpResponseMessage.Content.ReadAsStringAsync();
    fNameOrLNameAreNullOrEmpty.Should().NotBeNull();
    fNameOrLNameAreNullOrEmpty.Should().Be($"{WebApi.Properties.Resources.PersonValidationFNameIsEmpty}\r
{WebApi.Properties.Resources.PersonValidationLNameIsEmpty}");
}
```

The following test ensures that the web API method succeeds.

```csharp
[Test]
public async Task GivenFNameAndLNameAreNotNullOrEmpty_WhenCreatingPerson_ThenSucceeds()
{
    Person person = await CreatePerson(FNAME, LNAME);
    person.Should().NotBeNull();
    person.Id.Should().NotBe(0);
    person.FName.Should().Be(FNAME);
    person.LName.Should().Be(LNAME);
}
```

I extracted the **CreatePerson** method because it is used in multiple tests.

```csharp
async Task<Person> CreatePerson(string fName, string lName)
{
    HttpClient httpClient = WebApiTestWebApplicationFactory.CreateClient();
    PersonCreateData personCreateData = new() { FName = fName, LName = lName };
    HttpResponseMessage httpResponseMessage = await httpClient.PostAsync($"{Settings.Instance.WebApiUrl}/Person/Create", JsonContent.Create(personCreateData));
    httpResponseMessage.EnsureSuccessStatusCode();
    return await httpResponseMessage.Content.ReadFromJsonAsync(typeof(Person)) as Person;
}
```

### Read

Second, consider the following web API method, responsible for retrieving an existing person record based on its identifier.

```csharp
[HttpGet]
[Route("[action]/{id}")]
[SwaggerResponse(StatusCodes.Status200OK, Type = typeof(Person))]
[SwaggerResponse(StatusCodes.Status400BadRequest)]
public async Task<IActionResult> Read(int id)
{
    Person? person = await dbContext.People.SingleOrDefaultAsync(x => x.Id == id);
    if (person == null)
        return BadRequest(Properties.Resources.PersonNotFound);
    return Ok(person);
}
```

The following test ensures that the web API method returns a bad request error if a person with the specified identifier does not exist.

```csharp
[Test]
public async Task GivenNonExistingId_WhenReadingPerson_ThenReturnsBadRequest()
{
    HttpClient httpClient = WebApiTestWebApplicationFactory.CreateClient();
    HttpResponseMessage httpResponseMessage = await httpClient.GetAsync($"{Settings.Instance.WebApiUrl}/Person/Read/0");
    httpResponseMessage.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    string notfound = await httpResponseMessage.Content.ReadAsStringAsync();
    notfound.Should().NotBeNull();
    notfound.Should().Be(WebApi.Properties.Resources.PersonNotFound);
}
```

And the following test ensures that the web API method succeeds.

```csharp
[Test]
public async Task GivenExistingId_WhenReadingPerson_ThenSucceeds()
{
    Person expected = await CreatePerson(FNAME, LNAME);
    expected.Should().NotBeNull();

    HttpClient httpClient = WebApiTestWebApplicationFactory.CreateClient();
    HttpResponseMessage httpResponseMessage = await httpClient.GetAsync($"{Settings.Instance.WebApiUrl}/Person/Read/{expected.Id}");
    httpResponseMessage.EnsureSuccessStatusCode();
    Person actual = await httpResponseMessage.Content.ReadFromJsonAsync(typeof(Person)) as Person;
    MakeAssertions(expected, actual);
}
```

Once again, I extracted the **MakeAssertions** method because it is used in multiple tests.

```csharp
static void MakeAssertions(Person expected, Person actual)
{
    expected.Should().NotBeNull();
    actual.Should().NotBeNull();
    actual.Id.Should().Be(expected.Id);
    actual.FName.Should().Be(expected.FName);
    actual.LName.Should().Be(expected.LName);
}
```

### Read list

Third, consider the following web API method, responsible for retrieving the list of all the existing person records.

```csharp
[HttpGet]
[Route("[action]")]
[SwaggerResponse(StatusCodes.Status200OK, Type = typeof(List<Person>))]
public async Task<IActionResult> ReadList()
{
    List<Person> people = await dbContext.People.ToListAsync();
    return Ok(people);
}
```

The following test ensures that the web API method succeeds.

```csharp
[Test]
public async Task WhenReadingPersonList_ThenSucceeds()
{
    Person expected = await CreatePerson(FNAME, LNAME);
    expected.Should().NotBeNull();

    HttpClient httpClient = WebApiTestWebApplicationFactory.CreateClient();
    HttpResponseMessage httpResponseMessage = await httpClient.GetAsync($"{Settings.Instance.WebApiUrl}/Person/ReadList");
    httpResponseMessage.EnsureSuccessStatusCode();
    List<Person> people = await httpResponseMessage.Content.ReadFromJsonAsync(typeof(List<Person>)) as List<Person>;
    people.Should().NotBeNull();
    people.Should().NotBeEmpty();
    Person actual = people.SingleOrDefault(x => x.Id == expected.Id);
    MakeAssertions(expected, actual);
}
```

### Update

Fourth, consider the following web API method, responsible for updating an existing person record.

```csharp
[HttpPost]
[Route("[action]")]
[SwaggerResponse(StatusCodes.Status200OK, Type = typeof(Person))]
[SwaggerResponse(StatusCodes.Status400BadRequest)]
public async Task<IActionResult> Update(Person person)
{
    Person? existing = await dbContext.People.SingleOrDefaultAsync(x => x.Id == person.Id);
    if (existing == null)
        return BadRequest(Properties.Resources.PersonNotFound);
    PersonValidation personValidation = new();
    ValidationResult validationResult = personValidation.Validate(person);
    if (!validationResult.IsValid)
        return BadRequest(validationResult.ToString());
    existing.FName = person.FName;
    existing.LName = person.LName;
    await dbContext.SaveChangesAsync();
    return Ok(existing);
}
```

The following test ensures that the web API method returns a bad request error if a person with the specified identifier does not exist.

```csharp
[Test]
public async Task GivenNonExistingPerson_WhenUpdatingPerson_ThenReturnsBadRequest()
{
    HttpClient httpClient = WebApiTestWebApplicationFactory.CreateClient();
    Person expected = new();
    HttpResponseMessage httpResponseMessage = await httpClient.PostAsync($"{Settings.Instance.WebApiUrl}/Person/Update", JsonContent.Create(expected));
    httpResponseMessage.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    string notfound = await httpResponseMessage.Content.ReadAsStringAsync();
    notfound.Should().NotBeNull();
    notfound.Should().Be(WebApi.Properties.Resources.PersonNotFound);
}
```

The following test ensures that the web API method returns a bad request error if the first name or the last name are null or empty.

```csharp
[Test]
[TestCase(" ", " ")]
[TestCase(" ", "")]
[TestCase(" ", null)]
[TestCase("", " ")]
[TestCase("", "")]
[TestCase("", null)]
[TestCase(null, " ")]
[TestCase(null, "")]
[TestCase(null, null)]
public async Task GivenFNameOrLNameAreNullOrEmpty_WhenUpdatingPerson_ThenReturnsBadRequest(string fName, string lName)
{
    Person temp = await CreatePerson(FNAME, LNAME);
    temp.Should().NotBeNull();

    HttpClient httpClient = WebApiTestWebApplicationFactory.CreateClient();
    Person expected = new() { Id = temp.Id, FName = fName, LName = lName };
    HttpResponseMessage httpResponseMessage = await httpClient.PostAsync($"{Settings.Instance.WebApiUrl}/Person/Update", JsonContent.Create(expected));
    httpResponseMessage.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    string fNameOrLNameAreNullOrEmpty = await httpResponseMessage.Content.ReadAsStringAsync();
    fNameOrLNameAreNullOrEmpty.Should().NotBeNull();
    fNameOrLNameAreNullOrEmpty.Should().Be($"{WebApi.Properties.Resources.PersonValidationFNameIsEmpty}\r
{WebApi.Properties.Resources.PersonValidationLNameIsEmpty}");
}
```

And the following test ensures that the web API method succeeds.

```csharp
[Test]
public async Task GivenFNameAndLNameAreNotNullOrEmpty_WhenUpdatingPerson_ThenSucceeds()
{
    Person temp = await CreatePerson(FNAME, LNAME);
    temp.Should().NotBeNull();

    HttpClient httpClient = WebApiTestWebApplicationFactory.CreateClient();
    Person expected = new() { Id = temp.Id, FName = "Laura", LName = "Bernasconi" };
    HttpResponseMessage httpResponseMessage = await httpClient.PostAsync($"{Settings.Instance.WebApiUrl}/Person/Update", JsonContent.Create(expected));
    httpResponseMessage.EnsureSuccessStatusCode();
    Person actual = await httpResponseMessage.Content.ReadFromJsonAsync(typeof(Person)) as Person;
    MakeAssertions(expected, actual);
}
```

### Delete

Last, consider the following web API method, responsible for deleting an existing person record.

```csharp
[HttpDelete]
[Route("[action]/{id}")]
[SwaggerResponse(StatusCodes.Status200OK)]
[SwaggerResponse(StatusCodes.Status400BadRequest)]
public async Task<IActionResult> Delete(int id)
{
    Person? person = await dbContext.People.SingleOrDefaultAsync(x => x.Id == id);
    if (person == null)
        return BadRequest(Properties.Resources.PersonNotFound);
    dbContext.People.Remove(person);
    await dbContext.SaveChangesAsync();
    return Ok();
}
```

The following test ensures that the web API method returns a bad request error if a person with the specified identifier does not exist.

```csharp
[Test]
public async Task GivenNonExistingId_WhenDeletingPerson_ThenReturnsBadRequest()
{
    HttpClient httpClient = WebApiTestWebApplicationFactory.CreateClient();
    HttpResponseMessage httpResponseMessage = await httpClient.DeleteAsync($"{Settings.Instance.WebApiUrl}/Person/Delete/0");
    httpResponseMessage.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    string notfound = await httpResponseMessage.Content.ReadAsStringAsync();
    notfound.Should().NotBeNull();
    notfound.Should().Be(WebApi.Properties.Resources.PersonNotFound);
}
```

And the following test ensures that the web API method succeeds.

```csharp
[Test]
public async Task GivenExistingId_WhenDeletingPerson_ThenSucceeds()
{
    Person expected = await CreatePerson(FNAME, LNAME);

    HttpClient httpClient = WebApiTestWebApplicationFactory.CreateClient();

    {
        expected.Should().NotBeNull();
        HttpResponseMessage httpResponseMessage = await httpClient.DeleteAsync($"{Settings.Instance.WebApiUrl}/Person/Delete/{expected.Id}");
        httpResponseMessage.EnsureSuccessStatusCode();
    }

    {
        HttpResponseMessage httpResponseMessage = await httpClient.GetAsync($"{Settings.Instance.WebApiUrl}/Person/Read/{expected.Id}");
        httpResponseMessage.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        string notfound = await httpResponseMessage.Content.ReadAsStringAsync();
        notfound.Should().NotBeNull();
        notfound.Should().Be(WebApi.Properties.Resources.PersonNotFound);
    }
}
```
