# OpenTofu Pipeline Task

This repository contains a custom Azure Pipelines task for installing [OpenTofu](https://opentofu.org/) CLI.

[![Build Status](https://dev.azure.com/jasonwhalley/opentofu/_apis/build/status%2FJasonWhall.opentofu-pipeline-task?branchName=main)](https://dev.azure.com/jasonwhalley/opentofu/_build/latest?definitionId=40&branchName=main)

## Usage

```yaml
- task: UseOpenTofu@0
  inputs:
    version: latest # Specify the OpenTofu version to install

- script: tofu version
```

See [docs.md](docs.md) for usage instructions.

## Contributing

Please raise a GitHub issue for any bugs or feature requests before submitting a pull request. Contributions are welcome!