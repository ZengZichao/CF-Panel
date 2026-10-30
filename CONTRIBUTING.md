# Contributing to CF-Panel

Thank you for your interest in contributing to CF-Panel! This document provides guidelines for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

Be respectful and constructive in all interactions. We follow standard open-source community guidelines.

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or pnpm 8+
- Git

### Setup

```bash
git clone https://github.com/cf-panel/cf-panel.git
cd cf-panel
npm install
npm run dev
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make changes** and test locally:
   ```bash
   npm run dev    # Hot-reload development
   npm run build  # Verify production build
   ```
4. **Commit** with clear messages:
   ```bash
   git commit -m "feat: add new CF type visualization"
   ```
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation
   - `refactor:` code refactoring
   - `test:` adding tests
   - `chore:` maintenance
5. **Push** and create a **Pull Request**

## Coding Standards

### TypeScript

- Strict mode enabled (`strict: true`)
- No `any` type unless unavoidable
- Use functional components + Hooks for React
- Use Zustand for state management

### CSS

- Use CSS variables for theming
- Support both dark and light themes
- No inline styles (use class names)

### i18n

- All user-facing strings must use the translation system
- Add translations in both English and Chinese
- Update `TranslationKey` interface when adding new keys

### File Organization

- Keep components small and focused
- One component per file
- Co-locate types with their usage

## Submitting Changes

### Pull Request Process

1. Ensure your code builds: `npm run build`
2. Update documentation if needed (both English and Chinese)
3. Create a PR with a clear description:
   - What changes were made
   - Why the changes were made
   - How to test the changes
4. Link any related issues

### PR Template

```markdown
## Description
[What does this PR do?]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other

## Testing
[How did you test this?]

## Checklist
- [ ] Code builds successfully
- [ ] Documentation updated (EN + ZH)
- [ ] No new TypeScript errors
```

## Reporting Bugs

Use the **Bug Report** issue template. Include:

1. CF-Panel version
2. Operating system
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots (if applicable)

## Feature Requests

Use the **Feature Request** issue template. Include:

1. Problem description
2. Proposed solution
3. Alternatives considered
4. Additional context

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
