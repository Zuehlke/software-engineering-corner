---
title: Shallow Component Tests in Cypress with Angular Standalone Components
subtitle: Dynamically Overriding and Mocking Standalone Component Imports
domain: software-engineering-corner.hashnode.dev
tags: angular, components, testing
cover: https://cdn.hashnode.com/res/hashnode/image/stock/unsplash/nXKNn2L4fDw/upload/150adf478d431d819cf7f88e3eaa92f7.jpeg?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp
publishAs: timouti
hideFromHashnodeCommunity: false
ignorePost: true
---
We're all familiar with the testing pyramid principle, advocating for an abundance of unit tests and 
only a handful of e2e tests.
In frontend applications, the emphasis lies on numerous tests validating our component classes and 
services, with only a sparse selection of e2e tests directly engaging with the UI. 
However, a component is more than just its class. While class-only tests confirm behavior, 
they may fall short in assessing interactions with the DOM, and even fail to guarantee accurate rendering.

Angular 17 releases new built-in control flows transferring more logic to the component templates.
Consequently, the urge to validate component templates and interactions is on the rise, 
potentially surpassing the significance of unit tests.

Fortunately, Cypress offers a solution in the form of "component tests," applicable to Angular, React, Vue, and Svelte. 
For the sake of simplicity, we will delve into Angular component tests in this article.

### Cypress Component Tests
The objective of component tests is to validate and interact with the rendered component in the browser. 
Unlike conventional e2e tests, these tests operate in isolation and are thus "shallow", just like standard unit test.

To achieve this, certain providers and imports of the component need to be mocked. 
Cypress facilitates this through `cy.mount` with an optional `MountConfig` parameter. 
This `MountConfig` empowers the definition and override of component imports, providers, as well as 
input and output properties. 

```typescript
beforeEach(() => {
  cy.mount(MyComponent, {
      imports: [
          MyChildComponent, 
          RouterTestingModule,
          HttpClientTestingModule,
      ], 
      providers: [{ provide: MyService, useClass: MyMockService }]
  });
});
```
By leveraging the `MountConfig`, mocking providers and components becomes straightforward using your own 
MockClass. However, in the context of Angular standalone components, where imports and providers are 
integral part of the component itself, overriding child components via `MountConfig` encounters limitations.

### Overriding Standalone Child Component
The easiest solution involves mocking components with third-party libraries like `ng-mocks`. 
Alternatively, a native approach is viable if third-party solutions are not an option in your project.

First, we need to understand that the `cy.mount` is essentially just a wrapper around Angular's `TestBed.configureTestingModule`.
Secondly, full access to the `TestBed` is available within the Cypress component test.
And lastly, `TestBed.overrideComponent()` already allows us to override imported components in standalone components.

The idea is to access `TestBed` and override the imported child components. Creating a custom Cypress 
commands to do so, e.g. `cy.mockStandaloneChildComponents(...)`, simplifies mocking from within the test.
The implementation of this command essentially wraps the `overrideComponent` function, requiring the 
standalone component under test, a list of imported components to mock, and the corresponding mock class.

```typescript
declare global {
    namespace Cypress {
        interface Chainable {
            mockStandaloneChildComponents<T>(
                standaloneComponent: Type<T>,
                childComponentsToMock: any[] | Type<any>[]
            ): void;
        }
    }
}

function mockStandaloneChildComponents<T>(
    standaloneComponent: Type<T>,
    childComponentsToMock: any[] | Type<any>[]
): void {
    TestBed.overrideComponent(standaloneComponent, {
        remove: { imports: childComponentsToMock },
        add: {
            imports: childComponentsToMock.map(comp => {
                return createDynamicMockComponent(comp);
            }),
        },
    });
}

Cypress.Commands.add(
    'mockStandaloneChildComponents',
    mockStandaloneChildComponents
);
```

### Dynamic Components Mocking with Standalone Components
We don't want to create mock classes within our tests for all child components that we're mocking.
Instead, the list of child components to be mocked is passed to the custom override command, 
aiming for dynamic creation of component mocks. To that end, we create a new `createDynamicMockComponent` 
function. 

We need to create a dummy component with the same selector and the same inputs as our source component.
Reflection allows us to gather the component selector from the component's metadata. Extending the source component
grants us access to the same inputs, without explicit declaration in our dummy component.

Now, we just have to plug everything together.

```typescript
import { Component, reflectComponentType, Type } from '@angular/core';

export function createDynamicMockComponent<T>(component: Type<T>) {
  const componentMetadata = reflectComponentType(component);

  @Component({
    selector: componentMetadata?.selector,
    template:
      '<div class="mocked" [attr.data-cy]="cypressSelector">Mocked Component: {{mockedComponentName}}</div>',
    styles: [
      '.mocked { padding: 8px; margin: 16px; background-color: lightgrey }',
    ],
    standalone: true,
  })
  class DynamicMockComponent extends (component as any) {
    mockedComponentName = componentMetadata?.selector;
    cypressSelector = 'mocked-' + this.mockedComponentName;
  }

  return DynamicMockComponent;
}

```
Additionally, we provide a small template, aiding in visualizing the mocked component in rendered 
component tests. This proves beneficial when capturing screenshots and videos of test failures, and to better 
understand what is being tested and what is being mocked. 

Additionally, a `data-cy` test selector enables precise targeting of the mocked component in tests 
for visibility assertions or input validation.

### Summary
That's all. Now, we just need to call the mocking function before mounting the component.

```typescript
beforeEach(() => {
    cy.mockStandaloneChildComponents(MyComponent, [MyChildComponent]);
    cy.mount(MyComponent, {
      imports: [
          RouterTestingModule,
          HttpClientTestingModule,
      ], 
      providers: [{ provide: MyService, useClass: MyMockService }]
    });
});
```
Through a combination of reflection, inheritance, and the capabilities of Angular's `TestBed`, 
we successfully mock child components in standalone component imports. 
The implementation of our custom mock command has significantly streamlined our component tests.