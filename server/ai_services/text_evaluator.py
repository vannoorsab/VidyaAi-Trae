import os
import json
import openai
import torch
from transformers import MarianMTModel, MarianTokenizer
from elevenlabs import generate, save
from lime.lime_text import LimeTextExplainer

class TextEvaluator:
    def __init__(self):
        # Initialize OpenAI
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
        # Initialize translation models
        self.translation_models = {}
        self.translation_tokenizers = {}
        self.supported_languages = ['ta', 'hi', 'te']  # Tamil, Hindi, Telugu
        
        for lang in self.supported_languages:
            model_name = f'Helsinki-NLP/opus-mt-en-{lang}'
            self.translation_models[lang] = MarianMTModel.from_pretrained(model_name)
            self.translation_tokenizers[lang] = MarianTokenizer.from_pretrained(model_name)

        # Initialize LIME explainer
        self.explainer = LimeTextExplainer(class_names=['poor', 'fair', 'good', 'excellent'])

    def evaluate_text(self, text, subject):
        """Evaluate text submission using GPT-4"""
        try:
            # Prepare the prompt for evaluation
            prompt = f"""As an expert {subject} teacher, evaluate the following student response. 
            Provide a detailed assessment including:
            1. Score (0-100)
            2. Strengths
            3. Areas for improvement
            4. Specific suggestions

            Student's response:
            {text}
            """

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert teacher providing detailed feedback."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )

            # Extract and structure the feedback
            feedback = response.choices[0].message.content
            
            # Generate explanation using LIME
            explanation = self._generate_explanation(text, feedback)

            return {
                'feedback': feedback,
                'explanation': explanation,
                'confidence': response.choices[0].finish_reason == 'stop'
            }

        except Exception as e:
            print(f"Error in evaluate_text: {str(e)}")
            raise

    def translate_feedback(self, feedback, target_language):
        """Translate feedback to target language"""
        try:
            if target_language not in self.supported_languages:
                raise ValueError(f"Unsupported language: {target_language}")

            model = self.translation_models[target_language]
            tokenizer = self.translation_tokenizers[target_language]

            # Tokenize and translate
            inputs = tokenizer(feedback, return_tensors="pt", padding=True, truncation=True)
            translated = model.generate(**inputs)
            translated_text = tokenizer.decode(translated[0], skip_special_tokens=True)

            return translated_text

        except Exception as e:
            print(f"Error in translate_feedback: {str(e)}")
            raise

    def generate_audio_feedback(self, feedback, voice_id='default'):
        """Generate audio version of feedback using ElevenLabs"""
        try:
            audio = generate(
                text=feedback,
                voice=voice_id,
                model="eleven_monolingual_v1"
            )

            # Generate unique filename
            filename = f"feedback_{hash(feedback)}.mp3"
            filepath = os.path.join('audio_cache', filename)
            
            # Save audio file
            save(audio, filepath)
            
            return filepath

        except Exception as e:
            print(f"Error in generate_audio_feedback: {str(e)}")
            raise

    def _generate_explanation(self, text, feedback):
        """Generate explanation for the feedback using LIME"""
        try:
            # Define prediction function for LIME
            def predictor(texts):
                # Simplified scoring based on feedback sentiment
                scores = []
                for t in texts:
                    response = openai.ChatCompletion.create(
                        model="gpt-4",
                        messages=[
                            {"role": "system", "content": "Rate the following text on a scale of 0-3 (0=poor, 1=fair, 2=good, 3=excellent). Return only the number."},
                            {"role": "user", "content": t}
                        ],
                        temperature=0
                    )
                    score = int(response.choices[0].message.content)
                    scores.append([1 if i == score else 0 for i in range(4)])
                return numpy.array(scores)

            # Generate explanation
            exp = self.explainer.explain_instance(
                text,
                predictor,
                num_features=6,
                num_samples=100
            )

            # Format explanation
            explanation = {
                'important_phrases': [],
                'impact_scores': []
            }

            for feat, score in exp.as_list():
                explanation['important_phrases'].append(feat)
                explanation['impact_scores'].append(float(score))

            return explanation

        except Exception as e:
            print(f"Error in _generate_explanation: {str(e)}")
            return None

    def get_confidence_score(self, feedback):
        """Calculate confidence score for the feedback"""
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Rate the confidence level of this feedback on a scale of 0-1. Consider factors like specificity, relevance, and actionability. Return only the number."},
                    {"role": "user", "content": feedback}
                ],
                temperature=0
            )
            
            return float(response.choices[0].message.content)

        except Exception as e:
            print(f"Error in get_confidence_score: {str(e)}")
            return 0.5  # Default confidence score