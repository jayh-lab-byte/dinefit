import { applyRefinePatch, defaultQueries } from "./constraints";
import type { GeoLocation, SearchSession } from "./domain";
import { sessionToRequest } from "./recommend";

export type QuickKind = "closer" | "cheaper" | "quieter" | "other_food" | "other_mood";

export function applyQuick(session: SearchSession, kind: QuickKind) {
  if (kind === "closer") {
    const radius = Math.max(500, session.radius - 1000);
    session.constraints = applyRefinePatch(session.constraints, { radius });
    session.radius = radius;
  }
  if (kind === "cheaper") {
    const budgetPerPerson = session.budgetPerPerson
      ? Math.max(10000, session.budgetPerPerson - 10000)
      : 20000;
    session.constraints = applyRefinePatch(session.constraints, { budgetPerPerson });
    session.budgetPerPerson = budgetPerPerson;
  }
  if (kind === "quieter") {
    session.constraints = applyRefinePatch(session.constraints, {
      addPrefer: [{ type: "noise", value: "quiet", label: "더 조용한 곳" }],
    });
  }
  if (kind === "other_food") {
    session.constraints = applyRefinePatch(session.constraints, {
      category: "상관없음",
      searchQueries: defaultQueries(session.location.label, undefined, session.companion),
    });
    session.category = undefined;
  }
  if (kind === "other_mood") {
    session.constraints = applyRefinePatch(session.constraints, {
      addPrefer: [{ type: "atmosphere", value: "different", label: "다른 분위기" }],
    });
  }
  return sessionToRequest(session);
}

export function applyMove(session: SearchSession, location: GeoLocation) {
  session.location = location;
  session.constraints = {
    ...session.constraints,
    searchQueries: defaultQueries(location.label, session.category, session.companion),
  };
  return sessionToRequest(session);
}

export function applyRelaxation(session: SearchSession, change: "radius" | "category") {
  const option = session.relaxation.find((item) => item.change === change);
  if (change === "radius" && option?.nextRadius) {
    session.constraints = applyRefinePatch(session.constraints, { radius: option.nextRadius });
    session.radius = option.nextRadius;
    return sessionToRequest(session);
  }
  if (change === "category") return applyQuick(session, "other_food");
  return sessionToRequest(session);
}
