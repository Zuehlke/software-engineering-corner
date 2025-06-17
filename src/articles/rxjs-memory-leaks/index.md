---
title: RxJS Memory Leaks in Angular
description: >-
  Memory leaks in Angular applications often stem from unmanaged RxJS Observable
  subscriptions, where allocated memory isn't released when components are
  destroyed, leading to performance degradation.  Various techniques, including
  leveraging the `ngOnDestroy` lifecycle hook, the `takeUntil` operator, mixins,
  and the new `takeUntilDestroyed` operator in Angular 16, can effectively
  address this issue.  Employing specific linting rules can further help prevent
  these leaks by enforcing proper subscription management.
released: '2023-08-07T09:03:38.144Z'
cover: images/cover.jpeg
author: Timo Spring
tags:
  - Bugs and Errors
  - form
  - RxJS
  - Web Development
---
Memory leaks are a dreadful little nightmare to fix in your web application. Yet, when using [RxJS Observables](https://rxjs.dev/guide/observable) you face the challenge of mitigating the threat of creating memory leaks. You might already wonder - what are memory leaks and how can I fix them?

This article describes RxJS Observable memory leaks and presents various techniques and patterns to tackle them in Angular applications.

### Memory Leaks in a Nutshell

In Angular web applications, memory leaks are oftentimes caused by a mismanagement of [RxJs Observables](https://rxjs.dev/guide/observable). Thereby, heap memory space allocated to Observable subscriptions is not freed up when a component is destroyed. This memory leak will result in performance issues, i.e. the page gets slower and slower. Higher load times negatively impact the user experience and increase the bounce rate [\[1\]](https://www.nngroup.com/articles/response-times-3-important-limits/). If a page load goes from 1s to 5s, the bounce rate increases by 90% [\[2\]](https://www.thinkwithgoogle.com/consumer-insights/consumer-trends/mobile-page-speed-new-industry-benchmarks/). A page refresh will clear the heap memory again, and "reset" the memory leak.

Luckily, we can easily prevent memory leaks. But first, let us go into more detail about the origins of memory leaks.

### RxJs Observables

Let us start at the beginning - what are [RxJs Observables](https://rxjs.dev/guide/observable)? The *Reactive Extensions for Javascript* (RxJs), is a library for reactive programming concerned with asynchronous data streams and the propagation of data changes. Thereby, you can consider a data stream as a *collection* of data arriving, e.g. when fetching data from backend services using HTTP. This data stream can potentially change over time.

To that end, RxJS provides one core type - the *Observable* - representing a collection of future values and events. Observables are lazy push-based systems, similar to JavaScript [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global%5FObjects/Promise). The consumer of the data is unaware of when it will receive the data. It is the data producer that determines when to "push" data to its consumers. Compared to Promises, however, an Observable can produce multiple values over time, i.e. a stream of data. This data stream can return zero to potentially infinite values from its invocation onward, synchronously or asynchronously.

!\[RxJs Observables]\(https://cdn.hashnode.com/res/hashnode/image/upload/v1681311720510/6W-qbqxuM.png?auto=compress align="center")

Observables are lazy computations, so, unless you *subscribe* to them, no data will be transmitted. In Angular applications, we use Observables mostly to fetch data from backend services using HTTP, for routing purposes, and to respond to user events e.g. in forms.

**Finite and Infinite Observables**
There are two types of Observables in that respect - finite and infinite. Finite Observables will always emit a value (or an error) and then complete. So, there is no explicit need for unsubscribing, since RxJs Observables will also unsubscribe on error. Examples are the Angular `HttpClient` and `Router`[\[3\]](https://lukaonik.medium.com/do-we-need-to-unsubscribe-http-client-in-angular-86d781522b99). Thus, you don't have to explicitly unsubscribe to HTTP requests using the `HttpClient`.
Infinite Observables, on the other hand, will potentially never complete e.g. a click listener. There is no clear termination to the sequence of values emitted. Therefore, the subscription will live on in the memory if not explicitly unsubscribed.

### Subscriptions

Subscriptions are used to consume data provided by Observables. Subscribers, or rather data consumers, *subscribe* to an Observable, creating the subscription. Subscriptions are disposable resources that live in the heap memory. By *unsubscribing* from an Observable, the resource is destroyed and the allocated heap memory is freed up again. Unsubscribing will also cancel the Observable execution.

### **Memory Leaks - A Detailed Example**

**A Memory Leak in the Wild - Example Setup**\
Let us look at a practical example. You are requested to implement an autocomplete search feature in your web application. The requirement states that after 1s of no new user input, a search in the backend should be triggered. The returned search results should be displayed below the search input.

!\[live search input]\(https://cdn.hashnode.com/res/hashnode/image/upload/v1681311768972/\_YpoEOqLH.png?auto=compress align="center")

We use a simple [FormControl](https://angular.io/api/forms/FormControl) for the search input field and subscribe to the search term changes when the component is created, i.e. in the `ngOnInit` lifecycle hook. Our `SearchComponent` looks as follows:

```typescript
@Component({
  selector: "search-input",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"],
})
export class SearchComponent implements OnInit {
  searchCtrl: FormControl = new FormControl();

  ngOnInit() {
    this.searchCtrl.valueChanges.pipe(debounceTime(1000)).subscribe((searchTerm: string) => {
      this.searchService.updateSearchResults(searchTerm);
    });
  }
}
```

```xml
<mat-form-field appearance="fill">
  <mat-label>Search</mat-label>
  <input matInput [formControl]="searchCtrl" (focus)="onSearchFieldFocus()" />
</mat-form-field>
```

The `valueChanges` returns an Observable of type *any*. It emits an event when the value of the search control changes, so, with every new user keystroke (infinite Observable). We use the [RxJs operator](https://rxjs.dev/api/operators/debounceTime) `debounceTime` to only emit a value when there is no user input for at least 1s. In our callback, we simply call the backend service to update the search results.

**Identifying the Memory Leak**\
Now, when we subscribe to the search input changes, a subscription is created in the heap memory. Currently, we do not unsubscribe from the `valueChanges` Observable.\
If the `SearchComponent` is destroyed, the subscription would still be active in memory and not be cleaned up by the garbage collector. This becomes a problem when the `SearchComponent` is created and destroyed frequently, e.g. when the search input is only displayed after clicking a search button before. In that case, more and more heap space is occupied by those obsolete `valueChanges` subscriptions. The browser will become slower and slower and the search feature unusable. We have a memory leak.

A page refresh would clear the heap memory and reset the problem state, making it difficult to identify due to frequent re-compilations and page refreshes during development.

Luckily there are various techniques to deal with memory leaks. In the following, we present the most popular ones. Additionally, we outline the extension of the linting rules to prevent memory leaks before they occur.

## Fixing Memory Leaks

There are various techniques to fix memory leaks. We abstain from presenting third-party packages that deal with this issue as oftentimes this is not an option in corporate projects.

Here are the most common ones.

1. **ngOnDestroy**
2. **Scalable ngOnDestroy**
3. **Mixin**
4. **takeUntilDestroyed Operator**

**1. ngOnDestroy**\
A straightforward approach is to simply unsubscribe from all Observables when the component is destroyed. It is recommended to do this in the `ngOnDestroy` lifecycle hook. To that end, we assign the subscription to a variable `searchTerm$` and unsubscribe in the `ngOnDestroy` hook.

```typescript
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {
  searchCtrl: FormControl = new FormControl();
  searchTerm$?: Subscription;

  ngOnInit(): void {
    this.searchTerm$ = this.searchCtrl.valueChanges
      .pipe(debounceTime(1000))
      .subscribe((searchTerm: string) => {
        ...
      });
  }

  ngOnDestroy(): void {
    this.searchTerm$?.unsubscribe();
  }
```

This works well for smaller components with only a few subscriptions. However, it does not scale well. Imagine an advanced search form with more than twenty different filters and inputs that you listen to using subscriptions. The `SearchComponent` would be overflowing with class-scoped subscription variables and unsubscriptions in the `ngOnDestroy`.

**2. Scalable ngOnDestroy**\
We can easily deal with the scalability issue of the first approach by using the [RxJs `takeUntil` operator](https://www.google.com/search?client=safari\&rls=en\&q=rxjs+takeuntil\&ie=UTF-8\&oe=UTF-8). This operator allows us to automatically unsubscribe from the Observable at a given trigger. The trigger has to be an Observable itself.\
In our case, the trigger is the destruction of the component, i.e. we want to keep the subscription active *until* the component is destroyed. As the `ngOnDestroy` does not expose an Observable, we have to create our own:

```typescript
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {
  searchCtrl: FormControl = new FormControl();
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(1000),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm: string) => {
        ...
      });
  }

  ngOnDestroy(): void {
    this.destroy$?.next();
    this.destroy$?.complete();
  }
```

We create a new `destroy$` [Subject](https://rxjs.dev/guide/subject) acting as our trigger Observable. In all our subscriptions, we simply add the `takeUntil(this.destroy$)` operator. Lastly, we execute our trigger in the `ngOnDestroy` hook. All subscriptions are stopped and destroyed.

Note that `takeUntil` has to be the last operator in your pipe, otherwise, you risk a [takeUntil leak](https://ncjamieson.com/avoiding-takeuntil-leaks/). You can easily enforce this using the `no-unsafe-takeuntil` [eslint rule](https://github.com/cartant/eslint-plugin-rxjs/blob/main/docs/rules/no-unsafe-takeuntil.md).

**3. Fancy a Mixin?**\
This approach targets code duplication in the `ngOnDestroy` hook. The two calls to `this.destroy$` will be similar for every class using observables. Thus, the idea is to extract and centralise this part of the `ngOnDestroy` hook.

To that end, we introduce a new global function - `WithDestroy`. This function extends a base class *T* and adds the common `ngOnDestroy` hook with our two calls to the `destroy$` Subject.

```typescript
export function WithDestroy<T extends Constructor<{}>>(Base: T = class {} as never) {
  return class extends Base implements OnDestroy {
    public destroy$ = new Subject<void>();

    public ngOnDestroy(): void {
      this.destroy$?.next();
      this.destroy$?.complete();
    }
  };
}
```

Additionally, we need a new type `Constructor` that we add in a separate file.

```typescript
export type Constructor<T> = new (...args: any[]) => T;
```

This might look quite unusual, but it makes use of standard Typescript constructs. Our class `SearchComponent` can now be facilitated to the following:

```typescript
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent extends WithDestroy implements OnInit, OnDestroy {
  searchCtrl: FormControl = new FormControl();

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(1000),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm: string) => {
        ...
      });
  }
```

We can completely remove the `ngOnDestroy` hook and `destroy$` Subject in our component. The only addition is to extend the class using `WithDestroy` and adding a constructor. Smooth, isn't it?

**4. takeUntilDestroyed Operator**
Luckily, Angular v16 provides a new opearator `takeUntilDestroyed`. This new operator finally provides an easy to use solution for our problem. Generally, it works similar to the `takeUntil(this.destroy$)` presented earlier. Instead of the manually created destroy Observable, Angular 16 introduces a new `DestroyRef` provider to register destroy callbacks, similar to the `ngOnDestroy` lifecycle hook. This new provider can be used without the inheritence aspect demonstrated by our Mixin `WithDestroy` solution. So it is pretty neat and clean.

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {
  private destroyRef$ = inject(DestroyRef);
  searchCtrl: FormControl = new FormControl();

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(1000),
        takeUntilDestroyed(this.destroyRef$)
      )
      .subscribe((searchTerm: string) => {
        ...
      });
  }
}
```

When you use the `takeUntilDestroyed` inside the constructor, you can even remove the injection of the `DestroyRef` as it will be done automatically by Angular.

## Linting to Prevent Memory Leaks

We recommend the following linting rules to prevent Observable-based memory leaks in your project.

* [eslint-plugin-rxjs](https://github.com/cartant/eslint-plugin-rxjs)
  * `no-unsafe-takeuntil` - disallows operators after the `takeUntil` operator
* [rxjs-tslint-rules](https://github.com/cartant/rxjs-tslint-rules)
  * `rxjs-prefer-angular-takeuntil` - enforces the `takeUntil` operator when calling subscribe

## **Conclusion**

Memory leaks in Angular applications are oftentimes caused by not unsubscribing from infinite RxJs Observable subscriptions. Luckily, Angular 16 finally introduces an integrated approach to deal with this issue. Additionally, we proposed three alternative approaches to fix this type of memory leak and propose linting rules to enforce those prevention mechanisms.

\[1] [Nielsen Norman Group, Response Times: The 3 Important Limits, State April 2023](https://www.nngroup.com/articles/response-times-3-important-limits/)\
\[2] [Google Consumer Insights, State April 2023](https://www.thinkwithgoogle.com/consumer-insights/consumer-trends/mobile-page-speed-new-industry-benchmarks/)\
\[3] [Luka Onikadze, Do we need to unsubscribe HTTP client in Angular?, State April 2023](https://lukaonik.medium.com/do-we-need-to-unsubscribe-http-client-in-angular-86d781522b99)
