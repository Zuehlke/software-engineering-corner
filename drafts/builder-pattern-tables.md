---
title: One Table to Rule them All
subtitle: Leveraging the Builder Pattern to Craft Maintainable HTML Tables
domain: software-engineering-corner.hashnode.dev
tags: web-development, angular, design-patterns, software-architecture, refactoring
cover: https://cdn.hashnode.com/res/hashnode/image/stock/unsplash/QI3VFt5YOlg/upload/1ad02a99eb473f317da5c464673eb90d.jpeg?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp
publishAs: timouti
hideFromHashnodeCommunity: false
saveAsDraft: true
---

Tables are part of nearly every web application nowadays. We use them to display search results, to report financial statistics and sales, or to manage orders, inventory, and users.

However, implementing and maintaining tables is always a bit of a hustle. No matter if you use native HTML tables, component library tables (like Angular Material), or enterprise solutions like AG-Grid.

### Problem

Implementing tables requires lots of specification. You need to define the table header including the column titles, the mapping of our data entity to the table cells, and the potential formatting of the values in our cells. One cell might be a currency, another a simple ID or date, and others might even contain icons or buttons. Additionally, we want our table to be responsive and consistent throughout the application. And maybe you even require sorting or filtering.

Traditionally, you end up with a table template spanning over so many lines of code that it becomes difficult to grasp the table workings at a glance. Moreover, there is lots of boilerplate code when defining a second and third table, because the basic skeleton is identical. Especially, since you try to keep them consistent.

The following example shows a fairly simple Angular Material table. Can you make out easily how the table is structured, what data the cells contain and how they are being formatted?

```html
<table mat-table [dataSource]="data" class="example-table"
       matSort matSortActive="created" matSortDisableClear matSortDirection="desc">

    <!-- ID Column -->
    <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef>ID</th>
        <td mat-cell *matCellDef="let row">{{row.individualId.id}}</td>
    </ng-container>

    <!-- Products Column -->
    <ng-container matColumnDef="products">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let row">
            <div *ngFor="let product of row.products">
                {{ product }}
            </div>
        </td>
    </ng-container>

    <!-- Action Column -->
    <ng-container matColumnDef="action">
        <th mat-header-cell *matHeaderCellDef>Action</th>
        <td mat-cell *matCellDef="let row">
            <button mat-button color="primary" (click)="onButtonClicked(element.id)">Open</button>
        </td>
    </ng-container>

    <!-- Created Column -->
    <ng-container matColumnDef="created-date">
        <th mat-header-cell *matHeaderCellDef mat-sort-header disableClear>
            Created
        </th>
        <td mat-cell *matCellDef="let row">{{row.created_at | date}}</td>
    </ng-container>

    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
</table>
```

### Shared Table

As a first step, you might think about creating a shared component for your tables. This ensures that all tables within your application are consistent and easy to maintain. However, crafting such a shared table component is not as easy as it seems. The table would need to handle various data entities, cell formats, cell types, and date formats. And the more features you need to pack into your table, the more complex such a shared table can get.

Our shared table requires two inputs. First, the table configuration, consisting of headers, the data type for each column, information on how to retrieve the cell value from our data entity, and potential information about stylings and formatting of the cell value and columns.

Second, the list of data entities or rather the row objects that we want to display in our table. Thereby, the table needs to be able to deal with various data types (when using TypeScript at least, but why wouldn't you use TypeScript in the first place).

You can find an example of our shared table template at the bottom of this article.

### Column Configuration

Our first shared table input is the table configuration, or rather list of column configurations. Thereby, the column definition interface consists of four basic parts: the column title, a unique column ID (used for testing with cypress), the cell content configuration, and styling information.

```typescript
export type TableCellContentType =
  | TableCellContentValue
  | TableCellContentValueList
  | TableCellContentIcon
  | TableCellContentButton
  | undefined;

export type TableColumnConfiguration<T> = {
  columnId: string;
  title: string;
  cellContent: {
    displayType: TableCellDisplayingType;
    valueGetterFn: (data: T) => TableCellContentType;
    formatFn: (cellValue: TableCellContentType) => TableCellContentType;
  };
  styling: {
    width?: string;
    minWidth?: string;
    maxWidth?: string;
  };
};
```

The `cellContent` attribute defines a value getter function specifying how to retrieve the required cell value from our data object. We can also add formatting functions here to e.g. transform the fetched value to a date or currency.

The `displayType` attribute is used to switch between icons, buttons, string lists (multi-line), or simple string values displaying inside the table cell. Of course, this could easily be extended with other types that you want to display in your table cells, like references or even nested tables (please don't do that).

The `styling` attribute helps us to improve the responsiveness of the columns by defining min and max width (if required), or even fixed-width columns.

So, when we look at the "Created" date column of our example table, this would yield a column configuration as follows:

```json
{
  "title": "Created",
  "columnId": "created-date",
  "cellContent": {
    "displayType": TableCellContentType.TableCellContentValue,
    "valueGetterFn": (date: ExampleTO) => date.created,
    "formattingFn": (date?: string) => formatDate(date, 'mediumShort')
  },
  "styling": {
    "minWidth": "105px",
    "maxWidth": "250px"
  }
}
```

### Builder Pattern

There are not a lot of use cases where I would consider using a builder pattern in front-end applications. However, when dealing with the column configurations of our shared table component, it comes in quite handy. The builder pattern allows us to easily create such column definitions in a readable and scalable fashion.

```typescript
public initTable{
    const builder = new TableColumnConfigBuilder<ExampleTO>();
    this.columnDefinitions = [
        builder.column('ID').id((data) => data.individualId.id), 
        builder.column('Products').multiLineList((data) => data.products),
        builder.column('Action').button('Open', onButtonClickFn),
        builder.column('Created').date((data) => data.created_at)
    ]
}
```

So, every time you add a table to your component, you need to specify all the columns of your table using the `TableColumnConfigBuilder`. The builder itself is fairly straightforward. For each build step, you simply modify the generic column definition by adding, removing, or changing attributes. For example, in the build step `date()` we define a value getter, a `min` and `max` width and change the formatting of the cell to date formatting. Below is an excerpt of our table builder with a few sample steps:

```typescript
/**
* Builder that returns a column configuration to be used by the material table.
*/
export class TableColumnConfigBuilder<T> {
  private columnDef: TableColumnConfiguration<T>;

  constructor() {
    this.columnDef = this.defaultColumn();
  }

  /**
   * Sets the column header and column id. The id is used internally by angular material and has to be unique within
   * the table.
   * @param title - header title
   * @param id - unique column id e.g. fromDate
   */
  column(title: string, id: string): TableColumnConfigBuilder<T> {
    this.columnDef = {
      ...this.defaultColumn(),
      title: title,
      columnId: id,
    };
    return this;
  }

  /**
   * Sets the column content type to a date like type. That means that we set the formatting function to a date formatter
   * and the column min and max width automatically.
   */
  date(
    valueGetterFn: (data: T) => TableCellContentValue,
    format = 'mediumDate'
  ) {
    this.columnDef = {
      ...this.columnDef,
      cellContent: {
        ...this.columnDef.cellContent,
        valueGetterFn: valueGetterFn,
        formatFn: (value: TableCellContentType) => {
          if (typeof value === 'string') {
            return esasDate(value, format);
          }
          return value;
        },
      },
      styling: {
        ...this.columnDef.styling,
        minWidth: '105px',
        maxWidth: '180px',
      },
    };
    return this;
  }

  /**
   * Sets the min and max width of the column to accommodate a typical ID
   */
  id(valueGetterFn: (data: T) => TableCellContentValue) {
    this.columnDef = {
      ...this.columnDef,
      cellContent: {
        ...this.columnDef.cellContent,
        displayType: TableCellDisplayingType.Value,
        valueGetterFn: valueGetterFn,
      },
      styling: {
        ...this.columnDef.styling,
        minWidth: '80px',
        maxWidth: '165px',
      },
    };
    return this;
  }

  ...

  /**
   * Build step returning the column configuration as defined using the builder
   */
  build(): TableColumnConfiguration<T> {
    return this.columnDef;
  }
}
```

The beneficial part of this builder pattern is that we can easily modify all tables in our application at once. If we e.g. decide to change the formatting of our date columns, we can easily change it in the builder, and it will be effective for all date columns in our application. Additionally, we have consistency by design, so an ID column is always the same size, or a multi-line list is always displayed the same.

Moreover, the template of the components containing tables is clean and not clustered with table boilerplate code anymore. It just requires the two inputs, and that's it. Furthermore, it can be tested quite easily with unit and component tests.

```xml
<app-table>
    [tableData]="productsList"
    [columnDefinitions]="columnDefs"
</app-table>
```

### Caveat

The only drawback of the builder pattern is the added complexity of the shared table template. It has to be quite generic and cover various displaying types using `ngTemplates`, `ngTemplateOutlet`, and `ngTemplateOutletContext` in our Angular example, which are not so commonly used.

However, implementing this shared table template is mostly a one-time effort and helps us to drastically reduce the maintenance and implementation costs for all the tables that follow.

Our final shared table might look something like this:

```xml
<mat-table [dataSource]="tableData" class="table" data-cy="app-table">
    <mat-header-row *matHeaderRowDef="columnTitles"></mat-header-row>
    <mat-row
            (click)="selectRow(row, i)"
            [ngClass]="{ highlighted: isSelected(i) }"
            *matRowDef="let row; columns: columnTitles"
    ></mat-row>

    <ng-container
            *ngFor="let column of columnDefinitions" <--- OUR COLUMN CONFIGURATION
            [matColumnDef]="column.columnId"
    >
        <!--Table Header-->
        <mat-header-cell
                *matHeaderCellDef
                [ngStyle]="{
        maxWidth: column.styling.maxWidth,
        minWidth: column.styling.minWidth,
        width: column.styling.width,
      }"
        >{{ column.title }}</mat-header-cell>

        <!--Table Rows-->
        <mat-cell
                *matCellDef="let row"
                [ngStyle]="{
        maxWidth: column.styling.maxWidth,
        minWidth: column.styling.minWidth,
        width: column.styling.width,
      }"
        >
            <!-- Cell Content can be of various types: single value, list (multi-line), icon. -->
            <ng-container [ngSwitch]="column.cellContent.displayType">
                <ng-container
                        *ngSwitchCase="TableCellType.Value"
                        [ngTemplateOutlet]="singleValue"
                        [ngTemplateOutletContext]="{
            value: column.cellContent.formatFn(
              column.cellContent.valueGetterFn(row)
            ),
          }"
                ></ng-container>
                <ng-container
                        *ngSwitchCase="TableCellType.MultiLineList"
                        [ngTemplateOutlet]="listValue"
                        [ngTemplateOutletContext]="{
            valueList: getListFromObject(
              column.cellContent.valueGetterFn(row)
            ),
          }"
                ></ng-container>
                <ng-container
                        *ngSwitchCase="TableCellType.Icon"
                        [ngTemplateOutlet]="icon"
                        [ngTemplateOutletContext]="{
            icon: column.cellContent.valueGetterFn(row),
          }"
                ></ng-container>
                <ng-container
                        *ngSwitchCase="TableCellType.Button"
                        [ngTemplateOutlet]="button"
                        [ngTemplateOutletContext]="{
            button: column.cellContent.valueGetterFn(row),
          }"
                ></ng-container>
            </ng-container>
        </mat-cell>
    </ng-container>
</mat-table>

<ng-template #singleValue let-value="value">
  <span>{{
    value | orElseDash
  }}</span>
</ng-template>

<ng-template #listValue let-valueList="valueList">
    <div>
        <div *ngFor="let entry of valueList">
            {{ entry | orElseDash }}
        </div>
    </div>
</ng-template>

<ng-template #button let-button="button">
    <button
            color="primary"
            mat-button
            (click)="onButtonClicked()"
    >
        <mat-icon *ngIf="button.iconKey" [key]="button.iconKey"></mat-icon>
        {{ button.label }}
    </button>
</ng-template>

<ng-template #icon let-icon="icon">
    <mat-icon [key]="icon.iconKey"></mat-icon>
</ng-template>
```

### Summary

Using a combination of the builder pattern with a shared table component helps us to enforce consistency, reduce maintenance costs, reduce boilerplate code, and make tables inside the components more readable.

I am quite fond of it, how about you?
