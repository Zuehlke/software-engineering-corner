---
title: SQL Server CLR Integration
description: >-
  SQL Server's `ROUND` function and the .NET Framework's `Math.Round` method can
  produce different results. Leveraging SQL Server CLR integration, developers
  can create custom functions using .NET languages like C# and then deploy them
  within SQL Server. This allows for extending SQL Server's functionality with
  custom logic implemented in .NET.
released: '2023-04-03T09:07:56.537Z'
cover: images/cover.jpeg
author: Fabio Scagliola
tags:
  - C#
  - SQL
shortDescription: >-
  This post explains how to develop and deploy a .NET assembly with a C#
  user-defined function to SQL Server for CLR integration.
---
# SQL Server CLR Integration

Have you ever noticed that the `ROUND` function in SQL Server returns different results than the `Math.Round` method in the .NET Framework?

Try and execute the following code in SQL Server, and you will get **12.350**.

```sql
select ROUND(12.345, 2)
```

Try and execute the following code in Visual Studio's C# Interactive, and you will get **12.34**.

```csharp
Math.Round(12.345, 2)
```

There must be an explanation, but I never cared to look for it.

Instead, I decided to leverage this fact and write a brief article that explains how to develop a .NET assembly, containing a user-defined function written in C#, and install the assembly in the Common Language Runtime hosted in Microsoft SQL Server (called CLR integration) in order to be able to invoke the user-defined function from SQL code.

Let us begin by creating a **SQL Server Database Project** in Visual Studio.

Ensure that, in the properties of the project, in the **Project Settings** section, you set the **Target Platform** to the correct version of SQL Server.

Should you want to use the features of the latest C# version, you may want to edit the project file and add the following XML element to it.

```xml
<PropertyGroup>
    <LangVersion>preview</LangVersion>
</PropertyGroup>
```

Add a couple of references:

* System
* System.Data

Add a class similar to the following one.

```csharp
public partial class UserDefinedFunctions
{
    [SqlFunction]
    public static SqlDouble MATH_ROUND(SqlDouble value, SqlInt32 digits)
    {
        SqlDouble result = new(0);

        if (!value.IsNull)
            result = new SqlDouble(Math.Round(value.Value, digits.Value));

        return result;
    }
}
```

Note that the class must be **public** and **partial**, and it must be named `UserDefinedFunctions`, which means that you create a user-defined function by adding a method to an existing class with the same name.

Additionally, note that the method must be **static** and adorned with the `SqlFunction` attribute.

Needless to say, the method above introduces a user-defined function called `MATH_ROUND` that will round numbers in SQL Server just like the `Math.Round` method in the .NET Framework.

It is now time to build the project and deploy the assembly to SQL Server.

The following SQL code will do the job for you, assuming the path to the assembly is "C:\Data\SqlUtils.dll".

```sql
sp_configure 'show advanced options', 1
go
reconfigure
go
sp_configure 'clr strict security', 0
go
reconfigure
go
sp_configure 'clr enabled', 1
go
reconfigure
go
drop function if exists MATH_ROUND
go
drop assembly if exists SqlUtils
go
create assembly SqlUtils from 'C:\Data\SqlUtils.dll'
go
create function MATH_ROUND(@value as float, @digits as int) returns float external name SqlUtils.UserDefinedFunctions.MATH_ROUND
go
```

Here is the description of each step performed by the code:

1. Enable the advanced configuration options, which is a prerequisite for the next step.
2. Disable the strict security policy that would prevent us from registering and executing our assembly -- for the sake of simplicity, I do not want to enter the Code Access Security realm in this article; however, disabling the strict security policy is not a good practice, especially in production environments.
3. Enable the SQL Server CLR Integration, which is disabled by default.
4. Delete the user-defined function entry, if it already exists.
5. Delete the assembly, if it is already registered with the SQL Server CLR.
6. Register the assembly with the SQL Server CLR.
7. Create the user-defined function entry.

Now you can try and execute the following code in SQL Server, and you will get **12.34**.

```sql
select dbo.MATH_ROUND(12.345, 2)
```

A sample project is available at <https://github.com/fabioscagliola/SQL-Server-CLR-Integration>
