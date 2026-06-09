// Clinical Signatures — Expert-curated batteries

export interface ClinicalSignature {
  id: string;
  name: string;
  description: string;
  useCase: string; // e.g., "Initial ADHD evaluation", "Autism follow-up"
  scaleIds: string[];
  estimatedDuration: number; // minutes
  targetAgeMin: number;
  targetAgeMax: number;
  author: string; // Expert who created this
  createdDate: Date;
  communityRating: number; // 1-5 stars
  communityRatingCount: number;
  isVerified: boolean; // Medical expert verified
  clinicalContext: string[];
  respondentTypes: string[];
  tags: string[];
}

export interface SignatureReview {
  signatureId: string;
  reviewer: string;
  rating: number; // 1-5
  feedback: string;
  timestamp: Date;
  wouldRecommend: boolean;
}

export interface SignatureLibrary {
  totalSignatures: number;
  byCategory: Record<string, number>;
  topRated: ClinicalSignature[];
  myFavorites: ClinicalSignature[];
  recentlyUsed: ClinicalSignature[];
}
