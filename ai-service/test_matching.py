import json
import requests

def test_sbert_service():
    url = "http://localhost:8000/match"
    payload = {
        "gig": {
            "title": "Need Full-Stack React and Node.js Developer",
            "description": "Building a modern SaaS dashboard with WebSockets, Mongoose DB, and clean React UI.",
            "requiredSkills": ["React", "Node.js", "MongoDB", "WebSocket"],
            "category": "Web Development",
            "budget": 500
        },
        "freelancers": [
            {
                "id": "freelancer_001",
                "username": "alex_dev",
                "bio": "Senior MERN Stack developer with 6+ years experience in React, Node, and WebSockets.",
                "skills": ["React", "Node.js", "MongoDB", "Express", "TypeScript"],
                "experience": "Architected real-time SaaS applications.",
                "portfolio": "React Dashboard Engine",
                "completedProjects": 15,
                "completionRate": 100,
                "averageRating": 4.9,
                "evaluationScore": 95,
                "performanceScore": 94
            },
            {
                "id": "freelancer_002",
                "username": "maria_designer",
                "bio": "Award winning UI UX designer creating Figma wireframes and brand systems.",
                "skills": ["Figma", "UI/UX", "Adobe XD", "Branding"],
                "experience": "Lead visual designer for mobile apps.",
                "portfolio": "Mobile App UI UX Kit",
                "completedProjects": 8,
                "completionRate": 90,
                "averageRating": 4.8,
                "evaluationScore": 90,
                "performanceScore": 88
            }
        ]
    }

    try:
        print("🚀 Sending test request to SBERT microservice...")
        response = requests.post(url, json=payload, timeout=5)
        print("Response Status Code:", response.status_code)
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print("⚠️ Service offline or request failed:", e)

if __name__ == "__main__":
    test_sbert_service()
