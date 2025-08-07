---
title: Asynchronous form configuration
description: "Define zod form schema with asynchronous data"
shortDescription: "Define zod form schema with asynchronous data"
released: '2025-08-12T09:00:00.000Z'
cover: images/cover.jpeg
author: Tram Anh Duong
tags:
  - form
  - typescript
  - react
  - react-hook-form
  - zod
  - frontend-development
publishAs: tduong992
hideFromHashnodeCommunity: false
saveAsDraft: true
---

Recently, I implemented a custom form validation that takes a configuration value from the backend as validation
criteria. Meaning, I need to get the async value before setting up the form.

In this blog post, I will show the example using React and TypeScript.
To manage my forms and form validations I work with react-hook-form and zod.

## Basic Form Configuration

Let's consider a form with two (required) datetime form fields: `dateStart` and `dateEnd`.
The following is the zod form schema definition with validations.
_Note_: `z.date()` has an implicit "required" validation rule.

```ts
import { z } from 'zod';


// zod schema declaration
const FormSchema = z.object(
    {
        dateStart: z.date(),
        dateEnd: z.date(),
    },
);
type FormData = z.infer<typeof FormSchema>;
```

Then, the form schema can be passed to react-hook-form, which will handle the validations for us and
make the errors accessible from its `formState.errors` API.

```ts
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';


// react-hook-form setup in a functional component or custom hook
const form = useForm<FormData>(
    {
        resolver: zodResolver(FormSchema),
        defaultValues: {
            dateStart: '' as unknown as Date,
            dateEnd: '' as unknown as Date,
        },
    }
);

// get all validation violations: form.formState.errors
```

Let's see it all together with UI elements.
_Note_: change the class name "error" with the error style of your preference,
e.g. with red border to highlight the input field that has an error.

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';


// zod schema declaration
const FormSchema = z.object(
    {
        dateStart: z.date(),
        dateEnd: z.date(),
    },
);
type FormData = z.infer<typeof FormSchema>;

function MyForm() {

    // react-hook-form setup in a functional component or custom hook
    const form = useForm<FormData>(
        {
            resolver: zodResolver(FormSchema),
            defaultValues: {
                dateStart: '' as unknown as Date,
                dateEnd: '' as unknown as Date,
            },
        }
    );

    function onSubmit(data: FormData): void {
        console.log(data);
    }

    return (
        <form submit={ form.handleSubmit(onSubmit) }>
            <div>
                <MyDatePicker
                    { ...form.register('dateStart') }
                    className={ !!form.formState.errors?.dateStart ? 'error' : '' }
                />
                { form.formState.errors?.dateStart && (
                    <p>{ form.formState.errors.dateStart.message }</p> // <p>Start date is required</p>
                ) }
            </div>
            <div>
                <MyDatePicker
                    { ...form.register('dateEnd') }
                    className={ !!form.formState.errors?.dateEnd ? 'error' : '' }
                />
                { form.formState.errors?.dateEnd && (
                    <p>{ form.formState.errors.dateEnd.message }</p> // <p>End date is required</p>
                ) }
            </div>
            <button type={ 'submit' }>Submit</button>
        </form>
    );
}
```

## Form Schema Definition with External Data

Now, the requirement is that the specified `dateEnd - dateStart` should not exceed a certain time range.
For best practice, the submitted values should be also validated in the backend and/or maybe this time range criteria is
used for other use cases as well. In addition, the time range criteria needs to be configurable at deployment time.
Therefore, it would make sense to set this time range value in some configuration file, which both the frontend and
backend can read.

Here is how I form the schema definition to satisfy the requirements.

To pass the (async) values to define the form validation, I need to define the schema via a function.
Then, I can define my custom form validation using [`.superRefine()`](https://v3.zod.dev/?id=superrefine)
(or [`.check()`](https://zod.dev/api?id=superrefine) in zod v4).

_Note_: in order to distinguish between an error of the individual field vs the combined fields
(i.e. an error that affects both), and to not show the same combined error message twice (i.e. for both form fields),
I add an undefined form field only for the purpose to assign the combined error to something.

```ts
import { z } from 'zod';


// zod schema declaration
const BaseFormSchema = z.object(
    {
        dateRange: z.undefined(),
        dateStart: z.date(),
        dateEnd: z.date(),
    },
);

function getFormSchema(rangeDays: number) {
    return BaseFormSchema
        .superRefine(
            ({ dateStart, dateEnd }, ctx) => {
                if (!isWithinValidDatetimeRange(dateStart, dateEnd, rangeDays)) {
                    ctx.addIssue(
                        {
                            path: ['dateRange'],
                            code: z.ZodIssueCode.custom,
                            message: `Date range exceeded (max ${ rangeDays } days)`,
                        }
                    )
                }
            }
        );
}

function isWithinValidDatetimeRange(dateStart: Date | string, dateEnd: Date | string, rangeDays: number): boolean {
    const diffInMilliseconds = new Date(dateEnd).getTime() - new Date(dateStart).getTime();
    // magic number DAYS_IN_MILLISECONDS = 24 * 60 * 60 * 1000
    return diffInMilliseconds < (rangeDays * DAYS_IN_MILLISECONDS);
}

type FormSchema = ReturnType<typeof getFormSchema>;
type FormData = z.infer<typeof FormSchema>;
```

Then, in the form definition I call the form schema function, which expects to receive the configuration values from
the backend synchronously.

```ts
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';


// react-hook-form setup in a functional component or custom hook
const form = useForm<FormData>(
    {
        resolver: zodResolver(getFormSchema(serverConfig.rangeDays)),
        defaultValues: {
            dateStart: '' as unknown as Date,
            dateEnd: '' as unknown as Date,
        },
    }
);
```

## Handle Asynchronicity / Wrap-Up

To satisfy the rule "a hook cannot be called conditionally", I simply call the `useForm()` hook
from a functional component that is rendered only after a successfully fetched data response,
otherwise I show some loading screen.

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';


// handle asynchronicity with hooks
function MyConfiguration() {
    const serverConfig = useServerConfig(); // some custom hook using react-query to fetch the data

    if (serverConfig.data == undefined) {
        return (<p>Loading...</p>);
    }

    return (<MyForm serverConfig={ serverConfig.data }/>);
}
```

Then, I pass the fetched data from the backend to the form schema function.
Final touch: I handle the combined error message by checking on my `dateRange` undefined form field
and set the appropriate style accordingly.

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';


function MyForm({ serverConfig }: { serverConfig: { rangeDays: number } }) {

    // react-hook-form setup in a functional component or custom hook
    const form = useForm<FormData>(
        {
            resolver: zodResolver(getFormSchema(serverConfig.rangeDays)),
            defaultValues: {
                dateStart: '' as unknown as Date,
                dateEnd: '' as unknown as Date,
            },
        }
    );

    function onSubmit(data: FormData): void {
        console.log(data);
    }

    return (
        <form submit={ form.handleSubmit(onSubmit) }>
            <div>
                <MyDatePicker
                    { ...form.register('dateStart') }
                    className={ !!form.formState.errors?.dateStart || !!form.formState.errors?.dateRange ? 'error' : '' }
                />
                { form.formState.errors?.dateStart && (
                    <p>{ form.formState.errors.dateStart.message }</p> // <p>Start date is required</p>
                ) }
            </div>
            <div>
                <MyDatePicker
                    { ...form.register('dateEnd') }
                    className={ !!form.formState.errors?.dateEnd || !!form.formState.errors?.dateRange ? 'error' : '' }
                />
                { form.formState.errors?.dateEnd && (
                    <p>{ form.formState.errors.dateEnd.message }</p> // <p>End date is required</p>
                ) }
            </div>
            <>
                { form.formState.errors?.dateRange && (
                    <p>{ form.formState.errors.dateRange.message }</p> // <p>Date range exceeded (max { serverConfig.rangeDays } days)</p>
                ) }
            </>
            <button type={ 'submit' }>Submit</button>
        </form>
    );
}
```

This is how I configured a zod form schema with asynchronous data. Would you solve it differently?
