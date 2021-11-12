# Changeset Releaser

A tool for Changesets-powered monorepos for incremental building and testing changed and related packages in the CI.

## Installation

Assuming you already have a monorepo using Yarn Workspaces and Atlassian Changesets.

In the monorepo root directory, run the following command:

```
yarn add -WD changeset-releaser
```

## Usage

Add changesets as you would normally do using Atlassian Changesets:

```
yarn changeset
```

### Building

To build the packages use the following command:

```
yarn changeset-releaser build
```

It will build the following packages:

- changed packages
- their dependencies
- packages that need to be tested (see below)
- their dependencies

### Testing

To test the packages use the following command:

```
yarn changeset-releaser test
```

It will test the following packages:

- changed packages
- packages that depend on the changed packages

### Linting

To lint the packages use the following command:

```
yarn changeset-releaser lint
```

It will lint the changed packages.
