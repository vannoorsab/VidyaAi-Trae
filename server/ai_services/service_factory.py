from typing import Dict, Any, Optional
from .text_evaluator import TextEvaluator
from .code_evaluator import CodeEvaluator
from .handwriting_recognizer import HandwritingRecognizer
from .audio_processor import AudioProcessor

class AIServiceFactory:
    _instance = None
    _services: Dict[str, Any] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIServiceFactory, cls).__new__(cls)
            cls._instance._initialize_services()
        return cls._instance

    def _initialize_services(self) -> None:
        """Initialize all AI services with proper error handling"""
        try:
            # Initialize text evaluation service
            self._services['text'] = TextEvaluator()
            print("✓ Text evaluation service initialized")

            # Initialize code evaluation service
            self._services['code'] = CodeEvaluator()
            print("✓ Code evaluation service initialized")

            # Initialize handwriting recognition service
            self._services['handwriting'] = HandwritingRecognizer()
            print("✓ Handwriting recognition service initialized")

            # Initialize audio processing service
            self._services['audio'] = AudioProcessor()
            print("✓ Audio processing service initialized")

        except Exception as e:
            print(f"Error initializing AI services: {str(e)}")
            raise

    def get_service(self, service_type: str) -> Optional[Any]:
        """Get an instance of the requested service"""
        if service_type not in self._services:
            raise ValueError(f"Unknown service type: {service_type}")
        return self._services[service_type]

    def evaluate_submission(self, submission_type: str, content: Any, **kwargs) -> Dict[str, Any]:
        """Evaluate a submission using the appropriate service"""
        try:
            if submission_type == 'text':
                service = self.get_service('text')
                result = service.evaluate_text(content, kwargs.get('subject'))

            elif submission_type == 'code':
                service = self.get_service('code')
                result = service.evaluate_code(content, kwargs.get('language'))

            elif submission_type == 'handwritten':
                # First recognize the handwriting
                hw_service = self.get_service('handwriting')
                recognition_result = hw_service.recognize_handwriting(
                    content,
                    kwargs.get('subject')
                )

                # Then evaluate the recognized text
                text_service = self.get_service('text')
                result = text_service.evaluate_text(
                    recognition_result.text,
                    kwargs.get('subject')
                )
                result['recognition_confidence'] = recognition_result.confidence

            elif submission_type == 'voice':
                # First transcribe the audio
                audio_service = self.get_service('audio')
                transcription_result = audio_service.transcribe_audio(content)

                # Then evaluate the transcribed text
                text_service = self.get_service('text')
                result = text_service.evaluate_text(
                    transcription_result.text,
                    kwargs.get('subject')
                )
                result['transcription_confidence'] = transcription_result.confidence

            else:
                raise ValueError(f"Unsupported submission type: {submission_type}")

            return result

        except Exception as e:
            print(f"Error evaluating {submission_type} submission: {str(e)}")
            raise

    def generate_audio_feedback(
        self,
        feedback: str,
        language: str = 'en',
        voice_type: str = 'neutral'
    ) -> Dict[str, Any]:
        """Generate audio feedback in the specified language"""
        try:
            # First translate the feedback if needed
            if language != 'en':
                text_service = self.get_service('text')
                feedback = text_service.translate_feedback(feedback, language)

            # Then generate audio
            audio_service = self.get_service('audio')
            result = audio_service.generate_feedback_audio(
                text=feedback,
                language=language,
                voice_type=voice_type
            )

            return {
                'audio_path': result.audio_path,
                'duration': result.duration,
                'metadata': result.metadata
            }

        except Exception as e:
            print(f"Error generating audio feedback: {str(e)}")
            raise

    def explain_feedback(
        self,
        submission_type: str,
        original_content: Any,
        feedback: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate an explanation for the provided feedback"""
        try:
            if submission_type == 'text':
                service = self.get_service('text')
                explanation = service._generate_explanation(original_content, feedback)

            elif submission_type == 'code':
                service = self.get_service('code')
                explanation = service._generate_code_snippets(feedback, kwargs.get('language'))

            else:
                # For other types, use text service as fallback
                service = self.get_service('text')
                explanation = service._generate_explanation(original_content, feedback)

            return {
                'explanation': explanation,
                'type': submission_type
            }

        except Exception as e:
            print(f"Error generating explanation: {str(e)}")
            raise

    def health_check(self) -> Dict[str, bool]:
        """Check the health status of all services"""
        status = {}
        for service_name in self._services:
            try:
                service = self.get_service(service_name)
                # Perform a basic operation to verify service is working
                if service_name == 'text':
                    service.get_confidence_score('Test')
                elif service_name == 'code':
                    service._check_code_style('print("test")', 'python')
                elif service_name == 'handwriting':
                    service.preprocessing_params is not None
                elif service_name == 'audio':
                    service.get_available_voices()
                status[service_name] = True
            except Exception as e:
                print(f"Health check failed for {service_name}: {str(e)}")
                status[service_name] = False
        return status

# Create a global instance
ai_service_factory = AIServiceFactory()