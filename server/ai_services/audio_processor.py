import os
import torch
import whisper
from elevenlabs import generate, save, voices
from typing import Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path

@dataclass
class TranscriptionResult:
    text: str
    confidence: float
    language: str
    segments: list
    word_timestamps: Optional[list] = None

@dataclass
class AudioGenerationResult:
    audio_path: str
    duration: float
    voice_id: str
    metadata: Dict[str, Any]

class AudioProcessor:
    def __init__(self):
        # Initialize Whisper model
        self.model = whisper.load_model("medium")
        
        # Configure ElevenLabs
        self.eleven_api_key = os.getenv('ELEVEN_LABS_API_KEY')
        
        # Cache directory for audio files
        self.cache_dir = Path('audio_cache')
        self.cache_dir.mkdir(exist_ok=True)
        
        # Available voices for different use cases
        self.voice_profiles = {
            'teacher': 'Antoni',  # Professional, authoritative voice
            'friendly': 'Bella',  # Warm, encouraging voice
            'neutral': 'Sam'      # Clear, neutral voice
        }

    def transcribe_audio(self, audio_path: str, task: str = None) -> TranscriptionResult:
        """Transcribe audio using Whisper"""
        try:
            # Load audio file
            audio = whisper.load_audio(audio_path)
            
            # Detect language
            detection = self.model.detect_language(audio)
            detected_language = detection[0]

            # Transcribe with word-level timestamps if needed
            transcribe_options = {
                'task': task or 'transcribe',
                'language': detected_language,
                'word_timestamps': True
            }

            result = self.model.transcribe(audio, **transcribe_options)

            # Calculate confidence scores
            segment_confidences = [segment.get('confidence', 0) for segment in result['segments']]
            avg_confidence = sum(segment_confidences) / len(segment_confidences) if segment_confidences else 0

            return TranscriptionResult(
                text=result['text'],
                confidence=avg_confidence,
                language=detected_language,
                segments=result['segments'],
                word_timestamps=result.get('word_timestamps')
            )

        except Exception as e:
            print(f"Error in transcribe_audio: {str(e)}")
            raise

    def generate_feedback_audio(
        self,
        text: str,
        voice_type: str = 'neutral',
        language: str = 'en',
        emotion: str = None
    ) -> AudioGenerationResult:
        """Generate audio feedback using ElevenLabs"""
        try:
            # Select appropriate voice
            voice_id = self.voice_profiles.get(voice_type, self.voice_profiles['neutral'])
            
            # Prepare text for specific language and emotion
            prepared_text = self._prepare_text_for_tts(text, language, emotion)
            
            # Generate audio
            audio = generate(
                text=prepared_text,
                voice=voice_id,
                model="eleven_monolingual_v1"
            )

            # Generate unique filename
            filename = f"feedback_{hash(prepared_text)}_{voice_type}.mp3"
            filepath = self.cache_dir / filename
            
            # Save audio file
            save(audio, str(filepath))
            
            # Get audio metadata
            metadata = {
                'language': language,
                'voice_type': voice_type,
                'emotion': emotion,
                'text_length': len(prepared_text),
                'timestamp': str(filepath.stat().st_mtime)
            }

            return AudioGenerationResult(
                audio_path=str(filepath),
                duration=self._get_audio_duration(filepath),
                voice_id=voice_id,
                metadata=metadata
            )

        except Exception as e:
            print(f"Error in generate_feedback_audio: {str(e)}")
            raise

    def _prepare_text_for_tts(
        self,
        text: str,
        language: str,
        emotion: str = None
    ) -> str:
        """Prepare text for text-to-speech conversion"""
        try:
            # Clean text
            text = text.strip()
            
            # Add emotional context if specified
            if emotion:
                emotion_markers = {
                    'encouraging': '[Encouraging tone] ',
                    'professional': '[Professional tone] ',
                    'friendly': '[Friendly tone] ',
                    'concerned': '[Concerned tone] '
                }
                text = emotion_markers.get(emotion, '') + text

            # Add language-specific markers if needed
            if language != 'en':
                text = f"[{language.upper()}] {text}"

            return text

        except Exception as e:
            print(f"Error in _prepare_text_for_tts: {str(e)}")
            return text

    def _get_audio_duration(self, audio_path: Path) -> float:
        """Get duration of generated audio file"""
        try:
            import wave
            with wave.open(str(audio_path), 'rb') as audio_file:
                frames = audio_file.getnframes()
                rate = audio_file.getframerate()
                duration = frames / float(rate)
                return duration

        except Exception as e:
            print(f"Error in _get_audio_duration: {str(e)}")
            return 0.0

    def clean_cache(self, max_age_hours: int = 24) -> None:
        """Clean old audio files from cache"""
        try:
            import time
            current_time = time.time()
            
            for audio_file in self.cache_dir.glob('*.mp3'):
                file_age = current_time - audio_file.stat().st_mtime
                if file_age > (max_age_hours * 3600):
                    audio_file.unlink()

        except Exception as e:
            print(f"Error in clean_cache: {str(e)}")

    def get_available_voices(self) -> Dict[str, str]:
        """Get list of available voices and their characteristics"""
        try:
            available_voices = voices()
            voice_info = {}
            
            for voice in available_voices:
                voice_info[voice.name] = {
                    'id': voice.voice_id,
                    'category': voice.category,
                    'description': voice.description
                }
            
            return voice_info

        except Exception as e:
            print(f"Error in get_available_voices: {str(e)}")
            return {}

    def optimize_audio(self, audio_path: str) -> None:
        """Optimize audio for better transcription results"""
        try:
            import librosa
            import soundfile as sf

            # Load audio
            y, sr = librosa.load(audio_path)

            # Noise reduction
            y_clean = librosa.effects.preemphasis(y)

            # Normalize audio
            y_normalized = librosa.util.normalize(y_clean)

            # Save optimized audio
            optimized_path = str(Path(audio_path).with_suffix('.optimized.wav'))
            sf.write(optimized_path, y_normalized, sr)

            # Replace original file
            os.replace(optimized_path, audio_path)

        except Exception as e:
            print(f"Error in optimize_audio: {str(e)}")