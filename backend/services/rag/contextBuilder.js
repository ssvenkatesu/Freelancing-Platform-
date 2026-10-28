/**
 * Formats retrieved MongoDB records into structured, sanitized context blocks for the LLM prompt
 */
export const buildContext = ({ freelancers, gigs, orders, reviews }) => {
  let contextText = "";

  // 1. Freelancers Section
  if (freelancers && freelancers.length > 0) {
    contextText += "=== FREELANCER PROFILES ===\n";
    freelancers.forEach((f) => {
      contextText += `ID: ${f._id}\n`;
      contextText += `Username: ${f.username}\n`;
      contextText += `Country: ${f.country || "Global"}\n`;
      contextText += `Bio/About: ${f.bioSummary || f.desc || "N/A"}\n`;
      contextText += `Skills: ${(f.skills || []).join(", ") || "N/A"}\n`;
      contextText += `Hourly Rate: $${f.hourlyRate || 0}/hr\n`;
      contextText += `Average Rating: ${f.averageRating || 0} / 5.0 (${f.ratingCount || 0} reviews)\n`;
      contextText += `Completed Projects: ${f.completedProjectsCount || 0}\n`;
      contextText += `Cancelled Projects: ${f.cancelledProjectsCount || 0}\n`;
      contextText += `Completion Rate: ${f.completionRate || 100}%\n`;
      contextText += `Total Earnings: $${f.totalEarnings || 0}\n`;
      contextText += `Evaluation Score: ${f.evaluationScore || 0}% (${f.evaluationStatus || "not_taken"})\n`;
      contextText += `Evaluation Passed: ${f.evaluationPassed ? "YES" : "NO"}\n`;
      if (f.experience && f.experience.length > 0) {
        contextText += `Experience: ${f.experience.map((e) => `${e.title} at ${e.company} (${e.years} yrs)`).join("; ")}\n`;
      }
      if (f.portfolio && f.portfolio.length > 0) {
        contextText += `Portfolio: ${f.portfolio.map((p) => `${p.title}: ${p.description}`).join("; ")}\n`;
      }
      contextText += "---\n";
    });
  }

  // 2. Gigs Section
  if (gigs && gigs.length > 0) {
    contextText += "\n=== ACTIVE GIGS / SERVICES ===\n";
    gigs.forEach((g) => {
      contextText += `Gig ID: ${g._id} | Seller ID: ${g.userId}\n`;
      contextText += `Title: ${g.title}\n`;
      contextText += `Category: ${g.cat || "General"}\n`;
      contextText += `Price: $${g.price}\n`;
      contextText += `Description: ${g.desc}\n`;
      contextText += `Sales Count: ${g.sales || 0}\n`;
      contextText += "---\n";
    });
  }

  // 3. Completed Orders / Projects Section
  if (orders && orders.length > 0) {
    contextText += "\n=== COMPLETED PROJECTS / WORK HISTORY ===\n";
    orders.forEach((o) => {
      contextText += `Project ID: ${o._id} | Seller ID: ${o.sellerId} | Buyer ID: ${o.buyerId}\n`;
      contextText += `Project Title: ${o.title}\n`;
      contextText += `Agreed Amount: $${o.agreedAmount || o.price}\n`;
      contextText += `Status: ${o.status || "completed"}\n`;
      contextText += `Completed At: ${o.completedAt || o.updatedAt || "N/A"}\n`;
      contextText += "---\n";
    });
  }

  // 4. Customer Reviews Section
  if (reviews && reviews.length > 0) {
    contextText += "\n=== CUSTOMER REVIEWS & FEEDBACK ===\n";
    reviews.forEach((r) => {
      contextText += `Review ID: ${r._id} | Seller ID: ${r.sellerId} | Buyer ID: ${r.userId}\n`;
      contextText += `Rating: ${r.star || r.rating} / 5 Stars\n`;
      contextText += `Review Text: "${r.desc || r.reviewText}"\n`;
      contextText += "---\n";
    });
  }

  if (!contextText.trim()) {
    contextText = "No relevant freelancer records found in database.";
  }

  return contextText;
};
