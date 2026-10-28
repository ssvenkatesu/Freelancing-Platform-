from typing import List
from app.schemas import GigRequirementInput, FreelancerProfileInput, RecommendationItem
from app.embedding_service import encode_text, compute_cosine_similarity, settings

# Configurable Scoring Weights (Must sum to 1.0)
WEIGHTS = {
    "semanticMatch": 0.50,
    "performanceScore": 0.20,
    "evaluationScore": 0.10,
    "completionRate": 0.10,
    "averageRating": 0.10,
}

def rank_freelancers(
    gig: GigRequirementInput, freelancers: List[FreelancerProfileInput]
) -> List[RecommendationItem]:
    if not freelancers:
        return []

    # 1. Build Gig Semantic Representation Document
    gig_text = (
        f"Gig Title: {gig.title}. "
        f"Description: {gig.description}. "
        f"Required Skills: {', '.join(gig.requiredSkills)}. "
        f"Category: {gig.category}."
    )

    # Encode Gig Text using SBERT
    gig_vec = encode_text(gig_text)
    recommendations = []

    for f in freelancers:
        # 2. Build Freelancer Semantic Profile Text
        skills_str = ", ".join(f.skills) if f.skills else "General"
        profile_text = (
            f"Freelancer: {f.username}. "
            f"Bio: {f.bio or ''}. "
            f"Skills: {skills_str}. "
            f"Experience: {f.experience or ''}. "
            f"Portfolio: {f.portfolio or ''}."
        )

        # Encode Freelancer Profile Text using SBERT
        profile_vec = encode_text(profile_text)

        # 3. Calculate Cosine Similarity between Gig & Profile vectors
        semantic_match = compute_cosine_similarity(gig_vec, profile_vec)
        skill_match = semantic_match

        # 4. Normalize Signals to 0.0 - 1.0 Scale
        norm_perf = (f.performanceScore or 0.0) / 100.0
        norm_eval = (f.evaluationScore or 0.0) / 100.0
        norm_comp = (f.completionRate or 100.0) / 100.0
        norm_rating = (f.averageRating or 0.0) / 5.0

        # 5. Calculate Final Score using Configurable Weights
        raw_final_score = (
            WEIGHTS["semanticMatch"] * semantic_match
            + WEIGHTS["performanceScore"] * norm_perf
            + WEIGHTS["evaluationScore"] * norm_eval
            + WEIGHTS["completionRate"] * norm_comp
            + WEIGHTS["averageRating"] * norm_rating
        )
        final_score = round(raw_final_score * 100, 2)

        # 6. Generate Factual Reasons
        matched_skills = [
            s for s in f.skills if s.lower() in gig_text.lower()
        ]
        reasons = []

        if matched_skills:
          reasons.append(f"Matches {', '.join(matched_skills[:3])} requirements")
        reasons.append(f"SBERT semantic match score of {round(semantic_match * 100)}%")
        if f.completedProjects > 0:
            reasons.append(f"Completed {f.completedProjects} projects")
        reasons.append(f"{round(f.completionRate)}% completion rate")
        if f.averageRating > 0:
            reasons.append(f"{f.averageRating} / 5.0 average customer rating")
        if f.evaluationScore > 0:
            reasons.append(f"{round(f.evaluationScore)}% skill evaluation test score")

        explanation = f"SBERT semantic match score of {round(semantic_match * 100)}% based on skills, experience, and profile alignment."

        recommendations.append(
            RecommendationItem(
                freelancerId=f.id,
                matchScore=round(semantic_match, 4),
                skillMatch=round(skill_match, 4),
                performanceScore=f.performanceScore or 0.0,
                evaluationScore=f.evaluationScore or 0.0,
                completionRate=f.completionRate or 100.0,
                averageRating=f.averageRating or 0.0,
                finalScore=final_score,
                explanation=explanation,
                factualReasons=reasons,
            )
        )

    # Sort recommendations by finalScore descending
    recommendations.sort(key=lambda x: x.finalScore, reverse=True)
    return recommendations
