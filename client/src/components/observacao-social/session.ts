export type Stage = "choose" | "prepare" | "record" | "review";
export type Note = { condition: string; reaction: string; context: string; video: string; interpretation: string };
export const blank: Note = { condition: "", reaction: "", context: "", video: "", interpretation: "" };
export type Session = {
  band: number | null;
  scene: number;
  stage: Stage;
  records: Record<string, Note>;
};
export const fresh: Session = { band: null, scene: 0, stage: "choose", records: {} };
export type Action =
  | { type: "age"; band: number }
  | { type: "open"; scene: number }
  | { type: "stage"; stage: Stage }
  | { type: "edit"; field: keyof Note; value: string }
  | { type: "reset" };
export function session(state: Session, action: Action): Session {
  switch (action.type) {
    case "age": return Object.keys(state.records).length ? state : { ...state, band: action.band, scene: 0, stage: "choose" };
    case "open": return state.band === null ? state : { ...state, scene: action.scene, stage: "prepare" };
    case "stage": return { ...state, stage: action.stage };
    case "reset": return fresh;
    case "edit": {
      if (state.band === null) return state;
      const id = state.band + "/" + state.scene;
      const entry = { ...(state.records[id] ?? blank), [action.field]: action.value };
      const records = { ...state.records, [id]: entry };
      if (!Object.values(entry).some(text => text.trim())) delete records[id];
      return { ...state, records };
    }
  }
}

export function videoStamp(clip: number, time: number) {
  if (!Number.isFinite(time) || time < 0) return null;
  const seconds = Math.floor(time);
  const minutesPart = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secondsPart = String(seconds % 60).padStart(2, "0");
  return "Vídeo " + clip + " · " + minutesPart + ":" + secondsPart;
}
