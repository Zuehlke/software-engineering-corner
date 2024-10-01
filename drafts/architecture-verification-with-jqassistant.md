---
title: Architecture verification and documentation with jQAssistant and arc42
domain: software-engineering-corner.hashnode.dev
tags: Java, software architecture  
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1727771451245/mNMwZtunX.jpg?auto=format
publishAs: stmu
hideFromHashnodeCommunity: false
saveAsDraft: true
enableToc: true
---

# Architecture verification and documentation with jQAssistant and arc42

There are plenty of tools available for gaining insights into IT systems, like static code analysis, vulnerability scans, and runtime metrics and monitoring solutions. Each of these tools offers unique insights into various system aspects and can serve as quality gates or fitness functions (see [*Building Evolutionary Architectures* by Neal Ford et al.]([https://evolutionaryarchitecture.com/)).

However, tools specifically designed to monitor architectural aspects and decisions, and verify implementation against design, aren't as widespread. That's where [jQAssistant]([https://github.com/jQAssistant) comes in — it aims to fill this gap.

Thanks to its versatile concepts, jQAssistant can be used for a variety of tasks. In this article, I'll share some use cases and ways to leverage jQAssistant, hoping to inspire your own projects.

I won't dive into the core concepts and setup of jQAssistant here. Plenty of other resources cover those:

- For general info, the [jQAssistant Manual](https://jqassistant.github.io/jqassistant/current/) is your best starting point.
- For project setup and usage, [this blog series (German only)](https://uxitra.de/2024/04/04/codestrukturanalyse-mit-jqassistant-teil-1/) is worth a look.

We'll use a small sample project implementing a [Ports and Adapters Architecture](https://en.wikipedia.org/wiki/Hexagonal%5Farchitecture%5F(software)). You can find it on [GitHub](https://github.com/stmu-zuhlke/jqa-sample).

Let's dive in!

## Ensure ports and adapters

First, we want to ensure our setup of ports and adapters is consistently used. Here are the requirements:

- The `core` package contains the application core.
- An interface in `core` is a `port`.
- The `infra` package holds the adapter and other implementations.
- A class from `infra` that implements a `port` is an `adapter`.
- `Ports` are only allowed to be implemented by classes in `infra`.

Let's translate these requirements into jQAssistant!

Custom rules are defined in XML files within the `jqassistant` folder. Within these files, we write Cypher queries executed by jQAssistant.
For more information on writing rules, check out the [rules manual](https://jqassistant.github.io/jqassistant/current/#_rules).

First, let's enhance the graph by clarifying what constitutes a port and what qualifies as an adapter. 
To do this, we’ll define concepts that match Java types with the `core` or `infra` packages first. These common core concepts will simplify our efforts when defining additional rules.

```xml
<concept id="commons:corePackage">
        <description>Marks core package types</description>
        <cypher><![CDATA[
            MATCH
                (t:Type)
            WHERE
                t.fqn STARTS WITH "com.weatherbuddy.weatherdataservice.core"
            SET
                t:Core
            RETURN
                t
        ]]>
        </cypher>
    </concept>

    <concept id="commons:infraPackage">
        <description>Marks infra package types</description>
        <cypher><![CDATA[
            MATCH
                (t:Type)
            WHERE
                t.fqn STARTS WITH "com.weatherbuddy.weatherdataservice.infra"
            SET
                t:Infra
            RETURN
                t
        ]]>
        </cypher>
    </concept>
```

This can then be used to define a **ports-and-adapters** concept. This concept not only adds new labels to the nodes but also adds new relations `ADAPTER_OF` and `PORT_OF` between the nodes.

Additionally, we return the port name and a list of all implementing adapters, which is handy for reporting and documentation.

```xml
<concept id="structure:ports-and-adapters">
        <requiresConcept refId="commons:corePackage"/>
        <requiresConcept refId="commons:infraPackage"/>
        <description>Marks all interfaces in the core as ports</description>
        <cypher><![CDATA[
            MATCH
                (adapter:Type)-[r:IMPLEMENTS]->(port:Interface:Core)
            SET
                port:Port,adapter:Adapter
            CREATE
                (adapter)-[:ADAPTER_OF]->(port)-[:PORT_OF]->(adapter)
            RETURN
                port.name AS Port, collect(adapter.name) AS Adapters
        ]]>
        </cypher>
    </concept>
```

With these three concepts in place, we can now define a constraint to verify our last requirement.

```xml
    <constraint id="structure:adapterPackage" severity="blocker">
        <requiresConcept refId="structure:ports-and-adapters"/>
        <description>Makes sure, that adapters are in the infra package</description>
        <cypher><![CDATA[
            MATCH
                (a:Adapter)
            WHERE NOT
                a:Infra
            RETURN
                a as InvalidAdapter
        ]]></cypher>
    </constraint>
```

When executed, this constraint will fail if the result set of the Cypher query is greater than zero.

### Severity

JQassistant rules come with a severity level, giving you the power to finely tune which rules should actually break your build and which ones should just serve as warnings or informational notes.
This flexibility makes rule validation and reporting way more adaptable to your specific needs.

In the example above, the `structure:adapterPackage` constraint is set to a `blocker` severity level. This is the highest severity, meaning the rule will result in a fail if the result count is not zero.

If we set this to e.g. `minor`, only a warning will be printed out.

Here's a quick rundown of the supported severity levels:

- info
- minor (default for concepts)
- major (default for constraints)
- critical
- blocker

You can adjust the threshold levels for warnings and failures with these configuration options:

- 'jqassistant.analyze.report.warn-on-severity' (default: minor)
- 'jqassistant.analyze.report.fail-on-severity' (default: major)

Warnings and failures will show up on the console and in the generated reports.

Additionally, the `jqassistant.analyze.report.continue-on-failure` setting (default: false) determines whether jQAssistant continues or stops if failures are found during analysis.

## More insights with plugins

JQAassistant offers a versatile plug-in system, extending its capabilities beyond just Java code. This flexibility allows us to gain deeper insights and metrics about system structures.

In the sample project, the [git plugin](https://github.com/kontext-e/jqassistant-git-plugin) is utilized to collect metrics on contributors and identify hot spots. You can find the relevant rule in `/jqassistant/metrics.xml`.

```xml
    <concept id="metrics:MostChangedTypes">
        <requiresConcept refId="commons:ConnectGitFilesAndTypes"/>
        <description>Most changed Types</description>
        <cypher><![CDATA[
        MATCH
            (commit:Git:Commit)
            -[:CONTAINS_CHANGE]->(:Git:Change)-[:MODIFIES]->
            (:Git:File)-[:CONTAINS]->(type:Type)
        RETURN
            type.fqn AS Type, count(commit) AS NumberOfCommits
        ORDER BY
            NumberOfCommits DESC
        LIMIT
            20
    ]]></cypher>
    </concept>
```

The concept above highlights the top 20 java types with the most changes, useful for reporting or pinpointing risks and opportunities for restructuring.

You can even set up alerts when a file hits a certain threshold by creating a constraint with a warning severity.

This is just one example for system metrics. Beyond that, you can use various plugins or your own concepts to inspect the static aspects of your entire system. For instance, monitor API stability by checking changes to certain endpoints or OpenAPI specifications using the OpenAPI Plugin. You can also link test coverage with the Jacoco Plugin to specific packages, allowing you to set different coverage goals for different system parts. If you don't find what you need, you can always write your own plugin.

The sky's the limit! 🚀

## Living Documentation

As mentioned earlier, jQAssistant rules can be utilized for reporting and can enhance existing documentation with up-to-date information. This makes it ideal for creating living documentation that reflects the current state of the system and the relationship between design and implementation.

For reporting, we'll use the [jqassistant-asciidoctor-extension](https://github.com/jqassistant-tooling/jqassistant-asciidoctorj-extensions), which is an extension for asciiDoctor parsing the jQAssistant report and providing inculde directives for the results.
As a documentation template, we’ll employ [arc42](https://arc42.org), a framework for documenting software architectures. It already provides a structure we can hook in and is available as [asciiDoc template](https://arc42.org/download#file-based-formats). 

You'll find the documentation in the `src/docs` directory of our sample project. TThe project is pre-configured with the Asciidoc Maven plugin and the Asciidoc multipage HTML plugin, which creates a beautiful multipage documentation in your  `target/docs` folder, when running the project with `mvn verify`.

To enable jQAssistant-related Asciidoc directives, you'll need to add the jQAssistant extension as a dependency for the Asciidoc plugin in the pom.xml file.

```xml
    <plugin>
        <groupId>org.asciidoctor</groupId>
        <artifactId>asciidoctor-maven-plugin</artifactId>
        <version>${asciidoctor.maven.plugin.version}</version>
        <dependencies>
            <dependency>
                <groupId>org.jqassistant.tooling.asciidoctorj</groupId>
                <artifactId>jqassistant-asciidoctorj-extensions</artifactId>
                <version>1.0.1</version>
            </dependency>
        </dependencies>
        [...]
    </plugin>
```

This now enables us to use jQAssistant includes in our documentation like this:

```asciidoc
# Includes a sumamry of all executed constraints
include::jQAssistant:Summary[constraints="*"]

# Includes detailed execution results of a rule
# For concepts, this is a table of the cypher query result
include::jQAssistant:Rules[constraints="*"]
```

<div data-node-type="callout">
    <div data-node-type="callout-emoji">ℹ</div>
    <div data-node-type="callout-text">
    There is another [Asciidoc reporting plugin for jQAssistant](https://github.com/jqassistant-plugin/jqassistant-asciidoc-report-plugin) available. Unlike the extension we're using, this plugin allows for deprecated rule definitions in asciidoc and generates an HTML report based on those rules. However, since we're focused on integrating results directly into our documentation pipeline, it doesn't quite meet our needs.
    </div>
</div>

With these tools in hand, we can now embark on our journey into creating living documentation. ⛵

## Showcase: ADR validation

To show what I mean with "living documentation" and what is possible besides analysing code using jQAssistant, I created a showcase, validating [Architecture Descicion Records (ADR)](https://github.com/joelparkerhenderson/architecture-decision-record).

Here is what we want to do:

- write ADRs
- include the ADRs in the documentation
- scan ADRs with jQAssistant
- Verify, if the ADR is backed with at least one jQAssistant constraint

To document ADRs we want to use asciidoc files. Unfortunately, there is no jQAssistant plugin out there, which scans adoc files and adds them to the tree. But there are already other scanners included in jQAssistant, e.g. xml, json and yaml scanners. So as a workaround, we split up the ADR definition in two parts:

1. **ADR yaml file**, implementing an ADR template and providing a unique ADR ID.
2. **ADR adoc documentation file**, includes the yaml content and the jQAssitant rules for this ADR.

In our sample project you'll find the ADR examples in the folder `src/docs/adr`.

With the yaml files ingested by jQAssistant we can then write concepts and constraints targeting those nodes. Finally we can include all ADR documentation files in the architecture design desciions document.

So this is the concept:

![ADR validation concept](https://cdn.hashnode.com/res/hashnode/image/upload/v1727425895503/KXUvwoP3n.png?auto=format&width=500)

The end result should provide a documentation with the following contents:

- a list of all ADRs in our documentation
- detailes about every ADR
- an overview about which ADRs are covered by a constriant
- the results of the constraints for the last build

### Scanning ADRs

To ensure the YAML scanner can detect our ADR definitions, we simply add the following line to our .jqassistant.yml file:

```yaml
jqassistant:
[...]
  scan:
    include:
      files:
        - src/docs/adr
[...]
```

Adding this line will include all files in the adr folder for scanning by the YAML file scanner, which is part of the jQAssistant core distribution.

The yaml scanner adds generic yaml nodes into the Neo4J graph. To interpret these nodes as ADRs, we have to define our own concept:

```xml
<concept id="adr:document">
        <description>ADR yaml documents files</description>
        <cypher><![CDATA[
            MATCH
                (file:Yaml:File)
                    -[HAS_DOCUMENT]->
                (doc:Yaml:Document)
                    -[HAS_MAP]->
                (map:Yaml:Map)
                    -[HAS_KEY]->
                (key:Yaml:Key {name:'id'})
                    -[HAS_VALUE]->
                (id:Yaml:Value)
            WHERE
                file.fileName STARTS WITH '/adr-'
            MERGE
                (adr:Adr {adrId: id.value})
            RETURN adr
    ]]></cypher>
    </concept>
```

Here's what's happening:

We're scanning YAML documents whose filenames start with `/adr-`. For each of these files, a new node is created in the Neo4J graph. This node is labeled as `Adr` and includes a property holding the Adr-ID.

### Matching ADR rules

With the ADRs in place, we can now match the corresponding rules. To make this work, let's set some ground rules:

- ADR document names always start with `adr-`.
- The ID of a rule ensuring an ADR must be prefixed with the ADR-ID.

To match rules within a concept, we need to ingest the rule definitions into the Neo4J tree. This time, we'll use the built-in XML scanner by adding the jqassistant folder to the configuration:

```yaml
jqassistant:
[...]
  scan:
    include:
      files:
        - src/docs/adr
        - jqassistant
[...]
```

With the XML nodes available, we can define the following concept, which matches the ADR nodes with the XML rule element. The `merge` then creates a new node labeled `AdrConstraint` and establishes a new relationship, `ENSURED_BY`, between this node and the `Adr` node.

```xml
    <concept id="adr:matchingConstraint">
        <requiresConcept refId="adr:document"/>
        <description>Links ADRs with JQL Constraints which ensure the ADR</description>
        <cypher><![CDATA[
            match (adr:Adr)
            match (e:Xml:Element {name: 'constraint'})-->(attr:Xml:Attribute {name: 'id'})
            where attr.value STARTS WITH adr.adrId
            merge (adr)-[r:ENSURED_BY]->(constraint:AdrConstraint {adrId: adr.adrId, id: attr.value})
            return adr.adrId, type(r), constraint.id
        ]]></cypher>
    </concept>
```

<div data-node-type="callout">
    <div data-node-type="callout-emoji">ℹ</div>
    <div data-node-type="callout-text">
It seems that jQAssistant also has an internal concept providing JQAssistant rule nodes. Unfortunately, I haven't figured out how to reference it, which leads to race conditions during concept execution. I'm also unsure how to add this as `requiredConcept`. Here's a [Stack Overflow question](https://stackoverflow.com/questions/78981658/how-to-use-jqassistant-internal-node-labels-in-custom-concept) I created, but there hasn't been an answer so far.
    </div>
</div>

For a test, we now add two dummy constraints for adr-01. Both of those constraints will be linked to the corresponding ADR.

```xml
    <constraint id="adr-01">
        <description>Dummy contraint for ADR-01</description>
        <cypher><![CDATA[
            MATCH
                (file:Type)-->(adr:Adr)
            RETURN file
    ]]></cypher>
    </constraint>

    <constraint id="adr-01-hello">
        <description>Another Dummy contraint for ADR-01</description>
        <cypher><![CDATA[
            MATCH
                 (file:Type)-->(adr:Adr)
            RETURN file
    ]]></cypher>
    </constraint>
```

### Reporting and documentation

With everything in place, we are now ready to incorporate the results into the documentation..
As you may recall, our objective is to provide a comprehensive overview of all ADRs and their associated constraints.
o facilitate this, we are introducing a new concept called `adr:constraintReport`. This concept does not modify the graph in any way. Rather we use the query result as a structured report.

```xml
    <concept id="adr:constraintReport">
        <requiresConcept refId="adr:document"/>
        <requiresConcept refId="adr:matchingConstraint"/>
        <description>List of all constraints for adrs</description>
        <cypher><![CDATA[
            call {
                match (a:Adr)-[r:ENSURED_BY]->(c:AdrConstraint)
                return a.adrId as adr, c.id as Constraints
                UNION DISTINCT
                match(unionAdr:Adr)
                return unionAdr.adrId as adr, null as Constraints
           }
           return adr, collect(Constraints) as Constraints
        ]]></cypher>
    </concept>
```

The concept leverages advanced cypher features like `UNION` and `CALL` to gather all ADRs and connect them with their corresponding `AdrConstraints`.
This information is now incorporated into the `09_architecture_decisions.adoc` file using the jQAssistant includes:

```adoc
include::jQAssistant:Rules[concepts="adr:constraintReport"]
```

Et voilà, there you have it — a complete report detailing all our ADRs and whether they're covered by a constraint.

![ADR constaint report](https://cdn.hashnode.com/res/hashnode/image/upload/v1727767869285/k862e6Het.jpg?auto=format&width=600)

Next, we simply include each `adr-xx.adoc` file into the same document. The result is a living ADR documentation that can be effortlessly deployed and distributed, such as through a [Github Page](https://stmu-zuhlke.github.io/jqa-sample/section-design-decisions.html) 🚀

<div data-node-type="callout">
    <div data-node-type="callout-emoji">ℹ</div>
    <div data-node-type="callout-text">
To streamline the ADR inclusion, the sample project offers a custom Asciidoc include directive that allows us to use globs in the include directive.
    </div>
</div>

## Conclusion

Using jQAssistant in combination with arc42 provides a powerful approach to verifying and documenting software architecture. By integrating architectural rules into your build process, you can ensure that your design principles are consistently followed, creating living documentation that reflects the current state of the system.

### Pros and Cons

**Pros:**

- **Automated Verification**: Automatically checks architectural compliance, reducing manual oversight.
- **Living Documentation**: Keeps documentation up-to-date with actual implementation.
- **Flexibility**: Highly customizable with plugins and custom rules.
- **Integration**: Easily integrates with existing CI/CD pipelines.

**Cons:**

- **Complex Setup**: Initial setup and learning curve can be steep.
- **Limited Language Support**: Primarily focused on Java ecosystems, but can be extended by plug-ins.
- **Maintenance Overhead**: Custom rules and documentation need regular maintenance as the system evolves.

### Comparison with Sonar and ArchUnit

**Sonar:**
- **Focus**: Primarily on code quality, bugs, and vulnerabilities.
- **Strengths**: Excellent for static code analysis and maintaining code hygiene.
- **Limitations**: Less focus on architectural rules and design validation.

**ArchUnit:**
- **Focus**: Primarily on enforcing architectural rules within Java code.
- **Strengths**: Easy to integrate with JUnit, making it a good fit for developers familiar with unit testing frameworks.
- **Limitations**: Less comprehensive in creating living documentation compared to jQAssistant.

In summary, while tools like Sonar and ArchUnit have their unique strengths, jQAssistant combined with arc42 excels in providing a comprehensive solution for both architectural verification and documentation. This makes it an invaluable tool for teams looking to maintain architectural integrity and keep documentation in sync with their codebase.

## Related links and reads

- [Git Repo Sample project](https://github.com/stmu-zuhlke/jqa-sample)
- [arc42](https://arc42.org/)
- [jQAssistant Manual](https://jqassistant.github.io/jqassistant/current/)
- [Neo4J + Cypher refference](https://neo4j.com/docs/)
- [Ports and Adapters Architecture](https://en.wikipedia.org/wiki/Hexagonal%5Farchitecture%5F(software))
- [Blog post @ uxitra](https://uxitra.de/2024/04/04/codestrukturanalyse-mit-jqassistant-teil-1/)
