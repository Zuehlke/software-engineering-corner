---
title: Advanced Routing
domain: software-engineering-corner.hashnode.dev
tags: javascript, web-development, frontend-development, angular
cover: https://cdn.hashnode.com/res/hashnode/image/stock/unsplash/EOq4Dj33G_U/upload/72980e96faa8075e8392477062a3fd78.jpeg?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp&quot
publishAs: mikaruch
saveAsDraft: true
hideFromHashnodeCommunity: false
---

# What is our goal

We have already refactored our navigation concept twice.
Both times we have solely used forward navigations.
Yes also for actions which should have been back navigations, like the in-content back button.

The concept of the old navigation concept was quite simple but got out of hand quite quickly.
We just manage our own navigation stack.
When someone initiated a back navigation, the page was popped from our internal stack, but was pushed onto the browser native stack.
This happened, since under the hood we just called `router.navigate(['/a'], { state: { isBackNavigation: true } })`.
`isBackNavigation` was a flag we used to detect if the navigation was a back navigation or not.

We quickly found out, that the stacks gets out of sync quite quickly, since many people prefer using the native back button over the `back` button from within the portal.

# Angular Router Configuration

Let us quickly have a look at the configuration we are using in our project.

```ts
withRouterConfig({ onSameUrlNavigation: 'ignore', canceledNavigationResolution: 'computed' });
```

**onSameUrlNavigation**

The `onSameUrlNavigation` defines what should happen, when the same URL is activated.
E.g. when the user clicks on the same menu item again.

- `ignore (default)`: The navigation will be skipped
- `reload`: The router will load the component and execute all guards again

**canceledNavigationResolution**

The `canceledNavigationResolution` defines what should happen, after a navigation gets cancelled.

- With `replace (default)` the cancelled navigation URL will be overridden with the origin.
  ![Replace cancel navigation resolution](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316497961/8B2GoQVRe.png?auto=format)
- With `computed` the Angular router tries to restore the state from before the cancelled navigation.
  This will leave the browser stack intact.
  ![Compute cancel navigation resolution](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316514823/iO7cKQORz.png?auto=format)

# The new concept

To come up with a better solution, we first have to understand what requirements we have to meet.
And our portal has some interesting requirements.

- When a user cancels a flow, they should be navigated back to the page where the flow was started from (flow source page).
  ![Visualization of canceling flows](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316536567/siByewFSg.png?auto=format)
- When a user finishes a flow and initiates a back navigation, they should be navigated back to the flow source page.
  ![Visualization of skipping flow pages](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316547891/K6fY_oilb.png?auto=format)
- And, when a user clicks on the grayed out menu on detail pages, the user should be redirected back to a page where the menu is active (main page).
  ![Visualization of navigating to the previous main page](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316557945/FmbKRfvYm.png?auto=format)

## Basic navigation

The basic back and forward navigations are quite simple.
The forward navigation is done as usual with the Angular router.

```ts
router.navigate(['next']);
```

And for the back navigation, we can use the `Location` service from Angular.
It uses `window.history` under the hood, so it is the same as pressing the back button in the browser.

```ts
const location = inject(Location);
// navigate back
location.go(-1);
```

## Theory about Angular Router

To understand how it is possible to skip pages, we first have to have a look at the Angular router.
The Angular router dispatches at every step of the navigation process a different event.
When a navigation starts, the `NavigationStart` event is dispatched from the Angular router.

The `NavigationEnd` event is dispatched, when a navigation finished successfully.

The `NavigationCancel` event is dispatched, when a navigation gets cancelled.
This happens, if for example a canActivate guard returns `false`.

The `NavigationSkipped` event is dispatched, when a navigation gets skipped (duh).
This happens if `onSameUrlNavigation: 'ignore'` is set, and the same URL should be activated as the current.

![Angular Navigation Events](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316570876/l81JiHIHn.png?auto=format)

# Implementation

First, let us remind ourselves what the requirements are:

- Navigate back to the flow source page on cancel during a flow
- Navigate back over finished flows
- Navigate back to a main page where the menu is active

## The concept

Since maintaining our own navigation stack is not an option, we have to find a different solution.
The browser already maintains its own navigation stack, and each stack entry has its own state associated to it, which can be accessed via browser APIs.
To write to the state, we can use the global `history.replaceState()`, and to read from it, we just call `history.state`.
Doing a `popstate` navigation (browser back/forward navigation) will restore the previous state.
And the state is persistent, which means it survives reloading the page.

This is the key to our solution.
We can store an offset to the last `flow source page` and `main page` which was visited in this state.

Calculating the offsets should work like this:

```ts
// navigate to /home -> home is a flow source page and a main page
history.state = { flowSourcePageOffset: 0, mainPageOffset: 0 };
// navigate to /detail -> detail is a flow source page but not a main page
history.state = { flowSourcePageOffset: 0, mainPageOffset: 1 };
// navigate to /detail/a -> detail/a neither flow source page nor main page
history.state = { flowSourcePageOffset: 1, mainPageOffset: 2 };
// navigate back to /detail -> restore state from /detail
history.state = { flowSourcePageOffset: 0, mainPageOffset: 1 };
```

## Identifying the pages

Having the concept from before in our mind, how can we identify a main page or flow source page?
The best solution is setting a flag in the data of the route itself.

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

This means, every page which starts a flow needs to set `flowSourcePage` to `true`, and every main page needs to set `mainPage` to `true`.
To make life easier for developers, the `Route` type can be extended and the two custom data attributes can be added.

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

# Navigate back to flow source pages on cancel

To get started with the implementation, we first have to know how to read and write from the state.
In Angular, we can use the `Location` service, which abstracts the `history` object, and does some other Angular magic.
But the web API would be quite simple:

- Read: `history.state`
- Write: `history.replaceState(state, unused, url)`

## LocationService

Since we will use `Location` in multiple services, we will create our own service for it.
It simplifies and unifies the interaction with `Location`.

```ts
// important import
import { Location } from '@angular/common';

export interface HistoryState {
  flowSourcePageOffset?: number;
  mainPageOffset?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  constructor(
    private readonly location: Location,
    private readonly router: Router
  ) {}

  getCurrentState(): HistoryState | null {
    // history.state
    return this.location.getState() as HistoryState;
  }

  go(relativePosition: number) {
    this.location.historyGo(relativePosition);
  }

  replaceState(state: HistoryState) {
    // history.replaceState()
    this.location.replaceState(this.router.url, undefined, state);
  }
}
```

## NavigatorService

The main logic of the new navigation concepts is implemented in the `NavigationService`.
To recapitulate, we want to write the offset to the last `flow source page` and `main page` to the state.
And we want to do this once a navigation finishes.
We can subscribe to `router.events` and listen for the `NavigationEnd` event.
At this point, we know the navigation successfully finished, and we can update the state.
One important note is, we do not want to increase the offset, if we navigate using `{ replaceUrl: true }`.

### The Brain of the Operation

Let us have a look at the main part of the `NavigationService`.

```ts
@Injectable({
  providedIn: 'root'
})
export class NavigatorService implements OnDestroy {
  private destroy = new Subject<void>();

  private flowSourcePageOffset?: number = undefined;
  private mainPageOffset?: number = undefined;

  constructor(
    private readonly locationService: LocationService,
    private readonly router: Router,
    private readonly navigationDirectionService: NavigationDirectionService,
    private readonly store: Store
  ) {
    this.setupListener();
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  private setupListener() {
    this.router.events.pipe(takeUntil(this.destroy)).subscribe((e) => {
      if (e instanceof NavigationEnd) {
        const replacingUrl = this.router.getCurrentNavigation()?.extras.replaceUrl ?? false;
        const data = this.getRouteData(this.router.routerState.snapshot.root);
        const currentState = this.locationService.getCurrentState();

        if (data.flowSourcePageOffset) {
          this.flowSourcePageOffset = 0;
        } else if (currentState?.flowSourcePageOffset !== undefined) {
          this.flowSourcePageOffset = currentState.flowSourcePageOffset;
        } else if (this.flowSourcePageOffset !== undefined && !replacingUrl) {
          this.flowSourcePageOffset += 1;
        }

        if (data.mainPageOffset) {
          this.mainPageOffset = 0;
        } else if (currentState?.mainPageOffset !== undefined) {
          this.mainPageOffset = currentState.mainPageOffset;
        } else if (this.mainPageOffset !== undefined && !replacingUrl) {
          this.mainPageOffset += 1;
        }

        this.locationService.replaceState({ ...currentState, flowSourcePageOffset: this.flowSourcePageOffset, mainPageOffset: this.mainPageOffset });
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

As you can see, we subscribe to all `NavigationEnd` events.
We have to get the route data at this point, to know if the page is either a `flowSourcePage` or `mainPage`.
The not so nice part is, we have to drill down the `ActivatedRouteSnapshot`, to get the current route data, since the service can not inject `ActivatedRoute`.
We also read the current state from the history.
If it is a `popstate` navigation (browser back/forward), the current state would have the offset already set.
Or if it is an `imperative` navigation, the current state would not have any offset yet.

The logic for calculating the offset is simple.
If it is a `flowSourcePage` or `mainPage`, set the offset to 0.
If we recovered a state, because it was a `popstate` navigation, set it to the value which was already in the state.
And if `flowSourcePageOffset` or `mainPageOffset` is not `undefined` and we do not want to replace the page on the stack, we just count one up.

At the end we replace the current history state, and have the proper offset associated to the browser stack entry.

The cool thing about this concept is, if a reload is triggered, `NavigationEnd` will be dispatched again.
This means we get the current history state again, which automatically sets the variables within this service.

### Basic Back Navigation

With this implementation, we have the offset calculation done.
But so far, we cannot do any basic navigations yet.
The easiest navigation is a simple back navigation.
Let us have a look at how we implemented this scenario.

```ts
export class NavigatorService implements OnDestroy {
  // ...
  back(): void {
    this.historyGo(-1);
  }

  private historyGo(relativePosition: number) {
    if (this.navigationDirectionService.getRouterPageId() + relativePosition < 0) {
      this.store.dispatch(routerNavigate({ commands: [pages.Home.path], extras: { replaceUrl: true } }));
      return;
    }
    this.locationService.go(relativePosition);
  }

  // ...
}
```

As you can see, it is quite simple.
We just call under the hood `history.go(-1)`.
But one exception exists.
If someone directly navigates to a page, tries to do a back navigation, but there is no previous page in the stack, we would end up on `about:blank`.
This will always happen if the native browser back button is used, but it should never happen if the button within the portal is clicked.
Hence, we always navigate to our home page, if we detect that the back navigation would leave our portal.

#### NavigationDirectionService (keeping track of the current page id)

To figure out, if the user wants to leave the portal, we will have to implement another service.
The `NavigationDirectionService` is going to not only keep track of the current `pageId`, but also detect which direction the `popstate` navigation is.
The latter one, is especially helpful for our back and forward Angular animations.

```ts
@Injectable({
  providedIn: 'root'
})
export class NavigationDirectionService implements OnDestroy {
  private currentPageId = 0;
  private destroy = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly locationService: LocationService
  ) {
    this.setupListeners();
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  getRouterPageId(): number {
    return this.locationService.getCurrentState()?.ɵrouterPageId ?? 0;
  }

  private setupListeners() {
    this.router.events.pipe(takeUntil(this.destroy)).subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.currentPageId = this.getRouterPageId();
      }
    });
  }
}
```

To explain what we are doing here, we simply keep the `currentPageId` in memory and compare it to the `ɵrouterPageId`.
The `ɵrouterPageId` gets updated by the Angular router during the `RoutesRecognized` phase, which is called before `GuardsCheck`.
This means, if we check the value of `ɵrouterPageId` from a guard, it will already contain the new page id, while in the service we still track the old id in `currentPageId`.

However, important to note is, this only works with `popstate`.
Imperative navigations (navigations that were made with `router.navigate`) will always be forward navigations.

Now you might ask what is `ɵrouterPageId`.
This property is used by Angular to keep track of the current router page id.
And if you know a little bit about Angular, you might know any function or property that starts with the greek theta is private to Angular and should not be used.
It is likely to break, since it is not a public API.
However in the Angular source code, they added this comment:

```ts
// The `ɵ` prefix is there to reduce the chance of colliding with any existing user properties on
// the history state.
```

Since we know this comment, and know that the router somehow has to keep track of the current page id, I am quite sure that this information is not going to be removed from `history.state`.
It might come differently packaged, but it will still be there.
And in the worst case, we could rebuild what Angular currently has.

### Navigating to a Flow Source Page during a Flow

It should be quite simple to navigate back to a `flowSourcePage`, since we already know how many pages we have to jump back.
In the end the implementation is super simple.

```ts
type NavigationTarget = 'flow-source-page' | 'main-page';

export class NavigatorService implements OnDestroy {
  // ...
  navigateBackTo(target: NavigationTarget) {
    let relativePosition: number | undefined;

    const currentState = this.locationService.getCurrentState();

    if (target === 'flow-source-page') {
      relativePosition = currentState?.flowSourcePageOffset;
    } else if (target === 'main-page') {
      relativePosition = currentState?.mainPageOffset;
    }
    if (relativePosition === 0) {
      return;
    }
    if (relativePosition !== undefined) {
      this.historyGo(relativePosition * -1);
    } else {
      this.store.dispatch(routerNavigate({ commands: [pages.Home.path] }));
    }
  }

  // ...
}
```

We read the current history state.
We get the relativePosition defined by the target.
We then jump back to this page by using the offset.
If the offset is 0, we do not want to do anything, since we just want to stay on the current page.
However, there is one problem.
Users can access the application directly into a detail page, which is neither a `flowSourcePage` or a `mainPage`.
Hence, we can never set an offset, because there is no offset to begin with.
So instead of letting the user not navigate, the easiest solution is to do a simple forward navigation to our home page.

And that is it, users can now navigate around the app and jump back in history to the page they came from.

# Navigate back over finished flows

Having implemented the previous solution, it is quite easy to implement this requirement.
We want to detect if we want to navigate into a finished flow.
If we detect this, we can redirect the user back to the previous `flowSourcePage`.

Since this is not a new concept to use, we already solved this with guard (`flow-page-activation.guard`).
This guard checks if the URL we are originating from, belongs to the current flow.
If it does, we allow the navigation else we block the navigation.

To identify whether the two pages belong to the same flow, each flow page has to define a `flowBasePath`.
This `flowBasePath` is defined in the route data, and it is a common url segment between the flow pages have.

```ts
export interface RouteData {
  // ...
  flowBasePath?: string;
}

export const routes: CustomRoute[] = [
  {
    path: '/flow/a',
    component: FlowAComponent,
    pathMatch: 'full',
    data: { flowBasePath: 'flow' }
  },
  {
    path: '/flow/n',
    component: FlowBComponent,
    pathMatch: 'full',
    data: { flowBasePath: 'flow' }
  },
  {
    path: '/start',
    component: StartComponent,
    pathMatch: 'full'
  }
];
```

## Theory

In theory, it is clear what has to happen.
The guard detects that the page we are coming from is not part of the flow and redirects the user to the `flowSourcePage`.
The main issue with this concept is, the guard is called during an active navigation.
This means if we call directly `history.go(-3)` we interrupt an ongoing navigation, which could lead to a bad state.
Here `canceledNavigationResolution: computed` and `onSameUrlNavigation: ignore` comes into play.
Since Angular detects that we return `false` from the guard, Angular tries to restore the previous state.
This means they call `history.go(1)`, basically doing a forward navigation to the origin page.
Since we have never changed the URL, because the guard returned `false`, Angular now tries to activate the same URL again.
Since we configured to ignore any navigation, which activates the same URL, the `NavigationSkipped` event is dispatched.

So what we need to do in the guard, return `false`, wait until `NavigationSkipped` is dispatched and then call `navigateBackTo`.
![Computed in action](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316595311/_8_xt5-Mx.png?auto=format)

## NavigatorService (waiting for NavigationSkipped)

The implementation is again quite simple.
However, we have another edge case.
If the user directly tries to access a flow page, the guard should still return `false`.
However returning `false`, but having no previous navigation will result in a blank page being shown.
This means, if we see that the current page is the first page in the stack, we just redirect to our home page.
This should almost never happen though, but it is good to have it in place, in case it does happen.

```ts
export class NavigatorService implements OnDestroy {
  // ...
  navigateBackToTargetAfterNavigationFinish(target: NavigationTarget) {
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

## Flow Page Activation Guard

How to detect if we are redirecting from one to another flow page was described above.

But let us look at an example.
![Example of trying to navigate to a finished flow](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316611920/7Q3bsiK3q.png?auto=format)
In this case the previous URL **must** start with `/flow`.
So navigating from `/detail/a` to `/flow/b` should trigger `navigateBackToTargetAfterNavigationFinish('flow-source-page)`.

The `flowPageActivationGuard` simply has to read the `flowBasePath` from the route data, get the `originUrl`.
If they match, the navigation is valid.
If they do not, then we have to navigate back to the `flowSourcePage`.

```ts
export const flowPageActivationGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const navigatorService = inject(NavigatorService);

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

  // if a navigation request outside a flow targets a flow page, we navigate to the latest flowSourcePage, instead of the requested page
  navigatorService.navigateBackToTargetAfterNavigationFinish('flow-source-page');
  return false;
};
```

You might have noticed in the previous image, that navigating from `/start` to `/flow/a` would trigger the guard.
And the guard will return `false` because `/start` is not within the flow.
To work around this issue, we added a flow start page, which is part of the flow URL wise, but is not protected by the guard.
![Flow Start Page](https://cdn.hashnode.com/res/hashnode/image/upload/v1731316623940/6P4A6ACKU.png?auto=format)
This component then automatically redirects to the actual first flow page during `ngOnInit`.

```ts
router.navigate(['/flow/a'], { repalceUrl: true });
```

With this implementation, we have to take one compromise into consideration.
Navigating backwards is no problem now, but once one navigated back, the forward navigation will always go to the first flow page `/flow/a`.
And this means, the `flow-page-activation.guard` will return `false`, which means the browser navigation is stuck.
We tried other ways on how to solve this problem, but came to the conclusion, that the browsers (especially Chrome) had issues with them.

# Navigate back to main pages

We have already implemented the logic to track the offset and even navigate back to `mainPages`.
We only have to call `navigatorService.navigateTo('main-page')`
