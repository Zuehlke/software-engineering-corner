---
title: Implement a Powerful Application Search using Apache Solr
description: >-
  Implementing a robust search function is vital for enhancing user experience
  by providing quick access to relevant data. Standard databases often struggle
  with complex search requirements, but specialized tools like Apache Solr can
  be integrated to address these challenges. Solr indexes documents, enabling
  efficient retrieval of information based on user queries, and offers features
  like faceting, highlighting, and spell checking.
released: '2023-08-21T09:08:39.213Z'
cover: images/cover.jpg
author: Matthias Graf
tags:
  - apache
  - Java
  - General Programming
  - Tutorial
  - Web Development
---
A search function is a crucial feature in an application, playing an important role in enhancing the user experience. By simply entering relevant keywords or phrases, the users get instant access to the precise data they require. This saves them from the cumbersome task of manually navigating through intricate menus or hierarchies, making their interaction with the application more intuitive and efficient.

However, writing a good search is hard. A good search function must be able to analyse even large datasets efficiently and find the results relevant for the individual user, instead of simply returning results matching the user input. When, for example, searching a cooking recipe database for “carrot and egs” (note the spelling mistake), recipes using “eggs”, “eggs and carrots” as well as “egg and carrot” must be returned as well.

Using the standard SQL or NoSQL databases generally used in application development, this is hard to achieve. Luckily, there are special tools making it easy to add a search function to your application. In this post, I will show how to do this using
[Apache Solr](https://solr.apache.org/). You can find a working example using Spring Boot in my [GitHub Account](https://github.com/lizzyTheLizard/solr-example).

### What is Apache Solr?

Apache Solr is an open-source search platform built on top of [Apache Lucene](https://lucene.apache.org/). It can be integrated into applications to provide an easy-to-use but powerful search functionality. Solr supports a wide range of features and functionalities such as [faceting](https://solr.apache.org/guide/solr/latest/query-guide/faceting.html), [highlighting](https://solr.apache.org/guide/solr/latest/query-guide/highlighting.html), [spell checking](https://solr.apache.org/guide/solr/latest/query-guide/spell-checking.html#configuring-the-spellcheckcomponent) and provides a RESTful API as well as client libraries for various programming languages like Java, Python, and Ruby. Its extensive configuration options and flexible plugin architecture enables developers to customize and extend its functionality according to their requirements.

Solr works by creating an **index** over a collection of **documents**. Documents are the things you want your users to find. Depending on your applications, these might be pages, objects or even (binary) files. Each document consists of fields, which contain specific information about the document (e.g., the author, a summary, the full-text-content etc.). An index is a list of terms contained in those fields and a list of documents, in which those terms are present.

> One way to understand how Solr works is to think of a loose-leaf book of recipes. Every time you add a recipe to the book, you update the index at the back. You list each ingredient and the page number of the recipe you just added. Suppose you add one hundred recipes. Using the index, you can very quickly find all the recipes that use garbanzo beans, or artichokes, or coffee, as an ingredient. Using the index is much faster than looking through each recipe one by one. Imagine a book of one thousand recipes, or one million.

### Set up a Solr Server

Solr runs as its own web-service. The simplest way to start it is to use the provided [docker image](https://hub.docker.com/%5F/solr/). Using the `solr-precreate` command, you can start Solr by creating an empty but pre-configured collection ready to be used

```
docker run -p 8983:8983 solr solr-precreate <name-of-your-collection>
```

As soon as Solr has started, you can reach it at http://localhost:8983/solr/#/. When running a Solr server, it makes sense to back up the `/var/solr` Directory, as it will contain all the relevant index data.

### SolrJ

The simplest way to communicate between a Java-Application and Solr is to use [SolrJ](https://solr.apache.org/guide/solr/latest/deployment-guide/solrj.html), the official client library for Java. Alternatively, you can use the Rest-API directly or use a [similar library](https://solr.apache.org/guide/solr/latest/deployment-guide/client-apis.html) for other programming languages or the [RestAPI](https://solr.apache.org/guide/solr/latest/configuration-guide/v2-api.html) directly.

```xml
<dependency>
  <groupId>org.apache.solr</groupId>
  <artifactId>solr-solrj</artifactId>
  <version>9.2.1</version>
</dependency>
```

### Indexing your documents

As a first step, you need to send all documents you want to be indexed to Solr. Using SolrJ, this can be done as following

```java
final var solr = new Http2SolrClient.Builder("http://localhost:8983/solr/<name-of-your-index>").build();
final var document = new SolrInputDocument();
document.addField("id", "123");
document.addField("title", "Test-Document");
/* Add additional fields if needed */
solr.add(document);
/* If you add multiple document, commit only once at the end*/
solr.commit();
```

Using Spring Data, you can also use [Annotations to define the fields of a document](https://www.baeldung.com/spring-data-solr). If you want to index file types such as PPT, XLS, and PDF, you can use [Apache Tika](https://tika.apache.org/).

### Searching using Solr

If you have added your documents to the index, you can query them for different terms. The easiest way to do this is to just search for the word you are interested in. Using SolrJ this can be done as the following:

```java
final var solrQuery = new SolrQuery();
/* The term you want to search. In solr this is a query => parameter 'q'
This could come either directly from the user input, or it can be something
generated by the application*/
solrQuery.set("q", "test");
/* The fields you want to return, only 'id' in this case, but you could also
access other fields */
solrQuery.set("fl", "id");
/* Max number of results*/
solrQuery.setRows(1000);
final var response = solr.query(solrQuery);
/* Collect the IDs of the found elements*/
return response.getResults().stream()
.map(s -> (String) s.getFieldValue("id"))
.map(Integer::parseInt)
.collect(Collectors.toList());
```

Simple Solr queries are intuitive to use. However, they work in detail are hard to understand and there are various options and tweaks. To help you, there is an [extensive documentation](https://solr.apache.org/guide/solr/latest/query-guide/query-syntax-and-parsers.html) and, even better, a Web-Gui where you can play around with queries interactively at http://localhost:8983/solr/#/<name-of-your-index>/query

## Next Steps

At this stage, you have a simple search function integrated into your application. Users can input simple search queries and relevant documents are returned. However, you are not using the full strength of Solr yet. Depending on your needs, you could take a look at these additional topics

* If you want to fine-tune how the index is generated, you should define your own [Schema](https://solr.apache.org/guide/solr/latest/indexing-guide/schema-elements.html). In there you can e.g. define the type for each field, how they are split up into tokens to be indexed and much more. In [my example](https://github.com/lizzyTheLizard/solr-example), I showed how you can use your own schema file in Solr. However, best practices in how to define your schema are a huge topic. If you are interested in this topic, please leave a comment below!
* If needed, Solr can be scaled quite well. This is e.g. the case if you have a big user base performing expensive search operations or if the data to be indexed is too large for one server. In this case, take a look at [SolrCloud](https://solr.apache.org/guide/solr/latest/getting-started/tutorial-solrcloud.html). Despite its name, it is not some kind of cloud service, but instead a pre-configured system allowing you to operate multiple Solr instances. It uses [Apache ZooKeeper](https://zookeeper.apache.org/) to provide a highly available, fault-tolerant environment for distributing your indexed content and query requests across multiple servers.
* To allow better queries for your users, check out the different [Query Parsers](https://solr.apache.org/guide/solr/latest/query-guide/query-syntax-and-parsers.html) Solr offers. Each provides different advantages and various parameters and query operators like distance search, wildcards etc. to fine-tune search as much as you like.
