import os
import cv2
import numpy as np
import pytesseract
from PIL import Image
from typing import Dict, Any, Tuple
from dataclasses import dataclass

@dataclass
class RecognitionResult:
    text: str
    confidence: float
    preprocessed_image_path: str
    debug_info: Dict[str, Any]

class HandwritingRecognizer:
    def __init__(self):
        # Set Tesseract path if not in system PATH
        if os.name == 'nt':  # Windows
            pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

        # Configure Tesseract parameters
        self.custom_config = r'--oem 3 --psm 6'
        
        # Initialize preprocessing parameters
        self.preprocessing_params = {
            'blur_kernel': (5, 5),
            'threshold_block_size': 11,
            'threshold_c': 2,
            'noise_kernel': (1, 1),
            'dilation_kernel': (2, 2)
        }

    def recognize_handwriting(self, image_path: str, subject: str = None) -> RecognitionResult:
        """Recognize handwritten text from an image"""
        try:
            # Read and preprocess image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image at {image_path}")

            # Preprocess image
            preprocessed_image, debug_info = self._preprocess_image(image)
            
            # Save preprocessed image for debugging
            debug_image_path = self._save_debug_image(preprocessed_image, image_path)

            # Perform OCR
            text = pytesseract.image_to_string(
                Image.fromarray(preprocessed_image),
                config=self.custom_config
            )

            # Get confidence scores
            confidence_data = pytesseract.image_to_data(
                Image.fromarray(preprocessed_image),
                config=self.custom_config,
                output_type=pytesseract.Output.DICT
            )

            # Calculate average confidence
            confidences = [float(conf) for conf in confidence_data['conf'] if conf != '-1']
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            # Apply subject-specific post-processing if needed
            if subject:
                text = self._post_process_text(text, subject)

            return RecognitionResult(
                text=text,
                confidence=avg_confidence / 100,  # Normalize to 0-1
                preprocessed_image_path=debug_image_path,
                debug_info=debug_info
            )

        except Exception as e:
            print(f"Error in recognize_handwriting: {str(e)}")
            raise

    def _preprocess_image(self, image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Apply various preprocessing techniques to improve OCR accuracy"""
        debug_info = {}
        
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            debug_info['grayscale_mean'] = gray.mean()

            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(
                gray,
                self.preprocessing_params['blur_kernel'],
                0
            )
            debug_info['blur_applied'] = True

            # Apply adaptive thresholding
            threshold = cv2.adaptiveThreshold(
                blurred,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV,
                self.preprocessing_params['threshold_block_size'],
                self.preprocessing_params['threshold_c']
            )
            debug_info['threshold_applied'] = True

            # Remove noise
            kernel = np.ones(
                self.preprocessing_params['noise_kernel'],
                np.uint8
            )
            opening = cv2.morphologyEx(threshold, cv2.MORPH_OPEN, kernel)
            debug_info['noise_removed'] = True

            # Dilate to connect text components
            kernel = np.ones(
                self.preprocessing_params['dilation_kernel'],
                np.uint8
            )
            dilated = cv2.dilate(opening, kernel, iterations=1)
            debug_info['dilation_applied'] = True

            # Invert back to black text on white background
            final = cv2.bitwise_not(dilated)
            debug_info['preprocessing_complete'] = True

            return final, debug_info

        except Exception as e:
            print(f"Error in _preprocess_image: {str(e)}")
            debug_info['error'] = str(e)
            raise

    def _save_debug_image(self, image: np.ndarray, original_path: str) -> str:
        """Save preprocessed image for debugging"""
        try:
            # Create debug directory if it doesn't exist
            debug_dir = os.path.join(os.path.dirname(original_path), 'debug')
            os.makedirs(debug_dir, exist_ok=True)

            # Generate debug image path
            filename = os.path.basename(original_path)
            debug_path = os.path.join(debug_dir, f'preprocessed_{filename}')

            # Save image
            cv2.imwrite(debug_path, image)
            return debug_path

        except Exception as e:
            print(f"Error in _save_debug_image: {str(e)}")
            raise

    def _post_process_text(self, text: str, subject: str) -> str:
        """Apply subject-specific post-processing to the recognized text"""
        try:
            # Remove extra whitespace
            text = ' '.join(text.split())

            if subject.lower() == 'mathematics':
                # Fix common math symbol recognition issues
                replacements = {
                    'x': '×',  # Multiplication
                    '/': '÷',  # Division
                    '+-': '±',  # Plus-minus
                    '<=': '≤',  # Less than or equal
                    '>=': '≥',  # Greater than or equal
                    '!=': '≠',  # Not equal
                }
                for old, new in replacements.items():
                    text = text.replace(old, new)

            elif subject.lower() == 'chemistry':
                # Fix common chemical formula issues
                text = text.replace('h20', 'H₂O')
                text = text.replace('co2', 'CO₂')
                # Add more chemical formula corrections as needed

            return text

        except Exception as e:
            print(f"Error in _post_process_text: {str(e)}")
            return text  # Return original text if post-processing fails

    def adjust_preprocessing_params(self, image_path: str) -> None:
        """Dynamically adjust preprocessing parameters based on image characteristics"""
        try:
            image = cv2.imread(image_path)
            if image is None:
                return

            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Calculate image statistics
            mean_brightness = gray.mean()
            std_brightness = gray.std()

            # Adjust parameters based on image characteristics
            if mean_brightness < 127:  # Dark image
                self.preprocessing_params.update({
                    'threshold_block_size': 15,
                    'threshold_c': 3
                })
            elif std_brightness < 50:  # Low contrast
                self.preprocessing_params.update({
                    'blur_kernel': (3, 3),
                    'threshold_block_size': 13
                })
            else:  # Normal image
                self.preprocessing_params.update({
                    'blur_kernel': (5, 5),
                    'threshold_block_size': 11,
                    'threshold_c': 2
                })

        except Exception as e:
            print(f"Error in adjust_preprocessing_params: {str(e)}")
            # Keep default parameters if adjustment fails