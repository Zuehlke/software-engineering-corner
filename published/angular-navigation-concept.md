---
title: Routing Beyond Forward and Back
domain: software-engineering-corner.hashnode.dev
tags: javascript, web-development, frontend-development, angular, navigation
cover: https://cdn.hashnode.com/res/hashnode/image/stock/unsplash/EOq4Dj33G_U/upload/72980e96faa8075e8392477062a3fd78.jpeg?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp&quot
publishAs: mikaruch
hideFromHashnodeCommunity: false
---

> **Note:** Chrome has an [experimental implementation of the Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API), which provides native primitives for navigation handling.  
> If supported across all major browsers, this API could significantly simplify many of the patterns discussed in this article.

The navigation in complex web applications quickly goes beyond forward and back navigation.
We recently rebuilt the navigation on a large project. 
Though our project uses Angular, the underlying navigation concept is versatile and can be applied to any framework.

# What Was Our Goal

At the start of the rewrite, we had already refactored the navigation twice.
Both versions heavily relied on forward navigation, even when a user, for example, clicked on a `back` button.
This scenario meant the page was removed from an internal history stack but pushed onto the browser's history stack.
![Browser vs. Internal History Stack](https://cdn.hashnode.com/res/hashnode/image/upload/v1735512763637/ehl2GJbfc.png?auto=format)

If users only used the back button within the web app, they were fine.
If they only used the browser back button, they were fine.
However, mixing the two led to strange errors, as the stacks were out of sync.

This was the main motivation to implement a proper navigation solution once and for all - one that could cover all scenarios.

# Project Specifics

Every project has unique aspects.
Here are the relevant ones for this one.

## Flows

Flows in our project are sequences of pages that create or mutate user data.
For instance, when a user wants to change their address, it involves multiple pages.
The flow in this scenario consists of all the pages involved in changing the address.

## Disabled Navigation Menu

Another unique aspect of our project is that the navigation menu is disabled on detail pages.
![Disabled navigation menu on detail pages](https://cdn.hashnode.com/res/hashnode/image/upload/v1735637847386/Ub6Yog8qj.png?auto=format)

# Requirements

Apart from the regular forward and back navigation, we also have to implement the following use cases:

1. When a user cancels a flow, they should be navigated back to the page where the flow started (`flow source page`).
   ![Visualization of canceling flows](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316536567/siByewFSg.png?auto=format)
2. When a user finishes a flow and initiates a back navigation, they should be navigated back to the `flow source page`.
   ![Visualization of skipping flow pages](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316547891/K6fY_oilb.png?auto=format)
3. When a user clicks on the disabled navigation menu on detail pages, they should be redirected back to the last page where the menu was active (main page).
   ![Visualization of navigating to the previous main page](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316557945/FmbKRfvYm.png?auto=format)

# The Concept

We realized maintaining a custom internal navigation stack is very difficult, so we needed a different and simpler solution.
The browser already maintains its own navigation stack, and each stack entry has an associated state.
There are JavaScript APIs to read and write into this history state.
Performing a `popstate` navigation (browser back/forward navigation) restores the state associated with the stack item.
Additionally, the state is persistent, meaning it survives refreshes.

This is the solution to our problem.
We can store an offset to the last `flow source page` and `main page` in the history state.
For example, when a user cancels a flow, they should be navigated back `x` pages, where `x` is the `flow source page offset`.

Calculating the offsets should work like this:

```ts
// navigate to /home -> home is a flow source page and a main page
history.state = { flowSourcePageOffset: 0, mainPageOffset: 0 };
// navigate to /detail -> detail is a flow source page but not a main page
history.state = { flowSourcePageOffset: 0, mainPageOffset: 1 };
// navigate to /detail/a -> detail/a is neither a flow source page nor a main page
history.state = { flowSourcePageOffset: 1, mainPageOffset: 2 };
// navigate back to /detail -> restore state from /detail
history.state = { flowSourcePageOffset: 0, mainPageOffset: 1 };
```

# Identifying The Pages

To identify whether a page is a `flow source page` or a `main page`, we can set a flag in the route's data.

```ts
export const appRoutes: CustomRoute[] = [
  {
    path: '/',
    component: Component,
    pathMatch: 'full',
    data: { flowSourcePage: true, mainPage: true }
  }
];
```

Every page that starts a flow needs to set `flowSourcePage` to `true`, and every main page needs to set `mainPage` to `true`.
To enable autocompletion and type safety, the `Route` type can be extended to add these custom data attributes.

```ts
export interface RouteData {
  flowSourcePage?: boolean;
  mainPage?: boolean;
}

export interface CustomRoute extends Route {
  data?: RouteData;
  children?: CustomRoute[];
}
```

# Working With history.state (LocationService)

In Angular, we can use the `Location` service to interact with the history state.
It abstracts the `history` object and handles some Angular-specific tasks.
The web API for this is simple:

- Read: `history.state`
- Write: `history.replaceState(state, unused, url)`

Since we will use Angular's `Location` service in multiple places, it is helpful to create a wrapper for it.
This wrapper simplifies and unifies the interaction with the `Location` service.
Ensure you import the `Location` service from `@angular/common`.

```ts
// important import
import { Location } from '@angular/common';

export interface HistoryState {
  flowSourcePageOffset?: number;
  mainPageOffset?: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  getCurrentState(): HistoryState | null {
    // history.state
    return this.location.getState() as HistoryState;
  }

  go(relativePosition: number) {
    // e.g. this.location.historyGo(-3) -> navigates back 3 pages
    this.location.historyGo(relativePosition);
  }

  replaceState(state: HistoryState) {
    // history.replaceState()
    this.location.replaceState(this.router.url, undefined, state);
  }
}
```

_Note that `location.replaceState` has different parameters than `history.replaceState`.
`location.replaceState(path: string, query?: string, state?: any)` vs `history.replaceState(data: any, unused: string, url?: string | URL | null)`._

# Basic Navigation

Now let us take a look at the first part of the navigation: forward and back navigation.
To navigate forward, we can use `router.navigate(['/home'])`.

For back navigation, we are going to use `LocationService.go(-1)`.
Although `Location.back()` could also be used, the result would be the same, but the `go` function can be reused later on.

```ts

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly locationService = inject(LocationService);

  back(): void {
    this.historyGo(-1);
  }

  private historyGo(relativePosition: number) {
    this.locationService.go(relativePosition);
  }
}
```

The implementation is straightforward and works in most cases, but there is one exception.
If a logged-in user directly navigates to a detail page and then tries to navigate back, they would end up on the empty start page.
There are two ways a user can navigate back: the native browser back button and our `back` button within the application.
We cannot intercept the native browser back button, meaning the user will always end up on the empty start page.
However, for the `back` button within our application, we can implement a fallback if we detect this scenario.
The fallback is to replace the current page with the home page.

## Prevent Exiting The Application

To determine if a back navigation would leave the application, we first have to know how large the history stack is.
Instead of tracking the size manually, we can use an internal `Angular Router` counter, which is persisted in the history state.
The `ɵrouterPageId` gets updated by the router before the guard checks are run.
This means if we access the `pageId` in a `canActivate` guard, it will already be updated.

However, if you know a little about Angular, you might know that functions and properties beginning with a Greek theta (`ɵ`) are usually private to Angular internals and should not be used.
Angular declares these functions and properties as unstable since they are not part of the public API.
However, in the Angular source code, they added this comment:

```ts
// The `ɵ` prefix is there to reduce the chance of colliding with any existing user properties on
// the history state.
```

This does not guarantee that this property will not change in future updates.
_If it is removed, it is not that difficult to build this yourself._

To make this work, we only have to extend the `HistoryState` model and update the `NavigationService.historyGo` function.

```ts
export interface HistoryState {
  ɵrouterPageId?: number; // <---- Add
  flowSourcePageOffset?: number;
  mainPageOffset?: number;
}
```

Once we have access to the `ɵrouterPageId` state, we simply check if the current navigation request would exit the application.
If it does, we replace the current page with the home page.

```ts

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);

  back(): void {
    this.historyGo(-1);
  }

  private historyGo(relativePosition: number) {
    const pageId = this.locationService.getCurrentState()?.ɵrouterPageId ?? 0;
    if (pageId + relativePosition < 0) {
      this.router.navigate(['/home'], { replaceUrl: true });
      return;
    }
    this.locationService.go(relativePosition);
  }
}
```

# Calculating The Offsets

If we recall the concept, we want to store an offset to the `flow source page` and `main page` in the history state.
The calculation of the offset should happen once a navigation finishes.
The `Angular Router` provides an observable for navigation events.
We can subscribe to `router.events` and listen for `NavigationEnd`.
At this point, we know the navigation has successfully finished, and we can update the state.
One important note is that we do not want to increase the offset if we navigate using `{ replaceUrl: true }`.

Let us take a look at the main part of the `NavigationService`.

_Below the code, there is further explanation about how the code works._

```ts

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);

  private flowSourcePageOffset?: number = undefined;
  private mainPageOffset?: number = undefined;

  constructor() {
    this.setupListener();
  }

  private setupListener() {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        const replacingUrl = this.router.getCurrentNavigation()?.extras.replaceUrl ?? false;
        // 1. Getting Route Data
        const data = this.getRouteData(this.router.routerState.snapshot.root);
        // 2. Reading Current State
        const currentState = this.locationService.getCurrentState();

        // 3. Offset Calculation
        if (data.flowSourcePage) {
          this.flowSourcePageOffset = 0;
        } else if (currentState?.flowSourcePageOffset !== undefined) {
          this.flowSourcePageOffset = currentState.flowSourcePageOffset;
        } else if (this.flowSourcePageOffset !== undefined && !replacingUrl) {
          this.flowSourcePageOffset += 1;
        }

        if (data.mainPage) {
          this.mainPageOffset = 0;
        } else if (currentState?.mainPageOffset !== undefined) {
          this.mainPageOffset = currentState.mainPageOffset;
        } else if (this.mainPageOffset !== undefined && !replacingUrl) {
          this.mainPageOffset += 1;
        }

        // 4. Updating the State
        this.locationService.replaceState({
          ...currentState,
          flowSourcePageOffset: this.flowSourcePageOffset,
          mainPageOffset: this.mainPageOffset
        });
      }
    });
  }

  private getRouteData(snapshot: ActivatedRouteSnapshot): RouteData {
    let activeSnapshot = snapshot;
    // Traverse to the deepest child route if available
    while (activeSnapshot.firstChild) {
      activeSnapshot = activeSnapshot.firstChild;
    }
    return activeSnapshot.data as RouteData;
  }
}
```

## 1. Detecting Flow Source and Main Pages

To read the route data, we must use `this.router.routerState.snapshot.root` instead of injecting `ActivatedRoute`.
We cannot inject `ActivatedRoute` into any service because it is tied to the current active route context, which is only available in components or services injected within the component's hierarchy.

To get the routes data, we traverse to the deepest child route.

## 2. Reading Current State

As mentioned before the navigating back or forward (`popstate`) will restore the state from the newly activated page.
This means we can restore the previous offsets.
If it is a new navigation (`imperative`), then the current state will not have any offset set yet.

## 3. Offset Calculation

If it is a `flow source page` or `main page`, set the offset to 0.
If we recovered a state because it was a `popstate` navigation, set it to the restored value.
And if `flowSourcePageOffset` or `mainPageOffset` is set, and `replaceUrl` is not set, the offset is increased.

## 4. Updating the State

Now that the offset is calculated, it can be set again in the history state.

The really cool part about this concept is that if a reload is triggered, `NavigationEnd` will be dispatched again.
This means the current history state is restored, which automatically sets the variables within this service.

# Requirement 1: Navigate Back to Flow Source Pages on Cancel

It should be straightforward to navigate back to a `flow source page`, as we already know how many pages we need to jump back.

```ts
type NavigationTarget = 'flow-source-page' | 'main-page';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  // ...
  navigateBackTo(target: NavigationTarget) {
    let relativePosition: number | undefined;

    // 1. Getting the Offsets
    const currentState = this.locationService.getCurrentState();

    if (target === 'flow-source-page') {
      relativePosition = currentState?.flowSourcePageOffset;
    } else if (target === 'main-page') {
      relativePosition = currentState?.mainPageOffset;
    }

    // 2. Wrong Usage
    if (relativePosition === 0) {
      console.error(`Calling navigateBackTo ${target} from ${target} does nothing`);
      return;
    }

    // 3. Navigation
    if (relativePosition !== undefined) {
      this.historyGo(relativePosition * -1);
    } else {
      this.router.navigate(['/home']);
    }
  }

  // ...
}
```

## 1. Getting the Offsets

The offsets are stored within history state, so we only need to read it to get the current values.
Depending on the `target`, we then access the corresponding offset.

## 2. Wrong Usage

If the offset is 0, it typically indicates a programming error.
To make the programmer aware of the issue, an error is logged.
It is a programming mistake, because e.g. `navigateBackTo('flow-source-page')` should not be called on a `flow source page`.

## 3. Navigation

When an offset is found, the user is navigated back by the specified number of pages.

However, logged-in users can directly access the application on a detail page, which may not be a `flow source page` or a `main page`.
In such cases, the offsets would not be set.
Instead of preventing navigation, the fallback navigates the user to the home page.

# Requirement 2: Navigate Back Over Finished Flows

Before diving into the solution, it is necessary to cover some `Angular Router` basics.
Let us briefly look at the configuration used in this project.

## Angular Router Theory

```ts
withRouterConfig({ canceledNavigationResolution: 'computed', onSameUrlNavigation: 'ignore' });
```

### canceledNavigationResolution

The `canceledNavigationResolution` setting defines what should happen after a navigation is canceled.

- With `replace (default)`, the canceled navigation URL will be replaced by the origin.
  ![Replace cancel navigation resolution](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316497961/8B2GoQVRe.png?auto=format)
- With `computed`, the `Angular Router` attempts to restore the state before the canceled navigation.
  This keeps the browser history stack intact.
  ![Compute cancel navigation resolution](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316514823/iO7cKQORz.png?auto=format)

### onSameUrlNavigation

The `onSameUrlNavigation` setting defines what should happen when the same URL is activated, for example, if the user clicks the same menu item twice.

- `ignore (default)`: The navigation will be skipped.
- `reload`: The router will reload the component and re-execute all guards.

## Theory

The first problem to address is detecting a back navigation that would lead into a finished flow.
![Example of detecting flows](https://cdn.hashnode.com/res/hashnode/image/upload/v1735736268084/Yh6GI65zT.png?auto=format)

Once this scenario is detected, navigation can proceed to the last `flow source page`, which we implemented in the previous step.

## Detecting Navigation into Finished Flow

Detecting back navigation into a finished flow can be solved using a guard: `flow-page-activation.guard`.
The guard verifies if the origin URL belongs to the current flow.
If it does, the navigation is allowed; otherwise, the navigation is blocked.

To determine whether the origin URL belongs to the same flow, each flow page must define a `flowBasePath` in its route data.
The `flowBasePath` represents a common URL segment shared by all flow pages.

```ts
export interface RouteData {
  flowSourcePage?: boolean;
  mainPage?: boolean;
  flowBasePath?: string; // <---- Add
}

export const routes: CustomRoute[] = [
  {
    path: '/flow/a',
    component: FlowAComponent,
    pathMatch: 'full',
    canActivate: [flowPageActivationGuard],
    data: { flowBasePath: '/flow' }
  },
  {
    path: '/flow/b',
    component: FlowBComponent,
    pathMatch: 'full',
    canActivate: [flowPageActivationGuard],
    data: { flowBasePath: '/flow' }
  },
  {
    path: '/end',
    component: EndComponent,
    pathMatch: 'full'
  }
];
```

However, it is not possible to call `navigateBackTo` within the `guard` itself because guards execute during an active navigation.
This could lead to unexpected errors.

As described earlier, we configured the `Angular Router` in a specific way.

When a blocked navigation is detected, Angular attempts to restore the previous state (`canceledNavigationResolution: computed`).
Under the hood, Angular calls `history.go(1)`, which triggers a new navigation, but restores the browser history stack.
At the time of the guard execution, the previous page is still active.
The restore navigation now wants to navigate to the same URL, but it is ignored due to (`onSameUrlNavigation: ignore`).
This will trigger the `NavigationSkipped` event.

To summarize:

1. If the `flow-page-activation.guard` detects a navigation back into a finished flow, it should return `false`.
2. Wait for the `NavigationSkipped` event to be dispatched.
3. Then call the `navigateBackTo` function.
   ![Computed in action](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316595311/_8_xt5-Mx.png?auto=format)

## Flow Page Activation Guard

The `flow-page-activation.guard` retrieves the `flowBasePath` from the route data and the origin URL.
If they match, the navigation is valid.
If they do not match, the guard returns `false` and waits for the `NavigationSkipped` event.

```ts
export const flowPageActivationGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const navigationService = inject(NavigationService);

  // the shared part of the flow path (e.g., /insurance/accident-coverage-mutation/form -> accident-coverage-mutation) -> must be provided via route data -> see *.routes.ts
  const flowBasePath = route.data.flowBasePath as string;
  if (!flowBasePath) {
    die("'flowBasePath' is not defined but must be provided via routes!");
  }

  // the path from which the navigation to this route originated
  const originUrl = router.routerState.snapshot.url;

  if (originUrl.includes(flowBasePath)) {
    return true;
  }

  // if a navigation request outside a flow targets a flow page, navigate to the latest flowSourcePage, instead of the requested page
  navigationService.navigateBackToTargetAfterNavigationFinish('flow-source-page');
  return false;
};
```

### Handling Forward Navigation

This code also runs during forward navigation.
Starting a flow does not work as expected because the origin URL is not part of the flow.

To work around this, a flow start page can be introduced.
This page shares the same URL segment but is not protected by the guard.
![Flow Start Page](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316623940/6P4A6ACKU.png?auto=format)

During `ngOnInit`, this component redirects to the first flow page:

```ts
router.navigate(['/flow/a'], { replaceUrl: true });
```

### Compromise with Browser Navigation

Once navigated back to the `flow source page`, the browser's forward navigation no longer works, as the `flow/start` page is replaced by the protected `flow/a`.
![Browser Forward Navigation is blocked](https://cdn.hashnode.com/res/hashnode/image/upload/v1735738419103/do6p4Nc1z.png?auto=format)

## Waiting for NavigationSkipped

Navigating back to the `flow source page` is only possible after the current navigation finishes.
The `NavigationSkipped` event ensures this behavior.

```ts

@Injectable({ providedIn: 'root' })
export class NavigationService {
  // ...
  navigateBackToTargetAfterNavigationFinish(target: NavigationTarget) {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationSkipped),
        take(1)
      )
      .subscribe(() => {
        this.navigateBackTo(target);
      });
  }

  // ...
}
```

### Edge Case Handling

If a logged-in user attempts to directly access a flow page, the guard returns `false`.
Returning `false` during an initial navigation does not dispatch the `NavigationSkipped` event.

If the current page is the first page in the stack, redirecting directly to the home page resolves the issue.

```ts
export class NavigationService {
  // ...
  navigateBackToTargetAfterNavigationFinish(target: NavigationTarget) {
    // ADD
    if (this.navigationDirectionService.getRouterPageId() === 0) {
      this.router.navigate([pages.Home.path], { replaceUrl: true });
      return;
    }
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationSkipped),
        take(1)
      )
      .subscribe(() => {
        this.navigateBackTo(target);
      });
  }

  // ...
}
```

# Requirement 3: Navigate Back to Main Pages

We already implemented the logic to track the offset for main pages and navigate back to them.
Simply call `navigationService.navigateTo('main-page')`.

# Conclusion

Implementing this new navigation concept showed me how working with the available tools and APIs can significantly simplify the implementation.
We were able to reduce a lot of code, making the implementation easier, and even resolve some edge case bugs.
If you have any suggestions or better approaches for solving these kinds of use cases, feel free to share them in the comments!
