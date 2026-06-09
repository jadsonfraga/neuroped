# ⚡ BLOCO 3 — Quick Start Guide

**For developers implementing Features 6-10 and integration.**

---

## 📍 WHERE WE ARE

- ✅ Features 1-5 implemented (50% complete)
- 📁 Location: `/client/src/features/`
- 📄 Demo: `/client/src/pages/bloco3-showcase.tsx`
- 📋 Status: `claude/audite-bd8dye` branch
- 📚 Docs: `BLOCO3_PROGRESS.md` | `SESSION_SUMMARY_BLOCO3.md`

---

## 🏃 QUICK START: Adding Feature 6

### 1. Create Directory
```bash
mkdir -p client/src/features/history-comparison
```

### 2. Create Files (Template)
```typescript
// types.ts
export interface HistoryEntry {
  id: string;
  assessmentId: string;
  scaleName: string;
  score: number;
  timestamp: Date;
}

// HistoryComparison.tsx
import { Card } from "@/components/ui/card";
export function HistoryComparison() {
  return <Card>Feature 6 Implementation</Card>;
}

// index.ts
export { HistoryComparison } from "./HistoryComparison";
export type { HistoryEntry } from "./types";
```

### 3. Test in Showcase
```typescript
// bloco3-showcase.tsx
import { HistoryComparison } from "@/features/history-comparison";

<TabsContent value="history">
  <HistoryComparison />
</TabsContent>
```

### 4. Commit
```bash
git add client/src/features/history-comparison
git commit -m "feat(bloco3): Feature 6 - Historical Comparison

[Detailed description]

https://claude.ai/code/session_01LdJMxcFA2HGSERxEgemHCQ"
```

---

## 🔗 INTEGRATION CHECKLIST

### When Adding to Main Filter Page (`filtro.tsx`)

- [ ] Import feature component
- [ ] Add context/props passing
- [ ] Handle state management
- [ ] Add to UI layout (modal/drawer/tab)
- [ ] Wire up data flow
- [ ] Test interaction
- [ ] Add loading states
- [ ] Error handling

**Example:**
```typescript
import { ClinicalAssistant } from "@/features/clinical-assistant";

export function FilteroPage() {
  const [showAssistant, setShowAssistant] = useState(false);
  
  return (
    <>
      {showAssistant && (
        <ClinicalAssistant
          onBatterySelected={(scaleIds) => {
            // Add scales to filter
            applyScales(scaleIds);
            setShowAssistant(false);
          }}
        />
      )}
    </>
  );
}
```

---

## 📦 DEPENDENCIES

Already available (no new installs needed):
- ✅ React 18+
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Lucide icons
- ✅ Recharts (for charts)
- ✅ UI components (Button, Card, Badge, Input, etc)

---

## 🧪 TESTING FEATURES

### Unit Tests Pattern
```typescript
// features/my-feature/MyFeature.test.ts
import { describe, it, expect } from "vitest";
import { MyComponent } from "./MyFeature";

describe("MyFeature", () => {
  it("renders correctly", () => {
    // Test here
  });
});
```

### Run Tests
```bash
npm run test:unit
```

### Manual Testing
1. Start dev server: `npm run dev`
2. Navigate to `/bloco3-showcase`
3. Test feature in isolation
4. Check console for errors/warnings

---

## 🔍 CODE STYLE GUIDE

### Follow Existing Patterns

**Type Definitions:**
```typescript
// ✅ DO: Export interfaces from types.ts
export interface MyType {
  id: string;
  // ...
}

// ❌ DON'T: Inline types in components
const component = (props: { id: string }) => {};
```

**Components:**
```typescript
// ✅ DO: Use UI components from @/components/ui/
import { Card, Button, Badge } from "@/components/ui";

// ❌ DON'T: Create custom styled divs
<div className="...">Click</div>
```

**Imports:**
```typescript
// ✅ DO: Use @ alias for absolute imports
import { MyComponent } from "@/features/my-feature";

// ❌ DON'T: Use relative imports for distant files
import { MyComponent } from "../../../../features/my-feature";
```

**Colors:**
```typescript
// ✅ DO: Use Tailwind colors
className="bg-blue-50 border-blue-300 text-blue-900"

// ❌ DON'T: Use hex colors
className="bg-#f0f4ff"
```

---

## 📊 FEATURE TEMPLATES

### Input Form Template
```typescript
export function MyForm({ onSubmit, onCancel }) {
  const [value, setValue] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!value.trim()) {
      setErrors(["Field is required"]);
      return;
    }
    onSubmit?.(value);
  };

  return (
    <Card className="border-blue-300 bg-blue-50">
      <CardHeader>
        <CardTitle>My Form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.length > 0 && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
            {errors.map((err) => <p key={err}>{err}</p>)}
          </div>
        )}
        
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />

        <div className="flex gap-2">
          <Button onClick={handleSubmit} className="flex-1">Submit</Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Data Display Template
```typescript
export function MyPanel({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">
          <p>No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-4">
            <p className="font-semibold">{item.name}</p>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## 🚨 COMMON PITFALLS

| Issue | Solution |
|-------|----------|
| Props drilling too deep | Use context or pass callbacks cleanly |
| Hardcoded colors | Use Tailwind classes + variables |
| No error handling | Add try-catch + validation in forms |
| Missing types | Define interfaces in types.ts |
| Unused variables | Remove them (clean code) |
| console.log in prod | Use logger (to be implemented) |

---

## 🔧 DEBUGGING

### Check Build
```bash
npm run build:client
```

### Run Linter
```bash
npm run lint
```

### Type Check
```bash
npm run check
```

### Run Tests
```bash
npm run test:unit
```

---

## 📚 RESOURCES

**Understanding Features:**
- Read: `INNOVATION_FILTER_100PERCENT.md` (original vision)
- Read: `BLOCO3_PROGRESS.md` (feature details)
- Read: `SESSION_SUMMARY_BLOCO3.md` (implementation notes)

**Code Examples:**
- Study: `/client/src/features/clinical-assistant/` (Feature 1)
- Study: `/client/src/features/multidisciplinary/` (Feature 3)
- Study: `/client/src/features/scale-charts/` (Feature 4)

**Current Tests:**
- Look at: `/client/src/pages/bloco3-showcase.tsx` (manual testing)

---

## ✅ BEFORE COMMITTING

- [ ] No TypeScript errors (`npm run check`)
- [ ] No lint errors (`npm run lint`)
- [ ] Code is formatted (`npx prettier --write`)
- [ ] Feature is in showcase page
- [ ] Manual testing done
- [ ] Types are exported from index.ts
- [ ] Commit message includes feature number & description
- [ ] Include session URL in commit

---

## 🎯 FEATURES 6-10 BRIEF

**Feature 6:** Show previous assessments, trends, recommend retesting
**Feature 7:** Pre-built expert batteries (community-validated)
**Feature 8:** Detect fatigue, suggest shorter alternatives
**Feature 9:** Scale compatibility matrix showing redundancy
**Feature 10:** Auto-generate compliance audit trails

---

## 💬 QUESTIONS?

Check these in order:
1. `BLOCO3_PROGRESS.md` — Feature-specific details
2. `SESSION_SUMMARY_BLOCO3.md` — Implementation patterns
3. Existing features (`/client/src/features/*/`) — Code examples
4. Git log — Commit messages with decisions

---

**Last Updated:** 2026-06-09  
**Status:** 50% Complete  
**Next Developer:** You!

Happy coding! 🚀
