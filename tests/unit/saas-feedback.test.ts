/**
 * Testes unitários para Appointment Feedback
 * Valida: sentiment calculation, metrics aggregation, response rate
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AppointmentFeedback } from "../../shared/saas-schema";

/**
 * Calcula sentiment baseado em NPS ou rating
 */
function calculateSentiment(
  rating?: number,
  npsScore?: number,
): "positive" | "neutral" | "negative" | null {
  if (npsScore !== undefined) {
    if (npsScore >= 9) return "positive";
    if (npsScore >= 7) return "neutral";
    return "negative";
  }

  if (rating !== undefined) {
    if (rating >= 4) return "positive";
    if (rating === 3) return "neutral";
    return "negative";
  }

  return null;
}

/**
 * Agrega métricas de feedback
 */
function aggregateMetrics(feedbacks: Partial<AppointmentFeedback>[]) {
  const respondedFeedbacks = feedbacks.filter((f) => f.respondedAt);
  const ratings = respondedFeedbacks
    .filter((f) => f.rating)
    .map((f) => f.rating as number);
  const npsScores = respondedFeedbacks
    .filter((f) => f.npsScore !== undefined && f.npsScore !== null)
    .map((f) => f.npsScore as number);

  const averageRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

  const averageNps =
    npsScores.length > 0
      ? Math.round(npsScores.reduce((a, b) => a + b, 0) / npsScores.length)
      : null;

  let npsCategory: "detractors" | "passives" | "promoters" | null = null;
  if (averageNps !== null) {
    if (averageNps >= 9) npsCategory = "promoters";
    else if (averageNps >= 7) npsCategory = "passives";
    else npsCategory = "detractors";
  }

  const sentimentCounts = {
    positive: feedbacks.filter((f) => f.sentiment === "positive").length,
    neutral: feedbacks.filter((f) => f.sentiment === "neutral").length,
    negative: feedbacks.filter((f) => f.sentiment === "negative").length,
  };

  const responseRate =
    feedbacks.length > 0
      ? Math.round((respondedFeedbacks.length / feedbacks.length) * 100)
      : 0;

  return {
    totalResponses: respondedFeedbacks.length,
    totalAppointments: feedbacks.length,
    responseRate,
    averageRating,
    averageNps,
    npsCategory,
    sentimentBreakdown: sentimentCounts,
  };
}

describe("Appointment Feedback", () => {
  describe("Sentiment Calculation", () => {
    it("should calculate NPS-based sentiment", () => {
      assert.equal(calculateSentiment(undefined, 10), "positive");
      assert.equal(calculateSentiment(undefined, 9), "positive");
      assert.equal(calculateSentiment(undefined, 8), "neutral");
      assert.equal(calculateSentiment(undefined, 7), "neutral");
      assert.equal(calculateSentiment(undefined, 6), "negative");
      assert.equal(calculateSentiment(undefined, 0), "negative");
    });

    it("should calculate rating-based sentiment", () => {
      assert.equal(calculateSentiment(5), "positive");
      assert.equal(calculateSentiment(4), "positive");
      assert.equal(calculateSentiment(3), "neutral");
      assert.equal(calculateSentiment(2), "negative");
      assert.equal(calculateSentiment(1), "negative");
    });

    it("should prioritize NPS over rating", () => {
      assert.equal(calculateSentiment(1, 9), "positive");
      assert.equal(calculateSentiment(5, 0), "negative");
    });

    it("should return null for missing data", () => {
      assert.equal(calculateSentiment(), null);
      assert.equal(calculateSentiment(undefined, undefined), null);
    });
  });

  describe("Metrics Aggregation", () => {
    it("should calculate average rating", () => {
      const feedbacks: Partial<AppointmentFeedback>[] = [
        { rating: 5, respondedAt: "2026-08-27T10:00:00Z" },
        { rating: 4, respondedAt: "2026-08-27T11:00:00Z" },
        { rating: 3, respondedAt: "2026-08-27T12:00:00Z" },
      ];

      const metrics = aggregateMetrics(feedbacks);
      assert.equal(metrics.averageRating, 4); // (5 + 4 + 3) / 3 = 4
    });

    it("should calculate average NPS", () => {
      const feedbacks: Partial<AppointmentFeedback>[] = [
        { npsScore: 10, respondedAt: "2026-08-27T10:00:00Z" },
        { npsScore: 8, respondedAt: "2026-08-27T11:00:00Z" },
        { npsScore: 6, respondedAt: "2026-08-27T12:00:00Z" },
      ];

      const metrics = aggregateMetrics(feedbacks);
      assert.equal(metrics.averageNps, 8); // (10 + 8 + 6) / 3 = 8
    });

    it("should categorize NPS correctly", () => {
      const promoters: Partial<AppointmentFeedback>[] = [
        { npsScore: 10, respondedAt: "2026-08-27T10:00:00Z" },
        { npsScore: 9, respondedAt: "2026-08-27T11:00:00Z" },
      ];

      const passives: Partial<AppointmentFeedback>[] = [
        { npsScore: 8, respondedAt: "2026-08-27T10:00:00Z" },
        { npsScore: 7, respondedAt: "2026-08-27T11:00:00Z" },
      ];

      const detractors: Partial<AppointmentFeedback>[] = [
        { npsScore: 5, respondedAt: "2026-08-27T10:00:00Z" },
        { npsScore: 0, respondedAt: "2026-08-27T11:00:00Z" },
      ];

      assert.equal(aggregateMetrics(promoters).npsCategory, "promoters");
      assert.equal(aggregateMetrics(passives).npsCategory, "passives");
      assert.equal(aggregateMetrics(detractors).npsCategory, "detractors");
    });

    it("should calculate response rate correctly", () => {
      const feedbacks: Partial<AppointmentFeedback>[] = [
        { id: "1", respondedAt: "2026-08-27T10:00:00Z" },
        { id: "2", respondedAt: "2026-08-27T11:00:00Z" },
        { id: "3", respondedAt: null },
        { id: "4", respondedAt: null },
      ];

      const metrics = aggregateMetrics(feedbacks);
      assert.equal(metrics.responseRate, 50); // 2 of 4
      assert.equal(metrics.totalResponses, 2);
      assert.equal(metrics.totalAppointments, 4);
    });

    it("should count sentiments correctly", () => {
      const feedbacks: Partial<AppointmentFeedback>[] = [
        { sentiment: "positive", respondedAt: "2026-08-27T10:00:00Z" },
        { sentiment: "positive", respondedAt: "2026-08-27T11:00:00Z" },
        { sentiment: "neutral", respondedAt: "2026-08-27T12:00:00Z" },
        { sentiment: "negative", respondedAt: "2026-08-27T13:00:00Z" },
      ];

      const metrics = aggregateMetrics(feedbacks);
      assert.equal(metrics.sentimentBreakdown.positive, 2);
      assert.equal(metrics.sentimentBreakdown.neutral, 1);
      assert.equal(metrics.sentimentBreakdown.negative, 1);
    });

    it("should handle empty feedback list", () => {
      const metrics = aggregateMetrics([]);

      assert.equal(metrics.totalResponses, 0);
      assert.equal(metrics.totalAppointments, 0);
      assert.equal(metrics.responseRate, 0);
      assert.equal(metrics.averageRating, null);
      assert.equal(metrics.averageNps, null);
      assert.equal(metrics.npsCategory, null);
    });

    it("should handle no responses", () => {
      const feedbacks: Partial<AppointmentFeedback>[] = [
        { id: "1", respondedAt: null },
        { id: "2", respondedAt: null },
      ];

      const metrics = aggregateMetrics(feedbacks);

      assert.equal(metrics.totalResponses, 0);
      assert.equal(metrics.totalAppointments, 2);
      assert.equal(metrics.responseRate, 0);
      assert.equal(metrics.averageRating, null);
      assert.equal(metrics.averageNps, null);
    });

    it("should handle partial data (only rating, no NPS)", () => {
      const feedbacks: Partial<AppointmentFeedback>[] = [
        { rating: 5, respondedAt: "2026-08-27T10:00:00Z" },
        { rating: 4, respondedAt: "2026-08-27T11:00:00Z" },
      ];

      const metrics = aggregateMetrics(feedbacks);

      assert.equal(metrics.averageRating, 4.5);
      assert.equal(metrics.averageNps, null);
      assert.equal(metrics.npsCategory, null);
    });
  });
});

console.log("✓ Appointment Feedback tests passed");
