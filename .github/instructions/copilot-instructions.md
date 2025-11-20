# Copilot Instructions for Better Prompts and Code Generation

## General Guidelines
- Write clear, concise, and maintainable code.
- Prefer explicitness over implicitness.
- Use descriptive variable and function names.
- Add comments for complex logic or non-obvious decisions.
- Follow the project's existing code style and conventions.
- Avoid unnecessary dependencies; use standard libraries when possible.
- Write code that is easy to test and debug.

## TypeScript/JavaScript
- Use `const` and `let` instead of `var`.
- Prefer arrow functions for callbacks and short functions.
- Use async/await for asynchronous code.
- Always handle errors and edge cases.
- Prefer strict typing and interfaces in TypeScript.

## Node.js
- Use built-in modules when possible.
- Handle asynchronous operations with Promises or async/await.
- Validate all external input.

## Documentation
- Add JSDoc/TSDoc comments for exported functions and classes.
- Document assumptions and side effects.

## Testing
- Write unit tests for new features and bug fixes.
- Use mocks/stubs for external dependencies in tests.
- Use jest as the preferred testing framework.

## Domain Knowledge (OpenTofu Pipeline Task)
- Follow best practices for Azure DevOps pipeline tasks.
- Ensure compatibility with both Windows, Linux and MacOS agents.
- Validate all user inputs and provide helpful error messages.
- Log important actions and errors for troubleshooting.
- Support idempotent operations where possible.

## Prompting Copilot
- When asking Copilot to generate code, specify the language, context, and any relevant file or function names.
- Provide examples of expected input and output if possible.
- State any performance, security, or compatibility requirements.
- Ask for tests or documentation if needed.
