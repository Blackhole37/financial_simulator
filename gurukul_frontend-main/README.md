# Gurukul Learning Platform

A modern learning platform with AI agent simulation capabilities.

## Agent Simulation Dashboard V2 + Gurukul Interface Bridge

This project implements an advanced agent simulation dashboard that can be integrated with the Gurukul platform. The dashboard provides real-time visualization of agent activities, decisions, and interactions.

### Features

#### Agent Identity Visuals

- **FinancialCrew**: Blue theme with finance icon
- **EduMentor**: Green theme with book icon
- **WellnessBot**: Orange/purple theme with heart icon
- Each agent has a distinct visual identity with avatar/icon, color-coded name, and context bubble

#### Insight Cards (Real-Time)

- Each agent decision rendered as query + response
- Agent confidence displayed as a progress bar
- Tags for categorization (e.g., "risk", "health", "math")
- Time since query indicator

#### Interaction Timeline UI

- Scrollable timeline of all user-agent exchanges
- Timestamps for each interaction
- Icons per source type

#### Dynamic Feedback Indicators

- Visual cues for feedback (mentor/user)
- Color-coded: green = positive, red = negative
- Click to view full feedback

### Integration Guide

#### Embedding the Dashboard

The Agent Simulation Dashboard can be embedded in the Gurukul platform in several ways:

##### 1. As a React Component

```jsx
import Dashboard from "./path/to/Dashboard";

function App() {
  return (
    <div className="app">
      <Dashboard />
    </div>
  );
}
```

##### 2. Via iframe (if deployed separately)

```html
<iframe
  src="https://your-dashboard-url.com"
  width="100%"
  height="800px"
  frameborder="0"
  title="Agent Simulation Dashboard"
>
</iframe>
```

### API Endpoints

The dashboard connects to the following API endpoints:

#### 1. Get Agent Output

- **Endpoint**: `/get_agent_output`
- **Method**: GET
- **Description**: Retrieves agent decisions and outputs
- **Response Format**:

```json
[
  {
    "id": 1,
    "agent_type": "financial",
    "query": "How should I invest my savings?",
    "response": "Based on your risk profile, I recommend a mix of 60% index funds, 30% bonds, and 10% cash reserves.",
    "confidence": 0.87,
    "tags": ["risk", "investment"],
    "timestamp": "2023-06-15T10:30:00Z"
  }
]
```

#### 2. Get Agent Logs

- **Endpoint**: `/agent_logs`
- **Method**: GET
- **Description**: Retrieves agent activity logs
- **Response Format**:

```json
[
  {
    "id": 1,
    "agent_type": "financial",
    "action": "query_processed",
    "details": "Processed investment query with 87% confidence",
    "timestamp": "2023-06-15T10:30:00Z"
  }
]
```

#### 3. Get User Metadata

- **Endpoint**: `/user_meta`
- **Method**: GET
- **Description**: Retrieves user profile information
- **Response Format**:

```json
{
  "id": "user-123",
  "name": "John Doe",
  "preferences": {
    "agents": ["financial", "education"],
    "theme": "dark"
  }
}
```

### Simulated Session Format

For the session playback mode, the dashboard accepts JSON logs in the following format:

```json
{
  "session_id": "sim-123456",
  "timestamp": "2023-06-15T10:00:00Z",
  "interactions": [
    {
      "id": 1,
      "timestamp": "2023-06-15T10:01:00Z",
      "agent_type": "financial",
      "query": "How should I invest my savings?",
      "response": "Based on your risk profile, I recommend a mix of 60% index funds, 30% bonds, and 10% cash reserves.",
      "confidence": 0.87,
      "tags": ["risk", "investment"]
    },
    {
      "id": 2,
      "timestamp": "2023-06-15T10:03:00Z",
      "agent_type": "education",
      "query": "Explain the Pythagorean theorem",
      "response": "The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c².",
      "confidence": 0.95,
      "tags": ["math", "geometry"]
    }
  ]
}
```

## Technology Stack

- React with Vite for fast development
- Tailwind CSS for styling
- GSAP for animations
- React Query for data fetching
- Supabase for authentication and data storage
