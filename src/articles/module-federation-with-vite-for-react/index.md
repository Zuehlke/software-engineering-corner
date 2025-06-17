---
title: Micro Frontend - Module Federation with Vite for React
description: >-
  Module federation enables the composition of independently built and deployed
  applications into a unified frontend experience. This architecture, similar to
  microservices, allows for runtime integration of remote components, offering
  flexibility in development and deployment. Key to implementation is
  configuring both remote and host applications, defining exposed components and
  shared dependencies, and choosing between static imports and dynamic loading
  for remote modules.
released: '2023-05-15T09:28:20.499Z'
cover: images/cover.webp
author: Nipuna Marcus
tags:
  - Microfrontend
  - module federation
  - React
  - vite
  - Web Development
---
With the introduction to the [Microservice](https://martinfowler.com/articles/microservices.html) architecture for the backend, developers were looking into developing a similar architecture for frontend applications which is what we now know as [Micro frontends](https://micro-frontends.org/).
This architecture has a similar set of pros and cons as Microservices but for the frontend. One of the implementations to achieve this architecture from bundling tools such as Webpack and Vite is called Module Federation.

## What is Module Federation?

Module federation is a concept that gets different builds to come together to make one application. So in most cases, one will be the host application which will bring all other remote components that are built to be shared.

![How federation looks like](images/1749947965055-aet3t1ctloh.png)

Figure 1 shows a rough explanation of how it works. In the host application, there will be a reference to each remote component as an import or a Lazy Loaded module.
At the remote servers where each “HomePage App” and “Payment App” is hosted, shared components are packaged into a JavaScript module and will be publicly available as built JavaScript files (in the above example “homepage.js” and “payment.js”).
Then from the host application side, these remote components will be brought in at runtime as a JavaScript module and will be treated as components in the hosted application.

More details can be found [here](https://webpack.js.org/concepts/module-federation/) about the concept of Module Federation.

## How to use module federation in Vite?

To get the module federation functionality we need to add a plugin to Vite. [Plugin can be found here](https://github.com/originjs/vite-plugin-federation).

There is always a minimum of two places where we need to configure to get the module federation functionality. One configuration should be applied on the remote application where we have the components to be shared to tell Vite which components will be shared as modules and what is the entry name for the build.
The other Configuration should be applied on the host application side where we going to use the federated modules.

Following are the configurations to be applied on both sides.

## Remote Application Basic Configuration

```typescript
export default defineConfig({
    plugins: [
        react(),
        federation({
             name: 'remotecomponent1',
             filename: 'remotecomponent1.js',
             exposes: {
                 './Button': './src/components/buttons.tsx'
             },
             shared: ['react', 'react-dom', 'react-router-dom'],
        }),
    ]
});

```

Let’s go through each of the fields in the federation plugin.

**Name**: is the module name to be given to the JavaScript module that will be built including shared components. This is required. More details can be found [here](https://github.com/originjs/vite-plugin-federation#name-string).

**FileName**: is the Filename of the entry file for the JavaScript module. This is not required though as the default value for this will be `remoteEntry.js`. More details can be found [here](https://github.com/originjs/vite-plugin-federation#filenamestring).

**Exposes**: this is where we need to list down the components that we are going to expose as remote components with the remote module. More details can be found [here](https://github.com/originjs/vite-plugin-federation#exposes).

**NOTE**: All the exposing components should export the react component as a default export. Otherwise, it will not be able to integrate without an issue from the Host application side as there are not enough details to import individual export from a react component.

**Shared**: This is a bit of a complex property. When it comes to libraries like react we need to have one instance shared between all the libraries to handle states of components without an issue. So when we are working with remote modules we need a way to use one react instance in both the remote module and the host application. To achieve this we need to describe what libraries will be shared between the host and the remote modules. This property will enable us to list those libraries. So we need to add this property in both host-side configuration and remote application-side configuration and add the same list of libraries on both sides to indicate what needs to be shared. More details on the property can be found [here](https://github.com/originjs/vite-plugin-federation#shared).

## Host Application Basic Configuration

There are two ways to configure a host application to bring in remote modules. One is directly referring to the URL of the remote module entry file. The second is, dynamically populate the reference. Both have a similar set of properties as to the remote side except for the property remotes. As Name and Shared property are the same as explained above following is the explanation for remotes property.

Remotes: holds references to entry files of remote modules. Following are examples of how we can use remotes property. More details can be found [here](https://github.com/originjs/vite-plugin-federation#remotes).

### Get the remote component using the URL

```typescript
export default defineConfig({
    plugins: [
        react(),
        federation({
             name: 'remotecomponent1',
             remotes: {
                 sharedComp: 'http://localhost:3001/assets/remotecomponent1.js',
             },
             shared: ['react', 'react-dom', 'react-router-dom'],
        }),
    ]
});
```

### Get the Remote component by applying the URL dynamically

```typescript
export default defineConfig({
    plugins: [
        react(),
        federation({
             name: 'remotecomponent1',
             remotes: [
                 {
                     sharedComp: {
                         external: `Promise.resolve(window.remoteURL)`,
                         from: 'vite',
                         externalType: 'promise',
                     },
                 },
             ],
             shared: ['react', 'react-dom', 'react-router-dom'],
        }),
    ]
});
```

**External**: This can be the address of the remote module, basically the URL or a Promise. More details can be found [here](https://github.com/originjs/vite-plugin-federation#externalstringpromisestring).

**From**: will let the Vite know that from where the remote module coming from. Whether it’s coming from Webpack or Vite. More details can be found [here](https://github.com/originjs/vite-plugin-federation#from--vitewebpack).

**ExternalType**: will set what type of external reference will be used in an external property. So the value for this can be a URL or a promise. More details can be found [here](https://github.com/originjs/vite-plugin-federation#externaltype-urlpromise).

**NOTE**: *Here in the sample we are using `window.remoteURL` to get the URL. So this is set from the host application start-up. so this property can be set on `app.tsx` or somewhere which is the root component of the application.*

## How to use the remote module inside the host application

There are two ways to use remote modules in a component in the host application.

### As a Static Import

We can always add the remote module as a static import inside a react component.

```typescript
import Button from 'sharedComp/Button';

function App() {
  return (
    <div className="App">
      <div className="card">
        <Button />
      </div>
    </div>
  )
}

export default App;
```

This is fine but as to the performance and reliability, this is not the most promising way. I have faced a few issues when comes to this method. Also using this it's hard to handle network-level issues.

### As a Lazy loaded module

This is to load the remote module using lazy loading to up the performance and network issue handling.

```typescript
import {lazy, Suspense} from 'react';
const Button = lazy(() => import('sharedComp/Button') as any);
function App() {
  return (
    <div className="App">
      <div className="card">
        <Suspense fallback={<div>Loading...</div>}>
          <Button />
        </Suspense>
      </div>
    </div>
  )
}

export default App;
```

This is my recommended way of using remote modules as this gives us the ability to handle network-related issues and performance-related issues.

**NOTE**: *If you prefer to implement this using typescript make sure you add a custom type declaration file to your source root and add the name of the remotes config as a module. the file can be named something like `module.d.ts` .*

```typescript
declare module 'sharedComp/*' {}
```

## Running the applications

There are a few things we need to keep in mind when we are running both Host and Remote applications.

* Remember to run the remote application and host application in `Preview mode` when developing instead of `Development mode` to get the file serving to work. Otherwise, if we ran applications on dev mode because of dev server doesn’t serve files we cannot get the module federation working in dev mode.
* Also remember when a component is shared it will be shared as a JavaScript module and not as an application. The responsibility of an application will be carried out by the host application that will bring in and uses the shared module. Hence when the remote component uses environment variables or any other process-related data will be pushed through the host application to remote components. So when using a remote component remember that the host application will always be the platform that this remote component runs on. Because even though the remote component runs on a separate server, remember that the remote server only serves a file at this point when it comes to module federation and nothing more. You still can see the remote server-side application running using URL but from the host application side, we are only referencing the shared JavaScript module entry `.js` file. So make sure to provide all process-related data from the Host application even though they are provided on your remote application side.

### Let's implement a Basic Scenario with what we learned so far

Let’s consider an application use case that has different components which we can divide between different teams. Let’s take an E-Commerce site as a scenario. Let’s develop an E-Commerce web app as host and then a payment component and a Home Page component. For the Basic scenario let's implement only the Home page use case for now.

I borrowed some code from [the vite-plugin-federation samples for react and Vite](https://github.com/originjs/vite-plugin-federation/tree/main/packages/examples/react-vite) to get the base application and created a [sample application](https://github.com/NipunaMarcus/module-federation) which showcase a basic use case of module federation.

In this sample, the Home Page of our website is developed as a remote module that is referenced in the website (Host Application). Remote modules are imported as static imports in this sample ( Main branch ) and the remote module is referenced using a static URL.

```typescript
import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';
import dns from 'dns';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

dns.setDefaultResultOrder('verbatim')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'app',
      remotes: {
        homepage: 'http://localhost:5000/assets/homepage.js',
      },
      shared: ['react']
    }),
    tsconfigPaths(),
  ],
  preview: {
    host: 'localhost',
    port: 5001,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
```

So from the remote application, I have exposed two components, `Button` and `Home` , and added them to a module with the entry file name `homepage.js` .

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import dns from 'dns';
import tsconfigPaths from 'vite-tsconfig-paths';

dns.setDefaultResultOrder('verbatim')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'home',
      filename: 'homepage.js',
      exposes: {
        './Button': './src/components/button/index.tsx',
        './Home': './src/views/home/index.tsx'
      },
      shared: ['react']
    }),
    tsconfigPaths(),
  ],
  preview: {
    host: 'localhost',
    port: 5000,
    strictPort: true,
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
```

Let’s look at the Home component which is shared from the remote application.

```typescript
import { getProducts } from "../../utils/util";
import "./Home.css"

function Home() {
    // Get product names.
    const products: string[] = getProducts();
    return (
        <div className="home">
            <h3>Remote 1: Home Page</h3>
            {
                products.map((value: string) => {
                    return (
                        <div className="home-card">
                            <p>
                                {value}
                            </p>
                        </div>
                    )
                })
            }
        </div>
    );
}

export default Home;
```

Here if you closely look at the component you see that it is exported as default. **It is important to export the shared component as a default**. Without exporting the component as default, it will be hard to reference them from the Host application side.

From the Host application side when using the remote modules we can use static imports.

```typescript
import './App.css';

// Import remote modules using static imports.
// Use them inside the app component.
import Home from 'homepage/Home';
import Button from 'homepage/Button';

function App() {
  return (
    <div className="App">
      <h1>[Host Application] Welcome to the Shop!</h1>
      <div className='navBar'>
        <div>
          <Button caption="Home" />
        </div>
      </div>
      <div className="card">
        <Home />
        <p>
          Test App for host application.
        </p>
      </div>
      <p className="read-the-docs">
        Module federation with Vite and React
      </p>
    </div>
  )
}

export default App;
```

And after importing each of these components they can be used as any normal component. But remember using static import can cause issues when it comes to real production environments as these remote modules might not be available at the time. Hence using lazy loading on them will help when it comes to handling network-related issues. You can find the lazy loading sample here in [this branch](https://github.com/NipunaMarcus/module-federation/tree/lazy-loading).

With lazy loading, the host application side where we use the remote modules like below.

```typescript
import './App.css';
import React, { Suspense } from 'react';

// Import remote modules using lazy loading.
// Use them inside the app component.
const Home = React.lazy(() => import('homepage/Home'));
const Button = React.lazy(() => import('homepage/Button'));

function App() {
  return (
    <div className="App">
      <h1>[Host Application] Welcome to the Shop!</h1>
      <div className='navBar'>
        <div>
          <Suspense fallback={<div>Loading...</div>} >
            <Button caption="Home" />
          </Suspense>
        </div>
      </div>
      <div className="card">
        <Suspense fallback={<div>Loading...</div>} >
          <Home />
        </Suspense>
        <p>
          Test App for host application.
        </p>
      </div>
      <p className="read-the-docs">
        Module federation with Vite and React
      </p>
    </div>
  )
}

export default App;
```

In lines 6 and 7 I load the components from the remote module lazily. And then we are using that inside a `Suspense` component to load it in async and have a fallback component applied in case of loading takes time.

Also when importing these from remote modules if you are using typescript remember to add a custom definition file for types. So here in my implementation, I have added the `custom.d.ts` file. This file helps you to get rid of the compilation error `Module not found` .

```typescript
declare module 'homepage/*'
```

## Let's look into implementing a bit more advanced scenario

Let’s add the payment component into the story and make this a bit more complicated. Implementation for the advanced scenario can be found in [this branch](https://github.com/NipunaMarcus/module-federation/tree/advance-use-case).

This adds a bit of complexity as this uses two different remote modules to load home and payment pages and also added the complexity of react routing onto the host app. Also in this sample, the payment page is loaded using a dynamically set URL which is pushed during the runtime through `window` object.

Vite configuration for this advanced use case from the host application side looks like this.

```typescript
import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';
import dns from 'dns';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

dns.setDefaultResultOrder('verbatim')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'app',
      remotes: [
        {
          homepage: {
            external: 'http://localhost:5000/assets/homepage.js',
            from: 'vite',
            externalType: 'url'
          },
        },
        {
          payment: {
            external: 'Promise.resolve(window.paymentUrl)',
            from: 'vite',
            externalType: 'promise'
          },
        }
      ],
      shared: ['react', 'react-dom', 'react-router-dom']
    }),
    tsconfigPaths(),
  ],
  preview: {
    host: 'localhost',
    port: 5001,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
```

Here in the config, you can see I have added two different remote configs to load the payment and home remote modules and two different external types for each. Here, as we did in the earlier examples, we are loading the home component with a static URL which is embedded into the config. But to load the payment module we are using the `externalType`, promise. I’m using this to demonstrate that in case I don’t know what will be the URL, where the Payment remote module is hosted, in the build phase I should be able to set it in the runtime. This will be helpful if we are using and pipeline to host our applications and all the URLs will be resolved at runtime. So as you can see in line 25 I’m using the below config to use a promise to load the payment remote module’s URL during runtime.

```typescript
remotes: [
...
{
  payment: {
     external: 'Promise.resolve(window.paymentUrl)',
     from: 'vite',
     externalType: 'promise'
  },
}
...
```

And inside the `App.tsx` component inside the host application, I have set the payment remote module URL to the `window` object and lazy load the payment remote module in addition to the home page remote module.

```typescript
import './App.css';
import React, { Suspense, useEffect } from 'react';
import { ExtendedWindow } from 'types';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navigation from './components/navigationBar';

// Import remote modules using lazy loading.
// Use them inside the app component.
const Home = React.lazy(() => import('homepage/Home'));
const Payment = React.lazy(() => import('payment/Payment'));

declare let window: ExtendedWindow;

function App() {
  
  useEffect(() => {
    // This is not as elegant as production code as we cannot use such in production.
    // But lets assume these envs are coming from a environment handler.
    // And this is only for sample case.
    if (import.meta.env.VITE_PAYMENT_URL) {
      // This is where we set the payment remote's URL.
      window.paymentUrl = import.meta.env.VITE_PAYMENT_URL;
    }
  }, []);

  return (
    <div className="App">
      <h1>[Host Application] Welcome to the Shop!</h1>
      <BrowserRouter>
        <Navigation />
        <div className="card">
          <Routes>
            <Route path="/" element={<Navigate to='/home' />} />
            <Route path='/home' element={
              <Suspense fallback={<div>Loading...</div>} >
                <Home />
              </Suspense>
            } />
            <Route path='/payment' element={
              <Suspense fallback={<div>Loading...</div>} >
                <Payment />
              </Suspense>
            } />
          </Routes>
          <p>
            Test App for host application.
          </p>
        </div>
      </BrowserRouter>
      <p className="read-the-docs">
        Module federation with Vite and React
      </p>
    </div>
  )
}

export default App;
```

## Possible errors faced during development and possible solutions.

1. **React, React Router Dom, and other shared libraries becoming undefined.**

What you need to check is

* You have not added the correct list of shared libraries to `shared` property on either your remote app Vite config or host app Vite config. The shared list of both sides should be the same.
* Check anything that should be shared between remotes and the host app is added to the shared list.

2. **Failed to load the remote modules.**
   ![Error in similar case will look like this](images/1749947965056-x4qo98bd0u.webp)

What you need to check is

* Check whether each remote module name in the host side Vite config is unique.
* Check whether the correct component name is mentioned in the remote side Vite config. inside the config, the component name should be similar to the component you are looking to share.
* Check whether the component is exported as default from the remote application side.

3. **If all the packages are in a monorepo structure there is an issue with NPM hoisting and sharing libs between host and remote modules.**

[Building host side fails with hoisted dependencies in monorepo when using lerna](https://github.com/originjs/vite-plugin-federation/issues/276)

This is the open issue for this on the vite-plugin-federation side. But if you need to keep the monorepo structure what you need to do is follow what I have done in the above sample projects, install node modules in each application instead of the root of the workspace.

## Conclusion

* Always better to use lazy loading when it comes to importing remote modules instead of static import.
* Use static URL in config if you know the URL for remotely hosted modules and if need to resolve the URL dynamically at runtime then use the promise method to resolve the URL.
* Remember to add everything to the shared component for it to work without a hitch. Examples: if there is a provider which you have applied in your remote application root level and you are using this inside the shared component remember to either add this provide inside the shared component or create a provider from the host application side and wrap the remote component with that(haven’t tested this way though)… This is because once you share the component only that component and the imports needed for it will be packed together into the remote module. So what you add in the root component of the remote app won’t be available inside the shared component.
* Always share core libraries such as Vue and React between the host and remotes.
