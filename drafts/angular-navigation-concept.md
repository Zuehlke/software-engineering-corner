---
title: Advanced Routing
domain: software-engineering-corner.hashnode.dev
tags: javascript, web-development, frontend-development, angular
cover: https://cdn.hashnode.com/res/hashnode/image/stock/unsplash/EOq4Dj33G_U/upload/72980e96faa8075e8392477062a3fd78.jpeg?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp&quot
publishAs: mikaruch
saveAsDraft: true
hideFromHashnodeCommunity: false
---

**Disclaimer: This is a general concept, but the code snippets and some issue we solved were Angular specific.**

# TLDR;
As with almost everything, using the browser standards is resulting in the best and easiest implementation for our application routing.
Previously we managed our own navigation page stack in memory, but it got out of sync when the native browser back/forward feature were used.
Moving to `location.back()` and `location.go(-x)` helped us solve this issue and made the implementation a lot more streamlined.

# What was our goal
We have already refactored our navigation concept twice.
Both times we have mainly used forward navigations.
Yes also for actions that should have been back navigations.

The concept of the old navigation concept was quite simple, we just managed our own navigation stack.
When someone did a back navigation, the page was just popped from our internal stack.
But here also laid our issue, while our app knows that it was a back navigation, the browser pushed the new page on the native browser stack instead.
This happened, since under the hood we just called `router.navigate(['/a'], { state: { isBackNavigation: true } })`.

We quickly found out, that the stack gets out of sync quite quickly, since many people prefer using the native back button over the `back` button from within the website.

## Why refactor it a third time?
The honest answer is, we did not necessarily need to do it.
Yes we could not use Angular's scroll restoration feature and the state got out of sync.
But we just built our own scroll restoration, and the syncing problem affected only browsers.
Since we are mobile first, this did not really bother us either.

Now you might ask, why did we still do it?
To me, it just sounded fun and challenging, so I pushed for it.
And I was in luck, our PO was on holidays, so no one was there to object.
There is the developers pride as well, and our pride was a bit hurt, since we had the previously mentioned bugs.
I do not know, it might just be a me thing though.

Jokes aside for a moment, I was able to convince my peers, because it promises great simplification in our code, and we can start using certain Angular features again.

# The new concept
To come up with a better solution, we first had to understand what requirements we had to meet.
And our app has some interesting requirements.

- We have a concept we call flows, in these flows the user mostly does some sort of mutation to his data.
This means when a flow is finished, the user is not allowed to navigate back into the flow.
So somehow those flow pages need to be skipped during the back navigation.
![Visualization of skipping flow pages](https://cdn.hashnode.com/res/hashnode/image/upload/v1722059744888/mdVaUkM3A.png?auto=format)
- When a user cancels a flow, he should be navigated back to the page where the flow was started from.
![Visualization of canceling flows](https://cdn.hashnode.com/res/hashnode/image/upload/v1722059816861/jupymtMEm.png?auto=format)
- And, for some reason, the menu is grayed out on detail pages.
So when you click on the grayed out menu, you should be redirected to a page where it is active.
Those pages where the menu is active are called hub pages.
![Visualization of navigating to the previous hub page](https://cdn.hashnode.com/res/hashnode/image/upload/v1722060612577/rZmlmL735.png?auto=format)

## Basic navigation
The basic back and forward navigation is quite simple.
We do the forward navigation the same way we have always done it.
```ts
router.navigate(['next']);
```
And for the back navigation we simply do
```ts
location.back();
```
This works perfectly, as long as there is no Angular guard stopping the navigation.

## Theory about Angular Router
To understand how we can skip pages, we first have to have a look at the Angular router events.
When any navigation starts, the `NavigationStart` is dispatched.

A `NavigationEnd` event is dispatched, when a navigation ended successfully.

A `NavigationCancel` event is dispatched, when a navigation gets cancelled.
This happens, if for example a canActivate guard returns `false`.

And a `NavigationSkipped` event is dispatched, when a navigation gets skipped (duh).
This happens when the same URL should be loaded as the current.
The behavior can be changed with following router configuration: `onSameUrlNavigation`.
- `ignore (default/we use)`: The navigation will be skipped without calling `NavigationStart`
- `reload`: If the same URL is loaded, the whole navigation process is executed starting with `NavigationStart`. It will end with `NavigationEnd` or `NavigationCancel`.

![Angular Navigation Events](https://cdn.hashnode.com/res/hashnode/image/upload/v1722062002425/LaxtWYtW4.png?auto=format)

We had to adapt following router config.
The `canceledNavigationResolution` defines what should happen, when a navigation gets cancelled.
- With `replace (default)` the cancelled navigation URL will be overriden with the origin.
![Replace cancel navigation resolution](https://cdn.hashnode.com/res/hashnode/image/upload/v1722065513474/2O3ePgS4x.png?auto=format)
- With `computed (we use)` the Angular router tries to restore the state from before the cancelled navigation.
This will leave the browser stack intact.
![Compute cancel navigation resolution](https://cdn.hashnode.com/res/hashnode/image/upload/v1722069229276/5UVJe5ylq.png?auto=format)

## How we skip pages
Now that we know how the Angular router works, we can get to work.
The theory is clear, if we want to get back to a page in the history, and we can not maintain our own page stack, we have to iterate over the previous pages.
It should work like the following:
```ts
location.back();
canActivate(-2);
canActivate(skipPages) {
    if(should skip) {
      location.go(skipPages);
      return canActivate(skipPages - 1);  
    }
    return true;
}
```
To put this into words, when we want to navigate back, we have to check on every page, whether it should be skipped.
If it should be skipped, we go one more page back and do it all over again.

Now let us remind what our requirements are:
- Navigate back to flow source pages on cancel
- Navigate over finished flows
- Navigate back to a hub page where the menu is active

## How to skip to the flow source page
Having the concept from before in our mind, how do we decide whether a page is a flow source page?
The easiest solution we found was setting a boolean in the data of the route itself.
```ts
{
    path: '/',
    component: Component,
    pathMatch: 'full',
    data: { flowSourcePage: true }
}
```
This means, every time a new page is added, which starts a flow, this `flowSourcePage` boolean needs to be added to the new route.

The other difficulty is, where do we add the logic, which decides if we need to skip pages or just navigate back.
The best way we came up with, was adding a global canActivateChildren guard.
This guard will run every time a navigation is executed.
```ts
export const appRoutes: Routes = [
  {
    path: '',
    canActivateChildren: [guard],
    children: [
      ...all routes
    ]
  }
]
```
The guard can now override navigation requests and initiate the iteration.
It should look something like this:
```ts
export const guard = (childRoute) => {
  if (childRoute.component === null) {
    // our app relies heavily on nested routes
    // so the canActivateChildren is being called multiple times per navigation
    // since we only want to run the logic for the leaf routes, we just allow it as long as it is not a leaf route
    return true;
  }
  const data = childRoute.data;
  if(!data) {
    return true;
  }
  const navigationService = inject(NavigationService);
  if (navigationService.isNavigatingToTarget()) {
    if(navigationService.isNavigationTarget(data)) {
      navigationService.navigatedToTarget();
      return true;
    }
    navigationService.navigateAfterSkipped();
    return false;
  }
  return true;
}
```

And the `navigationService` does the following:
```ts
import { Location } from '@angular/common';

type NavigationTarget = 'flow-source-page';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private location = inject(Location);
  private router = inject(Router);
  
  private skip = -1;
  private navigationTarget?: NavigationTarget;
  
  navigateTo(target: NavigationTarget) {
    this.skip = -1;
    this.navigationTarget = target;
    this.location.historyGo(this.skip);
  }
  
  isNavigatingToTarget() {
    return !this.navigationTarget;
  }

  isNavigationTarget(routeData: Data) {
    if(this.navigationTarget === 'flow-source-page') {
      return (routeData['flowSourcePage'] as boolean) ?? false;
    }
    throw new Error('isNavigationTarget should never be called when navigationTarget is undefined');
  }

  navigatedToTarget() {
    this.navigationTarget = undefined;
    this.skip = -1;
  }

  navigateAfterSkipped() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationSkipped),
        take(1)
      )
      .subscribe(() => {
        this.skip -= 1;
        this.location.historyGo(this.skip);
      });
  }
}
```

To cancel `navigationService.navigateToFlowSourcePage()` has to be called.

I think the only function that needs explaining is `navigateAfterSkipped`.
The reason why `this.location.historyGo(this.skip);` can not be called immediately, is because a navigation is at that point still in progress.
And the `computed` cancel handler of the Angular router is not finished yet.
Remember from before `NavigationSkipped` is only dispatched if the url that should be activated is the same as the current.
So now we know, that `NavigationSkipped` is dispatched at the very end when we are back on the original page, and exactly then we want to navigate further back.
![Computed in action](https://cdn.hashnode.com/res/hashnode/image/upload/v1722068727369/6SYDEYFNA.png?auto=format)

## How to skip finished flows
Having implemented the previous solution, it is actually quite easy.
We have to detect a finished flow and if we detect one, we can just trigger the `navigateTo('flow-source-page')` function.
To detect if a flow is finished, we simply look at the URL of the previous page.
If the previous URL starts with a predefined string, then the navigation is allowed.
The predefined string is added in the data of the route.
```ts
{
    path: '/flow/a',
    component: FlowAComponent,
    pathMatch: 'full',
    data: { flowBasePath: 'flow' }
}
```
Let us look at an example.
![Example of trying to navigate to a finished flow](https://cdn.hashnode.com/res/hashnode/image/upload/v1722071295528/TaspIfzJU.png?auto=format)
In this case the previous URL **must** start with `/flow`.
So navigating from `/detail/a` to `/flow/b` will trigger `navigateTo('flow-source-page)`.

```ts
export const flowPageActivationGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const navigationService = inject(NavigationService);

  const flowBasePath = route.data.flowBasePath as string;
  if (!flowBasePath) {
    throw new Error("'flowBasePath' is not defined but must be provided via routes!");
  }

  // the path from which the navigation to this route originated
  const originUrl = router.routerState.snapshot.url;

  // the navigation from/to flow pages is only allowed from another flow page
  const isFlowPageActivationAllowed = originUrl.includes(flowBasePath);
  // if a navigation request outside a flow targets a flow page, we navigate to the latest flowSourcePage, instead of the requested page
  if (!isFlowPageActivationAllowed) {
    navigationService.navigateTo('flow-source-page');
  }
  return isFlowPageActivationAllowed;
};
```

You might have already seen, that the navigation from `/start` to `/flow/a` would also trigger the redirect.
To fix this issue, we added a flow start page, which has the same URL, but is not protected by the guard.
![Flow Start Page](https://cdn.hashnode.com/res/hashnode/image/upload/v1722071659339/TzTs5_dJc.png?auto=format)
It automatically redirects on `ngOnInit`.
This also came in handy for flows, where there might be different start screens, depending on the users account setup.

But again, we introduced another issue.
Right now if we want to do `location.back()` on `/flow/a`, we will never reach `/start` page, since `/flow/start` automatically redirects to `/flow/a`.
You might think doing `replaceUrl: true` would solve the problem.
Yes it solves the `location.back()` problem.
But imagine you navigate back from `/flow/a` to `/start` and then you want to navigate forward again using the browser buttons.
This will not work, since the next page is `/flow/a` and this one is protected by the guard.

So we had to dig deep and find a solution for this.
The solution we landed on is in my opinion a bit of a hack, but it works.
We flag those flow start pages with a `backSkip: true` attribute.
```ts
{
    path: '/flow/start',
    component: FlowStartComponent,
    pathMatch: 'full',
    data: { backSkip: true }
}
```
But the question is how do we detect if it is a back navigation or not?
Well now we had to dig even deeper.
And deep we dug. We landed on a solution, that is very Angular specific.
```ts
// TODO: verify that this is correct
type NavigationType = 'back' | 'forward' | 'imperative';

@Injectable({ providedIn: 'root' })
export class NavigationDirectionService {
  private window = inject(WINDOW);
  private router = inject(Router);
  
  private currentPageId = 0;
  
  constructor() {
    this.setupListener();
  }
  
  getNavigationType() {
    if(this.router.getCurrentNavigation().trigger !== 'popstate') {
      return 'imperative';
    }
    if(this.currentPageId < this.getRouterPageId()) {
      return 'back';
    }
    return 'forward';
  }
  
  private getRouterPageId() {
    return this.window.history.state.ɵrouterPageId;
  }
  
  private setupListener() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(()=>{
      this.currentPageId = this.getRouterPageId();
    })
  }
}
```

Now you might ask what the f*ck is `ɵrouterPageId`.
Well Angular keeps track of the current router page id.
You can check it out [in the Angular state manager](https://github.com/angular/angular/blob/main/packages/router/src/statemanager/state_manager.ts#L220).
I will not go too much into detail, because honestly I think I understand what happens there, but I am not entirely sure.
But important to know is, the `ɵrouterPageId` is updated during the `RoutesRecognized` event, which is called before `GuardsCheck`.
This means, if we check the direction in a guard, we have the new page id in `ɵrouterPageId` and the old one in `currentPageId`.

**So how can we use this to our advantage?**

Since we have the `currentPageId` we just compare it to the already updated `ɵrouterPageId`.
If it `ɵrouterPageId` is smaller than `currentPageId`, we know it is a back navigation.
![How to detect the navigation direction](https://cdn.hashnode.com/res/hashnode/image/upload/v1722076281194/vqj69u35t.png?auto=format)

However, important to note is, this only works with `popstate`.
Imperative navigations (navigations that were made with `router.navigate`) will always be forward navigations.

Alright, now we know how to detect back navigations.
We can now update the `guard` from before.
```ts
export const guard = (childRoute) => {
  ...
  if (navigationSerivce.isBackNavigation() && (data['backSkip'] as boolean) ?? false) {
    navigationService.navigateAfterSkipped();
    return false;
  }
  return true;
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private navigationDirectionService = inject(NavigationDirectionService);
  ...
  isBackNavigation() {
    return this.navigationDirectionService.getNavigationType() === 'back';
  }
}
```

And just like this, our second requirement is fulfilled.
Super simple right?

## Navigate back to hub pages
This is the simplest of all requirements.
We already have the logic, to navigate to flow source pages.
Let us use this code and extend it to work with hub pages.

```ts
import { Location } from '@angular/common';

type NavigationTarget = 'flow-source-page' | 'hub-page';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  ...
  
  isNavigationTarget(routeData: Data) {
    if(this.navigationTarget === 'flow-source-page') {
      return (routeData['flowSourcePage'] as boolean) ?? false;
    }
    if(this.navigatedToTarget() === 'hub-page') {
      return (routeData['hubPage'] as boolean) ?? false;
    }
    throw new Error('isNavigationTarget should never be called when navigationTarget is undefined');
  }
  
  ...
}
```

Then we just have to mark the hub pages in the route data.
```ts
{
    path: '/hubpage',
    component: HubPageComponent,
    pathMatch: 'full',
    data: { hubPage: true }
}
```

And to trigger the navigation to the hub page, we just have to call `navigationService.navigateTo('hub-page')`.
And that is it, we did it and it works almost flawless.


# Known Issues
Remember how `NavigationSkipped` works?
Well yeah me too, and we have one big problem because of it.
Let us have a look at this example.
![Navigation that breaks our navigation concept](https://cdn.hashnode.com/res/hashnode/image/upload/v1722077740906/XsuS1iHDB.png?auto=format)
We want to navigate from the last `/a` to the `hub page`.
But we get stuck at the first `/a`.
The reason for this is, it is the same URL, and our config says we should ignore those cases.
Meaning, the guards are not called anymore and only `NavigationSkipped` is dispatched.
So far I have not found a solution to this problem.

# Conclusion
I am not sure if what I did here can be solved easier.
I just know, that we were able to make our implementation with this new concept much easier and more streamlined.
In the end we use the Angular router to our advantage and let it do a lot of the work, we just use the platform.
Let me know in the comments, if there are other and better approaches of solving these requirements.
