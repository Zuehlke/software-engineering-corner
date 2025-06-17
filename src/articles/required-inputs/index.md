---
title: 'No Data Left Behind: Enforcing Required Inputs in Angular Components'
description: >-
  Angular developers can improve component usage and prevent bugs by explicitly
  defining required inputs. Older versions of Angular can leverage the component
  selector for this purpose, while Angular v16 introduces a dedicated "required"
  input property. This ensures that necessary data is provided, leading to more
  robust and predictable component behavior.
released: '2023-05-22T04:34:28.769Z'
cover: images/cover.jpeg
author: Timo Spring
tags:
  - Angular
  - basics
  - Bugs and Errors
  - components
  - Web Development
---
Have you ever added an Angular component to a page view and wondered which component inputs are required? Have you ever created a new component and asked yourself if you can enforce specific inputs? Have you ever been annoyed by dealing with potentially undefined inputs for expected inputs? If so, then you my friend, are up for a treat!

### Problem

Let's say we have a shared button component that we use all over our app. Our custom button component only needs its type (submit or cancel) and a click callback function as input. Additionally, you can pass an optional custom label text.

```typescript
@Component({
  selector: 'app-button'
  ...
})
export class ButtonComponent {
  @Input() type?: 'submit' | 'cancel';
  @Input() clickCallback?: () => void;
  @Input() label?: string;
```

Now, when we add the custom button to a new view, we cannot see which inputs are required. To ensure proper usage, we would want to make sure that the button always gets at least a type and a click callback function as input. But this is not visible in our view so far.

```xml
<app-button></app-button>
```

Of course, you could use an `ngIf` to hide the button when the type and callback are undefined. However, we don't wanna end up with hidden buttons and frustrated users. We want to enforce a contract when using our shared button to ensure proper usage.

## Selector as Protector

An elegant solution to this problem is to add the required input properties to the selector name inside our component. This makes the inputs required when we use the component. Thus, the IDE and compiler will complain if you use the button component without our required inputs (since they are now part of the selector).

```typescript
@Component({
  selector: 'app-button [type] [clickCallback]'
  ...
})
export class ButtonComponent {
  @Input() type!: 'submit' | 'cancel';
  @Input() clickCallback!: () => void;
  @Input() label?: string;
```

This is a really easy solution to our problem. However, if your component has loads of mandatory inputs, then the component selector easily becomes polluted. Note that you might wanna rethink your component alltogether in that case. Nobody should require too much input to properly work.

## Angular v16 to the Rescue

Luckily, the Angular team addresses this problem with Angular v16 and introduces a new required argument for inputs. I really like this solution as you immediately see which inputs are optional and which ones are mandatory without polluting the selector.

```typescript
@Component({
  selector: 'app-button'
  ...
})
export class ButtonComponent {
  @Input({ required: true }) type: 'submit' | 'cancel';
  @Input({ required: true }) clickCallback: () => void;
  @Input() label?: string;
```

## Conclusion

Clearly, declaring required inputs in your component helps you to prevent bugs and facilitates component usage. Especially, for shared components like UI design components. If you are stuck with older Angular versions, you can use the selector to enforce inputs. Otherwise, you might wanna opt in for the new required argument of Angular v16.

So, check your code now and make sure to enforce what should be enforced.
