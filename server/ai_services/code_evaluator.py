import os
import torch
import openai
from transformers import RobertaTokenizer, RobertaForSequenceClassification
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class CodeMetrics:
    complexity: float
    maintainability: float
    efficiency: float
    style_score: float

@dataclass
class CodeFeedback:
    score: float
    feedback: str
    metrics: CodeMetrics
    suggestions: List[str]
    code_snippets: List[Dict[str, str]]

class CodeEvaluator:
    def __init__(self):
        # Initialize OpenAI
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
        # Initialize CodeBERT
        self.tokenizer = RobertaTokenizer.from_pretrained('microsoft/codebert-base')
        self.model = RobertaForSequenceClassification.from_pretrained('microsoft/codebert-base')
        
        # Language-specific style guides
        self.style_guides = {
            'python': 'PEP 8',
            'javascript': 'Airbnb Style Guide',
            'java': 'Google Java Style Guide',
            'cpp': 'Google C++ Style Guide'
        }

    def evaluate_code(self, code: str, language: str) -> CodeFeedback:
        """Evaluate code submission using CodeBERT and GPT-4"""
        try:
            # Get code metrics
            metrics = self._analyze_code_metrics(code, language)
            
            # Generate detailed feedback using GPT-4
            feedback = self._generate_feedback(code, language, metrics)
            
            # Calculate overall score
            score = self._calculate_score(metrics, feedback)
            
            # Generate improvement suggestions
            suggestions = self._generate_suggestions(code, language, metrics)
            
            # Generate example code snippets
            code_snippets = self._generate_code_snippets(feedback, language)
            
            return CodeFeedback(
                score=score,
                feedback=feedback,
                metrics=metrics,
                suggestions=suggestions,
                code_snippets=code_snippets
            )

        except Exception as e:
            print(f"Error in evaluate_code: {str(e)}")
            raise

    def _analyze_code_metrics(self, code: str, language: str) -> CodeMetrics:
        """Analyze code metrics using CodeBERT"""
        try:
            # Tokenize code
            inputs = self.tokenizer(code, return_tensors='pt', truncation=True, max_length=512)
            
            # Get model outputs
            with torch.no_grad():
                outputs = self.model(**inputs)
            
            # Extract features from the model's hidden states
            features = outputs.hidden_states[-1].mean(dim=1)
            
            # Calculate metrics based on features
            complexity = torch.sigmoid(features[:, 0]).item()
            maintainability = torch.sigmoid(features[:, 1]).item()
            efficiency = torch.sigmoid(features[:, 2]).item()
            
            # Calculate style score based on language-specific rules
            style_score = self._check_code_style(code, language)
            
            return CodeMetrics(
                complexity=complexity,
                maintainability=maintainability,
                efficiency=efficiency,
                style_score=style_score
            )

        except Exception as e:
            print(f"Error in _analyze_code_metrics: {str(e)}")
            raise

    def _generate_feedback(self, code: str, language: str, metrics: CodeMetrics) -> str:
        """Generate detailed feedback using GPT-4"""
        try:
            prompt = f"""As an expert {language} developer, review this code and provide detailed feedback.
            Consider the following metrics:
            - Complexity: {metrics.complexity:.2f}
            - Maintainability: {metrics.maintainability:.2f}
            - Efficiency: {metrics.efficiency:.2f}
            - Style Score: {metrics.style_score:.2f}

            Code:
            ```{language}
            {code}
            ```

            Provide feedback on:
            1. Code structure and organization
            2. Algorithm efficiency
            3. Best practices and patterns
            4. Style guide compliance ({self.style_guides.get(language, 'standard conventions')})
            5. Potential improvements
            """

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert code reviewer providing detailed feedback."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"Error in _generate_feedback: {str(e)}")
            raise

    def _calculate_score(self, metrics: CodeMetrics, feedback: str) -> float:
        """Calculate overall score based on metrics and feedback"""
        try:
            # Weights for different components
            weights = {
                'complexity': 0.2,
                'maintainability': 0.3,
                'efficiency': 0.25,
                'style': 0.25
            }
            
            # Calculate weighted score
            score = (
                metrics.complexity * weights['complexity'] +
                metrics.maintainability * weights['maintainability'] +
                metrics.efficiency * weights['efficiency'] +
                metrics.style_score * weights['style']
            ) * 100
            
            return round(score, 2)

        except Exception as e:
            print(f"Error in _calculate_score: {str(e)}")
            raise

    def _check_code_style(self, code: str, language: str) -> float:
        """Check code style against language-specific guidelines"""
        try:
            prompt = f"""Rate this {language} code's style compliance with {self.style_guides.get(language, 'standard conventions')}.
            Return only a score between 0 and 1.

            Code:
            ```{language}
            {code}
            ```
            """

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a code style analyzer. Respond only with a score between 0 and 1."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0
            )

            return float(response.choices[0].message.content)

        except Exception as e:
            print(f"Error in _check_code_style: {str(e)}")
            return 0.5

    def _generate_suggestions(self, code: str, language: str, metrics: CodeMetrics) -> List[str]:
        """Generate improvement suggestions based on metrics"""
        try:
            prompt = f"""Based on these metrics:
            - Complexity: {metrics.complexity:.2f}
            - Maintainability: {metrics.maintainability:.2f}
            - Efficiency: {metrics.efficiency:.2f}
            - Style Score: {metrics.style_score:.2f}

            Provide 3-5 specific suggestions to improve this {language} code:
            ```{language}
            {code}
            ```
            """

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a code improvement advisor. Provide specific, actionable suggestions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )

            # Split suggestions into list
            suggestions = [s.strip() for s in response.choices[0].message.content.split('\n') if s.strip()]
            return suggestions

        except Exception as e:
            print(f"Error in _generate_suggestions: {str(e)}")
            return []

    def _generate_code_snippets(self, feedback: str, language: str) -> List[Dict[str, str]]:
        """Generate example code snippets based on feedback"""
        try:
            prompt = f"""Based on this feedback:
            {feedback}

            Generate 2-3 example code snippets in {language} that demonstrate best practices and improvements.
            Format each snippet with a title and description.
            """

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a code example generator. Provide educational code snippets."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )

            # Parse response into structured snippets
            snippets = []
            current_snippet = {}
            for line in response.choices[0].message.content.split('\n'):
                if line.startswith('Title:'):
                    if current_snippet:
                        snippets.append(current_snippet)
                    current_snippet = {'title': line[6:].strip()}
                elif line.startswith('Description:'):
                    current_snippet['description'] = line[12:].strip()
                elif '```' in line:
                    current_snippet['code'] = line.split('```')[1].strip()

            if current_snippet:
                snippets.append(current_snippet)

            return snippets

        except Exception as e:
            print(f"Error in _generate_code_snippets: {str(e)}")
            return []