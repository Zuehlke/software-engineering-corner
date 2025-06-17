---
title: Finally, custom form elements that don't suck!
description: >-
  The ElementInternals API simplifies the creation of custom form elements
  within web components, enabling seamless integration with HTML forms and
  compatibility with common form libraries. By associating web components with
  forms and managing value, validity, and focus events, developers can create
  custom elements that behave like native form controls. This API empowers
  developers to build more robust and versatile web components for form
  interactions.
released: '2023-04-17T09:07:01.235Z'
cover: images/cover.jpeg
author: Patrick Walther
tags:
  - Web Components
  - form
  - Shadow DOM
  - lit
  - JavaScript
---
In the world of web development, creating custom form elements has always been a bit of a challenge.
However, with the introduction of web components and the use of the ElementInternals API, this task
has become much easier. By leveraging the power of web components, developers can now create custom
form elements that can be used in any website or application. In this blog post, we will explore
what the ElementInternals API is and how you can use it to create custom form elements.

## The Problem

One of the main challenges that developers face when creating web components is making them work
seamlessly with HTML forms. By default, web components are not recognized as form elements, which
means that they cannot be submitted and don't show up in FormData. So even if your custom component
wraps a native input in its ShadowDOM, it will not be picked up by a form outside the Shadow DOM.
You could pass a native input into the component from the outside via the `slot` element, but this
creates numerous new problems with accessing and styling that input from inside the web component.
This also means they won't work out of the box with common form libraries.

## ElementInternals to the rescue

This [API](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) provides a set of
methods and properties that allow developers to customize the behavior of web components when used
as form elements. It is supported by all major browsers, including Chrome ( v77), Firefox (v93),
Safari (v16.4), and Edge (v79). See [caniuse](https://caniuse.com/mdn-api_elementinternals).
If you need to support older browsers there is a polyfill with limited functionality available:
<https://www.npmjs.com/package/element-internals-polyfill>.

As there are numerous properties and methods available, let's focus on the most significant ones:

* Start using ElementInternals in your web component
* Ensure value and validity
* Focus events

## Start using ElementInternals in your web component

There is essentially two things we have to do, to use the ElementInternals API:

* Flag the web component as being `formAssociated`
* Attach the ElementInterals in the constructor of our web component

I'm putting together a showcase for a design system and will be using examples written in
[Lit](https://lit.dev), but they should be easily adaptable to plain web components. You can find
the project on [Github](https://github.com/r3dDoX/design-system-showcase).

Below you can see the most basic example of allowing a web component to be associated with a form as
well as attaching the ElementInternals to use internally.

```typescript
import {customElement} from 'lit/decorators.js';
import {LitElement} from 'lit';

@customElement('dss-switch')
export default class Switch extends LitElement {
  static formAssociated = true;

  private internals: ElementInternals;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }
}
```

Now our web component is capable of being included in a form. We can set a name attribute and it
will show up in FormData. But without a value this will not help us much yet.

## Ensure value and validity

A form element usually exposes a `value` property. Since many 3rd party form libraries rely on this,
our component should also have an exposed `value` property. Let's say our `Switch`
component from above is actually just rendering a checkbox inside. Due to this, we will also expose
a property `checked` just like the native checkbox. All we want to do now is replicate these
properties from our native checkbox on our component.

```typescript
import {customElement, property} from 'lit/decorators.js';
import {LitElement} from 'lit';
import {createRef, Ref, ref} from 'lit-html/directives/ref.js';

@customElement('dss-switch')
export default class Switch extends LitElement {
  static formAssociated = true;

  @property({type: Boolean})
  public checked = false;

  @property()
  public value?: string;

  private internals: ElementInternals;
  private inputRef: Ref<HTMLInputElement> = createRef();

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  protected render() {
    return html`
      <input 
        ${ref(this.inputRef)}
        type="checkbox"
        ?checked="${this.checked}"
        @change=${(event: Event) => this.handleCheckboxChange(event)}
      >
    `;
  }

  private handleCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.checked = checkbox.checked;
    this.value = checkbox.value;
    this.dispatchEvent(new Event('change', event));
  }

  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('checked')) {
      this.internals.setFormValue(this.checked ? 'on' : null);
      this.internals.setValidity(
        this.inputRef.value!.validity,
        this.inputRef.value!.validationMessage,
        this.inputRef!.value,
      );
    }
    super.updated(changedProperties);
  }
}
```

Let's break this example down. First, we render the native input and pass the property `checked`
down to it. This means, when we set that property on our web component, it will update the native
checkbox.

Next, we set up an event listener for the change event on the `checkbox`, which will trigger a
handler function. Within this function, we will modify the `checked` and `value` properties of our
component based on the changes made to the native checkbox. Since change events do not travel
through the ShadowDOM we have to re-dispatch the event.

Lastly, whenever our components `checked` property changes we will update the ElementInternals. The
native checkbox has `null` or `on` set as the value, so we replicate this behavior in our component.
Updating the validity does not make a lot of sense yet, but later if we would support things
like `required` we could take the native checkbox validation messages. This means when trying to
submit the form our component would report the validity of the native checkbox.

## Focus events

Many 3rd party form libraries allow you to run validations on `change` or on `blur`. This means our
web component needs to dispatch those events. For our `switch` component, we already dispatch
a `change` event, and we won't have to worry about focus/blur events. Since we have a native input
in our ShadowDOM, our component will dispatch focus and blur events when the native input receives
or loses focus.

There is an edge case which you can see in the `buttongroup` component
[here](https://github.com/r3dDoX/design-system-showcase/blob/main/src/components/buttongroup/buttongroup.component.ts).
When we slot elements, the focus on these slotted children will take away focus from our component.
Or in the case of the `buttongroup` component, we will never get focus since there are no elements
that can receive focus inside our ShadowDOM.

Luckily we can use the `focusin` and `focusout` events that bubble up through the slot and dispatch
our own focus/blur events on our component. Since the `buttongroup` component has multiple buttons
inside the `slot` we get a `focusout` and a `focusin` whenever the user switches focus from one
button to the other. Therefore, we needed to add a little more logic to not dispatch too many
events.

## Conclusion

As you can see in the [Github project](https://github.com/r3dDoX/design-system-showcase), adding
form capabilities to your web components became quite easy with the new ElementInternals API. It
allows us to customize the behavior of our components in forms and let them work seamlessly with
native forms as well as 3rd party form libraries.
