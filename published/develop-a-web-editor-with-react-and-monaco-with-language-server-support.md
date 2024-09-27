---
title: Develop a Web Editor for your DSL using React and Monaco Editor library with Language Server support
domain: software-engineering-corner.hashnode.dev
tags: Web Editor, Monaco, Monaco Language Client, Language Server, LSP
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1720940174478/yjy4aJtIT.gif?auto=format
publishAs: NipunaMarcusZuhlke
seriesSlug: editor-with-ls-support
hideFromHashnodeCommunity: false
---

# Develop a Web Editor for your DSL using React and Monaco Editor library

As of now all most all of the world services are moving to cloud and becoming digitalize. Even the countries which were behind this digital transformation was hurried in to digitalization because of the past pandemic. Well this is not that relevant to the topic i’m gonna discuss here but.. well.. at least we are trying to move code editing tool we used to have in our local machine to be a online service where many features like code editing and code review can be easily integrated in to more collaborative space.

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

## Implementing the Web Editor

You can find the complete implementation of this editor in below GitHub repo below.

[React Webeditor Implementation](https://github.com/NipunaMarcus/web-editor/tree/websocket-ls)

Also the Language Server that is used for this example is available in this repo.

[HelloLS Websocket Launcher](https://github.com/NipunaMarcus/hellols/tree/websocket-launcher)

### Prerequisites

Before start, we will be needing below items

- node (v20.10.0)
- npm (v10.2.3)
- Basic knowledge of TypeScript
- Basic knowledge of React
- Java (v17)

## Architecture

Architecture of the Web Editor will be as below.

![Architecture](https://cdn.hashnode.com/res/hashnode/image/upload/v1717742534914/GzLBzavNE.png?auto=format)

You can follow below steps to implement the Web editor.

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
    "vscode-ws-jsonrpc": "^3.3.1",
    "vscode-languageclient": "8.0.2"
  }
}
```

If you look at the `Dev Dependencies` you can see that we are using react 18, typescript and packager will be Vite.

if you look at the `Dependencies` you can see that there are five dependencies which are related to Monaco Editor implementation.

- [monaco-editor](https://www.npmjs.com/package/monaco-editor): Core library for Monaco.
- [monaco-languageclient](https://www.npmjs.com/package/monaco-languageclient): Language Server client impl for Monaco.
- [react-monaco-editor](https://www.npmjs.com/package/react-monaco-editor)
- [vscode-ws-jsonrpc](https://www.npmjs.com/package/vscode-ws-jsonrpc): Websocket-JsonRPC interface by vscode.
- [vscode-languageclient](https://www.npmjs.com/package/vscode-languageclient): interface between monaco languageclient and vscode base language client which will map json rpc messages.

Next lets create the files needed for the `Vite` builder and `TypeScripts`. For these I'm not going to explain in detail as these are pretty much common knowledge for `Vite` and `TypeScript`. You can find related files here.

- [vite.config.ts](https://github.com/NipunaMarcus/web-editor/blob/websocket-ls/vite.config.ts)
- [tsconfig.json](https://github.com/NipunaMarcus/web-editor/blob/websocket-ls/tsconfig.json)

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

const LS_WS_URL = "ws://localhost:8080/ls";
export function connectToLs() {
  return new Promise((resolve, reject) => {
    const webSocket = new WebSocket(LS_WS_URL);

    webSocket.onopen = () => {
      console.log("LS WebSocket connection Open");
      const socket = toSocket(webSocket);
      const reader = new WebSocketMessageReader(socket);
      const writer = new WebSocketMessageWriter(socket);
      const languageClient = new MonacoLanguageClient({
        name: `${HELLO_LANG_ID} Language Client`,
        clientOptions: {
          documentSelector: [HELLO_LANG_ID],
          errorHandler: {
            error: () => ({ action: ErrorAction.Continue }),
            closed: () => ({ action: CloseAction.DoNotRestart }),
          },
        },
        connectionProvider: {
          get: () => Promise.resolve({ reader, writer }),
        },
      });

      languageClient.start();
      resolve(languageClient);
    };

    webSocket.onerror = (error) => {
      console.log("LS WebSocket connection Open");
      reject(error);
    };
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
      closed: () => ({ action: CloseAction.DoNotRestart }),
    },
  },
  connectionProvider: {
    get: () => Promise.resolve({ reader, writer }),
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
    extensions: [HELLO_LANG_EXTENSION],
  });
};
```

This will tell Monaco editor to not to rely on defined languages and treat all source as a custom language. If developer didn’t do this Monaco editor won’t send messages using Monaco Language Client.

**createModel()**: This will create a new Monaco Editor model with a file URI. If we didn’t create this model Monaco will use the default model which uses a in memory file URI which will cause issues when comes to LS.

```typescript
export const createModel = (): monaco.editor.ITextModel =>
  monaco.editor.createModel(
    "",
    HELLO_LANG_ID,
    monaco.Uri.parse(`file:///hello-${Math.random()}${HELLO_LANG_EXTENSION}`)
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

- Make sure you run the backend ( The Language Server ) and then run the frontend as WebSocket client is initialize as soon as the Monaco Editor mount to the DOM.
- If you are bumping the Monaco library versions or any related library version make sure you bump surrounding libraries to compatible versions.
- Check the LSP4J version and Monaco-LanguageClient version implements the same LSP specification.

Happy Coding!

**Next**

- [Develop a Web Editor With Angular and Monaco with Language Server support](https://software-engineering-corner.zuehlke.com/develop-a-web-editor-with-angular-and-monaco-with-language-server-support)

**Previous**

- [Develop your own language server](https://software-engineering-corner.zuehlke.com/develop-your-own-language-server)
