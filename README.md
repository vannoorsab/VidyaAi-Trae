# VidyAI - AI-Powered Education Platform

VidyAI is a comprehensive education platform that leverages artificial intelligence to provide real-time feedback, automated grading, and multilingual support for students, teachers, and parents.

## 🌟 Features

### For Students
- Submit work in multiple formats:
  - Text submissions
  - Code submissions with language-specific evaluation
  - Handwritten work through image upload
  - Voice recordings for verbal responses
- Receive instant AI-generated feedback
- View detailed explanations of evaluations
- Access feedback in multiple languages
- Listen to audio versions of feedback

### For Teachers
- Review AI-generated evaluations
- Override or approve automated assessments
- Provide voice feedback to students
- Track student progress and performance metrics
- Bulk approve accurate AI evaluations

### For Parents
- Monitor children's academic progress
- Receive summarized feedback reports
- Listen to audio summaries in preferred language
- Track improvement trends over time

## 🤖 AI Technologies

- **OpenAI GPT-4**: Text and code evaluation
- **Whisper**: Voice transcription
- **Tesseract OCR**: Handwritten text recognition
- **MarianMT**: Multilingual translation
- **ElevenLabs**: Text-to-speech conversion
- **CodeBERT**: Code analysis and evaluation
- **LIME/SHAP**: AI decision explanation

## 🛠️ Technical Stack

### Backend
- Node.js + Express
- Python AI Services
- MongoDB/PostgreSQL
- Firebase Auth
- AWS S3/Firebase Storage

### Frontend
- React.js
- TailwindCSS
- PWA Support
- IndexedDB for offline data

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vidyai.git
cd vidyai
```

2. Install backend dependencies:
```bash
cd server
npm install

# Install Python AI service dependencies
cd ai_services
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd client
npm install
```

4. Set up environment variables:
```bash
# Backend .env
PORT=3000
MONGODB_URI=your_mongodb_uri
FIREBASE_CONFIG=your_firebase_config
OPENAI_API_KEY=your_openai_key
ELEVEN_LABS_API_KEY=your_elevenlabs_key

# Frontend .env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_CONFIG=your_firebase_config
```

## 🚀 Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend development server:
```bash
cd client
npm run dev
```

3. Access the application at `http://localhost:5173`

## 📱 PWA and Offline Support

VidyAI is designed to work offline with the following capabilities:
- Cache static assets and previous submissions
- Store new submissions when offline
- Sync data when connection is restored
- Install as a desktop/mobile app

## 🔒 Security Features

- Firebase Authentication
- Role-based access control
- Secure file storage
- API rate limiting
- Input validation and sanitization

## 🌐 Supported Languages

- English (Default)
- Tamil
- Hindi
- Telugu

## 📖 Documentation

Detailed documentation is available in the `/docs` directory:
- [API Documentation](docs/api.md)
- [AI Services Guide](docs/ai-services.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](docs/contributing.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Google for Firebase and TensorFlow
- ElevenLabs for Text-to-Speech API
- All contributors and supporters