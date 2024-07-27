**Disclaimer: This is a general concept, but the code snippets and some issue we solved were Angular specific**
# TLDR;
As with almost everything, using the standards from the browsers, is resulting in the best and easiest implementation for our internal navigation.
Previously we managed our own navigation stack within the stack, but it got out of sync when the native browser back/forward feature were used.
Moving to `location.back()` helped us resolve this issue and made the implementation a lot simpler.

# What was our goal
We have already refactored our navigation concept twice.
Both times we have mainly used forward navigations.
Yes also for actions that should have been back navigations.

The concept of the old navigation concept was quite simple, we just managed our own navigation stack.
When someone did a back navigation, the page was just popped from our internal stack.
But here also laid our issue, while our app knows that it was a back navigation, the browser pushed the new page on the native browser stack instead.
This happened, since under the hood we just called `router.navigate(['/a'], { state: { isBackNavigation: true } })`.

We quickly found out, that the stack gets out of sync quite quickly, since many people use the native back over the `back` button within the website.

## Why refactor it a third time?
The honest answer is, we did not necessarily need to do it.
Yes we could not use Angular's scroll restoration feature and the state got out of sync.
But since most of our users use the native app, where those sync issue never happen, it was not a big annoyance.

_The issue does not happen in native apps, because there are no browser back and forward navigations. There we control everything ourselves_

Now you might ask, why did we still do it?
To me, it just sounded fun and challenging, so I pushed for it.
And I was in luck, our PO was on holidays, so no one objected.
And of course, we have something called developers pride.
And our pride was a bit hurt, since we still had bug with it.
I do not know, it might just be a me thing though.

Jokes aside for a moment, I was able to convince my peers, because it promises great simplification in our code, and we can start using certain Angular features again.

# The new concept
To come up with a better solution, we first had to understand what requirements we had to meet.
And our app has some interesting requirements.

- We have a concept we call flows, in these flows the user mostly does some sort of mutation to his data.
This means when a flow is finished, the user is not allowed to navigate back into it.
So somehow those flow pages need to be skipped during the back navigation.
![Visualization of skipping flow pages](https://cdn.hashnode.com/res/hashnode/image/upload/v1722059744888/mdVaUkM3A.png?auto=format)
- When a user cancels during this flow, he should be navigated back to the page where the flow was started from.
![Visualization of canceling flows](https://cdn.hashnode.com/res/hashnode/image/upload/v1722059816861/jupymtMEm.png?auto=format)
- For some reason, the menu is grayed out on certain detail pages.
What should happen, when you click on the grayed out menu, you should be redirected to a page where it is active again.
Those pages are called hub pages.
![Visualization of navigating to the previous hub page](https://cdn.hashnode.com/res/hashnode/image/upload/v1722060612577/rZmlmL735.png?auto=format)

## Basic navigation
The basic back and forward navigation is quite simple.
We do the forward navigation as we do it normally.
```ts
router.navigate(['next']);
```
And the back navigation simply does
```ts
location.back();
```
This works perfectly, as long as there is no Angular guard stopping this navigation as it does for the flows.

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
- `reload`: If the same URL is loaded, the whole navigation process is done. It will end with `NavigationEnd` or `NavigationCancel`.

![Angular Navigation Events](https://cdn.hashnode.com/res/hashnode/image/upload/v1722062002425/LaxtWYtW4.png?auto=format)

We had to adapt one more router config.
The `canceledNavigationResolution` defines what should happen, when a navigation gets cancelled.
- With `replace (default)` the cancelled navigation URL will be overriden with the origin.
![Replace cancel navigation resolution](https://cdn.hashnode.com/res/hashnode/image/upload/v1722065513474/2O3ePgS4x.png?auto=format)
- With `computed (we use)` the Angular router tries to restore the state from before the cancelled navigation.
This will leave the browser stack intact.

## How we skip pages
Now that we know how the Angular router works, we can get to work.
The theory is clear, if we want to get back to a page in the history, and we can not maintain our own page stack, we have to iterate over the previous pages.
It should work like this:
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
- Navigate over finished flows
- Navigate back to flow source pages on cancel
- Navigate back to a hub page where the menu is active



# Known Issues
We did not find a solution to one problem. 
