---
title: Effortless API-first
description: >-
  API-first development prioritizes designing APIs before writing code, using
  specifications like OpenAPI to define endpoints, operations, and data
  structures. This approach fosters better API design, enables parallel
  development, facilitates code generation, and improves integration testing.
  Tools like Swagger Editor and OpenAPI Generator streamline the process,
  allowing for the creation of server and client code from API specifications.
released: '2023-09-18T09:09:21.176Z'
cover: images/cover.jpg
author: Marco Romanutti
tags:
  - api
  - API-First
  - APIs
  - gradle
  - OpenApi
  - REST
  - REST API
shortDescription: >-
  Explore API-first development, a paradigm prioritizing API design before
  coding. Learn its benefits, including parallel team work and code generation.
---
The software development world is an ever-evolving landscape. Technologies and methodologies continuously evolve - each promising a more efficient and effective way to create high-quality software.
One such approach that is gaining significant traction is *API-first* development.

In this article series, we will explore the idea behind API-first, look at practicable examples and [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator)'s new multiple specification files feature.

### What does API-first mean?

API-first design is a development paradigm that prioritizes our APIs, or application programming interfaces, and how our different software pieces communicate. In this approach, APIs are designed before any line of code is written.

[OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0) is used to outline how the API should act. It is a standard that allows us to define endpoints, operations, parameters, error messages, and other information in a way that both humans and computers understand.

A fully-fledged example of an OpenAPI specification can be found [here](https://editor.swagger.io/).

### The benefits of API-first development

API-first comes with a lot of benefits. Here are some of them:

* **Better APIs**: Designing an API upfront forces you to talk about the purpose of the API and how it should behave. This leads to APIs that fit their consumers' needs, are easier to use, and often reduce server and client complexity.

* **Development teams can work in parallel**: As soon as the API specification is defined, both server and clients can start their implementation work in parallel.

* **Code-generation**: Client and server code can be generated from the API specification.

* **Integration tested**: Having the API defined first improves the chances that our client talks correctly to our server. Generating code and building your development and ci/cd-processes around API-first improves the chances even more.

### The tools

Appropriate tooling is essential for API-first development. The following two will make our lifes easier:

#### Swagger Editor

The [Swagger Editor](https://editor.swagger.io/) is a browser-based editor where we can write OpenAPI specifications. It provides a live preview of the API documentation and allows us to generate server and client code in various languages. If you checked out the OpenAPI example before, you already have seen it in action.

#### OpenAPI Generator

A commonly used tool to generate code based on OpenAPI specifications is the [OpenAPI Generator](https://openapi-generator.tech/). It comes in different ways: As [CLI](https://central.sonatype.com/artifact/org.openapitools/openapi-generator-cli/7.0.0), [Maven plugin](https://github.com/OpenAPITools/openapi-generator/blob/master/modules/openapi-generator-maven-plugin/README.md) or [Gradle plugin](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-gradle-plugin).

### A first example

To give an example of how API-first can be used, we will create a simple API and generate the required code.
This example uses version `7.0.0` of the [Gradle plugin](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-gradle-plugin).

As described earlier, we start with designing our API. In this first step, we define an endpoint that returns the details of a specific user. The specification is written in YAML and can be found in the `openapi` directory.

*openapi/user-api.yaml:*

```yaml
openapi: 3.0.0
info:
  version: 1.0.0
  title: User API
paths:
  /users/{userId}:
    get:
      summary: Get details of a specific user by ID
      tags:
        - users
      parameters:
        - name: userId
          in: path
          description: ID of the user to retrieve
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          description: Unique identifier for the user.
        username:
          type: string
          description: User's name.
      required:
        - id
        - username
```

The specification consists of the following elements:

* **`openapi`**: Defines the version of the OpenAPI specification being used.
* **`info`**: Version, name and a brief description of the API.
* **`paths`**: Exposes all available endpoints - in our case a `GET` endpoint to retrieve user details, including supported operations, parameters and possible responses.
* **`components`**: Used to define reusable data models. Currently, we only have a `User` object.

So far, so clear.

Having our OpenAPI specification, we can now generate the required code. To do so, we need to add the following plugin to our `build.gradle.kts` file:

```kotlin
plugins {
    id("org.openapi.generator") version "7.0.0"
}
```

### Generating the server

The plugin now allows us to specify further how the code should be generated.
We want to generate a [Spring](https://spring.io/) server in this example. Therefore, we need to add the following task to our `build.gradle.kts` file:

```kotlin
openApiGenerate {
    generatorName.set("spring")
    inputSpec.set("$rootDir/openapi/user-api.yaml")
    configFile.set("$rootDir/api-config.json")
    outputDir.set("$buildDir/generated")
}
```

Let's see what we configured:

* `generatorName` specifies the generator to use.
* `inputSpec` contains the OpenAPI specification we use to generate our code.
* `configFile` allows to customize further the code generation (check out the [docs](https://github.com/OpenAPITools/openapi-generator/blob/master/modules/openapi-generator-gradle-plugin/README.adoc#configuration) to learn more about the available options).
* `outputDir` specifies the directory where the generated code should be placed.

We are now ready to run the code generation. To do so, we can run the following command:

```bash
./gradlew openApiGenerate
```

This will result in an interface that can be implemented in the respective controller on sever side.

```java
@Generated
public interface UsersApi {

    @Operation(
            operationId = "usersUserIdGet",
            summary = "Get details of a specific user by ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "OK", content = {
                            @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))
                    })
            }
    )
    @RequestMapping(
            method = RequestMethod.GET,
            value = "/users/{userId}",
            produces = {"application/json"}
    )
    default ResponseEntity<User> usersUserIdGet(
            @Parameter(name = "userId", description = "ID of the user to retrieve", required = true, in = ParameterIn.PATH) @PathVariable("userId") Integer userId
    ) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }
}
```

And also, the data transfer object (DTO) that is returned by the server was generated:

```java
@Generated
public class User {

  private Integer id;

  private String username;
  
  public User(Integer id, String username) {
    this.id = id;
    this.username = username;
  }

  public User id(Integer id) {
    this.id = id;
    return this;
  }
  
  @NotNull 
  @Schema(name = "id", description = "Unique identifier for the user.", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("id")
  public Integer getId() {
    return id;
  }

  public void setId(Integer id) {
    this.id = id;
  }

  public User username(String username) {
    this.username = username;
    return this;
  }
  
  @NotNull 
  @Schema(name = "username", description = "User's name.", requiredMode = Schema.RequiredMode.REQUIRED)
  @JsonProperty("username")
  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }
}

```

### Generating the client

Just as we generated server code, we can also generate client code using an appropriate generator.
In our case, we want to generate a [TypeScript](https://www.typescriptlang.org/) client.
Therefore, we choose the `typescript-angular` generator in our gradle task:

```kotlin
openApiGenerate {
    generatorName.set("typescript-angular")
    inputSpec.set("$rootDir/openapi/user-api.yaml")
    configFile.set("$rootDir/api-config.json")
    outputDir.set("$buildDir/generated")
}
```

The generator will generate a service that can be used to call the API (generated services are quite verbose - for clarity, we focus on the relevant parts):

```typescript
@Injectable({
    providedIn: 'root'
})
export class UsersService {

    constructor(protected httpClient: HttpClient) {
        // ...
    }
    
    public usersUserIdGet(userId: number): Observable<User> {
        // ...
    }
}
```

As the client code in our case includes the fully-fledged implementation of the service, we can directly use it in our application.

Also, a corresponding data transfer object was generated:

```typescript
export interface User {
    id: number;
    username: string;
}
```

A final thought about organizing your code: Keep your generated code in a separate directory or module to keep it isolated from your application code. This will make managing and updating your generated code easier as your API evolves over time.

### Conclusion

As we can see, the OpenAPI Generator is a powerful tool that can be used to generate code for both server and client side.
In the [next article](/api-first-part-2/) we will look at a more realistic example and how [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) helps you to keep your specification files structured.
