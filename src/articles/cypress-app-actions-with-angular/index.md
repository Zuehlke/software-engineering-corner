---
title: Cypress app actions with Angular
description: >-
  The deprecation of Protractor led to a migration of end-to-end tests,
  revealing challenges with test speed and flakiness due to repetitive UI
  interactions and data dependencies. Leveraging Cypress's ability to access the
  application directly, a solution was implemented to manipulate the application
  state, improving test stability, readability, and speed. This approach
  minimized impact on the Angular app by exposing a central service for targeted
  actions.
released: '2023-03-20T10:13:29.394Z'
cover: images/cover.jpg
author: Lucas Schnüriger
tags:
  - Web Development
  - Angular
  - Testing
  - Frontend Development
  - Cypress
shortDescription: >-
  Learn how Cypress app actions with Angular can improve e2e test stability,
  readability, and speed by directly manipulating app state.
---
It came as no surprise when the Angular team announced last August [on their official blog](https://blog.angular.io/the-state-of-end-to-end-testing-with-angular-d175f751cb9c) that they've decided to deprecate Protractor.
They've been public about evaluating the future of Protractor.
Version 12 of Angular already added support for other e2e testing frameworks.
As a result, we migrated the existing Protractor tests at one of our customers to Cypress.
We used this as a chance to improve the tests themselves.
One way to do this was using Cypress app actions.

# The Problem

Due to the nature of the application in question, many tests required multiple steps to reach the desired start conditions.
The existing tests would go through the same parts of the UI again and again.
Other tests would rely on a pre-defined set of test data, which is left in an inconsistent state after an error.
That caused the following tests that relied on the same data to fail too.
All in all, this led to slow tests and was often the source of flakiness on the CI.

Completely reorganising the end-to-end tests for an optimised flow through the application was not a viable option.
We simply didn't have the time for it (or rather: it wasn't a high enough priority), and even then, we wouldn't have been able to eliminate all issues.

Looking at the capabilities of Cypress, we first tried using `cy.request()` to call our API directly to set up and manipulate test data.
Sadly, for a couple of reasons, this turned into more effort than we were willing to put in.
On different deployment stages the app and API run on different ports and need respective credentials.
Rather than configuring Cypress to work properly in every case, we wanted to rely on what we had.
Our Angular app already knew how to handle all communication with the API.
So why not use that to our advantage?

# App Actions

In a [blog post from 2019](https://www.cypress.io/blog/2019/01/03/stop-using-page-objects-and-start-using-app-actions/#application-actions), Cypress engineer Gleb Bahmutov explained the concept of "application actions".
Cypress ambassador Filip Hric also went into [the difference between app actions and page objects](https://applitools.com/blog/page-objects-app-actions-cypress/).
They leverage the fact that Cypress runs inside the browser and therefore has access to the application.
That allows us to skip interacting with sections of the UI that aren't part of the test and directly manipulate the state.
The command `window` gives us access to the window object.

```ts
cy.window()
    .then(({app}) => app.sayTheLineBart());
```

# Angular

First, we needed to make the desired service accessible on the window object.
We decided against overusing app actions for the time being.
The interface, respectively dependency, between Cypress and our Angular app should be kept small.
As we had a `BackendService` that centrally handled all requests to our API, it was an obvious choice.
It would be only one connection point while offering a high degree of flexibility.
In the constructor of the service, we verify whether the app is running inside Cypress and then expose the service.
This way, it's not accessible in any other situation.

`src/app/.../backend.service.ts`:

```typescript
export class BackendService {
    constructor() {
        if (window.hasOwnProperty('Cypress')) {
            window.app4cy = window.app4cy ?? {};
            window.app4cy.BackendService = this;
        }
    }

    public get<T>(url: string): Promise<T> {
        // ...
    }

    // ...
}
```

# Abstraction through Commands

The action should be easy to use in Cypress, so we created a custom command: `backendRequest`.
This way, we keep the dependency on the app in one central place and abstract the app action.

`cypress/support/commands.ts`:

```typescript
Cypress.Command.add('backendRequest',
    {prevSubject: false},
    <M extends keyof BackendService>(method: M, ...args: Parameters<BackendService[M]>) =>
    cy.log(`Use BackendService for a ${method.toUpperCase()} request to '${args[0]}'`)
        .window({log: false})
        .its('app4cy.BackendService', {log: false})
        // @ts-ignore (TS compiler sadly struggles with the relationship between the types of "method" and "args")
        .then(async (service: BackendService) => service[method](..args));
);
```

That also allowed us to specify the types of parameters and return values.

`cypress/support/commands.ts`:

```typescript
declare global {
    namespace Cypress {
        interface Chainable<Subject> {
            backendRequest<M extends keyof BackendService>(
                method: M,
                ...args: Parameters<BackendService[M]>
            ): Chainable<ReturnType<BackendService[M]>>;
        }
    }
}
```

We then went even one step further.
Repeated actions, such as creating a specific item, were put into a utility function.
One could argue this was unnecessary, but depending on your needs it might prove to be helpful.
The actual test looks more readable when calling `createNewItem("Just do it")` than understanding what that request is doing.

`cypress/support/utils.ts`:

```typescript
export function createNewItem(itemName: string): void {
    const urlPath = 'items';
    cy.backendRequest('post', urlPath, itemName);
}
```

# Conclusion

Once we set this app action up, the affected tests greatly improved in stability, readability, and speed.
Using app actions halved the duration of some tests and resolved most unwanted dependencies between them.
By choosing to expose only one central service, we kept the impact on the Angular app itself minimal.
In another app, it might make sense to use more specified services or components to manipulate the client-side state.
Our experiences with this setup are very positive.
I would recommend looking into making use of the potential of Cypress if you have similar problems.
The setup is straightforward and adjustable.

Additionally, you don't have to draw a hard line between app actions and page objects.
Even if you prefer the structure of page objects, you could profit.
I could imagine page objects containing logic to decide whether to go through the UI or use app actions.
But in any case, app actions are not a silver bullet and should be used only selectively and deliberately.
