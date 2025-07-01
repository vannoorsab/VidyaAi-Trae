# Contributing to VidyAI

## Welcome!

Thank you for considering contributing to VidyAI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Use welcoming and inclusive language
- Be collaborative
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

- A clear and descriptive title
- Exact steps to reproduce the problem
- Expected behavior vs actual behavior
- Screenshots if applicable
- Your environment details
- Any relevant logs

### Suggesting Enhancements

When suggesting enhancements:

- Use a clear and descriptive title
- Provide a detailed description of the proposed feature
- Explain why this enhancement would be useful
- Include mockups or examples if possible

### Pull Requests

1. Fork the repository
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Run tests:
   ```bash
   # Frontend tests
   cd client
   npm run test

   # Backend tests
   cd server
   npm run test

   # AI service tests
   cd server/ai_services
   pytest
   ```
5. Commit your changes:
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. Create a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.9+
- Docker Desktop
- Git

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vidyai.git
   cd vidyai
   ```

2. Install dependencies:
   ```bash
   # Frontend
   cd client
   npm install

   # Backend
   cd ../server
   npm install

   # AI Services
   cd ai_services
   python -m venv venv
   source venv/bin/activate  # or .\venv\Scripts\Activate on Windows
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start development servers:
   ```bash
   # Frontend
   npm run dev

   # Backend
   npm run dev

   # AI Services
   python main.py
   ```

## Coding Guidelines

### General

- Write clear, readable, and maintainable code
- Follow existing code style and conventions
- Add comments for complex logic
- Update documentation when necessary

### JavaScript/TypeScript

- Follow ESLint configuration
- Use TypeScript for new components
- Write functional components with hooks
- Add PropTypes or TypeScript interfaces
- Follow React best practices

### Python

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions and classes
- Follow SOLID principles
- Add unit tests for new features

### Git Commit Messages

Follow the Conventional Commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance tasks

Example:
```
feat(auth): add OAuth2 authentication support

Implement OAuth2 authentication using Firebase.
Add necessary middleware and routes.

Closes #123
```

## Testing Guidelines

### Frontend Tests

- Write unit tests for components
- Add integration tests for complex features
- Test accessibility compliance
- Ensure responsive design tests

Example:
```javascript
describe('SubmitWork Component', () => {
  it('should handle file upload correctly', () => {
    // Test implementation
  });

  it('should display validation errors', () => {
    // Test implementation
  });
});
```

### Backend Tests

- Write unit tests for services
- Add integration tests for APIs
- Test error handling
- Validate input/output

Example:
```javascript
describe('Authentication Service', () => {
  it('should validate user credentials', async () => {
    // Test implementation
  });

  it('should handle invalid tokens', async () => {
    // Test implementation
  });
});
```

### AI Service Tests

- Test model accuracy
- Validate processing pipeline
- Check error handling
- Test performance metrics

Example:
```python
def test_text_evaluation():
    evaluator = TextEvaluator()
    result = evaluator.evaluate("sample text")
    assert result.score >= 0 and result.score <= 100
    assert len(result.feedback) > 0
```

## Documentation Guidelines

### Code Documentation

- Add JSDoc comments for JavaScript/TypeScript
- Write clear Python docstrings
- Document complex algorithms
- Explain configuration options

### API Documentation

- Document all endpoints
- Include request/response examples
- List error codes
- Provide authentication details

### User Documentation

- Keep README.md updated
- Add setup instructions
- Include troubleshooting guides
- Provide usage examples

## Review Process

### Pull Request Review

1. Automated checks must pass
2. Code review by maintainers
3. Documentation review
4. Testing verification
5. Final approval

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Commits follow conventions
- [ ] No security vulnerabilities
- [ ] Performance impact considered

## Getting Help

- Check existing documentation
- Search closed issues
- Join Discord community
- Contact maintainers

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Recognized in project documentation

Thank you for contributing to VidyAI! 🎉