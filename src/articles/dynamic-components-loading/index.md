---
title: Ditch the Template Chaos - Angular Dynamic Components Loading
description: >-
  Angular offers a way to dynamically load components at runtime, enabling the
  display of different views based on data type. By using the
  `ngComponentOutlet` directive, developers can select and render specific
  components based on an item's attributes, keeping templates clean and
  scalable. This approach simplifies the management of diverse data
  representations within a single view.
released: '2023-10-16T09:10:33.185Z'
cover: images/cover.jpeg
author: Timo Spring
tags:
  - Angular
  - components
  - HTML
  - template
  - Web Development
---
Sometimes you have to deal with handling various views for different data types. In this article, we explore dynamic components loading in Angular.

### Problem

Let's say we are fetching a list of cameras and camera equipment for our glorious online shop. Each list item is either a camera or camera equipment. You know, like tripods, lenses, bags, and whatever fancy filters come to your mind. All those items share some common attributes like price, name, an overselling description, and an id. However, when it comes to the technical characteristics, they differ. Therefore, we have different requirements when it comes to displaying them. For cameras, we want to show the list of tech specs in a table. And for the equipment, we ought to use single values, references, or whatever fancy displaying alternative comes to your mind. The point is, that we need to employ different views depending on the item's tech attribute type.

### Dynamic Components Loading

We already know that we need to create different view components. One view for the tech spec table, one for simple string lists, etc. You get the drill. The question remains how to easily switch between those view components depending on the data type of our attributes. Traditionally, you would use an `ngIf` or `ngSwitch` for such a task (or factory resolvers if you are old-school). However, you might need to handle more than just four views. In that case, both approaches don't scale well. There is already enough chaos and pollution in the world, so, we want to keep at least our template nice and clean.

Luckily, there is another powerful directive that is rarely used: `ngComponentOutlet` (I know, it might be a branding issue). This directive allows us to load new components dynamically at runtime. Additionally, as of Angular 16.2, we can provide inputs to those dynamically created components.

## Example

Let's see it in action. We loaded our list of camera/equipment items from the backend. We already created various view components for different attribute types, like a table, single line value, a reference to other cameras, or a table of references to cameras (e.g. for compatibility). We have a common `ItemComponent` that displays the name, price, description, etc. This is the place where we want to add our component outlet.

In our template, we add the `ngComponentOutlet` and pass it the view component and inputs, required for displaying. Admittedly, the syntax feels a bit strange.

```html
<ng-container 
        *ngComponentOutlet="getAttributeViewComponent(item); 
            inputs: {
                attributes: item.attributes
            }"
/>
```

In the `ItemComponent`, we have to implement the `getAttributeViewComponent` function. It should return the desired view component based on the data type.
Because interface checks in Typescript are always a bit problematic, I would recommend to add an `attributeType` property to your TOs.

```typescript
getAttributeViewComponent(item: ShopItem) {
    switch (item.attributeType) {
        case AttributeType.LIST:
            return ListViewComponent;
        case AttributeType.TABLE:
            return TableViewComponent;
        case AttributeType.REFERENCE:
            return ReferenceViewComponent;
        case AttributeType.REFERENCE_TABLE:
            return ReferenceTableViewComponent;
        default:
            return SingleValueViewComponent;
    }
}
```

That's it. The attribute views are now being loaded dynamically at run time based on the data type. Lean, isn't it?

## Conclusion

The new input property of `ngComponentOutlet` allows us to use the directive more flexibly and easily. This results in our template being clean and tidy. Just the way we like it.
