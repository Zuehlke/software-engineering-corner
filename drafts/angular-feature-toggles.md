---
title: Feature Flags in Angular
subtitle: "Crafting a Custom Feature Flag Setup in Angular"
domain: software-engineering-corner.zuehlke.com
tags: angular, web-development, javascript, frontend-development, guide
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1732888744339/n2T03yjCA.jpg?auto=format
publishAs: zemph
hideFromHashnodeCommunity: false
saveAsDraft: true
---

# Feature Flags in Angular

_Disclaimer: On a project I am currently working on, I introduced feature flags and created a setup in Angular that works great for me. 
With this post I would like to share the results with you._

## What are feature flags
In the most basic form, you can think of feature flags as a remote configuration consisting of features and their state (enabled / disabled). 
This configuration can be updated during the runtime of the application to  manage gradual rollouts, A/B tests, and quick rollbacks, improving flexibility and reducing risk.

<iframe src="https://stackblitz.com/edit/stackblitz-starters-6zh7dxms?embed=1&file=src%2Fmain.ts" width="100%" height="400"></iframe>

## Tooling

There are many tools available for adding feature flags to your project. 
The only requirement is a request, which returns a list of feature-flags with their current state. 
This could even be done by hosting a static JSON file somewhere that can easily be updated. 

## Goal

We are going to implement following three feature flags:
 - toggling the injection of an external analytics script into the DOM
 - showing/hideing an iframe within our application
 - enabling a route to a new feature

## Setup

Before we jump into the examples, we first need a setup to manage and use feature flags in our app. We'll define some types for better structure, set up default values, and create a way to fetch and provide the flags throughout the app.

### Type Safety

To keep things simple and avoid mistakes, it’s helpful to define a clear structure for our feature flags. This way, we know exactly what flags are available.

```js
// feature-flag.model.ts

export type FlagKey = 'analytics' | 'iframe' | 'route';

export type Flag = {
  readonly key: FlagKey;
  readonly enabled: boolean;
}

export type FlagMap = {
  readonly [key in FlagKey]: Flag;
};
```

`FlagKey` lists all the feature flags we have, so we don’t accidentally use one that doesn’t exist.
The feature flag API call for fetching the feature flags could fail. 
This is why defining sensible defaults is a good idea. 
We can use the previously created `FlagMap` and set the appropriate defaults. 

```js
// feature-flag.constants.ts
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

### Fetching the feature flags
To toggle any kind of feature, we need to make the feature flag request as early as possible. 
Therefore we fetch the flags before bootstrapping the application. 
After receiving the remote feature flags, they can then pe provided within your Angular application using an injection token in your `ApplicationConfiguration`.

```js
// tokens.ts
// Create the injection token
export const FEATURE_FLAG_TOKEN = new InjectionToken<FeatureFlag>('FEATURE_FLAG_TOKEN');

// main.ts
// Fetch the feature flags and provide them within the ApplicationConfiguration

const fetchFlags = async (): Promise<FlagMap> => {
  try {
    // throw new Error('load default flags');
    const response = await fetch('/assets/feature-flags.json');
    return response.json();
  } catch {
    return DEFAULT_FLAGS;
  }
};

fetchFlags()
  .then((featureFlags) => bootstrapApplication(AppComponent, applicationConfig(featureFlags)));

// app.config.ts
export const applicationConfig = (featureFlags: FlagMap): ApplicationConfig => ({
  providers: [
    { provide: FEATURE_FLAG_TOKEN, useValue: featureFlags },
    // Rest of your providers
  ]
});
```

## Feature Flag Service

In a service we can inject the remotely loaded feature flags and provide a function to check their status. 
This service will be used throughout our setup.

```js
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly featureFlags = inject(FEATURE_FLAG_TOKEN);

  hasFeature(key: FlagKey): boolean {
    return this.featureFlags[key].enabled;
  }
}
```

### Basic use

With the basic setup established we are now able to use the feature flags service and check the flag values. 
We just need to inject it wherever we need it. 

```js

// Inject
private readonly featureFlag = inject(FeatureFlagService);

// Use
const featureValue = this.featureFlag.hasFeature('analytics')
```

More often than not, it’s not that simple to just see if a feature is enabled—we usually want to use feature flags in more specific contexts. 
Let me show you a few tools that can make your life easier when working with feature toggles.

## Using a feature flag before initializing Angular
To toggle any feature, it's essential to make the feature flag request as early as possible.
In Angular, there are different approaches to achieve this.
The earliest opportunity is to fetch the feature flags before bootstrapping the application.
For us this makes sense, since feature flags are fundamental to the app's core.
Once resolved, the feature flags are provided through an InjectionToken.

```js
// app.config.ts
{
    provideAppInitializer(() => {
    const featureFlag = inject(FeatureFlagService);

    if (featureFlag.hasFeature('analytics')) {
      addAnalyticsScriptToDom(document);
    }
  }),
},
```

## Conditionally showing UI using a directive
A very common use case for a feature flag is to show/hide content. 
This could be achieved with the code we already have but we can make our lives easier with creating a structural directive. 
It should take the flag key as an input and render/hide the component depending on the state of the flag 
Optionally it should also take a template reference to a fallback component, in case the feature is disabled.

```js
*appFeatureFlag="'iframe'; else fallback"
```

The directive has two inputs: one for the flag key and another for an optional fallback template. 
Based on the value of the flag, we either render the main template or the fallback template.

You might wonder why the input names seem weird.
This is necessary so the directive can be used as a structural directive with the `*` prefix.
This so called [structural directive shorthand](https://angular.dev/guide/directives/structural-directives#structural-directive-shorthand) requires us to use a certain naming convention for the inputs.
Angular transforms the asterisk in front of a structural directive into an `<ng-template>` that hosts the directive and surrounds the element and its descendants behind the scene. 
Otherwise, we would have to do this ourselves anytime we use the directive. 

```js
@Directive({
  selector: '[appFeatureFlag]',
  standalone: true
})
export class FeatureFlagDirective {
  appFeatureFlag =  input<FlagKey | undefined>();
  appFeatureFlagElse = input<TemplateRef<unknown> | undefined>();

  private readonly featureFlag = inject(FeatureFlagService);
  private readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly isEnabled = computed(() => {
    const flagKey = this.appFeatureFlag();
    return !flagKey || this.featureFlag.hasFeature(flagKey);
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
    const elseTemplate = this.appFeatureFlagElse();
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
<iframe *appFeatureFlag="'iframe'; else fallback"
        width="560"
        height="315"
        src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=PqWzCGoitRdn2RUt"
        title="YouTube video player" referrerpolicy="strict-origin-when-cross-origin"></iframe>
<ng-template #fallback>
    Content unavailable :/
</ng-template>
```

## Guarding a route with a feature flag

Protecting a route with a feature flag guard can be quite useful for restricting access to certain parts of your application. 
If the feature is active, the guard returns true and allows the navigation. 
Otherwise it redirects to the fallback url.

```js
export function featureFlagGuard(key: FlagKey, redirectUrl: string = '/'): CanActivateFn {
  return () => {
    const featureFlag = inject(FeatureFlagService);
    const router = inject(Router);

    if (featureFlag.hasFeature(key)) {
      return true;
    }
    if (redirectUrl) {
      return router.parseUrl(redirectUrl);
    }
    return router.parseUrl(HOME_PAGE_URL);
  };
}
```

This `canActivate` guard can be used with any route.

```js
{
  path: 'new-feature',
  component: NewFeatureComponent,
  pathMatch: 'full',
  canActivate: [featureFlagGuard('route', '/coming-soon')],
}
```

## Conclusion
While feature flags can add flexibility and support gradual rollouts or A/B testing, they also bring extra complexity—and, if not handled carefully, can cause issues. 
But when used with clear guidelines, they can help teams experiment and adapt more easily without constant redeployments. 
