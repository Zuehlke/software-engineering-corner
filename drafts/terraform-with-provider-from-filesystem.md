---
title: Configuring Terraform to obtain a provider from the local filesystem
domain: software-engineering-corner.hashnode.dev
tags: [terraform, windows, cicd, ci, cd, iac]
cover: https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbTjXYU%2Fbtq9e6SzhlK%2F1kOCYlRDgqPl3qF5qoQQNk%2Fimg.png
publishAs: immohuneke
saveAsDraft: true
hideFromHashnodeCommunity: false
---

# Configuring Terraform to obtain a provider from the local filesystem

You may be developing your own Terraform provider and
need to test it before releasing it via the artifact repository.
Or you may be in an environment where it's a laboriously slow
process to deploy a custom provider into the local repository
mirror (such as Nexus or Artifactory).

In a recent project, my team needed to develop a Terraform
provider for the Gravitee API Gateway and API management portal.
The workaround was to source the provider from the developer's
file system - but a few technical obstacles were encountered
along the way!
This is how we overcame them.

## Problem

When running `terraform init ...` you consistently encounter
error messages telling you that the custom provider cannot be
found in any of the searched repository locations.
```
│ Error: Failed to query available provider packages
│
│ Could not retrieve the list of available versions for provider custom/gravitee: provider registry.terraform.io/custom/gravitee was not found in any of the search locations
│
│ - provider mirror at https://<artifactory host>/artifactory/api/terraform/<virtual repo>/providers/

```

This stops you from initialising the terraform root properly
and therefore you can't execute `terraform plan`
or `terraform apply`.

## Terraform CLI configuration

First of all, you need to make sure that the CLI is correctly
configured.
One of the settings in the CLI configuration tells the `terraform`
executable where to go looking for providers.

As [documented by Hashicorp](
https://developer.hashicorp.com/terraform/cli/config/config-file), 
you can (if necessary) override the standard search locations
for providers.
The easiest way to find out the settings required is to navigate
to the provider you require in your Terraform project,
and (in Artifactory at least) click "Set me up" in the top right
corner.

Under Windows, our team discovered that the CLI configuration
file absolutely must be named `%APPDATA%\terraform.rc`.
The environment variable `TF_CLI_CONFIG_FILE`, which is meant
to allow you to nominate a different location,
just caused obscure errors under Windows.
Your mileage may vary.

The standard "Set me up" configuration redirects all requests
that would normally go to `registry.terraform.io` to the local
network mirror server.
It typically looks a bit like this:
```
provider_installation {
  direct {
    exclude = ["registry.terraform.io/*/*"]
  }
  network_mirror {
    url = "https://<artifactory host>/artifactory/api/terraform/<virtual repo name>/providers/"
  }
}
```

## Adding a provider from the file system

The documentation is a little hazy on this subject,
so I'm indebted to [this post on StackOverflow](
https://stackoverflow.com/questions/70320229/how-can-i-use-2-providers-in-the-same-terraform-config)
for useful clues.
1. Build or obtain a copy of the provider (in this case,
   the file name was `terraform-provider-gravitee.exe`
   and we wanted to give it the namespace `custom`)
2. Create the following folder and store the executable provider there:
   `%APPDATA%\registry.terraform.io\custom\gravitee\0.0.1\windows_amd64`
   * this mimics the repository layout that Terraform
   expects for providers
   * it may be safer to copy the file there than to move it, otherwise
   your virus protection might prevent the executable from running
3. Add code to the file `%APPDATA%\terraform.rc` as follows,
   making sure to use forward slashes only and substituting
   * your own user ID (in two places);
   * the correct artifact repository host FQDN;
   * the correct virtual repository name (repository key in
     Artifactory parlance)

   Don't omit the additions to the `include` and `exclude` values.
   ```
   provider_installation {
     dev_overrides {
       "custom/gravitee" = "C:/Users/<user>/AppData/Roaming/registry.terraform.io/custom/gravitee/0.0.1/windows_amd64"
     }
     direct {
       exclude = ["registry.terraform.io/*/*","custom/gravitee"]
     }
     filesystem_mirror {
       path    = "C:/Users/<user>/AppData/Roaming"
       include = ["custom/gravitee"]
     }
     network_mirror {
       url     = "https://<artifactory host>/artifactory/api/terraform/<virtual repo name>/providers/"
       include = ["registry.terraform.io/*/*"]
       exclude = ["custom/gravitee"]
     }
   }
   ```
4.	Delete any existing `.terraform` folder and `.terraform.lock.hcl` file from the Terraform root folder
5.	Run `terraform init -backend-config .\.vars\<local config file>` - ignore warnings about the provider override
6.	Run `terraform plan -var-file .\.vars\<local variable values file>` - ignore warnings about the provider override

## Deploying the custom provider

In order to run your Terraform project within the build and
deploy (CI/CD) pipeline, 

When your provider is ready to go into the artifact repository
(and when your artifact repository is ready to host it)
you can delete the added lines from the CLI configuration file.

[This StackOverflow answer](
https://stackoverflow.com/questions/76154495/using-artifactory-as-terraform-registry-for-custom-provider)
shows how to structure the artifact repositories in order
to be able to deploy your own providers.

[JFrog's own documentation](
https://jfrog.com/help/r/jfrog-artifactory-documentation/deploy-terraform-providers)
explains how to structure the
repository layout for a provider and how to deploy a
provider to the repository.
You'll probably need to cater for a number of different
operating systems and processor architectures.

## Possible Gotchas

When you come to switch back to the provider available from your
artifact repo, make sure that you completely reinitialise terraform.
Delete any existing `.terraform` folder and `.terraform.lock.hcl` from
the Terraform root and rerun
`terraform init -backend-config .\.vars\<local config file>`.
Unless you do this, you may find that you get an out-of-date provider
in your build, which Terraform will have retrieved from its provider
cache.

I hope this helps someone to cut to the chase more quickly than
I was able to!
