# VidyAI API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API endpoints except `/auth/register` and `/auth/login` require authentication using Firebase JWT token.

### Headers

```
Authorization: Bearer <firebase_token>
```

## Endpoints

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "string",
  "password": "string",
  "role": "student|teacher|parent",
  "name": "string"
}

Response: 201 Created
{
  "userId": "string",
  "email": "string",
  "role": "string"
}
```

#### Get User Profile

```http
GET /auth/profile

Response: 200 OK
{
  "userId": "string",
  "email": "string",
  "role": "string",
  "name": "string",
  "preferences": {}
}
```

### Student Endpoints

#### Submit Work

```http
POST /students/submit
Content-Type: multipart/form-data

Form Data:
- type: "text|code|handwritten|voice"
- content: string or File
- subject: string
- description: string

Response: 201 Created
{
  "submissionId": "string",
  "status": "evaluating|completed",
  "timestamp": "string"
}
```

#### Get Submission History

```http
GET /students/submissions?page=1&limit=10

Response: 200 OK
{
  "submissions": [
    {
      "id": "string",
      "type": "string",
      "subject": "string",
      "status": "string",
      "score": number,
      "timestamp": "string"
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

#### Get Submission Feedback

```http
GET /students/submissions/:id/feedback

Response: 200 OK
{
  "score": number,
  "feedback": "string",
  "audioFeedbackUrl": "string",
  "explanation": "string",
  "teacherReview": {
    "override": boolean,
    "comment": "string"
  }
}
```

### Teacher Endpoints

#### Get Pending Reviews

```http
GET /teachers/reviews?status=pending&page=1&limit=10

Response: 200 OK
{
  "reviews": [
    {
      "submissionId": "string",
      "studentId": "string",
      "type": "string",
      "subject": "string",
      "aiScore": number,
      "aiFeedback": "string",
      "timestamp": "string"
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

#### Submit Review

```http
POST /teachers/reviews/:submissionId
Content-Type: multipart/form-data

Form Data:
- override: boolean
- score: number
- feedback: string
- audioFeedback: File (optional)

Response: 200 OK
{
  "status": "completed",
  "timestamp": "string"
}
```

### Parent Endpoints

#### Get Children's Progress

```http
GET /parents/children/:childId/progress

Response: 200 OK
{
  "overall": {
    "averageScore": number,
    "totalSubmissions": number,
    "improvementRate": number
  },
  "subjects": [
    {
      "name": "string",
      "averageScore": number,
      "submissions": number
    }
  ],
  "recentSubmissions": [
    {
      "id": "string",
      "type": "string",
      "subject": "string",
      "score": number,
      "timestamp": "string"
    }
  ]
}
```

#### Get Weekly Summary

```http
GET /parents/children/:childId/summary
Query Parameters:
- language: string (default: "en")
- format: "text|audio" (default: "text")

Response: 200 OK
{
  "summary": "string",
  "audioUrl": "string",
  "week": "string",
  "highlights": [
    {
      "subject": "string",
      "achievement": "string"
    }
  ]
}
```

### AI Service Endpoints

#### Generate Audio Feedback

```http
POST /ai/audio
Content-Type: application/json

{
  "text": "string",
  "language": "string"
}

Response: 200 OK
{
  "audioUrl": "string",
  "duration": number
}
```

#### Explain AI Feedback

```http
POST /ai/explain
Content-Type: application/json

{
  "submissionId": "string",
  "feedbackId": "string"
}

Response: 200 OK
{
  "explanation": "string",
  "confidence": number,
  "factors": [
    {
      "name": "string",
      "weight": number,
      "description": "string"
    }
  ]
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid request parameters",
  "details": {
    "field": "error message"
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": number
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "requestId": "string"
}
```

## Rate Limiting

API endpoints are rate-limited based on the following rules:
- Authentication endpoints: 5 requests per minute
- Student submissions: 10 requests per minute
- AI service endpoints: 20 requests per minute
- Other endpoints: 60 requests per minute

## Webhooks

### Submission Status Updates

```http
POST <webhook_url>
Content-Type: application/json

{
  "event": "submission.status_update",
  "submissionId": "string",
  "status": "evaluating|completed|reviewed",
  "timestamp": "string"
}
```

### AI Service Status

```http
POST <webhook_url>
Content-Type: application/json

{
  "event": "ai.status",
  "service": "string",
  "status": "operational|degraded|down",
  "timestamp": "string"
}
```