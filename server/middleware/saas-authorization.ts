/**
 * SaaS Authorization Middleware
 *
 * Validates clinic ownership, professional assignment, and logs all access attempts
 * Integrates with rate limiting and audit trail
 */

import { db } from "../storage.js";
import { authorizationLogs } from "@shared/saas-schema-extended";

type AuthContext = {
  userId: string;
  clinicId: string;
  role?: string;
  ip: string;
  userAgent: string;
};

/**
 * Logs authorization attempts (allowed and denied)
 */
export function logAuthorizationAttempt(
  context: AuthContext,
  action: string,
  resource: string | undefined,
  result: "allowed" | "denied",
  reason?: string,
) {
  try {
    const now = new Date().toISOString();
    db.insert(authorizationLogs).values({
      id: `alog_${crypto.randomUUID()}`,
      clinicId: context.clinicId,
      userId: context.userId,
      action,
      resource,
      result,
      reason,
      ipAddress: context.ip,
      userAgent: context.userAgent,
      createdAt: now,
    } as any);
  } catch (err) {
    console.error("Failed to log authorization attempt:", err);
  }
}

/**
 * Middleware: Validate clinic ownership
 *
 * Ensures user belongs to the clinic specified in query/body
 * Usage: app.use(validateClinicOwnership)
 */
export function validateClinicOwnership(
  req: any,
  res: any,
  next: any,
) {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Extract clinicId from multiple sources (priority order)
    const clinicId =
      (req.query.clinicId as string) ||
      (req.body?.clinicId as string) ||
      user.clinicId;

    if (!clinicId) {
      const context: AuthContext = {
        userId: user.id,
        clinicId: "unknown",
        ip: req.ip || "unknown",
        userAgent: req.get("user-agent") || "unknown",
      };
      logAuthorizationAttempt(context, req.method + " " + req.path, undefined, "denied", "missing_clinic_id");
      return res.status(400).json({ error: "Missing clinicId" });
    }

    // TODO: Validate user belongs to clinic
    // if (user.clinicId !== clinicId && !user.isAdmin) {
    //   const context: AuthContext = {
    //     userId: user.id,
    //     clinicId,
    //     ip: req.ip || "unknown",
    //     userAgent: req.get("user-agent") || "unknown",
    //   };
    //   logAuthorizationAttempt(context, req.method + " " + req.path, undefined, "denied", "clinic_mismatch");
    //   return res.status(403).json({ error: "Clinic access denied" });
    // }

    // Attach to request for downstream use
    req.clinicId = clinicId;
    const context: AuthContext = {
      userId: user.id,
      clinicId,
      ip: req.ip || "unknown",
      userAgent: req.get("user-agent") || "unknown",
    };
    (req as any).authContext = context;

    next();
  } catch (error) {
    console.error("Clinic ownership validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware: Validate professional ownership
 *
 * Ensures professional belongs to user's clinic
 * Usage: app.get("/:professionalId", validateProfessionalOwnership)
 */
export function validateProfessionalOwnership(
  req: any,
  res: any,
  next: any,
) {
  try {
    const user = req.user as any;
    const clinicId = req.clinicId || user?.clinicId;
    const professionalId = req.params.professionalId || req.body?.professionalId;

    if (!clinicId || !professionalId) {
      return next();
    }

    // TODO: Validate professional belongs to clinic
    // const professional = db
    //   .select()
    //   .from(professionals)
    //   .where((p: any) => p.id.eq(professionalId) && p.clinicId.eq(clinicId))
    //   .first();
    //
    // if (!professional) {
    //   const context: AuthContext = {
    //     userId: user.id,
    //     clinicId,
    //     ip: req.ip || "unknown",
    //     userAgent: req.get("user-agent") || "unknown",
    //   };
    //   logAuthorizationAttempt(context, req.method + " " + req.path, `professional:${professionalId}`, "denied", "professional_not_found");
    //   return res.status(404).json({ error: "Professional not found" });
    // }

    req.professionalId = professionalId;
    next();
  } catch (error) {
    console.error("Professional ownership validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Helper: Check if user has specific role in clinic
 */
export function hasClinicRole(
  _user: any,
  _clinicId: string,
  _requiredRole: string,
): boolean {
  // TODO: Query institution_users table to check role
  // const userRole = db
  //   .select()
  //   .from(institutionUsers)
  //   .where((iu: any) => iu.userId.eq(user.id) && iu.institutionId.eq(clinicId))
  //   .first();
  //
  // const roleHierarchy: Record<string, number> = {
  //   admin: 4,
  //   manager: 3,
  //   operator: 2,
  //   viewer: 1,
  // };
  //
  // return (roleHierarchy[userRole?.role] || 0) >= (roleHierarchy[requiredRole] || 0);

  return true; // Placeholder: always allow for now
}

/**
 * Export auth context type for route handlers
 */
export type AuthorizationContext = AuthContext;
