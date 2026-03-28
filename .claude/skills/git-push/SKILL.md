---
name: git push
description: A skill that helps users quickly commit and push git changes, triggered when the user initiates a git commit/push.
---

## Execution Process
1. First, execute `git pull` to fetch remote updates and check for conflicts. If conflicts exist, prompt the user to resolve them before proceeding with subsequent operations.
2. Execute `git status` to check all uncommitted changes.
3. Execute `git add` to add changes to the staging area.
4. Generate a compliant commit message based on the specification below, and execute `git commit` to commit the changes.
5. Execute `git push` to push the changes to the remote repository.

## Commit Message Specification
Please strictly follow the Conventional Commits specification to generate exactly one commit message. You need to use `git diff --staged` to view the changes in the staging area and generate a compliant message based on the content. The message must satisfy all the following rules:
1. Must include `type` and `scope` in a fixed format.
2. Format: `type(scope): <concise and accurate summary of the changes>`
3. `type` must be one of the following standard Conventional Commits types:
   - feat: New feature
   - fix: Bug fix
   - hotfix: Production hotfix
   - refactor: Code refactoring (does not affect functionality)
   - test: Test-related changes (adding / modifying test cases)
   - docs: Documentation changes (README, comments, documentation, etc.)
   - chore: Build process or tool changes (dependency updates, scripts, configurations, etc.)
4. `scope` must be provided and named based on the actual module being modified (e.g., login, order, pay, etc.). It cannot be omitted or use generic terms like `misc`, `all`, etc.
5. Use English half-width characters. The parentheses `()` must be present.
6. The description must summarize the core changes. Listing changes individually or using "and / & / etc." is prohibited.
7. Do not output multiple lines, explanations, code blocks, or any prefix/suffix text. Output only the final commit message.
8. If a reasonable scope or intent cannot be determined from the context, make a reasonable inference based on the primary changes rather than using a vague description.
9. Keep the message under 50 characters to avoid overly long commit messages.
10. Must be written in English.
