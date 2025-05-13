---
title: Responsive Element Size Tracking in Angular with ResizeObserver and Signals
subtitle: A modern approach to keeping dropdowns and overlays aligned with dynamic inputs
domain: software-engineering-corner.zuehlke.com
tags: angular, responsive-web-design, responsive-design, frontend, web-development, javascript, performance, best-practices, browser
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1745872404199/OhbgsBw-f.jpg?auto=format
publishAs: timouti
saveAsDraft: true
hideFromHashnodeCommunity: false
---

Modern web applications are increasingly embracing dynamic and flexible layouts.
Thus, reactive UI updates not only have to respond to user input, but also to layout changes and viewport resizings.

A frequent challenge is keeping dropdowns or overlays aligned with their trigger elements. 
Specifically for an autocomplete input, ensuring the width of the dropdown window matches the width of the corresponding input field. 
Traditionally, developers relied on the global `window:resize` listeners or manual DOM manipulations to handle these cases.

With the introduction of Signals and by leveraging modern Web APIs, we now have a cleaner, more reactive, and efficient alternative.

### The Problem with Window Resize
One requirement is to ensure that the width of a dropdown matches the width of its input field, also when the input field is resized.
This is particularly important in responsive layouts, where the input field may change size due to various factors, such as window resizing or layout changes.

It is tempting to just listen to the `window:resize` with `@HostListener` and adjust the dropdown width based on the current input field width. Following is a naive implementation, 
as seen in many projects:
```typescript
@ViewChild('inputField', {read: ElementRef}) inputElement: ElementRef<HTMLInputElement>;

@HostListener('window:resize')
onWindowResize(): void {
    this.adjustDropdownWidth();
}

ngAfterViewInit(): void {
    this.adjustDropdownWidth();
}

adjustDropdownWidth(): void {
    const input = this.inputElement.nativeElement;
    const dropdown = document.querySelector('.dropdown-menu') as HTMLElement;
    dropdown.style.width = `${input.offsetWidth}px`;
}
```
However, this approach has some drawbacks. First, it triggers regardless of whether the input field was actually resized or not, since it 
only listens to window resizes. This leads to unnecessary DOM updates and might impact performance. Furthermore, this does not work, if the input field changes 
its size e.g. due to a collapsing sidebar, because the window size would remain the same. 

Additionally, manipulating the DOM from within the component is not the best practice. We are dependent on the class name which might change when using third party libraries for the 
typeahead. Or we might have multiple matches for the element and resize the wrong one after all. 

So, a solution independent of window events, is needed.

### ResizeObserver and Signals
Luckily, the [ResizeObserver Web API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) provides us with a neat solution to observe the changes to an element's 
dimensions. Thereby, it watches specific elements and fires a callback whenever their size changes, more specifically, their `contentRect` (content box size).
It only fires when the element actually changes its size (width or height) and batch processes changes efficiently in a single animation frame. 
So, we don't need global events or polling and can target specific elements. This helps us to eliminate the dependency on `window:resize` and optimize performance.

Next, we want to tackle the DOM manipulation and reactivity. Instead of directly setting the width of the HTML element in the component, we pass it over the `[style.width]` input 
in the template. We leverage the [Angular Signals](https://angular.io/guide/signals) to create a reactive signal that holds the width of the dropdown. 

To make it work we only have to update the width signal in the callback function of our `ResizeObserver`. 
And to make it reusable, we create a small utility function that combines these two technologies:

```typescript
import { signal } from '@angular/core';
import { ElementRef } from '@angular/core';

interface ElementResizeObserver { width: Signal<string>, destroy: () => void}

/**
 * Creates a ResizeObserver. The ResizeObserver will observe the element and update the width signal when the element is resized.
 * Has the advantage that it is only observing a specific element for the resize event and not the whole window.
 * @param element - The element that will be observed e.g. the input field
 */
export function updateWidthOnElementResize(target: ElementRef<HTMLElement>): ElementResizeObserver  {
    const width = signal('100%');
    
    // Creates the ResizeObserver and passes the callback function to it that updates the width signal with the new width of the element
    const observer = new ResizeObserver(() => {
        width.set(`${target.nativeElement.offsetWidth}px`);
    });

    // Starts observing the element for resize events
    observer.observe(target.nativeElement);

    return {
        width: width.asReadonly(), // Returns the width signal as readonly
        destroy: () => observer.disconnect(), // Disconnects the observer when it is no longer needed, call in ngOnDestroy
    };
}

```
This utility function returns a width Signal that updates whenever the target element’s width changes. 
Additionally, it returns a destroy method to cleanly disconnect the observer when the component is destroyed.

### Plugging it all together
Now, it is easy to use the utility function in our component. We just need to call it in the `ngAfterViewInit` lifecycle hook and pass the input field element reference.

```typescript
@ViewChild('inputField', {read: ElementRef}) inputElement: ElementRef<HTMLInputElement>;

protected dropdownWidth: Signal<string>;
private resizeDropdownWidthObserver: ElementResizeObserver;
    
ngAfterViewInit(): void {
    this.resizeDropdownWidthObserver = updateWidthOnElementResize(this.inputElement);
    this.dropdownWidth = this.resizeDropdownWidthObserver.width;
}

ngOnDestroy(): void {
    this.resizeDropdownWidthObserver.destroy();
}
```
The `dropdownWidth` signal can now be used in the template to set the width of the dropdown. In our case, we are using the 
[ng-bootstrap typeahead](https://ng-bootstrap.github.io/#/components/typeahead/api) component, which allows us to set the width of the dropdown-items via the `[style.width]` input.
Thanks to the nature of signals, the reactivity comes out of the box.
```html
<ng-template #dropdownList let-result="result" let-term="term">
    <ngb-highlight
            class="dropdown-item"
            [style.width]="dropdownWidth()"
            [result]="resultFormatter(result)"
            [term]="term"
    ></ngb-highlight>
</ng-template>
```
Or we apply the same logic to a custom dropdown component. 
```html
<input #inputElement type="text" class="form-control" /> 
<div class="dropdown-menu" [style.width]="dropdownWidth()">     
    <!-- Dropdown content -->
</div>
```

The dropdown will now automatically adapt its width to match the input field, even if the input size changes independently of the window size.

### Benefits of this approach
1. **Efficiency**: No unnecessary updates — only reacts to element resizes, not window resizes.
2. **Stability**: No direct DOM manipulation, not relying on CSS class names to stay the same, reducing the risk of breaking changes.
3. **Simplicity**: Minimal code, using well maintained native browser-API, reactivity out of the box and no manual change detection is required.
4. **Scalability**: Supports multiple elements individually without interfering with each other.

### Conclusion
In conclusion, the combination of ResizeObserver and Angular Signals provides a powerful and efficient way to handle dynamic element size tracking in Angular applications. 
It avoids the pitfalls of traditional `window:resize` event listeners and brings reactivity directly to the DOM elements that need it.
This small pattern can help with responsiveness and maintainability. 

It is a great example of how modern web APIs can be effectively integrated into Angular applications to enhance performance and user experience.
Let me know your thoughts in the comments below.

### Bonus
You can easily extend the utility function to track both width and height if needed, or debounce the updates for extremely rapid layout changes.