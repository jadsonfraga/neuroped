import type { InteractiveScaleDef } from "./interactiveScaleItems";
import { buildScale, buildWithSentinels } from "./authorialScaleBuilder";
import { mariaClara } from "./authorialMariaClara";

export const authorialDrive2026OperationalItems: Record<string, InteractiveScaleDef> = {
  "nef-360": buildScale("nef-360", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sensory", "sleep", "epilepsy", "functionality"], 5),
  "neurofunc-360": buildScale("neurofunc-360", ["development", "language", "attention", "executive", "learning", "behavior", "emotion", "sleep", "epilepsy", "functionality"], 4),
  "integra-kids-360": buildScale("integra-kids-360", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "functionality"], 5),
  "mapa-360": buildScale("mapa-360", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sensory", "sleep", "epilepsy", "functionality"], 5),
  "sinaf-neuroped": buildScale("sinaf-neuroped", ["development", "language", "social", "attention", "executive", "behavior", "emotion", "sleep", "functionality", "family"], 5),
  "integra-neuroped-90": buildScale("integra-neuroped-90", ["development", "language", "attention", "executive", "learning", "behavior", "emotion", "sleep", "functionality"], 10),
  "einpi-360": buildScale("einpi-360", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sleep", "epilepsy", "motor", "functionality"], 4),
  "ponte-ped-72": buildScale("ponte-ped-72", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sleep", "epilepsy", "functionality", "family"], 6),
  "sinapse-fi-60": buildScale("sinapse-fi-60", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sensory", "sleep", "epilepsy", "functionality"], 5),
  "nexus-ped-52": buildScale("nexus-ped-52", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sensory", "sleep", "epilepsy", "motor", "functionality"], 4),
  "nefi-ped-96": buildScale("nefi-ped-96", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sensory", "sleep", "epilepsy", "functionality"], 8),
  "eidaf-neuroinfantil": buildScale("eidaf-neuroinfantil", ["development", "language", "attention", "executive", "learning", "behavior", "emotion", "sleep", "epilepsy", "functionality"], 5),
  "navi-ped-84": buildScale("navi-ped-84", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sensory", "sleep", "epilepsy", "motor", "functionality", "family"], 6),
  "sinergi-neuroped": buildScale("sinergi-neuroped", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sensory", "sleep", "epilepsy", "functionality"], 5),
  "orbita-neurofuncional": buildScale("orbita-neurofuncional", ["development", "language", "attention", "executive", "learning", "behavior", "emotion", "sleep", "functionality"], 5),
  "nexus360-neuroped": buildScale("nexus360-neuroped", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sleep", "functionality"], 5),
  "prisma-nf-60": buildScale("prisma-nf-60", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sensory", "sleep", "epilepsy", "functionality"], 5),
  "mosaico-np-72": buildScale("mosaico-np-72", ["development", "language", "social", "attention", "executive", "learning", "behavior", "emotion", "sleep", "epilepsy", "functionality", "family"], 6),
  "idafeni": buildWithSentinels("idafeni", ["development", "language", "attention", "executive", "learning", "behavior", "emotion", "sleep", "functionality"], 5, 7),
  "einpi-drj-v1": buildWithSentinels("einpi-drj-v1", ["development", "language", "social", "attention", "executive", "learning", "emotion", "functionality"], 5, 8),
  "escala-maria-clara-ansiedade": mariaClara(),
};
