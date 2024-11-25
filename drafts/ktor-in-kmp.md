---
title: TODO
subtitle: TODO
domain: software-engineering-corner.hashnode.dev
tags: kotlin, mobile, android, ios, kmp, kmm, kotlin-multiplatform, ktor, networking, http, testing, mocking
cover: TODO
publishAs: TODO
hideFromHashnodeCommunity: false
saveAsDraft: true
--- 
These days it’s quite rare to have a mobile that doesn’t access online resources. Naturally, “set up the HTTP stack” is one of the first stories on our backlog in a new project.

We’ve found [Ktor](https://ktor.io) to be a great library to work with, especially in our [Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform.html) projects. We wanted to share an approach we’ve used in many of our project when we set up Ktor.

# HttpClient in Ktor

[Ktor](https://ktor.io) is a relatively new HTTP library (for both clients and servers). It is designed to take advantage of Kotlin’s capabilities. If can be configured to use different “engines” under the hood for low-level networking. This makes it particularly suitable for cross-platform projects as it allows us to use an engine tuned for each platform. We’ll talk about these more as we go.

A central type for Ktor clients is `HttpClient`. This is the type an app [uses to make HTTP requests](https://ktor.io/docs/client-requests.html). An `HttpClient`  is configured using a closure when it is constructed. For example, `HttpClient` like so:

```kotlin
val httpClient = HttpClient(Darwin) { // 1. Engine selection – “Darwin” is for iOS
 
    // 2. Engine behaviour
    engine {
        configureRequest {
            setAllowsCellularAccess(false)
        }
    }
 
    // 3. Environment selection
    defaultRequest {
         url(host = "example.com", path = "/api/v2")
    }
 
    // 4. Logging
    install(Logging) {
        logger = Logger.SIMPLE
        level = LogLevel.ALL
    }
 
    // 5. Payload handling
    install(ContentNegotiation) {
         json(jsonFormatter)
    }
     
    // 6. Response validation
    HttpResponseValidator { /* omitted */ }
}
```

# Separating app logic and environment set up

In the sample code above, some concerns (4 and 5) are inherent to the way the application uses the client and it should always remain the same. The others, though, are dependent on the surrounding environment of the app.

* The choice of engine and how it is configured will depend on the platform.
* Internal builds may talk to service at a different address and may have different credentials
* In internal builds, or during testing, we may want to use an in-app mock instead of a live server.
* Logging behaviour may depend on the type of build (e.g. would be disabled in production).

We like to decouple how we set these environment-specific configuration from how the app code itself configures its `HttpClient`. In fact, the environment configuration may be in a different module from the app code as we don’t want our internal environment credentials or mocks to be shipped with the app in production.

## Interfacing our problem

Due to the way `HttpClient` is configured, we can’t inject a pre-built instance into the app as it wouldn’t be able to further configure it anymore. We also don’t want to manually inject configuration data objects into the app, as ideally it shouldn’t even know *what* should it configure.

We have a straightforward solution for this – though it may need a bit of getting used to. When we start our app, instead of creating the `HttpClient` directly in the app, we inject an interface that creates it for us, but gives us a chance to customise it:

```kotlin
interface HttpClientProvider {
    fun httpClient(commonInit: HttpClientConfig<*>.() -> Unit): HttpClient
}
```

For the “default” use case, we may have an implementation of that interface like so:

```kotlin
class DefaultHttpClientProvider(
        private val host: String,
        private val path: String? = null,
        private val scheme: String = "https"
) : HttpClientProvider {

    override fun httpClient(commonInit: HttpClientConfig<*>.() -> Unit): HttpClient {
        return newPlatformHttpClient {

            install(Logging) {
                logger = Logger.SIMPLE
                level = LogLevel.ALL
            }
            
            defaultRequest {
                val provider = this@DefaultHttpClientProvider
                url(scheme = provider.scheme, host = provider.host, path = provider.path)
            }

            commonInit(this)
        }
    }
    
}

internal expect fun newPlatformHttpClient(config: HttpClientConfig<*>.() -> Unit = {}): HttpClient
```

We need to use `newPlatformHttpClient` here as the choice of engine depends on the platform. In our Android-specific code, we can define it to use `OkHttp` .

```kotlin
internal actual fun newPlatformHttpClient(config: HttpClientConfig<*>.() -> Unit) = HttpClient(OkHttp) {
    engine {
        // configure OkHttp engine
    }

    config(this)
}
```

iOS code is basically the same, except that it’ll use and configure the `Darwin` engine.

## Mocking our engine

Ktor provides a [`MockEngine`](https://ktor.io/docs/client-testing.html#test-client) that we can use for offline integration tests. Here’s an `HttpClientProvider` that uses the mock engine.

```kotlin
class MockHttpClientProvider(private val maximumSimulatedNetworkingDelay: Duration = 0.3.seconds): HttpClientProvider {
    override fun httpClient(commonInit: HttpClientConfig<*>.() -> Unit): HttpClient =
        HttpClient(mockEngine) {
            commonInit(this)

            install(Logging) {
                logger = Logger.SIMPLE
                level = LogLevel.ALL
            }
        }

    private val mockEngine = MockEngine { request ->
        delay(maximumSimulatedNetworkingDelay.times(Random.nextDouble()))

        when {
            request.url.encodedPath == "/health" -> {
                respond(
                    content = ByteReadChannel("""
                        {
                            "isHealthy": true
                        }
                    """.trimIndent()),
                    status = HttpStatusCode.OK,
                    headers = headersOf(HttpHeaders.ContentType, "application/json")
                )
            }
            else -> {
                respond(
                    content = ByteReadChannel(""),
                    status = HttpStatusCode.NotFound,
                    headers = headersOf(HttpHeaders.ContentType, "text/plain")
                )
            }
        }

    }
}
```

# Adopting and adapting

Here we’ve stripped our solution to its bare minimum to get the core idea across. This is not published as a framework as each app’s use is slightly different and a general-purpose solution would either not be fit for most app or be unnecessarily complex.

Instead, here are some things to consider as you adapt this for your codebase:

## Providers are composable

You might’ve noticed that `newPlatformHttpClient` `expect` function and `HttpClientProvider` essentially have the same signature. The platform engines could just as well have been provided by conformances of `HttpClientProvider`.

`HttpClientProvider`s are composable, so you can have as many layers as you need that build upon each other. This can be useful especially if your app talks to different services but wants to configure the network the same way for all of these; or if you need to inject interceptors somewhere in the stack for security or monitoring purposes.

## APIs are convention-based

Because this solution is trying to be close to how `Ktor` works, there’s no type-safe guarantee that the different parts of the system keep to their lane. For example, nothing is stopping the app code to override the provider’s default request configuration.

For smaller projects, this is probably the right trade-off. For bigger projects or teams, you may find it’s better to strengthen the boundaries by creating custom type-safe API.

## Mocking can be expanded

Implementation of `MockHttpClientProvider` (as written here) can easily get out of hand when you start mocking many APIs, and maybe have different possible responses for each of those APIs, so consider improvements that suit your needs.