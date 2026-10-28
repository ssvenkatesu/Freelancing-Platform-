from typing import List, Optional
from pydantic import BaseModel, Field

class FreelancerProfileInput(BaseModel):
    id: str
    username: str
    bio: Optional[str] = ""
    skills: List[str] = Field(default_factory=list)
    experience: Optional[str] = ""
    portfolio: Optional[str] = ""
    completedProjects: Optional[int] = 0
    completionRate: Optional[float] = 100.0
    averageRating: Optional[float] = 0.0
    evaluationScore: Optional[float] = 0.0
    performanceScore: Optional[float] = 0.0

class GigRequirementInput(BaseModel):
    title: str
    description: str
    requiredSkills: List[str] = Field(default_factory=list)
    category: Optional[str] = ""
    budget: Optional[float] = 0.0

class MatchRequest(BaseModel):
    gig: GigRequirementInput
    freelancers: List[FreelancerProfileInput]

class RecommendationItem(BaseModel):
    freelancerId: str
    matchScore: float
    skillMatch: float
    performanceScore: float
    evaluationScore: float
    completionRate: float
    averageRating: float
    finalScore: float
    explanation: str
    factualReasons: List[str]

class MatchResponse(BaseModel):
    modelUsed: str
    totalEvaluated: int
    recommendations: List[RecommendationItem]
