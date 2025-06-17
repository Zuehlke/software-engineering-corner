---
title: An Introduction to Unit Testing
description: >-
  Unit testing involves writing automated code to verify the behavior of small
  units of work, ensuring assumptions about end results are correct. It
  contrasts with integration testing, which uses real dependencies and can be
  slower and less reliable. Key concepts include test-driven development,
  value-based, state-based, and interaction testing, as well as the use of fakes
  like stubs and mocks to isolate code and manage external dependencies.
released: '2023-01-09T10:07:51.166Z'
cover: images/cover.jpeg
author: Fabio Scagliola
tags:
  - TDD (Test-driven development)
  - C#
  - test
  - test driven development
  - Software Testing
---
# An Introduction to Unit Testing

This article provides an introduction to unit testing.

## Contents

* Unit testing in theory
* Unit testing in practice
* Fakes
* Code samples
* Suggested readings

## Unit testing in theory

This section defines unit testing, units of work, integration tests, and test-driven development.

### Unit testing definition 1

A unit test is a piece of a code (usually a method) that invokes another piece of code and checks the correctness of some assumptions afterward. If the assumptions turn out to be wrong, the unit test has failed. The piece of code, also called the unit, is a method or function.

### Unit of work

A unit of work is the sum of actions that take place between the invocation of a public method in the system and a single noticeable end result after a test of that system.

A noticeable end result can be observed without looking at the internal state of the system and only through its public APIs and behavior.

### Unit test definition 2

A unit test is a piece of code that invokes a unit of work and checks one specific end result of that unit of work. If the assumptions on the end result turn out to be wrong, the unit test has failed. The scope of a unit test can span as little as a method or as much as multiple classes.

### Integration tests

Integration tests are any tests that aren’t fast and consistent, and that use one or more real dependencies of the units under test. If the test uses the real system time, the real filesystem, a real database, or some piece of hardware, it has stepped into the realm of integration testing.

### Integration tests drawbacks

If a test uses the real database, then it’s no longer only running in memory; in that, its actions are harder to erase than when using only in-memory fake data. Integration tests increase the risk of another problem: testing too many things at once. In an integration test you can have many failure points and, therefore, finding the cause of the problem is harder. An integration test uses real dependencies.

### Unit tests vs integration tests

* Can I run and get results from the test I wrote two weeks, months, or years ago?
* Can any member of my team run and get results from tests I wrote two months ago?
* Can I run all the tests I’ve written in no more than a few minutes?
* Can I run all the tests I’ve written at the push of a button?
* Can I write a basic test in no more than a few minutes?

If the answer to one or more of the questions above is no, then I have stepped into the realm of integration testing.

### Unit test definition 3

A unit test is an automated piece of code that invokes the unit of work being tested, and then checks some assumptions about a single end result of that unit. A unit test is almost always written using a unit testing framework. It can be written easily and runs quickly. It’s trustworthy, readable, and maintainable. It’s consistent in its results as long as production code hasn’t been changed.

### Test-driven development (TDD)

TDD is a practice that involves writing unit tests before the production code is written, writing a failing test to prove that code or functionalities are missing, and then making the test pass by writing production code that meets the expectations.

When refactoring your code (refactoring means changing a piece of code without changing its functionality), seeing a test fail, and then seeing it pass without changing the test, you’re basically testing the test itself too.

### Types of unit testing

**Value-based testing** checks the value returned from a function.

**State-based testing** is about checking for noticeable behavior changes.

**Interaction testing** is testing how an object sends messages (i.e. calls methods) to other objects. You use interaction testing when calling another object is the end result of a specific unit of work.

## Unit testing in practice

This section introduces the xUnit testing frameworks.

### Unit testing frameworks

Unit tests are written as code, using libraries from the unit testing framework. The tests are run from a separate unit testing tool or inside the IDE, and the results are reviewed (either as output text, the IDE, or the unit testing framework application UI) by the developer or an automated build process.

### The xUnit frameworks

xUnit is a collective name for several unit testing frameworks that derive their structure and functionality from Smalltalk’s SUnit, designed by Kent Beck in 1998.

### Naming convention

The name of a unit test usually includes the name of the class, the name of the unit of work, and the expected behavior.

Example:  `OpticalSensor_IsRedBloodCell_ReturnsFalse()`

### Structure of a unit test

The typical sequence of actions performed by a unit test is the following: creating an object, setting it up as necessary, acting on the object, and asserting that something is as expected.

### Attributes

The unit testing framework provides several attributes used to decorate the code of the unit tests, such as  `TestFixture`,  `Test`,  `TestCase`,  `Setup`, and  `TearDown`.

### Assertions

The unit testing also provides classes and methods to assert what is expected, such as  `Assert.IsFalse()`,  `Assert.IsTrue()`,  `Assert.AreEqual()`,  `Assert.Throws()`, and  `Assert.DoesNotThrow()`.

## Fakes

This section presents faking techniques commonly used in unit testing.

### External dependencies

An external dependency is an object in your system that your code under test interacts with and over which you have no control.

### Fakes: stubs and mocks

A fake is a generic term that can describe either a stub or a mock. A stub is a controllable replacement for an existing dependency: by using a stub, you can test your code without dealing with the dependency directly. Mocks are just like stubs, but you can assert against the mock object, whereas you do not assert against a stub.

### Abstraction and dependency injection

When you cannot test something, either you add a layer that wraps up the calls to that something, and then mimic that layer in your tests, or you make that something replaceable, so that it is itself a layer of indirection.

### Refactoring

Refactoring means changing a piece of code without changing its functionality. There are two types of dependency-breaking refactoring, and one depends on the other: abstracting concrete objects into interfaces, and refactoring to allow the injection of fakes of those interfaces. In order to abstract concrete objects into interfaces, extract an interface to allow replacing the underlying implementation. In order to allow the injection of fakes of the interfaces, inject a stub into a class under test, inject a mock using a constructor, inject a mock using a property, or inject a mock using a method.

### Isolation frameworks

An isolation framework is a set of programmable APIs that makes the creation of fake objects much faster and simpler. Isolation frameworks exist for most languages that have a unit testing framework associated with them.

## Code samples

This section describes the examples included in my unit testing training project available at the following location.

<https://github.com/fabioscagliola/Unit-Testing>

### Unit testing example 1

The **UnitTesting01.cs** file includes two unit tests that verify the Boolean values returned by the  `IsRedBloodCell`  method of the  `OpticalSensor`  class.

```csharp
using NUnit.Framework;

namespace UnitTesting01
{
    public class OpticalSensor
    {
        public bool IsRedBloodCell(uint measuredValue)
        {
            bool result = false;

            if (measuredValue > 1000)
            {
                result = true;
            }

            return result;
        }
    }

    [TestFixture]
    public class OpticalSensorTest
    {
        [Test]
        public void OpticalSensor_IsRedBloodCell_ReturnsFalse()
        {
            OpticalSensor opticalSensor = new OpticalSensor();
            bool result = opticalSensor.IsRedBloodCell(675);
            Assert.IsFalse(result);
        }

        [Test]
        public void OpticalSensor_IsRedBloodCell_ReturnsTrue()
        {
            OpticalSensor opticalSensor = new OpticalSensor();
            bool result = opticalSensor.IsRedBloodCell(1050);
            Assert.IsTrue(result);
        }

    }

}
```

### Unit testing example 2

The **UnitTesting02.cs** file introduces the use of the  `TestCase`  attribute to merge the two unit tests of example 1 into one test that verifies the Boolean values returned by the  `IsRedBloodCell`  method of the  `OpticalSensor`  class.

```csharp
using NUnit.Framework;

namespace UnitTesting02
{
    public class OpticalSensor
    {
        public bool IsRedBloodCell(uint measuredValue)
        {
            bool result = false;

            if (measuredValue > 1000)
            {
                result = true;
            }

            return result;
        }
    }

    [TestFixture]
    public class OpticalSensorTest
    {
        [Test]
        [TestCase(675u, false)]
        [TestCase(1050u, true)]
        public void OpticalSensor_IsRedBloodCell_Works(uint measuredValue, bool expected)
        {
            OpticalSensor opticalSensor = new OpticalSensor();
            bool actual = opticalSensor.IsRedBloodCell(measuredValue);
            Assert.AreEqual(expected, actual);
        }

    }

}
```

### Unit testing example 3

The **UnitTesting03.cs** file, in addition to what is sown in example 2, demonstrates how to test for an exception that may now be thrown by the  `IsRedBloodCell`  method of the  `OpticalSensor`  class.

```csharp
using NUnit.Framework;
using System;

namespace UnitTesting03
{
    public class OpticalSensor
    {
        public bool IsRedBloodCell(uint measuredValue)
        {
            if (measuredValue > 2000)
            {
                throw new ApplicationException("The measured value must be lower than 2000!");
            }

            bool result = false;

            if (measuredValue > 1000)
            {
                result = true;
            }

            return result;
        }
    }

    [TestFixture]
    public class OpticalSensorTest
    {
        [Test]
        [TestCase(675u, false)]
        [TestCase(1050u, true)]
        public void OpticalSensor_IsRedBloodCell_Works(uint measuredValue, bool expected)
        {
            OpticalSensor opticalSensor = new OpticalSensor();
            bool actual = opticalSensor.IsRedBloodCell(measuredValue);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void OpticalSensor_IsRedBloodCell_ThrowsExcwption()
        {
            OpticalSensor opticalSensor = new OpticalSensor();
            ApplicationException ex = Assert.Throws<ApplicationException>(() => { opticalSensor.IsRedBloodCell(2001); });
            Assert.AreEqual("The measured value must be lower than 2000!", ex.Message);
        }

    }

}
```

### Unit testing example 4

All the previous files provide examples of value-based testing (checking the value returned by a method). The **UnitTesting04.cs** file provides an example of state-based testing (checking for noticeable behavior changes).

```csharp
using NUnit.Framework;

namespace UnitTesting04
{
    public enum ClampStatus { Closed = 0, Open = 1, }

    public class Clamp
    {
        protected ClampStatus status;

        public ClampStatus Status { get { return status; } }

        public void Close()
        {
            status = ClampStatus.Closed;
        }

        public void Open()
        {
            status = ClampStatus.Open;
        }

    }

    [TestFixture]
    public class ClampTest
    {
        [Test]
        public void Clamp_Close_Works()
        {
            Clamp clamp = new Clamp();
            clamp.Close();
            Assert.AreEqual(ClampStatus.Closed, clamp.Status);  // State-based testing (also called state verification) 
        }

        [Test]
        public void Clamp_Open_Works()
        {
            Clamp clamp = new Clamp();
            clamp.Open();
            Assert.AreEqual(ClampStatus.Open, clamp.Status);
        }
    }

}
```

### Unit testing example 5

In the **UnitTesting05.cs** file, the  `GoHome`  method of the  `PressController`  class depends on some piece of hardware; the dependency is now simulated by throwing an exception; in such a scenario, unless we get rid of the dependency, the unit test can only verify that the exception is thrown.

```csharp
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace UnitTesting05
{
    public class PressController
    {
        protected uint position;

        public uint Position { get { return position; } }

        public async Task GoHome()
        {
            await Task.Run(() =>
            {
                throw new ApplicationException("The press did not respond!");
            });
        }

    }

    public class Extraction
    {
        protected PressController pressController;

        public Extraction(PressController pressController)
        {
            this.pressController = pressController;
        }

        public async Task Begin()
        {
            await pressController.GoHome();

            if (pressController.Position != 0)
            {
                throw new ApplicationException("The press did not go home!");
            }

            // TODO: Continue with the extraction 
        }

    }

    [TestFixture]
    public class OpticalSensorTest
    {
        [Test]
        public void Extraction_Begin_ThrowsException()
        {
            PressController pressController = new PressController();
            Extraction extraction = new Extraction(pressController);
            ApplicationException ex = Assert.ThrowsAsync<ApplicationException>(async () => { await extraction.Begin(); });
            Assert.AreEqual("The press did not respond!", ex.Message);
        }

    }

}
```

### Unit testing example 6

In the **UnitTesting06.cs** file, the  `IPressController`  interface is extracted from the  `PressController`  class, and two stubs are introduced: the  `PressControllerStub`  class and the  `PressControllerStubNotGoingHome`  class, both implementing the  `IPressController`  interface; with minor adjustments to the  `Extraction`  class and to the unit tests, the code is now covered: we got rid of the dependency using the stubs; please note that we never make assertions against the stubs.

```csharp
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace UnitTesting06
{
    public interface IPressController
    {
        uint Position { get; }
        Task GoHome();

    }

    public class PressController : IPressController  // This class in not being tested anymore 
    {
        protected uint position;

        public uint Position { get { return position; } }

        public async Task GoHome()
        {
            await Task.Run(() =>
            {
                throw new ApplicationException("The press did not respond!");
            });
        }

    }

    public class PressControllerStub : IPressController
    {
        protected virtual uint HomePosition { get { return 0; } }

        protected uint position;

        public uint Position { get { return position; } }

        public async Task GoHome()
        {
            await Task.Run(() =>
            {
                Task.Delay(3000);
                position = HomePosition;
            });
        }

    }

    public class PressControllerStubNotGoingHome : PressControllerStub
    {
        protected override uint HomePosition { get { return 1050; } }
    }

    public class Extraction
    {
        protected IPressController pressController;

        public Extraction(IPressController pressController)
        {
            this.pressController = pressController;
        }

        public async Task Begin()
        {
            await pressController.GoHome();

            if (pressController.Position != 0)
            {
                throw new ApplicationException("The press did not go home!");
            }

            // TODO: Continue with the extraction 
        }

    }

    [TestFixture]
    public class OpticalSensorTest
    {
        [Test]
        public void Extraction_Begin_ThrowsException()
        {
            IPressController pressControllerStub = new PressControllerStubNotGoingHome();
            Extraction extraction = new Extraction(pressControllerStub);
            ApplicationException ex = Assert.ThrowsAsync<ApplicationException>(async () => { await extraction.Begin(); });
            Assert.AreEqual("The press did not go home!", ex.Message);
        }

        [Test]
        public void Extraction_Begin_Works()
        {
            IPressController pressControllerStub = new PressControllerStub();
            Extraction extraction = new Extraction(pressControllerStub);
            Assert.DoesNotThrowAsync(async () => { await extraction.Begin(); });
        }

    }

}
```

### Unit testing example 7

In the **UnitTesting07.cs** file, the  `Open`  method of the  `ClampController`  class depends on some piece of hardware; the dependency is now simulated by throwing an exception; in such a scenario, unless we get rid of the dependency, the unit test can only verify that the exception is thrown.

```csharp
using NUnit.Framework;
using System;

namespace UnitTesting07
{
    public enum ClampStatus { Closed = 0, Open = 1, }

    public class ClampController
    {
        protected ClampStatus status;

        public ClampStatus Status { get { return status; } }

        public void Close()
        {
            throw new ApplicationException("The clamp did not respond!");
        }

        public void Open()
        {
            throw new ApplicationException("The clamp did not respond!");
        }

    }

    public class Extraction
    {
        protected ClampController clampController;

        public ClampController ClampController { get { return clampController; } }

        public Extraction(ClampController clampController)
        {
            this.clampController = clampController;
        }

        public void Begin()
        {
            clampController.Open();

            // TODO: Continue with the extraction 
        }

    }

    [TestFixture]
    public class ExtractionTest
    {
        [Test]
        public void Extraction_Begin_ThrowsException()
        {
            ClampController clampController = new ClampController();
            Extraction extraction = new Extraction(clampController);
            ApplicationException ex = Assert.Throws<ApplicationException>(() => { extraction.Begin(); });
            Assert.AreEqual("The clamp did not respond!", ex.Message);
        }

    }

}
```

### Unit testing example 8

In the **UnitTesting08.cs** file, the  `IClampController`  interface is extracted from the  `ClampController`  class, and the  `ClampControllerMock`  class is introduced as a mock, implementing the  `IClampController`  interface; with minor adjustments to the  `Extraction`  class and to the unit test, the code is now covered: we got rid of the dependency using the mock; please note that we do make assertions against the mock. In this example the mock is injected using a constructor.

```csharp
using NUnit.Framework;
using System;

namespace UnitTesting08
{
    public enum ClampStatus { Closed = 0, Open = 1, }

    public interface IClampController
    {
        ClampStatus Status { get; }
        void Close();
        void Open();
    }

    public class ClampController : IClampController  // This class in not being tested anymore 
    {
        protected ClampStatus status;

        public ClampStatus Status { get { return status; } }

        public void Close()
        {
            throw new ApplicationException("The clamp did not respond!");
        }

        public void Open()
        {
            throw new ApplicationException("The clamp did not respond!");
        }

    }

    public class ClampControllerMock : IClampController
    {
        protected ClampStatus status;

        public ClampStatus Status { get { return status; } }

        public void Close()
        {
            status = ClampStatus.Closed;
        }

        public void Open()
        {
            status = ClampStatus.Open;
        }

    }

    public class Extraction
    {
        protected IClampController clampController;

        public IClampController ClampController { get { return clampController; } }

        public Extraction(IClampController clampController)
        {
            this.clampController = clampController;
        }

        public void Begin()
        {
            clampController.Open();

            // TODO: Continue with the extraction 
        }

    }

    [TestFixture]
    public class ExtractionTest
    {
        [Test]
        public void Extraction_Begin_OpensClamp()
        {
            IClampController clampControllerMock = new ClampControllerMock();
            Extraction extraction = new Extraction(clampControllerMock);  // Inject the mock using a constructor 
            extraction.Begin();
            Assert.AreEqual(ClampStatus.Open, clampControllerMock.Status);
        }

    }

}
```

### Unit testing example 9

In this example the mock is injected using a method.

```csharp
using NUnit.Framework;
using System;

namespace UnitTesting09
{
    public enum ClampStatus { Closed = 0, Open = 1, }

    public interface IClampController
    {
        ClampStatus Status { get; }
        void Close();
        void Open();
    }

    public class ClampControllerMock : IClampController
    {
        protected ClampStatus status;

        public ClampStatus Status { get { return status; } }

        public void Close()
        {
            status = ClampStatus.Closed;
        }

        public void Open()
        {
            status = ClampStatus.Open;
        }

    }

    public class Extraction
    {
        protected IClampController clampController;

        public IClampController ClampController { get { return clampController; } }

        public void SetClamp(IClampController clampController)
        {
            this.clampController = clampController;
        }

        public void Begin()
        {
            if (clampController == null)
            {
                throw new ApplicationException("The clamp controller was not specified!");
            }

            clampController.Open();

            // TODO: Continue with the extraction 
        }

    }

    [TestFixture]
    public class ExtractionTest
    {
        [Test]
        public void Extraction_Begin_ThrowsException()
        {
            Extraction extraction = new Extraction();
            ApplicationException ex = Assert.Throws<ApplicationException>(() => { extraction.Begin(); });
            Assert.AreEqual("The clamp controller was not specified!", ex.Message);
        }

        [Test]
        public void Extraction_Begin_OpensClamp()
        {
            IClampController clampControllerMock = new ClampControllerMock();
            Extraction extraction = new Extraction();
            extraction.SetClamp(clampControllerMock);  // Inject the mock using a method 
            extraction.Begin();
            Assert.AreEqual(ClampStatus.Open, clampControllerMock.Status);
        }

    }

}
```

### Unit testing example 10

In this example the mock is injected using a property.

```csharp
using NUnit.Framework;
using System;

namespace UnitTesting10
{
    public enum ClampStatus { Closed = 0, Open = 1, }

    public interface IClampController
    {
        ClampStatus Status { get; }
        void Close();
        void Open();
    }

    public class ClampControllerMock : IClampController
    {
        protected ClampStatus status;

        public ClampStatus Status { get { return status; } }

        public void Close()
        {
            status = ClampStatus.Closed;
        }

        public void Open()
        {
            status = ClampStatus.Open;
        }

    }

    public class Extraction
    {
        protected IClampController clampController;

        public IClampController ClampController { get { return clampController; } set { clampController = value; } }

        public void Begin()
        {
            if (clampController == null)
            {
                throw new ApplicationException("The clamp controller was not specified!");
            }

            clampController.Open();

            // TODO: Continue with the extraction 
        }

    }

    [TestFixture]
    public class ExtractionTest
    {
        [Test]
        public void Extraction_Begin_ThrowsException()
        {
            Extraction extraction = new Extraction();
            ApplicationException ex = Assert.Throws<ApplicationException>(() => { extraction.Begin(); });
            Assert.AreEqual("The clamp controller was not specified!", ex.Message);
        }

        [Test]
        public void Extraction_Begin_OpensClamp()
        {
            IClampController clampControllerMock = new ClampControllerMock();
            Extraction extraction = new Extraction();
            extraction.ClampController = clampControllerMock;  // Inject the mock using a property 
            extraction.Begin();
            Assert.AreEqual(ClampStatus.Open, clampControllerMock.Status);
        }

    }

}
```

## Suggested readings

“Test Driven Development: By Example” by Kent Beck; Addison-Wesley Professional, 2002, 9780321146533

“Working Effectively with Legacy Code, First Edition” by Michael Feathers; Prentice Hall, 2004, 9780131177055

“xUnit Test Patterns: Refactoring Test Code” by Gerard Meszaros; Addison-Wesley Professional, 2007, 9780131495050

“Clean Code” by Robert C. Martin; Prentice Hall, 2008, 9780136083238

“Growing Object-Oriented Software, Guided by Tests” by Steve Freeman, Nat Pryce; Addison-Wesley Professional, 2009, 9780321503626

“The Art of Unit Testing, 2nd Edition” by Roy Osherove; Manning Publications, 2013, 9781617290893

“Dependency Injection Principles, Practices, And Patterns” by Mark Seemann, Steven Van Deursen; Manning Publications, 2019, 978161729473
