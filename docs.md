# OpenTofu Installer Task

This task installs OpenTofu on the agent and sets up the environment for subsequent tasks.

## Usage

To use the OpenTofu Installer Task in your Azure DevOps pipeline, add the following YAML snippet to your pipeline configuration:

```yaml
- task: UseOpenTofu@0
  inputs:
    version: latest

- script: tofu version
  displayName: Check OpenTofu Version
```

## Inputs

| Name    | Description                                                                                                 | Required | Default |
| ------- | ----------------------------------------------------------------------------------------------------------- | -------- | ------- |
| version | The version of OpenTofu to install. Can be `latest` (Default), a specific version `1.10.0` or a range `1.x` | Yes      | latest  |
