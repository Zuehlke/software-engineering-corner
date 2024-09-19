---
title: Develop your own Language Server
domain: software-engineering-corner.hashnode.dev
tags: Language Server Protocol, Java, LSP
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1720939748891/bKimfsPot.gif?auto=format
publishAs: NipunaMarcusZuhlke
hideFromHashnodeCommunity: false
saveAsDraft: true
---

# Develop your own Language Server

If you have ever worked with an IDE for programming languages like Java or C#, you have probably experience that how easy it is to write program with auto-completion feature ( some might know it as intellisense ) provided by the IDE which help you to type code faster and select suitable functions to complete your task, or find the usage of the particular function, or go to the implementation of a function just by clicking on it or rename a method safely without having to change everywhere it is used, by yourself. As most of the IDEs support multiple languages these language features are injected into the IDE via the language plugin which is written by the language developers or IDE developers (or whoever love that language).

## So where is this so-called language server fit in?

If you are a developer (Obviously) you might have a favorite IDE that you always use. And it is really easy if you can develop software from different languages on top of the same IDE that you like. So various developers choose IDEs that they like and stick to it. Because of that language developers always trying to add language feature support for all most all the IDEs and that is hard because every IDE has their own way (Architecturally) of supporting languages features. So it is very difficult for the language developers to support every IDE because they need a big effort to develop language plugin for each. It will be really easy if they have a protocol for supporting language features which are supported by every IDE. So Microsoft came up with an idea of [Language Server Protocol(LSP)](https://microsoft.github.io/language-server-protocol/) when they developing the Visual Studio Code. Well for your information Language server is not a new concept it was there for a long time only it was not standardized. You can find more details about the language server in [Protocol History](https://github.com/Microsoft/language-server-protocol/wiki/Protocol-History). So the purpose of language server protocol is to save the language developer from the misery of writing different implementations to support the same language in various IDEs by developing just one implementation to support a language for all IDEs.

## What is Language Server Protocol (LSP) ?

LSP is a protocol used to provide language-specific features in a language-agnostic way. It decouples the editor from the language-specific logic, allowing you to support various languages with minimal effort. LSP offers:

- Syntax checking
- Auto-completions
- Hover information
- Code formatting
- Refactorings

Now with this protocol more old and new languages have language servers that anyone can get and integrated into their own plugin for an IDE or an advanced text editor to give support to a language.

Now the question is how we implement this protocol to support a language?
well, let me walk you through ways we can implement this protocol to support our own language.

## Implementing the Language Server

Full Backend implementation can be found at the below GitHub repo

[HelloLS Websocket Launcher](https://github.com/NipunaMarcus/hellols/tree/websocket-launcher)

> **Note**: Here the LSP4J version is bumped to 0.21.0. If you want you can go higher. Previously we were using LSP4J 0.9.0.

## Prerequisites

Before start, we will be needing below installed in your local environment

- Java (v17)
- IDE of your choice that supports Java

> **Note**: You can choose another language as well but you need to find LSP implementation for each of those languages and then implementation would be similar except for the websocket part as I'm going to use Springboot for that.

Now you can follow along with below steps to impelement a basic Language Server.

### Step 1: Language Server Implementation

For the Language server implementation here I'm using [LSP4J](https://github.com/eclipse-lsp4j/lsp4j). As you can see there are three classes available under the language-server module. So these three classes are added to implement the three main interfaces provided by LSP4J as to the breakdown given in the LSP specification to support general cases, language features, and workspace management.

- HelloLanguageServer.java — This class implements the interface available in the LSP4J called LanguageServer which contains the general functionality of the language server such as initializing the language server, shutting down the language server and so on … Also if the LS needs to publish the diagnostics(compilation error and semantic errors) back to the Client (in our case VSCode plugin) LS needs to be client aware. To make the LS client aware we need to implement the LanguageClientAware interface which allows LS to get the language client instance.
- HelloTextDocumentService.java — This class implements the interface available in the LSP4J called TextDocumentService which contains the language features and the text synchronization endpoints explained in the LSP spec.
- HelloWorkspaceService.java — This class implements the interface available in the LSP4J called WorkspaceService which contains the workspace features such as workspace symbol and configuration changes…

Let's get to the implementation.

If you look at the `pom.xml` of the project you can see that there is a dependency for `LSP4J`.

```xml
<dependency>
    <groupId>org.eclipse.lsp4j</groupId>
    <artifactId>org.eclipse.lsp4j</artifactId>
    <version>${lsp4j.version}</version>
</dependency>
```

So this is the library that we will use to implement our Language Server for Hello Language.

So first let’s implement the `HelloLanguageServer.java` as it is the entry point to the LS.

```java
package langserver;

import org.eclipse.lsp4j.CompletionOptions;
import org.eclipse.lsp4j.InitializeParams;
import org.eclipse.lsp4j.InitializeResult;
import org.eclipse.lsp4j.ServerCapabilities;
import org.eclipse.lsp4j.TextDocumentSyncKind;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.services.LanguageClientAware;
import org.eclipse.lsp4j.services.LanguageServer;
import org.eclipse.lsp4j.services.TextDocumentService;
import org.eclipse.lsp4j.services.WorkspaceService;

import java.util.concurrent.CompletableFuture;

public class HelloLanguageServer implements LanguageServer, LanguageClientAware {
    private TextDocumentService textDocumentService;
    private WorkspaceService workspaceService;
    private LanguageClient client;
    private int errorCode = 1;

    public HelloLanguageServer() {
        this.textDocumentService = new HelloTextDocumentService();
        this.workspaceService = new HelloWorkspaceService();
    }

    @Override
    public CompletableFuture<InitializeResult> initialize(InitializeParams initializeParams) {
        // Initialize the InitializeResult for this LS.
        final InitializeResult initializeResult = new InitializeResult(new ServerCapabilities());

        // Set the capabilities of the LS to inform the client.
        initializeResult.getCapabilities().setTextDocumentSync(TextDocumentSyncKind.Full);
        CompletionOptions completionOptions = new CompletionOptions();
        initializeResult.getCapabilities().setCompletionProvider(completionOptions);
        return CompletableFuture.supplyAsync(()->initializeResult);
    }

    @Override
    public CompletableFuture<Object> shutdown() {
        // If shutdown request comes from client, set the error code to 0.
        errorCode = 0;
        return null;
    }

    @Override
    public void exit() {
        // Kill the LS on exit request from client.
        System.exit(errorCode);
    }

    @Override
    public TextDocumentService getTextDocumentService() {
        // Return the endpoint for language features.
        return this.textDocumentService;
    }

    @Override
    public WorkspaceService getWorkspaceService() {
        // Return the endpoint for workspace functionality.
        return this.workspaceService;
    }

    @Override
    public void connect(LanguageClient languageClient) {
        // Get the client which started this LS.
        this.client = languageClient;
    }
}
```

This class is implementing both `LanguageServer` and `LanguageClientAware` interfaces provided by LSP4J. From those interfaces, we get to override methods mentioned in the `General` section of the [LSP](https://microsoft.github.io/language-server-protocol/specifications/specification-3-14/). I will explain the main parts of LS implementation as other parts are mainly explained in the LSP and in HelloLS implementation using comments.

So if you have read the LSP specification you know the `initialize` is the entry method which LS and the LS Client initialize the connection and let the client know what capabilities(such as auto-completion, formatting, find all references) that the LS supports. You can find more details about this [here](https://microsoft.github.io/language-server-protocol/specifications/specification-3-14/#initialize).

So if you look in the `initialize` method implementation you can see we have added completion as the only capability supported by `HelloLS`.

Then let’s look at how we have set the two main services which provide language features and workspace manager functionality. We have override `getTextDocumentService()` and `getWorkspaceService()`. These two return instances of our `HelloTextDocumentService` class And `HelloWorkspaceService` class.

So let’s look into `HelloTextDocumentService` implementation.

```java
package langserver;

import org.eclipse.lsp4j.CompletionItem;
import org.eclipse.lsp4j.CompletionItemKind;
import org.eclipse.lsp4j.CompletionList;
import org.eclipse.lsp4j.CompletionParams;
import org.eclipse.lsp4j.DidChangeTextDocumentParams;
import org.eclipse.lsp4j.DidCloseTextDocumentParams;
import org.eclipse.lsp4j.DidOpenTextDocumentParams;
import org.eclipse.lsp4j.DidSaveTextDocumentParams;
import org.eclipse.lsp4j.jsonrpc.messages.Either;
import org.eclipse.lsp4j.services.TextDocumentService;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class HelloTextDocumentService implements TextDocumentService {
    @Override
    public CompletableFuture<Either<List<CompletionItem>, CompletionList>> completion(CompletionParams completionParams) {
        // Provide completion item.
        return CompletableFuture.supplyAsync(() -> {
            List<CompletionItem> completionItems = new ArrayList<>();
            try {
                // Sample Completion item for sayHello
                CompletionItem completionItem = new CompletionItem();
                // Define the text to be inserted in to the file if the completion item is selected.
                completionItem.setInsertText("sayHello() {\n    print(\"hello\")\n}");
                // Set the label that shows when the completion drop down appears in the Editor.
                completionItem.setLabel("sayHello()");
                // Set the completion kind. This is a snippet.
                // That means it replace character which trigger the completion and
                // replace it with what defined in inserted text.
                completionItem.setKind(CompletionItemKind.Snippet);
                // This will set the details for the snippet code which will help user to
                // understand what this completion item is.
                completionItem.setDetail("sayHello()\n this will say hello to the people");

                // Add the sample completion item to the list.
                completionItems.add(completionItem);
            } catch (Exception e) {
                //TODO: Handle the exception.
            }

            // Return the list of completion items.
            return Either.forLeft(completionItems);
        });
    }

    @Override
    public CompletableFuture<CompletionItem> resolveCompletionItem(CompletionItem completionItem) {
        return null;
    }

    @Override
    public void didOpen(DidOpenTextDocumentParams didOpenTextDocumentParams) {

    }

    @Override
    public void didChange(DidChangeTextDocumentParams didChangeTextDocumentParams) {

    }

    @Override
    public void didClose(DidCloseTextDocumentParams didCloseTextDocumentParams) {

    }

    @Override
    public void didSave(DidSaveTextDocumentParams didSaveTextDocumentParams) {

    }

}
```

If you have a look at the override methods you can see that implementing `TextDocumentService` class from LSP4J given us interfaces for all the language features except for workspace management. As I only implementing a sample completion I have implemented only the completion method keeping other methods returning empty.

So if you look at the implementation I’m just creating a `CompletionItem` and filling it with what type of completion item is this and what is the text to be inserted and description and label of the completion item.

If you have a language AST or Source processor(string processor), this is the place where you can put your logic to filter out what to be provided as completion based on the line, column and the file which are provided as a parameter to the `completion()` method as `CompletionParams`.

I implemented the WorkspaceService from LSP4J in `HelloWorspaceService` but did not implement any Workspace related features as we are doing a simple LS implementation here (Let's leave it for a future series where we have a simple parser for our Hello language).

### Step 2: Expose LS functionality via WebSocket

In this WebSocket service implementation what I have used is SpringBoot starter kit for WebSockets. Language Server Implementation hasn’t change and only the Launcher of the Language Server has changed.

What I have used in this WebSocket Launcher implementation is that the WebSocket that handles Text messages.

```java
package launcher;

import langserver.HelloLanguageServer;
import org.eclipse.lsp4j.jsonrpc.Launcher;
import org.eclipse.lsp4j.services.LanguageClient;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;

public class LanguageServerWebSocketHandler extends TextWebSocketHandler {
    private HelloLanguageServer languageServer;
    private WebSocketMessageHandler messageHandler;

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        System.out.println(message.toString());
        System.out.println(session.getAttributes());
        if (messageHandler != null) {
            messageHandler.onMessage(message.getPayload());
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("connection established. sessionId: " + session.getId() + ", Client: " + session.getRemoteAddress());
        try{
            languageServer = new HelloLanguageServer();
            messageHandler = new WebSocketMessageHandler();
            WebSocketLauncherBuilder<LanguageClient> builder = new WebSocketLauncherBuilder<>();
            builder
                    .setSession(session)
                    .setMessageHandler(messageHandler)
                    .setLocalService(languageServer)
                    .setRemoteInterface(LanguageClient.class);
            Launcher<LanguageClient> languageClientLauncher = builder.create();
            languageServer.connect(languageClientLauncher.getRemoteProxy());
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        System.out.println("Shutdown language server due to an error.");
        languageServer.shutdown();
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        System.out.println("Shutting down language server.");
        languageServer.shutdown();
    }
}
```

This is the class that handles the JSON RPC messages send from the WebEditor WebSocket. It will receive the messages as a text and then using message handlers it will parse it to JSON RPC and pass on to LSP4J JSON RPC handler.

### Step 3 - Build and Run the Language Server

You can build the project using bellow command in your terminal as we are using Maven for the builder.

```shell
mvn clean install
```

to run the program, after building, you can use below command.

```shell
java -jar target/hellols-0.0.1-SNAPSHOT.jar
```

Happy Coding!

**Next**

- [Develop a Web Editor With React and Monaco with Language Server support](https://software-engineering-corner.zuehlke.com/develop-a-web-editor-with-react-and-monaco-with-language-server-support)
- [Develop a Web Editor With Angular And Monaco with Language Server support](https://software-engineering-corner.zuehlke.com/develop-a-web-editor-with-angular-and-monaco-with-language-server-support)
