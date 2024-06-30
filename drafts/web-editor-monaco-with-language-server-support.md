---
title: Create a custom web editor using Monaco and Language Server Protocol (LSP)
domain: software-engineering-corner.hashnode.dev
tags: Web Editor, Monaco, Monaco Language Client, Language Server, LSP
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1719718605895/bv2LfyFWS.jpg?auto=format
publishAs: cjayashantha, NipunaMarcusZuhlke
hideFromHashnodeCommunity: false
--- 

# Create a custom web editor using Monaco and Language Server Protocol (LSP)

If you are developing a domain-specific language or custom language, chances are high that current editors might not support features such as syntax highlighting, diagnostics, and code autocompletion. To enable these features, you need a Language Server Protocol (LSP) and sometimes a custom editor. In this article, we will discuss how to develop a web editor and connect it to a language server using the WebSocket protocol.

### What is Monaco Editor?
Monaco Editor is the code editor that powers Visual Studio Code, known for its performance, rich API, and extensive feature set. It offers:

- Syntax highlighting 
- IntelliSense (auto-completion)
- Code navigation (go to definition, find references)
- Multiple language support

### What is Language Server Protocol (LSP) ?
LSP is a protocol used to provide language-specific features in a language-agnostic way. It decouples the editor from the language-specific logic, allowing you to support various languages with minimal effort. LSP offers:

- Syntax checking
- Auto-completions 
- Hover information
- Code formatting
- Refactorings

# Creating Web Editor

Let's start developing a web editor for a custom language server.

For this example, we will develop our own mock language server fronted with websocket. Full implementation available at below location

https://github.com/NipunaMarcus/hellols/tree/websocket-launcher


## Prerequisites
Before start, we will be needing below items

- node (v20.10.0)
- npm (v10.2.3)
- Basic knowledge of TypeScript
- Basic knowledge of Angular or React
- Java (v17) 


## Architecture


![Architecture](https://cdn.hashnode.com/res/hashnode/image/upload/v1717742534914/GzLBzavNE.png?auto=format)

## Creating the Language Server
Full Backend implementation can be found at the below GitHub repo

[HelloLS Websocket Launcher](https://github.com/NipunaMarcus/hellols/tree/websocket-launcher)

> **Note**: Here the LSP4J version is bumped to 0.21.0. If you want you can go higher. Previously we were using LSP4J 0.9.0.

### Step 1: Language Server Implementation
For the Language server implementation here I'm using [LSP4J](https://github.com/eclipse-lsp4j/lsp4j). As you can see there are three classes available under the language-server module. So these three classes are added to implement the three main interfaces provided by LSP4J as to the breakdown given in the LSP specification to support general cases, language features, and workspace management.

* HelloLanguageServer.java — This class implements the interface available in the LSP4J called LanguageServer which contains the general functionality of the language server such as initializing the language server, shutting down the language server and so on … Also if the LS needs to publish the diagnostics(compilation error and semantic errors) back to the Client (in our case VSCode plugin) LS needs to be client aware. To make the LS client aware we need to implement the LanguageClientAware interface which allows LS to get the language client instance.
* HelloTextDocumentService.java — This class implements the interface available in the LSP4J called TextDocumentService which contains the language features and the text synchronization endpoints explained in the LSP spec.
* HelloWorkspaceService.java — This class implements the interface available in the LSP4J called WorkspaceService which contains the workspace features such as workspace symbol and configuration changes…

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

## Creating Web Editor using Angular

You can find the complete implementation of this editor in below GitHub repo below.

[Angular Webeditor Implementation](https://github.com/cjayashantha/web-editor)

### Step 1: Create New Angular Project

- To create new Angular project, we will be using Angular CLI

```shell
ng new web-editor
```

- Navigate to generated project folder
```shell
cd web-editor
```

### Step 2: Installing Monaco Language Client

The latest version of Monaco Language Client at the time of writing this article is version 8.4.0. With this version, the development team (TypeFox) suggests using their wrapper for the editor instead of directly using the Monaco Editor.

We will be installing the following npm dependencies to add the Monaco Editor and language client.

- [Monaco Language Client](https://www.npmjs.com/package/monaco-languageclient) 
- [Monaco Editor Wrapper](https://www.npmjs.com/package/monaco-editor-wrapper)
- [VSCode WebSocket JSON RPC](https://www.npmjs.com/package/vscode-ws-jsonrpc)

```shell
npm i monaco-languageclient vscode-ws-jsonrpc monaco-editor-wrapper
```

After installing all the dependencies, the `package.json` file will look like the example below
```json
{
  "name": "web-editor",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^18.0.0",
    "@angular/common": "^18.0.0",
    "@angular/compiler": "^18.0.0",
    "@angular/core": "^18.0.0",
    "@angular/forms": "^18.0.0",
    "@angular/platform-browser": "^18.0.0",
    "@angular/platform-browser-dynamic": "^18.0.0",
    "@angular/router": "^18.0.0",
    "monaco-editor-wrapper": "^5.1.2",
    "monaco-languageclient": "^8.4.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "vscode-ws-jsonrpc": "^3.3.1",
    "zone.js": "~0.14.3"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^18.0.2",
    "@angular/cli": "^18.0.2",
    "@angular/compiler-cli": "^18.0.0",
    "@types/jasmine": "~5.1.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.4.2"
  }
}
```

### Step 3: Create Editor

To keep things minimal, We will use the generated app component files.

Since we are using the Monaco Editor Wrapper, we only need to create a new `div` tag in the HTML file and pass that element to the `MonacoEditorLanguageClientWrapper`.

_app.component.html_

```html
<div #editor class="editor"></div>
```

**Styling**

We will add the following styles to make the editor take up the full height and width of the screen.

_app.component.scss_
```scss
.editor {
  height: 100vh;
  width: 100%;
}
```

_app.component.ts_

```typescript
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  MonacoEditorLanguageClientWrapper,
  UserConfig,
} from 'monaco-editor-wrapper';
import { lsConfig } from './configs/ls.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  
  @ViewChild('editor')
  editorElement!: ElementRef;

  async ngAfterViewInit(): Promise<void> {
    const wrapper = new MonacoEditorLanguageClientWrapper();
    try {
      await wrapper.dispose();
      await wrapper.initAndStart(lsConfig, this.editorElement.nativeElement);
    } catch (e) {
      console.error(e);
    }
  }
}
```

In the line `wrapper.initAndStart`, you can see that we are passing `lsConfig` as a parameter to initialize the editor. 

Below is the minimal configuration that should be passed to the method to connect to the language server using WebSocket.

_ls.config.ts_
```typescript
import { UserConfig } from 'monaco-editor-wrapper';

export const LANG_ID = 'hello';
export const LANG_EXTENSION = 'hello';

const LS_WS_URL = 'ws://localhost:8080/ls';

export const lsConfig: UserConfig = {
  wrapperConfig: {
    editorAppConfig: {
      $type: 'classic',
      codeResources: {
        main: {
          text: '',
          fileExt: LANG_EXTENSION,
        },
      },
      useDiffEditor: false,
      languageDef: {
        languageExtensionConfig: {
          id: LANG_ID,
          extensions: [LANG_EXTENSION],
        },
      },
    },
  },
  languageClientConfig: {
    languageId: LANG_ID,
    options: {
      $type: 'WebSocketUrl',
      url: LS_WS_URL,
      startOptions: {
        onCall: () => {
          console.log('Connected to socket.');
        },
        reportStatus: true,
      },
      stopOptions: {
        onCall: () => {
          console.log('Disconnected from socket.');
        },
        reportStatus: true,
      },
    },
  },
};
```

### Step 4: Introduce Syntax Highlighting 

To enable syntax highlighting in the Monaco editor, we need to provide language syntax definitions. You can read more about this in the following [link](https://microsoft.github.io/monaco-editor/monarch.html). We will add an example configuration to support syntax highlighting.

```typescript
import * as monaco from 'monaco-editor';


export const syntaxDefinitions: monaco.languages.IMonarchLanguage = {
  typeKeywords: [
    'boolean', 'double', 'byte', 'int', 'short', 'char', 'void', 'long', 'float'
  ],

  keywords: [
    'abstract', 'continue', 'for', 'new', 'switch', 'assert', 'goto', 'do',
    'if', 'private', 'this', 'break', 'protected', 'throw', 'else', 'public',
    'enum', 'return', 'catch', 'try', 'interface', 'static', 'class',
    'finally', 'const', 'super', 'while', 'true', 'false'
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
    '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
    '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
    '%=', '<<=', '>>=', '>>>='
  ],

  // we include these common regular expressions
  symbols: /[=><!~?:&|+\-*/^%]+/,

  tokenizer: {
    root: [
      // identifiers and keywords
      [/[a-z_$][\w$]*/, { cases: { '@typeKeywords': 'keyword',
                                   '@keywords': 'keyword',
                                   '@default': 'identifier' } }],
      [/[A-Z][\w\$]*/, 'type.identifier' ],  // to show class names nicely

      // whitespace
      { include: '@whitespace' },

      // delimiters and operators
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, { cases: { '@operators': 'operator',
                              '@default'  : '' } } ],

      // @ annotations.
      // As an example, we emit a debugging log message on these tokens.
      // Note: message are supressed during the first load -- change some lines to see them.
      // [/@\s*[a-zA-Z_\$][\w\$]*/, { token: 'annotation', log: 'annotation token: $0' }],

      // numbers
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // strings
      [/"([^"\\]|\\.)*$/, 'string.invalid' ],  // non-teminated string
      [/"/,  { token: 'string.quote', bracket: '@open', next: '@string' } ],

      // characters
      [/'[^\\']'/, 'string'],
      // [/(')(@escapes)(')/, ['string','string.escape','string']],
      [/'/, 'string.invalid']
    ],

    comment: [
      [/[^\/*]+/, 'comment' ],
      [/\/\*/,    'comment', '@push' ],    // nested comment
      ["\\*/",    'comment', '@pop'  ],
      [/[\/*]/,   'comment' ]
    ],

    string: [
      [/[^\\"]+/,  'string'],
      // [/@escapes/, 'string.escape'],
      [/\\./,      'string.escape.invalid'],
      [/"/,        { token: 'string.quote', bracket: '@close', next: '@pop' } ]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/,       'comment', '@comment' ],
      [/\/\/.*$/,    'comment'],
    ],
  },
};
```

Then we need to update the `languageDef` section in the `ls.config.ts` file by setting the `syntaxDefinitions` into the `monarchLanguage` property as shown below:
```typescript
  languageDef: {
    languageExtensionConfig: {
      id: LANG_ID, 
      extensions: [LANG_EXTENSION],
    },
    monarchLanguage: syntaxDefinitions,
  },
```

After adding the language syntax definitions, the final configuration file will look like the example below:

_ls.config.ts_
```typescript
import { UserConfig } from 'monaco-editor-wrapper';

export const LANG_ID = 'hello';
export const LANG_EXTENSION = 'hello';

const LS_WS_URL = 'ws://localhost:8080/ls';

export const lsConfig: UserConfig = {
  wrapperConfig: {
    editorAppConfig: {
      $type: 'classic',
      codeResources: {
        main: {
          text: '',
          fileExt: LANG_EXTENSION,
        },
      },
      useDiffEditor: false,
      languageDef: {
        languageExtensionConfig: {
          id: LANG_ID,
          extensions: [LANG_EXTENSION],
        },
        monarchLanguage: syntaxDefinitions,
      },
    },
  },
  languageClientConfig: {
    languageId: LANG_ID,
    options: {
      $type: 'WebSocketUrl',
      url: LS_WS_URL,
      startOptions: {
        onCall: () => {
          console.log('Connected to socket.');
        },
        reportStatus: true,
      },
      stopOptions: {
        onCall: () => {
          console.log('Disconnected from socket.');
        },
        reportStatus: true,
      },
    },
  },
};
```

### Step 5: Starting up the language server and web editor

Starting the language server

```shell
java -jar target/hellols-0.0.1-SNAPSHOT.jar
```

Starting the Angular application

```shell
ng serve
```

below is the final look.

![web-editor](https://cdn.hashnode.com/res/hashnode/image/upload/v1717756040911/IFeF6apmJ.png?auto=format)

## Creating Web Editor using React
You can find the complete implementation of this editor in below GitHub repo below.

[React Webeditor Implementation](https://github.com/NipunaMarcus/web-editor/tree/websocket-ls)

### Step 1: Create new React project

To do this you can use few methods and the simplest one whould be 
use [create react app](https://create-react-app.dev/) tool.

But who likes doing things easily right, so let's do it the good old hard way.
Let's first create a node app. You can use the below command. 

```shell
npm init
```
This will generate the package.json for the module ( learn more about it [here](https://docs.npmjs.com/cli/v8/commands/npm-init#examples)). As for the file structure you can create as below.

![File Structure](https://cdn.hashnode.com/res/hashnode/image/upload/v1718590023215/43PvPy3Pf.png?auto=format)

Above structure will be our first file and folder structure for the project.

### Step 2: Install Monaco related dependencies and setup the app.
Let's have a look at the package.json.

```json
{
    "name": "web-editor",
    "version": "0.0.1",
    "license": "MIT",
    "scripts": {
        "build": "tsc & vite build",
        "dev": "vite"
    },
    "devDependencies": {
        "@types/react": "^18.2.43",
        "@types/react-dom": "^18.2.17",
        "@vitejs/plugin-react": "^4.3.0",
        "typescript": "^5.4.5",
        "vite": "^5.2.11"
    },
    "dependencies": {
        "monaco-editor": "0.36.1",
        "monaco-languageclient": "5.0.1",
        "react": "^17.0.2",
        "react-dom": "^17.0.2",
        "react-monaco-editor": "^0.52.0",
        "vscode-ws-jsonrpc":"^3.3.1",
        "vscode-languageclient": "8.0.2"
    }
}
```
If you look at the `Dev Dependencies` you can see that we are using react 18, typescript and packager will be Vite.

if you look at the `Dependencies` you can see that there are five dependencies which are related to Monaco Editor implementation.

* [monaco-editor](https://www.npmjs.com/package/monaco-editor): Core library for Monaco.
* [monaco-languageclient](https://www.npmjs.com/package/monaco-languageclient): Language Server client impl for Monaco.
* [react-monaco-editor](https://www.npmjs.com/package/react-monaco-editor)
* [vscode-ws-jsonrpc](https://www.npmjs.com/package/vscode-ws-jsonrpc): Websocket-JsonRPC interface by vscode.
* [vscode-languageclient](https://www.npmjs.com/package/vscode-languageclient): interface between monaco languageclient and vscode base language client which will map json rpc messages.

Next lets create the files needed for the `Vite` builder and `TypeScripts`. For these I'm not going to explain in detail as these are pretty much common knowledge for `Vite` and `TypeScript`. You can find related files here.
* [vite.config.ts](https://github.com/NipunaMarcus/web-editor/blob/websocket-ls/vite.config.ts)
* [tsconfig.json](https://github.com/NipunaMarcus/web-editor/blob/websocket-ls/tsconfig.json)

Now the basic setting up of the application is done let's move to next step.

### Step 3: Implement websocket client

After implementation folder structure in source root `src` will look similar to below. 

![Updated Project](https://cdn.hashnode.com/res/hashnode/image/upload/v1718606152263/_RsMPwEhX.png?auto=format)

Now lets look at the `ls-client/ws-client.ts` file which contains the implementation for the websocket client.

```typescript
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from "vscode-ws-jsonrpc";
import { CloseAction, ErrorAction } from "vscode-languageclient";
import { MonacoLanguageClient } from "monaco-languageclient";
import { HELLO_LANG_ID } from "../editor/constants";

const LS_WS_URL = 'ws://localhost:8080/ls'
export function connectToLs() {
    return new Promise((resolve, reject) => {
        const webSocket = new WebSocket(LS_WS_URL);

        webSocket.onopen = () => {
            console.log('LS WebSocket connection Open');
            const socket = toSocket(webSocket);
            const reader = new WebSocketMessageReader(socket);
            const writer = new WebSocketMessageWriter(socket);
            const languageClient = new MonacoLanguageClient({
                name: `${HELLO_LANG_ID} Language Client`,
                clientOptions: {
                    documentSelector: [HELLO_LANG_ID],
                    errorHandler: {
                        error: () => ({ action: ErrorAction.Continue }),
                        closed: () => ({ action: CloseAction.DoNotRestart })
                    }
                },
                connectionProvider: {
                    get: () => Promise.resolve({reader, writer}),
                },
            });

            languageClient.start();
            resolve(languageClient);
        }

        webSocket.onerror = (error) => {
            console.log('LS WebSocket connection Open');
            reject(error);
        }
    });
}
```
here if you look at the connectToLs() function you can see that we have Opened a WebSocket connection for the LS_WS_URL.

```typescript
const webSocket = new WebSocket(LS_WS_URL);
```

then if the connection is open successfully then we are connecting the WebSocket messages to vscode-ws-jsonrpc library to define incoming ( read) and outgoing (write) serialization JSON RPC messages from LS to WebEditor and vise versa.

```typescript
const socket = toSocket(webSocket);
const reader = new WebSocketMessageReader(socket);
const writer = new WebSocketMessageWriter(socket);
const languageClient = new MonacoLanguageClient({
    name: `${HELLO_LANG_ID} Language Client`,
    clientOptions: {
        documentSelector: [HELLO_LANG_ID],
        errorHandler: {
            error: () => ({ action: ErrorAction.Continue }),
            closed: () => ({ action: CloseAction.DoNotRestart })
        }
    },
    connectionProvider: {
        get: () => Promise.resolve({reader, writer}),
    },
 });
```
Then once we have define the LanguageClient with appropriate reader and writer we can start the Language Client as below.

```typescript
languageClient.start();
```

Then the Most important question is where do we initialize the WebSocket connection?

So initialization of the WebSocket can be done inside the EditorDidMount() callback function which explained in the next step.

### Step 4: Implement the code editor
let's look at the `editor` component.

```typescript
import MonacoEditor, { EditorDidMount } from "react-monaco-editor";
import { connectToLs } from "../ls-client/ws-client";
import { HELLO_LANG_ID, MONACO_OPTIONS } from "./constants";
import { createModel, registerLanguage } from "./util";

export function Editor() {
    const editorDidMount: EditorDidMount = (editor) => {
        registerLanguage();
        const model = createModel();
        editor.setModel(model);
        connectToLs();
        editor.focus();
    };

    return (
        <div>
            <div>
                <h3>Web Editor</h3>
            </div>
            <div>
                <MonacoEditor
                    width="100%"
                    height="80vh"
                    language={HELLO_LANG_ID}
                    theme="vs"
                    options={MONACO_OPTIONS}
                    editorDidMount={editorDidMount}
                />
            </div>
        </div>
    );
}
```
Above is the minimal configurations for the basic Monaco Editor with Language Server support.

If you check the component function you can see that it returning `<MonacoEditor />` component. So there are few props you need to pass into the MonacoEditor component to get it working and among those you have very basic props which are `width` `height` `language` `theme` `options` and `editorDidMount`.

`width` and `height` will set the height and width of the editor. These are accepting css units.

Using `language` prop you can set the language that Monaco editor suppose to support. This will decide upon what syntax highlighting and Language feature configurations to be added from Monaco side. Also you can register your own language here and add syntax highlighting and Language features for that language as we are doing here.

For `theme` you can use built in themes or you can define a theme and then customize how your editor looks. For now i have used the default theme. Even if you didn’t add this property editor will set it theme to default.

In `options` property you can provide options for the editor based on to what functionality you are going to create using this editor ( Diff editor or an editor). Here I have created an editor which only has one editor which has the capability of opening one file so I have passed options related to that use case. I’m not gonna explain each and every options we can pass as those are explained in the Monaco website.

next let’s look at `editorDidMount` property. This property expect a call back to be bound which will be called once the editor is mounted to the DOM. It is a similar case to `componentDidMount` event in React. When executing this function will pass you the current Monaco editor. Also inside this function you can initiate to bind your editor with the monaco-langclient which will help you bind language features to your editor. This will help you to bind your editor with your Language Server to provide rich language editing experience.

If we look in to `editorDidMount` callback implementation you can see there are few functiona that are called in order to get the editor ready and connect to LS.

```typescript
const editorDidMount: EditorDidMount = (editor) => {
    registerLanguage();
    const model = createModel();
    editor.setModel(model);
    connectToLs();
    editor.focus();
};
```
Let's go through those called functions one by one.

**registerLanguage()**: This function will perform a crucial configuration for the Monaco editor which is registering our Custom Language.
```typescript
export const registerLanguage = () => {
    monaco.languages.register({
        id: HELLO_LANG_ID,
        aliases: [HELLO_LANG_ID],
        extensions: [HELLO_LANG_EXTENSION]
    });
}
```
This will tell Monaco editor to not to rely on defined languages and treat all source as a custom language. If developer didn’t do this Monaco editor won’t send messages using Monaco Language Client.

**createModel()**: This will create a new Monaco Editor model with a file URI. If we didn’t create this model Monaco will use the default model which uses a in memory file URI which will cause issues when comes to LS.
```typescript
export const createModel = (): monaco.editor.ITextModel => monaco.editor.createModel(
    '',
    HELLO_LANG_ID,
    monaco.Uri.parse(
        `file:///hello-${Math.random()}${HELLO_LANG_EXTENSION}`
    )
);
```
this is just a mock file URI that has been added but in case you have actual file URI please add that path. Our WebEditor is not implemented to actually handle files on the file system.

Next set the created editor model to mounted editor as below.
```typescript
editor.setModel(model);
```
After preparing the Monaco Editor, the next step is to connect the Monaco Language Client to WebSocket. This is where we call the connectToLs().
```typescript
connectToLs();
```
That's it for the implementation

### Step 5: Starting up the language server and web editor
Well That’s it. Now it should be ready to go.

You can build the Frontend using below command

```shell
npm run build
```
And you can run the Frontend using below command
```shell
npm run dev
```
to start the language server use below command

```shell
java -jar target/hellols-0.0.1-SNAPSHOT.jar
```
Here is the final look.

![React Web Editor](https://cdn.hashnode.com/res/hashnode/image/upload/v1719713207751/GDUJ_Rq1a.jpeg?auto=format)

## Important Facts
* Make sure you run the backend and then run the frontend as WebSocket client is initialize as soon as the Monaco Editor mount to the DOM.
* If you are bumping the Monaco library versions or any related library version make sure you bump surrounding libraries to compatible versions.
* Check the LSP4J version and Monaco-LanguageClient version implements the same LSP specification.