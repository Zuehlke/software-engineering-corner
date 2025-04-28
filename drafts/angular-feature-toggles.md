---
title: Feature Toggles in Angular
subtitle: "Crafting a Custom Feature Toggle Setup in Angular"
domain: software-engineering-corner.zuehlke.com
tags: angular, web-development, javascript, frontend-development, guide
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1732888744339/n2T03yjCA.jpg?auto=format
publishAs: zemph
hideFromHashnodeCommunity: false
saveAsDraft: true
---

_Disclaimer: On a project I am currently working on, I introduced feature toggles and created a setup in Angular that works great for me. 
With this post I would like to share the results with you._

## What are feature toggles
In the most basic form, you can think of feature toggles as a remote configuration consisting of features and their state (enabled / disabled). 
This configuration can be updated during the runtime of the application to  manage gradual rollouts, A/B tests, and quick rollbacks, improving flexibility and reducing risk.

<iframe src="https://stackblitz.com/edit/stackblitz-starters-2rzgektu?file=src%2Fmain.ts&amp;embed=1" width="100%" height="400"></iframe>

## Tooling

There are many tools available for adding feature toggles to your project. 
The only requirement is a request, which returns a list of feature-flags with their current state. 
This could even be done by hosting a static JSON file somewhere that can easily be updated. 

## Goal

Let's say we want to be able to toggle three features. 
The first one is an external analytics script we inject into the DOM during the initialization of Angular. 
The second feature toggle should be able to show/hide some iFrame we display within our application. 
The final feature is a route that should become inaccessible when toggled off. 
If all features are enabled, the response of the feature flag request would look something like this.

```json
[
    {
        "feature": {
            "id": 0,
            "name": "analytics"
        },
        "enabled": true
    },
    {
        "feature": {
            "id": 1,
            "name": "iframe"
        },
        "enabled": true
    },
    {
        "feature": {
            "id": 2,
            "name": "route"
        },
        "enabled": true
    }
]
```

## Basic Setup

### Type Safety

For some type safety within the feature toggle setup, I came up with the following model.

```js
// feature-toggle.model.ts

export interface FeatureToggle {
  init: () => Promise<void>;
  hasFeature: (key: FlagKey) => boolean;
}

export type FlagKey = 'analytics' | 'iframe' | 'route';

export interface Flag {
  readonly key: FlagKey;
  readonly enabled: boolean;
}

export type FlagMap = {
  readonly [key in FlagKey]: Flag;
};
```

Using the `FlagMap` type, we can create a constant to manage and access all our flags and their keys. 
We can also use it to set our default flags, which we needed when initiating the feature toggle instance.

```js
// feature-toggle.constants.ts
export const featureFlags: FlagMap = {
  analytics: {
    key: 'analytics',
    enabled: true
  },
  iframe: {
    key: 'iframe',
    enabled: false
  },
  route: {
    key: 'route',
    enabled: true
  }
};
```

### Setting up the feature toggle instance
To toggle any kind of feature, we need to make the feature flag request as early as possible. 
Therefore we create our feature toggle instance and make the initial call, which fetches the flags. 
We do this before bootstrapping the application. 
The feature toggle instance should provide some method to check if a feature is active at any given time, without having to re-fetch the flags (e.g. `hasFeature()`). 
After setting up the feature toggle instance, it can then pe provided within your Angular application using an injection token in your `ApplicationConfiguration`.

```js
// tokens.ts
// Create the injection token
export const FEATURE_TOGGLE_TOKEN = new InjectionToken<FeatureToggle>('FEATURE_TOGGLE_TOKEN');

// main.ts
// Create feature toggle instance and provide within the ApplicationConfiguration
const featureToggle = createFeatureToggleInstance();
featureToggle
  .init({
    environmentID: ENVIRONMENT_ID,
    defaultFlags: DEFAULT_FLAGS
  })
  .then(() => bootstrapApplication(AppComponent, applicationConfig(featureToggle)));

// app.config.ts
export const applicationConfig = (featureToggle: FeatureToggle): ApplicationConfig => ({
  providers: [
    { provide: FEATURE_TOGGLE_TOKEN, useValue: featureToggle },
    // Rest of your providers
  ]
});
```

## Basic use

With the basic setup established we are now able to use the feature toggle instance and check the flag values. 
We just need to inject it wherever we need it. 

```js

// Inject
private readonly featureToggle = inject(FEATURE_TOGGLE_TOKEN);

// Use
const featureValue = this.featureToggle.hasFeature('analytics')
```

This flag’s value can now be used to change the behavior of your application. 
More often than not, it’s not that simple—we usually want to use feature flags in more specific contexts. 
Thats why I want to talk about a few tools that can make your life easier when working with feature toggles.

## Using a feature flag before initializing Angular
The first situation I want to talk about is using a feature flag, before the application is fully initialized. 
In this example we want to conditionally inject an analytics script into the DOM to track the user interaction within our application. 
To achieve this, we can use the `provideAppInitializer` function within our `ApplicationConfiguration`. 
Using our feature toggle instance, we can conditionally append the script to the DOM depending on the flag.

```js
// app.config.ts
{
    provideAppInitializer(() => {
    const featureToggle = inject(FEATURE_TOGGLE_TOKEN);

    if (featureToggle.hasFeature('analytics')) {
      addAnalyticsScriptToDom(document);
    }
  }),
},
```

## Conditionally showing UI using a directive
A very common use case for a feature flag is to show/hide content. 
This could be achieved with the setup we already have but we can make our lives easier when creating a directive we can use within the template. 
It should take the flag key as an input and render/hide the component depending on the flag value. 
Optionally it should also take a template reference as an input for the fallback, if the feature is disabled.

The setup of the feature toggle directive is quite simple. 
We inject the feature toggle instance, the `TemplateRef`, and the `ViewContainerRef`. 
We define two inputs: one for the flag key and another for an optional fallback template. 
A `computed` signal checks if the feature is enabled. 
Inside the constructor, we use an `effect` to reactively respond to changes in the signal. 
Based on the value, we either render the main template using `featureActive()` or the fallback template using `featureDisabled()`.

If the feature is active, we use the `ViewContainerRef` to create an embedded view from the `TemplateRef` that the directive is attached to. 
If the feature is not active, we clear the view container and, if a fallback template is provided via the `appFeatureToggleElse` input, render that instead.

You might wonder why the input names seem weird. 
They are set like this on purpose to, so we can use this directive as a structural directive with the `*` prefix. 
This is beneficial because Angular transforms the asterisk in front of a structural directive into an `<ng-template>` that hosts the directive and surrounds the element and its descendants behind the scene. 
Otherwise, we would have to do this ourselves anytime we use the directive. 
This so called [structural directive shorthand](https://angular.dev/guide/directives/structural-directives#structural-directive-shorthand) requires us to use a certain naming convention for the inputs. 
They need to have the directive selector as a prefix. 

```js
@Directive({
  selector: '[appFeatureToggle]',
  standalone: true
})
export class FeatureToggleDirective {
  appFeatureToggle =  input<FlagKey | undefined>();
  appFeatureToggleElse = input<TemplateRef<unknown> | undefined>();

  private readonly featureToggle = inject(FEATURE_TOGGLE_TOKEN);
  private readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly isEnabled = computed(() => {
    const flagKey = this.appFeatureToggle();
    return !flagKey || this.featureToggle.hasFeature(flagKey);
  });

  constructor() {
    effect(() => {
      this.isEnabled() ? this.featureActive() : this.featureDisabled();
    });
  }

  private featureActive(): void {
    this.createView(this.templateRef);
  }

  private featureDisabled(): void {
    const elseTemplate = this.appFeatureToggleElse();
    elseTemplate ? this.createView(elseTemplate) : this.viewContainer.clear();
  }

  private createView(templateRef: TemplateRef<unknown>): void {
    this.viewContainer.clear();
    this.viewContainer.createEmbeddedView(templateRef);
  }
}
```

And this is how you would use it within a template

```html
<iframe *featureToggle="'iframe'; else fallback"
        width="560"
        height="315"
        src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=PqWzCGoitRdn2RUt"
        title="YouTube video player" referrerpolicy="strict-origin-when-cross-origin"></iframe>
<ng-template #fallback>
    Content unavailable :/
</ng-template>
```

## Guarding a route with a feature flag

In this last example I want to demonstrate how you can use a guard to toggle a route in your Angular project. 
It’s easy to implement and can be quite useful for restricting access to certain parts of your application. 
If the feature is active, the guard returns true and allows the navigation. 
Otherwise it redirects to the fallback url if provided. 
In my case the fallback is optional and the guard navigates to the home page by default.

```js
export function featureToggleGuard(key: FlagKey, redirectUrl?: string): CanActivateFn {
  return () => {
    const featureToggle = inject(FEATURE_TOGGLE_TOKEN);
    const router = inject(Router);

    if (featureToggle.hasFeature(key)) {
      return true;
    }
    if (redirectUrl) {
      return router.parseUrl(redirectUrl);
    }
    return router.parseUrl(HOME_PAGE_URL);
  };
}
```

This guard can be used in any route within the `canActivate` Array.

```js
{
  path: 'new-feature',
  component: NewFeatureComponent,
  pathMatch: 'full',
  canActivate: [featureToggleGuard('route', '/coming-soon')],
}
```

## Conclusion

Feature flags aren’t the right choice for every project. 
While they can add flexibility and support gradual rollouts or A/B testing, they also bring extra complexity—and, if not handled carefully, can cause issues. But when used with clear guidelines, they can help teams experiment and adapt more easily.

In this post, I shared a custom setup for feature toggles in Angular, including examples for runtime configuration, conditionally showing UI with directives, and guarding routes. 
Your implementation might look different, but I hope this gave you a good starting point and some ideas to work with.
