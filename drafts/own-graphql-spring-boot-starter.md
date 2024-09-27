---
title: Create own GraphQL Spring Boot Starter
domain: software-engineering-corner.hashnode.dev
tags: Java, Springboot, GraphQL
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1726474334943/vvF5pmFaI.jpg?auto=format
publishAs: abeggchr
hideFromHashnodeCommunity: false
saveAsDraft: true
---
Spring Boot starters typically contain everything to get started with a given technology (like `spring-boot-starter-web`),
but they also provide a means to share functionality accross multiple applications (like `spring-boot-starter-actuator`).

In this article, we'll create a Spring Boot starter which will make a GraphQL endpoint available to all applications where the starter is included.
We will cover a similar functionality as the `info` endpoint of the [actuator](https://docs.spring.io/spring-boot/api/rest/actuator/index.html) starter: displaying the applications version. But instead of a REST API, we'll provide a GraphQL endpoint.

The resulting code is available at [https://github.com/abeggchr/shared-graphql-spring-boot-starter](https://github.com/abeggchr/shared-graphql-spring-boot-starter).

## 1. Set up a Spring Boot application

Create the Spring application which will later consume the starter. Start from where the Spring's ["Building a GraphQL service"](https://spring.io/guides/gs/graphql-server) left off and copy the [`completed`](https://github.com/spring-guides/gs-graphql-server/tree/main/complete) solution into our `application` folder.

```
shared-graphql-spring-boot-starter
└ application
```

Start the application, open `http://localhost:8080/graphiql?path=/graphql`, and check that you can execute GraphQL queries like:

```graphql
query bookDetails {
  bookById(id: "book-1") {
    id
    name
  }
}
```

## 2. Set up a Spring Boot starter

Create an empty Spring Boot starter project alongside the application.

```
shared-graphql-spring-boot-starter
├ application
└ graphql-info-spring-boot-starter
```

Either create your Java project structure with the IDE or use [Spring Initializr](https://start.spring.io/).

For the name, consider Springs [recommendation](https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html#features.developing-auto-configuration.custom-starter.naming) to use the following pattern: `{own-name}-spring-boot-starter`.

Ensure you have the necessary dependencies for both Spring Boot and Spring for GraphQL in your build file (i.e. `build.gradle.kts`)

```kotlin
plugins {
    java
    `maven-publish`
}

group = "org.example"
version = "1.0-SNAPSHOT"

// to match the applications java version
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    compileOnly("org.springframework.boot:spring-boot-starter-parent:3.3.1")
    compileOnly("org.springframework.boot:spring-boot-starter-graphql:3.3.1")

    annotationProcessor("org.springframework.boot:spring-boot-autoconfigure-processor:3.3.1")
}
```

## 3. Create a controller in the starter

Create a controller in the starter that handles GraphQL queries. Make sure you use the `@QueryMapping` annotation for GraphQL query handlers.

```java
package org.example;

import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class GraphQLController {

    @QueryMapping
    public String info() {
        return "version=0.0.1";
    }
}
```

## 4. Add auto-configuration class

Next, create an auto-configuration class that will automatically configure the `GraphQLController` bean when the starter is included in a Spring Boot application.

```java
package org.example;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GraphQLStarterAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public GraphQLController graphQLController() {
        return new GraphQLController();
    }
}
```

This class ensures that the `GraphQLController` bean is instantiated and registered when the starter is present in the application classpath.

The `@ConditionalOnMissingBean` annotation makes sure, the bean will get loaded by Spring only if there is no other bean of this type present in the context. 

Note that it is best-practice to split the auto-configuration part of the starter and the implementation into different projects. The directory structure would look as follows. For the sake of simplicity, we are using a single project here.

```
shared-graphql-spring-boot-starter
├ application
└ starter
  ├ graphql-info-spring-boot-autoconfigure
  └ graphql-info-spring-boot-starter
```

## 5. Register the auto-configuration class

To ensure that Spring Boot picks up the auto-configuration class, you need to register it. Create a file at `src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` and add the fully qualified name of the auto-configuration class:

```
org.example.GraphQLStarterAutoConfiguration
```

Note that for older Spring versions, the `spring.factories` file was used for that purpose.

## 6. Add a GraphQL schema to the starter

Place the schema file in the `src/main/resources/graphql` folder. For example, create a `schema.graphqls` file:

```graphql
extend type Query {
    info: String
}
```

Spring will automatically merge the starters schema with the applications schema when the application starts up. 

Note the `extend` keyword. Without that keyword, Spring would try to merge two different `Query` types resulting in an error like `errors=['Query' type [@14:1] tried to redefine existing 'Query' type [@1:1]]`. With `extend` you can avoid this error.

## 7. Enable automatic schema merging in consuming application

Set the application property `spring.graphql.schema.locations`  to `classpath*:graphql/**/` in the consuming applications `application.properties` file, so that schema files are detected in all dependencies dependencies. The default value is `classpath:graphql/**/` (without `*`) and does not merge schemas.

```properties
spring.graphql.schema.locations=classpath*:graphql/**/
```

## 8. Use the starter in the consuming application

Once your starter is ready, publish it to a Maven repository (or use a local Maven install), and include it in the `build.gradle` file of the consuming application.

```gradle
implementation 'org.example:graphql-info-spring-boot-starter:1.0-SNAPSHOT'
```

With this setup, when the consuming application starts, it will have access to the `/graphql` endpoint with the `info` query automatically available.

## 9. Query the GraphQL endpoint

Start the application, open `http://localhost:8080/graphiql?path=/graphql` and check that the following query returns the hard-coded value `version=0.0.1`.

```graphql
query info {
  info
}
```

## 11. Configuratively set the version

You can allow users of your starter to customize the endpoint behavior via `application.properties`. For example, you can inject version number from the configuration like this:

`GraphQLStarterAutoConfiguration.java`:
```java
package org.example;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(GraphQLStarterProperties.class)
public class GraphQLStarterAutoConfiguration {

    @Autowired
    private GraphQLStarterProperties properties;

    @Bean
    @ConditionalOnMissingBean
    public GraphQLController graphQLController() {
        return new GraphQLController(properties);
    }
}
```

`GraphQLController.java`:
```java
package org.example;

import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class GraphQLController {

    private final GraphQLStarterProperties properties;

    public GraphQLController(GraphQLStarterProperties properties) {
        this.properties = properties;
    }

    @QueryMapping
    public String info() {
        return "version=%s".formatted(this.properties.getVersion());
    }
}
```

`application.properties`:
```properties
info.app.version=1.0.0
```

The graphql query `info` now returns the configured value `1.0.0`.

## 12. Add parameters

When you add additional query or mutation methods to the starters `schema.graqphql` and `GraphQLController`,
you might run into parameter-related errors. In that case, adding the `-parameters` compiler argument helps, 
as described in the [Spring 6.x release notes]{https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-6.x#parameter-name-retention}.

``` kotlin
tasks.withType<JavaCompile>() {
    options.compilerArgs.add("-parameters")
}
```

## 13. Troubleshooting

To get more insight into the GraphQL schema loading and query mapping process, you can enable debug-level logging in the consuming applications `application.properties`:

```properties
logging.level.org.springframework.graphql=DEBUG
```


Photo by <a href="https://unsplash.com/@itfeelslikefilm?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Janko Ferlič</a> on <a href="https://unsplash.com/photos/photo-of-library-with-turned-on-lights-sfL_QOnmy00?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
  