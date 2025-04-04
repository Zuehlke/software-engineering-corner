---
title: Automated API tests with Gherkin increase efficiency and quality
domain: software-engineering-corner.hashnode.dev
tags: apis,bdd,testing,domain,tdd,automation
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1738135144630/ZHt3i_56w.avif?auto=format
publishAs: stma
hideFromHashnodeCommunity: false
---
Automated and continuous tests of web service interfaces detect discrepancies to specification at an early stage and can be resolved with less effort.
By using Gherkin, the test cases are simple to understand and to define.
This innovation reduces defects and leads to lower costs.

## Initial situation

A new, service-oriented financial platform offers several dozen web services to bidirectionally exchange financial data.
The web service specification is based on specialised data models to avoid dependencies to products or technologies.
The platform comprises a mixture of new, and modified existing web services.
The focus is on REST services with a JSON payload, specified using OpenAPI or OData.

The following diagram shows the initial situation:
![Initial situation with manual test setup](https://cdn.hashnode.com/res/hashnode/image/upload/v1738135447079/IQkkiyweH.png?auto=format)
*Initial situation with manual test setup*

Several service consumers call the web service interfaces provided by the service provider, the financial platform that is newly built.
The implementation of the interfaces is based on service specifications in OpenAPI/OData, based on the functional requirements of the services.
The service consumers expect a certain behaviour from the service provider when a service is called.
This includes data that is delivered in a specific format, or return values and error codes, depending on the request.
This expected behaviour is reflected in a service contract, which can be tested using contract-based/contract-driven testing.

This distributed system decouples the organisational units in terms of products, technologies and release cycles.
However, quality assurance is challenging, as the web services offered can only be invoked end-2-end via the consumer's systems or by complex, manual test requests.
These tests are therefore time-consuming, error-prone, only partially reproducible and difficult to document.
As key financial figures and reports are generated via the platform, it is important that the web services are implemented and integrated correctly.
If the platform generates incorrect results, the consequences may be severe - reputational damage, legal challenges, and even insolvency.

To test the interfaces and the behaviour of the system, the people involved in development use a REST client.
For services that only offer read or write operations, additional calls are made to other services to create the preconditions for the test or to verify the result.
The challenges here include the fact that business experts must also operate the REST client, that the users must have the correct security setup to authenticate the service calls and that several service calls are required for individual test cases, which must be made in the correct order and with consistent data.

## Optimisation of the development process

The primary goal is to find a solution to automatically test the web services provided and to document the test execution.
These tests should be able to be defined, interpreted and executed by business experts, developers and testers.
It should also be possible to use the documentation of the executed tests for audits.
This should ensure quality and reduce effort to execute the tests and to fix errors.
This in turn leads to greater efficiency within the organisation and the specialist capacities that are freed up can be used more effectively.

The following diagram shows the development process:
![Development process with information flow and Living Documentation extension for API Tests](https://cdn.hashnode.com/res/hashnode/image/upload/v1738239853878/7Ka7v-wqs.png?auto=format)
*Development process with information flow and Living Documentation extension for API Tests*

The requirements from the business analysis are transferred to development in various formats such as plain text, decision tables, flowcharts and verbal explanations.
During development, the service contracts are defined, and the services are implemented and tested.
The implementation is then verified together with the service contract and the tests executed are based on the requirements out of the business analysis.
This feedback goes back to the business analysis for verification.

### Challenges

One of the disadvantages of this development process is that it requires four transformation steps to bring the business requirements into a specification, to interpret the specification, to implement and verify it.
As the requirements change over time, these time-consuming and error-prone transformation steps take place several times per requirement and service.
Furthermore, it takes a long time before feedback about the quality of the implementation can be provided as an output of the manual tests.

### Optimisations

The additional living documentation in the form of feature files in Gherkin optimises the development process by providing early feedback to the BA.
Furthermore, these feature files are used for test automation, which reduces the manual testing effort and identifies discrepancies in the implementation more quickly.
This makes implementation and testing of the interfaces provided more efficient.

The development process can be further optimised by defining requirements directly in Gherkin.
With a machine-readable definition of business requirements, the transformation steps between BA and DEV are no longer necessary.
The Gherkin files are also used for test automation and as living documentation that documents and checks the current implementation of the system anytime.
This ensures a faster and less error-prone development process, which in turn increases efficiency.

## Living Documentation in Gherkin

To ensure that the tests can be defined and interpreted by business experts, developers and testers, the test scenarios are defined in Gherkin.
Gherkin is a text format to define the expected behaviour of a system, readable for machines and humans.
The Gherkin definitions are structured into features, scenarios and steps, whereby the steps are divided into Given-When-Then steps.
A complete reference of this language including the keywords with synonyms, step arguments, and language selectors can be found at [cucumber.io](https://cucumber.io/docs/gherkin/reference).

The following Gherkin elements are used in the examples below:

- `Feature` contains a high-level description and related scenarios.
- `Scenario` describes a use case or a business rule and consists of a list of steps.
- `Given` steps define one or more preconditions.
- `When` steps define one or more interactions with the system.
- `Then` steps define one or more postconditions, i.e. the expected behaviour of the system.
- `@` tag contains the technical name and the version of the API.

For an API test, the data required in the system and the data for the service request are defined in the Given step.
In the When step, the service operation to be called is defined, i.e. which URL with parameters and payload is called in a web service.
The Then step verifies the response from the service and optionally checks the status of the data in the system after the operation.

The following examples show how easily, and comprehensibly even more complex scenarios can be defined and executed.
The implementation of the individual steps can orchestrate several service operations and provide the final result for verification.
The generic step definitions for setting service request parameters or checking service response status codes are also shown.
These are implemented once and can be reused in scenarios for different services.
The request payload can be read from a file or can be generated dynamically, which means that even complex request structures with unique payloads can be generated.

### Example of a synchronous read-write service test

The following example shows scenarios to test synchronous read and write operations of a web service.
HTTP GET and POST requests are sent in the background and their results are checked.
To keep the test scenarios independent of the existing data in the system, the required test data is first created in the backend in the Given step.
The key attributes assigned by the backend when the data record is created are saved in the scenario and passed on transparently to the subsequent steps.
Data records created in the test run are automatically deleted after each scenario.

    @USER-V1
    Feature: User Service

      The user service provides CRUD operations to create, read, update,
      and delete users. A user is identified via attribute "username".

      Scenario: Get existing user.
        Given existing user
          | Firstname | Lastname | Email             |
          | John      | Doe      | john.doe@mail.com |
        When service operation getUser is executed
        Then service response status code is 200
        And user has values
          | Firstname | Lastname | Email             |
          | John      | Doe      | john.doe@mail.com |

      Scenario: Get non-existing user.
        Given username "XXXXXX"
        When service operation getUser is executed
        Then service response status code is 404

      Scenario: Create existing user.
        Given existing user
          | Firstname | Lastname | Email             |
          | John      | Doe      | john.doe@mail.com |
        When service operation createUser is executed
        Then service response status code is 409
*Example scenarios to test a synchronous read-write service*

### Example of a synchronous read-only service test

The following example shows scenarios to test synchronous operations of a read-only web service.
In the background, HTTP GET requests are sent and their results are checked.
To keep the test scenarios as independent as possible from the existing data in the system, only two already existing data records are assumed in the system.
The scenario to read a single data record sets the key attributes in the Given step to the key values of the first record and queries this data record again in the When step.
The Then step checks that the operation was successful and that the data record was returned with the correct key attributes.

    @BANKR-V1
    Feature: Bank Read Service

      The bank read OData service provides key information for banks, such as
      country, key, name, and SWIFT code. A bank is uniquely identified by a
      combined key of BankCountry and BankInternalID.

      Scenario: Get two banks.
        Given service request parameter $top with value 2
        When service operation getBanks is executed
        Then service response status code is 200
        And banks contain 2 entries with BankCountry and BankInternalID defined

      Scenario: Get existing bank.
        Given BankCountry and BankInternalID with value from first getBanks entity
        When service operation getBank is executed
        Then service response status code is 200
        And bank with BankCountry and BankInternalID

      Scenario: Get non-existing bank.
        Given BankCountry with value "XX" and BankInternalID with value "XXXX"
        When service operation getBank is executed
        Then service response status code is 404
*Example scenarios to test a synchronous read-only service*

### Example of an asynchronous write-only service test

The following example shows scenarios to test asynchronous operations of a write-only web service.
Several HTTP requests are orchestrated in the background.
First, a HTTP POST request is sent to initiate asynchronous request processing.
HTTP GET requests are then sent to a status endpoint until the asynchronous processing is complete.
The result of the processing is then requested and checked.

    @BANKSP-V1
    Feature: Bank Statement Post Service

      The bank statement post service enables us to upload bank statements.
      The service operations are asynchronous decoupled in middleware, offering
      a status operation to poll until service operation is completed.

      Scenario: Post bank statements.
        Given bank statements
          | Statement | Account               | Balance |
          | 191       | CH1234567890123456789 | 1234.56 |
          | 191       | CH1234567890123456789 | 2345.67 |
        When service operation postBankStatement is executed
        Then service response status code is 200
        And post bank statement status is "SUCCESS"
        And post bank statement response with BankStatementShortID defined

      Scenario: Post bank statements from file.
        Given bank statement file "camt-valid.xml"
        When service operation postBankStatement is executed
        Then service response status code is 200
        And post bank statement status is "SUCCESS"
        And post bank statement response with BankStatementShortID defined

      Scenario: Post invalid bank statement.
        Given bank statement file "camt-invalid.xml"
        When service operation postBankStatement is executed
        Then service response status code is 200
        And post bank statement status status is "ERROR"
        And post bank statement response with BankStatementShortID undefined
*Example scenarios to test an asynchronous write-only service*

## Automation of the API tests

The following diagram provides an overview of the implementation of the automated API tests:
![Implemented target state with automated API tests](https://cdn.hashnode.com/res/hashnode/image/upload/v1738137715383/NtHyADveZ.png?auto=format)
*Implemented target state with automated API tests*

The API tests simulate a service consumer and call the same service URLs using the same authentication mechanisms.
This ensures that the test behaviour is like the real implementation.
The test scenarios are read from the feature files in Gherkin at runtime.
The additional service calls used for pre- and post-conditions are also executed automatically.
The API tests with their test scenarios are accessible for various roles in the project and are also executed and logged on the build server.

Furthermore, the test data should be able to be designed dynamically to enable changes in fiscal year or accounting period, and to be able to generate unique business and technical keys such as invoice numbers or correlation identifiers dynamically for each test run.
In addition, the tests should be able to be executed against different system instances by configuring URLs, authentications, clients, or company codes accordingly.

### Technology chosen

SpecFlow is used to interpret the Gherkin specifications and to execute the Given-When-Then steps.
SpecFlow is the implementation of Cucumber for .NET, which contains the language parser for Gherkin.
Cucumber is the software that supports Behaviour-driven Development (BDD) and exists for various programming languages such as C++, Java, JavaScript, Phyton, Go, Rust, etc.
As .NET/C# was already used in service platform, the API tests were also realised on this technology stack.

Generated service clients are used to create the web service requests with dynamic payload.
The source information for the code generator is the OpenAPI specification.
C# interfaces and classes are generated from this, which map the service operations with their parameters as well as the request and response objects.
As the generated service models also contain information about mandatory attribute values, a valid request can be generated with little effort.
To be able to generate typed clients for OData services, the OData metadata in XML format is first converted into OpenAPI format.

For web services without an OpenAPI specification, the required classes for the service client are created manually, analogue to the generated ones.
Furthermore, test data can also be referenced in separate files in Gherkin, for example payment instructions in XML format or invoices in PDF format.
JSON and XML payloads, which are defined directly in Gherkin, are also supported.
This also allows invalid requests to be simulated, for example with incorrect attribute names or invalid data types for attribute values.
The callback methods of the generated clients are implemented in such a way that the parameters and payload of the generated request can be overwritten with other values if defined in the test case.

To ensure that the calls from the test client are as close as possible to the calls from real consumers, the same endpoints are called with the same authentication mechanisms.
To do this, the API test uses dedicated authentication secrets such as users and certificates to map these to the required authorisations.

### Test execution

The API tests can be executed in the development environment or on the build server.
Execution in the development environment gives the developer fast feedback about the implementation of the API tests and the web service.
A simplified development environment can also be made available to testers and business experts to execute test cases locally.
This reduces round trips by providing direct feedback on changed or newly created test cases or test data.
On the build server, the test cases can be triggered manually or executed automatically within a CI/CD pipeline or a nightly build.
The build server also offers a graphical presentation of the test results, either for a single test run or for a time history over several test runs.

### Test result evaluation

To analyse failed test cases, the available information is crucial.
For this reason, the executed service requests are recorded in detail in the test output containing HTTP method, complete URL, request headers, request content, response status code, response headers and response content.
For test cases in which a request is executed multiple times or with further requests in Given or Then steps, all requests are recorded with the same level of detail.
This makes it easy to verify the data of the steps before or after a request.
This allows developers and testers to trace the tests independently, adapt the implementation and restart the API tests themselves without knowing the details of the test implementation.

By regularly running the API tests in a nightly build, errors that occur without direct code changes can also be detected.
These include problems in the infrastructure, changed authorisations, expired certificates, long response times, etc.
Failed test cases can be converted to notifications, bugs or incidents to analyse them.

## Test Pyramid

The Test Pyramid is a metaphor to group tests of different granularity.
Feature-driven tests are well-known as system or end-2-end tests calling a web UI with Selenium.
In fact, these tests can be used at all levels of the test pyramid, as the following examples show:
![Feature-driven tests can be used for unit, integration, and system tests](https://cdn.hashnode.com/res/hashnode/image/upload/v1738268699930/rS4YbQNAl.png?auto=format)
*Feature-driven tests can be used for unit, integration, and system tests*

The automated API tests shown are system tests to test web-services end-2-end.
Such tests tempt to be used to test the entire functionality of a system.
This should be avoided, as system tests are more complex to create and to execute than integration or unit tests.
The test pyramid helps to categorise test cases using examples and gives a guidance which tests to implement at which level.

Business logic as an example could be verified isolated in a unit test, which is easy to create and provides fast feedback.
Feature-driven tests in Gherkin can also be used here to define the expected behaviour from a business perspective.
However, this does not mean that all unit tests should be defined in Gherkin.
It is an addition to classic tests and not a replacement.

If it’s not possible to test a feature isolated, an integration test could be used as an alternative.
Those tests are more complex than a unit test, but in general less complex than a system test.
Examples here could be to call a mocked API, to test the implementation of the API isolated. Also on this level, feature-driven or classic integration test can be used.

## Conclusion

The number of discrepancies found and the time saved show that the investment in the test cases and their automation has paid off.
The creation of detailed test cases, which verify not only the ‘happy case’ but also the behaviour in exceptional situations, makes differences between the implementation and the service specification visible.
For example, an incorrect HTTP response status or response content during business operations can lead to subsequent errors that require further analysis and intervention.
Furthermore, the service consumer can rely on this unspecified behaviour, which makes subsequent adaptation more complex or even impossible.
One positive surprise was how quickly business experts familiarised themselves with the Gherkin scenarios and were able to identify different interpretations of the technical specifications at first glance.

However, the effort needed for the initial implementation of the solution should not be underestimated.
The individual components of the solution, such as the structure of the test cases in Gherkin, reusable step definitions, their implementation with SpecFlow or the configuration of the code generator for the interfaces, each have their own complexity.
Subsequently integrating these components with each other so that the tests can be executed smoothly and reliably requires experience.

This change must also be integrated into the development process so that new test cases are consistently created for new services.
Analysing and resolving failed test cases also requires endurance, as the cause must first be analysed and then resolved.
An experienced, interdisciplinary team with knowledge of the business domain, the development, the technologies used, and the principles of test-driven and behaviour-driven development are very helpful at this point.
