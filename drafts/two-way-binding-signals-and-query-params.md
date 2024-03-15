---
title: Two-way binding between Signals and Query Params
subtitle: "Pushing the limits of signals while rediscovering Angular concepts"
domain: software-engineering-corner.zuehlke.com
tags: signals, web-development, javascript, typescript, frontend-development, reactivity, explained, angular
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1710531988213/wpYOexURa.jpg?auto=format
publishAs: juliocastrodev
hideFromHashnodeCommunity: false
saveAsDraft: true
---

Signals are the hot topic of today. Pretty much every major framework (except `React`...) is introducing them in one way or another. This is surprisingly also the case of Angular, which is making huge efforts to improve a lot of the pain points we've been experiencing for too many years. A few examples of this include standalone components, a new build system leveraging esbuild and our protagonist of today: signals. 

If you want to learn more about what signals are and a few interesting historical details about them, reach out to our amazing previous article [Signals, Signals everywhere][signalsEverywhereArticle] by [Lucas Schnüriger][lucasProfile].

The whole concept of signals is a pretty new topic in the Angular community. In fact, just a few weeks ago, [Angular 17.2][angular17.2] was released, introducing the possibility of using two-way binding along with signals. And not long before, [Angular 17.1][angular17.1] released a new API to specify `@Input()` while working with results as signals. 

Wait a minute, really? Weren't those important APIs already available when the Angular team released the first stable version of signals? Isn't two-way binding or, even more, parent-to-child communication basic features of the framework? Yes, we could claim that but the Angular team is taking a gradual strategy to introduce all these new concepts into the framework. And that's probably a good thing, since they are learning and listening from the community during the process. You can also influence and give your oppinion in the [opened discussions][angularDiscussions].

In today's article, we'll experiment and push to the limit the current state of signals in the Angular framework. For that, we will implement an exciting Two-way binding mechanism to map signals with Angular's router state and the browser url. Are you ready? 

## The Challenge

Let's start with a simple application:

```ts
@Component({
  selector: "app-root",
  standalone: true,
  template: ` <h1>Signals Demo</h1> `,
})
export class AppComponent {}
```

![Initial application](https://cdn.hashnode.com/res/hashnode/image/upload/v1710536390017/q5rnF-2Oc.png?auto=format&w=500)

This is pretty much what you get when you generate a new Angular application nowadays. But without all the boilerplate and some basic styles.

Let's start by consuming query params in the traditional way: using `RxJS`:

```ts
@Component({
  selector: "app-root",
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <h1>Signals Demo</h1>
    <p>Your first name is: {{ firstName$ | async }}</p>
  `,
})
export class AppComponent {
  private activatedRoute = inject(ActivatedRoute);

  firstName$ = this.activatedRoute.queryParams.pipe(
    map((allQueryParams) => allQueryParams["firstName"])
  );
}
```

![Consuming query params with RxJS](https://cdn.hashnode.com/res/hashnode/image/upload/v1710536464769/FbnjIrApA.gif?auto=format)

Great! this works and it's not necessarily inconvenient since Angular is handling the tedious task of managing subscriptions when we use the `async` pipe. Now let's see how this would look like with signals:

At the moment of writing this article, Angular's router doesn't provide signals as results when we use its API. Most likely this will be introduced in future releases, but for now we have to do a workaround. We can pick the current responses from Angular's router, which are based on `RxJS`'s observables, and convert them by using the `toSignal` utility function:

```ts
@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <h1>Signals Demo</h1>
    <p>Your first name is: {{ firstName() }}</p>
  `,
})
export class AppComponent {
  private activatedRoute = inject(ActivatedRoute);

  firstName = toSignal(
    this.activatedRoute.queryParams.pipe(map((allQueryParams) => allQueryParams["firstName"]))
  );
}
```

This code will produce the exact same result as the `RxJS`-only approach. But now, notice that we don't need the `async` pipe anymore, or even to worry about managing a subscription. The `firstName` signal will be connected to the `firstName` query param, and will be updated whenever there's a change on it. We can consume its value by just evaluating the signal and now we can use all the other interesting features like `computed`, `effect`, etc.

Let's make the example a bit more interesting by adding a few more query params and extracting the logic of creating the signal to a private method:

```ts
@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <h1>Signals Demo</h1>
    <p>Full name: {{ fullName() }}</p>
    <p>Age: {{ age() }}</p>
  `,
})
export class AppComponent {
  private activatedRoute = inject(ActivatedRoute);

  firstName = this.getQueryParam("firstName");
  lastName = this.getQueryParam("lastName");
  age = this.getQueryParam("age");

  fullName = computed(() => `${this.firstName() ?? ""} ${this.lastName() ?? ""}`);

  private getQueryParam(name: string) {
    const value$ = this.activatedRoute.queryParams.pipe(
      map((allQueryParams) => allQueryParams[name])
    );

    return toSignal(value$);
  }
}
```

![Consuming query params with signals](https://cdn.hashnode.com/res/hashnode/image/upload/v1710536530242/EJ6p_x7xp.gif?auto=format)

This is already pretty cool! We have a handy utility to consume query params. Notice how easily we combined the `firstName` and `lastName` signals to compute the `fullName` one, this would have been much more verbose and complicated using `RxJS`.

Let's add more features. Let's say we want a button to anonymise the user, meaning removing the values of `firstName` and `lastName`:

```ts
@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <h1>Signals Demo</h1>
    <p>Full name: {{ fullName() }}</p>
    <p>Age: {{ age() }}</p>

    <button (click)="anonymise()">I want to be anonymous 👤</button>
  `,
})
export class AppComponent {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  // ...

  anonymise() {
    const queryParams = { firstName: undefined, lastName: undefined };
    this.router.navigate([], { queryParams, queryParamsHandling: "merge" });
  }

  // ...
}
```

![Changing query params with Angular router](https://cdn.hashnode.com/res/hashnode/image/upload/v1710536580024/nqZ9dSNZx.gif?auto=format)

That's amazing! everything is working as expected, our signals are correctly getting the new `undefined` values and Angular is updating the UI accordingly.

Let's take a closer look in this `anonymise` method: We are using Angular's router to navigate to the exact same page, that's the reason we are passing an empty array:

```ts
this.router.navigate([]);
```

We do this because we are only interested to change the values of the query params, not the route or anything else.

In this case we want to unset the `firstName` and `lastName` query params, so we can anonymise the user. That's why we are passing `undefined` as their new values:

```ts
const queryParams = { firstName: undefined, lastName: undefined };
this.router.navigate([], { queryParams, queryParamsHandling: "merge" });
```

The `queryParamsHandling: "merge"` option is basically telling Angular to perform an **update** of the query params. This is important because, in this case, we are not interested to lose the `age` query param whenever it's there.

Finally, the UI gets updated successfully because after the router navigates, a new value will be emitted in the `activatedRoute.queryParams` observable, which we map and convert to the signals that we have in our component. So every time it emits a new value, our signals will be in sync.

This is very cool but we can do better:

```ts
anonymise() {
  // It's not very nice that we have to specify
  // the query param names again here ⬇️
  const queryParams = { firstName: undefined, lastName: undefined };
  this.router.navigate([], { queryParams, queryParamsHandling: "merge" });
}
```

Notice that we already have in our component a `firstName` and `lastName` signals. Wouldn't be nicer if we can just **set** the new values of the query params using them directly? Something like this:

```ts
anonymise() {
  this.firstName.set(undefined)
  this.lastName.set(undefined)
}
```

That would be amazing, but unfortunately this doesn't work since the `toSignal` utility returns a read-only signal.

But that doesn't mean we cannot do it ourselves. Let's build it!

## Implementing Two-way binding between Signals and Query Params

First let's create a handy `QueryParamsService` so we separate the query param handling logic from our component:

```ts
@Injectable({ providedIn: "root" })
export class QueryParamService {
  private activatedRoute = inject(ActivatedRoute);

  get(queryParamName: string) {
    const value$ = this.activatedRoute.queryParams.pipe(
      map((allQueryParams) => allQueryParams[queryParamName])
    );

    return toSignal(value$);
  }
}
```

```ts
@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <h1>Signals Demo</h1>
    <p>Full name: {{ fullName() }}</p>
    <p>Age: {{ age() }}</p>

    <button (click)="anonymise()">I want to be anonymous 👤</button>
  `,
})
export class AppComponent {
  private queryParamService = inject(QueryParamService);

  firstName = this.queryParamService.get("firstName");
  lastName = this.queryParamService.get("lastName");
  age = this.queryParamService.get("age");

  fullName = computed(() => `${this.firstName() ?? ""} ${this.lastName() ?? ""}`);

  anonymise() {
    // TODO: in a minute :)
  }
}
```

This small refactor will produce the same behavior as before except the anonymise feature, which we will implement in the nicer way as soon as we make our `get` method from `QueryParamService` return a writable signal.

This is a very interesting challenge. So let's start simple:

```ts
@Injectable({ providedIn: "root" })
export class QueryParamService {
  private activatedRoute = inject(ActivatedRoute);

  get(queryParamName: string) {
    const queryParamValue = signal("");

    // TODO: connect signal with actual query param value.

    return queryParamValue;
  }
}
```

We need to return a writable signal, let's call it `queryParamValue`. Right now it is completely disconnected from the corresponding query param. That's the problem we want to solve.

More specifically, we need to connect it to the `activatedRoute.queryParams` observable, but manually creating and maintaining a subscription in our service doesn't sound like a signal-friendly idea:

```ts
@Injectable({ providedIn: "root" })
export class QueryParamService {
  private activatedRoute = inject(ActivatedRoute);

  get(queryParamName: string) {
    const queryParamValue = signal("");

    // This will "work" but we don't want 
    // to explicitly subscribe over here ❌
    this.activatedRoute.queryParams.subscribe((allQueryParams) =>
      queryParamValue.set(allQueryParams[queryParamName])
    );

    return queryParamValue;
  }
}
```

A signal-friendly idea could be to convert the `activatedRoute.queryParams` observable to a signal itself and then somehow synchronize it with `queryParamValue`:

```ts
@Injectable({ providedIn: "root" })
export class QueryParamService {
  private activatedRoute = inject(ActivatedRoute);
  private allQueryParams = toSignal(this.activatedRoute.queryParams);

  get(queryParamName: string) {
    const queryParamValue = signal("");

    // TODO: sync queryParamValue signal with allQueryParams signal

    return queryParamValue;
  }
}
```

We need to update `queryParamValue` every time `allQueryParams` gets updated. We can achieve that with an effect:

```ts
@Injectable({ providedIn: "root" })
export class QueryParamService {
  private activatedRoute = inject(ActivatedRoute);
  private allQueryParams = toSignal(this.activatedRoute.queryParams);

  get(queryParamName: string) {
    const queryParamValue = signal("");

    effect(
      () => {
        const newQueryParamValue = this.allQueryParams()?.[queryParamName];
        queryParamValue.set(newQueryParamValue);
      },
      { allowSignalWrites: true }
    );

    return queryParamValue;
  }
}
```

Since we are accessing the value of the `allQueryParams` signal in the effect, it will run every time this signal gets updated, which happens every time Angular emits a new value in the `activatedRoute.queryParams` observable.

Inside the effect, we are just updating the value of our `queryParamValue` signal. For that, notice that we need to pass the `allowSignalWrites: true` option. This is necessary because updating signals in effects could lead to infinite loops and unexpected and intricate situations in general. That's why Angular disables this possibility by default.

However, in this scenario there's no danger to do it: The effect is only triggered when `allQueryParams` is updated, that refreshes our `queryParamValue` signal and it finishes there. No danger of triggering an infinite loop or unexpected situations.

![Using our partial solution to access query params](https://cdn.hashnode.com/res/hashnode/image/upload/v1710538037690/Nk-9yMBSk.gif?auto=format)

With the current solution we have the same behavior as before but we are not yet able to implement the anonymise feature in the nicer way. Yes, now we are returning a writable signal but if we set or update its value there's going to be no effect in Angular's router state or in the browser url. We'll achieve that in a minute but before let's improve a bit the current solution.

Notice that the effect will run every time the `allQueryParams` signal gets updated but that's too much. Remember that we are passing a `queryParamName` to our `get` method, meaning we are only interested in a specific query param in that context. For example, if we call the method with `age`, creating a signal linked to the `age` query param, then it doesn't make sense that its effect gets executed whenever the `firstName` or `lastName` query params get updated. Let's fix that:

```ts
@Injectable({ providedIn: "root" })
export class QueryParamService {
  private activatedRoute = inject(ActivatedRoute);
  private allQueryParams = toSignal(this.activatedRoute.queryParams);

  get(queryParamName: string) {
    const activatedRouteValue = computed(() => this.allQueryParams()?.[queryParamName]);
    const queryParamValue = signal(activatedRouteValue());

    effect(() => queryParamValue.set(activatedRouteValue()), { allowSignalWrites: true });

    return queryParamValue;
  }
}
```

With this version, we are creating a computed signal, `activatedRouteValue`, which is still connected to the `activatedRoute.queryParams` observable but only tracks the corresponding query param value we are interested inside the `get` method. Now, we define our effect using this signal, and not `allQueryParams`, this way the effect will only get executed when there's actually a new value to refresh our `queryParamValue` signal.

This is just slightly more efficient since the `computed` expression will still be evaluated every time `allQueryParams` gets updated. But, at least we won't trigger the effect that often and we also get an additional advantage with this approach: We can properly initialize our `queryParamValue` signal:

```ts
const queryParamValue = signal(activatedRouteValue());
```

This will just pull the current value of the relevant query param in that specific instant. So it would be equivalent to do something like this:

```ts
const queryParamValue = signal(activatedRoute.snapshot.queryParams[queryParamName]);
```

But using the signal to initialize it is a bit more concise and the dependency between `queryParamValue` and `activatedRouteValue` is easier to notice. Additionally, it's of course more interesting to initialize `queryParamValue` with something connected to `activatedRoute` than to using an empty string.

Coming back to our goal, the only missing part is connecting changes made on our writable `queryParamValue` signal to Angular's router state and the browser url. So we can achieve the two-way binding. We'll also implement this with an effect:

```ts
@Injectable({ providedIn: "root" })
export class QueryParamService {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  private allQueryParams = toSignal(this.activatedRoute.queryParams);

  get(queryParamName: string) {
    const activatedRouteValue = computed(() => this.allQueryParams()?.[queryParamName]);
    const queryParamValue = signal(activatedRouteValue());

    effect(() => queryParamValue.set(activatedRouteValue()), { allowSignalWrites: true });

    effect(() =>
      this.router.navigate([], {
        queryParams: { [queryParamName]: queryParamValue() },
        queryParamsHandling: "merge",
      })
    );

    return queryParamValue;
  }
}
```

Notice that in this second effect we are using the same idea of navigating with Angular's router to the same place (look at the empty array `[]`), and then we just override the query params. There is where we consume the value of our `queryParamValue` signal, so this second effect will be executed every time it gets updated.

When we look at this setup with the two effects, it seems like is going to enter in an infinite loop: the first effect makes `activatedRouteValue` to update `queryParamValue`, this will trigger the second effect, where `queryParamValue` will update `activatedRouteValue`, which will trigger the first effect again, and so on and so forth.

This infinite loop would happen if the values that are being assigned are different every time. That's one of the reasons we have to be very careful when we use `allowSignalWrites: true`. However, in this case we are safe. To illustrate it, let's consider the following situation:

```typescript
const activatedRouteValue = signal("red");
const queryParamValue = signal("blue");

// Something triggers a change in one signal. For example:
activatedRouteValue.set("purple");

// activatedRouteValue has changed from "red" to "purple" then trigger first effect:

// (Inside activatedRouteValue->queryParamValue effect):
queryParamValue.set("purple");

// queryParamValue has changed from "blue" to "purple" then trigger second effect:

// (Inside queryParamValue->activatedRouteValue effect):
activatedRouteValue.set("purple");

// activatedRouteValue is already "purple". It hasn't changed its value. Therefore,
// there's no need to trigger first effect again. End of the chain.
```

So this should be it, right? Well, unfortunately this doesn't work yet:

![Empty UI situation when using our almost ready solution](https://cdn.hashnode.com/res/hashnode/image/upload/v1710538597922/uDBmH5mo6.gif?auto=format)

Apparently we have an empty state. Not only that, query params disappear from the browser url. What is going on?

Well, most of it is related to Angular's router start up logic. Initially, Angular only emits the actual or real values of the query params through `activatedRoute.queryParams` observable **when the first navigation** is completed. 

This sounds surprising at first, specially when we try to access a query param that is initially provided in the browser url and, through Angular's router API, its starting value is `undefined`. Why doesn't Angular just pick whatever is initially in the browser url?

To understand it better let's consider an example. Imagine that you visit `http://localhost:4200/home?firstName=Dave` and, in the component assigned to `/home`, you try to access `activatedRoute.snapshot.queryParams["firstName"]`, in its `ngOnInit` for example. Angular won't return `Dave` as you may expect. You will actually receive `undefined`. The reason is that Angular hasn't finished the initial navigation yet. During this period of time, if we access the `snapshot` or the current value of the `activatedRoute.queryParams` observable, we will get an empty object `{}`, that's why we received `undefined` when we try to access an specific query param during this period of time.

If you think about it, this behavior makes sense, there could be logic configured that affects the initial and all navigations in general, `guards` could be a good example of that. This means, some query params could be added or removed during a navigation, not necessarily matching what was initially available in the browser url. And because of this, Angular is only sure about the actual or correct values of the query params as soon as the current navigation finishes.

This whole situation affects us in the initial value we provide to our `queryParamValue` signal. If we use the `get` method from the `QueryParamService` in components that are loaded during the initial navigation, then our `queryParamValue` signal will be initialized to `undefined`. This is technically not a big deal since it is connected to the `activatedRoute.queryParams` observable. So as soon as Angular emits the actual value of the query param, then the signal will be updated accordingly.

The issue with the empty UI is related to another not so intuitive behavior of Angular's router: Cancelling concurrent navigations. Maybe this surprises you but when we do `router.navigate`, this is actually an asynchronous operation, it returns a `Promise`, which is resolved whenever the navigation is completed.

The problem is when we start or trigger a `router.navigate` when there's a navigation that is still on progress. When Angular detects this, it will **cancel the current navigation** and execute the new one instead, completely ignoring the previous one. How is this related to the empty UI problem? Let's take a look:

```ts
get(queryParamName: string) {
  const activatedRouteValue = computed(() => this.allQueryParams()?.[queryParamName]);
  const queryParamValue = signal(activatedRouteValue());

  effect(() => queryParamValue.set(activatedRouteValue()), { allowSignalWrites: true });

  effect(() =>
    this.router.navigate([], {
      queryParams: { [queryParamName]: queryParamValue() },
      queryParamsHandling: "merge",
    })
  );

  return queryParamValue;
}
```

The problem is in the second effect. Specifically during its first execution.

Effects are executed as soon as they are defined, this is necessary so they can keep track of the signals that are used inside of them.

When the second effect is initially executed, a navigation will be triggered, cancelling Angular's start up navigation and losing with it the actual values of the query params. 

Let's try to understand it better with a specific example: Let's say we are visiting `http://localhost:4200?firstName=Dave&lastName=Doe&age=40`. And our `AppComponent` has the following code:

```ts
firstName = this.queryParamService.get("firstName");
```

Notice that it's only creating a single signal. In this case to track the `firstName` query param, but we will still experience the empty UI situation, affecting all query params in general.

When `queryParamService.get("firstName")` is executed we create a writable `queryParamValue` signal linked to the `firstName` query param. In this process we define two effects and they get executed immediately to keep track of their corresponding signals as we have mentioned before. 

Notice how we trigger a `router.navigate` in the second effect:

```ts
effect(() =>
  this.router.navigate([], {
    queryParams: { [queryParamName]: queryParamValue() },
    queryParamsHandling: "merge",
  })
);
```

This navigation will be triggered right away. And since our `AppComponent` is rendered on start up, it will definitely conflict with Angular's initial navigation. 

Therefore, Angular will cancel the current navigation. In this case, the initial one, the one that had this information: "navigate to `http://localhost:4200?firstName=Dave&lastName=Doe&age=40`" and will be replaced with "navigate to `http://localhost:4200/`", with no query params information at all. 

As soon as this navigation finishes Angular could emit the actual query param values through the `activatedRoute.queryParams` observable, but there are no query params in `http://localhost:4200/`.


The reason why there are no query params in this new navigation is in the `router.navigate` we are triggering in the effect:

```ts
  queryParams: { [queryParamName]: queryParamValue() },
```

In this example `queryParamName` is `"firstName"` and `queryParamValue()` is initially `undefined` for what we mentioned a bit above (you could think that we are accessing `activatedRoute.snapshot.queryParams["firstName"]` during the period of time in which the query params object is empty `{}`). 

So the effect is triggering a navigation that has this information: "navigate to `http://localhost:4200?firstName=undefined`", since the value of `firstName` is `undefined` it's just removed from the query params. And notice that there's no information about the other query params at all.

We could argue that we are indicating Angular to `merge` the query params in that `router.navigate` call. So no query params should be removed from the browser url.

But, again, Angular only emits a new value in the `activatedRoute.queryParams` observable as soon as the current navigation is completed. Before that the query params object that Angular maintains is just an empty object `{}`. And, when the effect replaces the initial navigation with an "empty navigation", ultimately we will be indicating Angular to update the current query params object from `{}` with `{}`, resulting in, of course `{}`. After the navigation is completed, Angular just reflects the state of the query params in the browser url, and since it's `{}`, all query params are removed from the browser url. 

Since there's a lot going on, let's try to visualize this cancelling navigation idea. We're going to add some debug code and simplify the usage in the `AppComponent`:

```ts
@Injectable({ providedIn: "root" })
export class QueryParamService {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  private allQueryParams = toSignal(this.activatedRoute.queryParams);

  constructor() {
    // Notice that we log navigation events here
    this.router.events.subscribe((e) => console.log(e));
  }

  // Same as before
  get(queryParamName: string) {
    const activatedRouteValue = computed(() => this.allQueryParams()?.[queryParamName]);
    const queryParamValue = signal(activatedRouteValue());

    effect(() => queryParamValue.set(activatedRouteValue()), { allowSignalWrites: true });

    effect(() =>
      this.router.navigate([], {
        queryParams: { [queryParamName]: queryParamValue() },
        queryParamsHandling: "merge",
      })
    );

    return queryParamValue;
  }
}
```

```ts
@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <h1>Signals Demo</h1>
    <p>Your first name is: {{ firstName() }}</p>
  `,
})
export class AppComponent {
  private queryParamService = inject(QueryParamService);

  // Notice we only use the .get() method once
  firstName = this.queryParamService.get("firstName");
}
```

![Angular cancelling navigations while navigating](https://cdn.hashnode.com/res/hashnode/image/upload/v1710543815428/08rDdKOv7.gif?auto=format)

Notice that when we visit the url in the browser an initial navigation is triggered by Angular on start up, this initial navigation contains the query params. But, as soon as we execute the second effect inside the `queryParamService.get` method, a new empty navigation is triggered, which cancels the initial one, losing in the way all the query params.

This looks like a very tricky problem to solve. It would be convenient if Angular provided a way to synchronously navigate, but this is in general impossible since, as we mentioned, we could register guards, resolvers, etc. This situation makes navigation an asynchronous operation by design.

For this reason, we somehow need to **wait** for the current navigation to complete in order to execute the one that we have in the second effect. Fortunately, we can take advantage of `async/await` when dealing with signals, we just have to be careful so we don't get unexpected situations, pretty similar to what we discussed with `allowSignalWrites: true`.

This is the final version of the service, including logic to wait for the current navigation to complete:

```ts
@Injectable({ providedIn: "root" })
export class QueryParamService {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  private allQueryParams = toSignal(this.activatedRoute.queryParams);

  get(queryParamName: string) {
    const activatedRouteValue = computed(() => this.allQueryParams()?.[queryParamName]);
    const queryParamValue = signal(activatedRouteValue());

    effect(() => queryParamValue.set(activatedRouteValue()), { allowSignalWrites: true });

    effect(async () => {
      const newValueToPushInRoute = queryParamValue();

      if (!this.router.navigated) return;
      if (this.isRouterNavigating()) await this.waitUntilRouterIsIdle();

      this.router.navigate([], {
        queryParams: { [queryParamName]: newValueToPushInRoute },
        queryParamsHandling: "merge",
      });
    });

    return queryParamValue;
  }

  private isRouterNavigating() {
    return this.router.getCurrentNavigation() !== null;
  }

  private waitUntilRouterIsIdle(): Promise<unknown> {
    return firstValueFrom(
      this.router.events.pipe(
        filter((e) => e instanceof NavigationEnd),
        timeout(1_000)
      )
    );
  }
}
```

It's interesting what we added to the second effect: First of all, we are using `async/await`. This is not a problem while we keep in mind that only the signals that we use before an `await` will be tracked. All the signals that we use after or, in general, in an asynchronous operation outside of the "regular" effect code, will not be considered. That's the reason we are accessing `queryParamValue` in the very top:

```ts
effect(async () => {
  // We access it here so the effect keeps track of it ✅
  const newValueToPushInRoute = queryParamValue();

  if (!this.router.navigated) return;
  if (this.isRouterNavigating()) await this.waitUntilRouterIsIdle();

  this.router.navigate([], {
    // If we would have accessed it here directly
    // the effect wouldn't consider it when we awaited ❌
    queryParams: { [queryParamName]: newValueToPushInRoute },
    queryParamsHandling: "merge",
  });
});
```

Then we have the `if` conditions. The first one protects us from the empty UI situation we saw before:

```ts
if (!this.router.navigated) return;
```

Basically `router.navigated` will be false while the initial navigation is still running. If that's the case, we are not interested in triggering a new `router.navigate`, because if we do we will remove all the query params, since during this period of time, our `queryParamValue` signal still has the initial value, meaning `undefined`.

Finally, the second if prevents us from triggering a navigation while one is still on going:

```ts
if (this.isRouterNavigating()) await this.waitUntilRouterIsIdle();
```

This way, we don't have to worry that Angular may cancel navigations. We achieve this by using to handy private methods. One to check if there's a navigation happening, using `router.getCurrentNavigation` method. And, if so, waiting until that finishes. The waiting is done by awaiting this `Promise`:

```ts
private waitUntilRouterIsIdle(): Promise<unknown> {
  return firstValueFrom(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      timeout(1_000)
    )
  );
}
```

We simply use the `router.events` observable and filter until we find a `NavigationEnd` value. Then we just convert it to `Promise` using `firstValueFrom` so we can await it in the effect. Notice that there's also a `timeout` of 1s but we could think of a much more elaborated error handling in another iteration. 

Once we have all the pieces ready, we made it! Now we have a nice utility that allow us to consume query params with signals. Not only that, those signals are writable and every time they are updated then those values are propagated to Angular's router state and the browser url. 

Let's now see the nicer solution of the anonymise feature implemented with these signals. And perhaps a few more interesting use cases: 

```ts
@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <h1>Signals Demo</h1>
    <p>Full name: {{ fullName() }}</p>
    <p>Age: {{ age() }}</p>

    <hr />

    <h2>Using Signals</h2>
    <button (click)="anonymise()">I want to be anonymous 👤</button>
    <button (click)="becomeJackSparrow()">Become Jack Sparrow 🏴‍☠️</button>
    <button (click)="getOlder()">Get Older 👴</button>

    <hr />

    <h2>Using Angular Router</h2>
    <button (click)="becomeHarryPotter()">Become Harry Potter 🪄</button>
    <button (click)="getYounger()">Get Younger 👶</button>
  `,
})
export class AppComponent {
  private queryParamService = inject(QueryParamService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  firstName = this.queryParamService.get('firstName');
  lastName = this.queryParamService.get('lastName');
  age = this.queryParamService.get('age');

  fullName = computed(
    () => `${this.firstName() ?? ''} ${this.lastName() ?? ''}`
  );

  // ---- using signals

  anonymise() {
    this.firstName.set(undefined);
    this.lastName.set(undefined);
  }

  becomeJackSparrow() {
    this.firstName.set('Jack');
    this.lastName.set('Sparrow');
  }

  getOlder() {
    this.age.set(+this.age() + 5);
  }

  // ---- using Angular router
  becomeHarryPotter() {
    const queryParams = { firstName: 'Harry', lastName: 'Potter' };
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }

  getYounger() {
    const queryParams = {
      age: +this.activatedRoute.snapshot.queryParams['age'] - 5,
    };
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }
}
```

![Demo using final solution of query param signals](https://cdn.hashnode.com/res/hashnode/image/upload/v1710544346332/X6Qp6vdOY.gif?auto=format)

Amazing! We can see that it works in both directions, whether we interact with our signals or if we use Angular's router API. In all scenarios everything gets updated accordingly. 

This was a fun exercise to experiment with signals and the interoperability with current Angular APIs. Probably in the future there will be a native way to achieve the same result or at least support to implement it ourselves in an easier way.

Of course we can keep iterating our solution and perhaps adding support for batch updates of the query params, maybe making some extra checks in the effects so they run less frequently, etc. If you have any ideas about it or would like to discuss about all the new possibilities that signals bring to the frontend world I'd be more than happy to hear about it.

That's all for today but remember to stay tuned for more exciting articles about signals and much more in the Software Engineering Corner.

<!-- Links -->

[angular17.2]: https://github.com/angular/angular/releases/tag/17.2.0
[angular17.1]: https://github.com/angular/angular/releases/tag/17.1.0
[signalsEverywhereArticle]: https://software-engineering-corner.zuehlke.com/signals-signals-everywhere
[angularDiscussions]: https://github.com/angular/angular/discussions
[lucasProfile]: https://hashnode.com/@culas
