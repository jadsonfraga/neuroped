/** Rota /cognitive-lab/:taskId — resolve a tarefa para o runner adequado. */
import { Link, useParams } from "wouter";
import { CognitiveTaskRunner } from "@/features/cognitive-lab/CognitiveTaskRunner";
import { SpanTaskRunner } from "@/features/cognitive-lab/SpanTaskRunner";
import { TrailMakingRunner } from "@/features/cognitive-lab/TrailMakingRunner";
import { VisualSearchRunner } from "@/features/cognitive-lab/VisualSearchRunner";
import { TowerRunner } from "@/features/cognitive-lab/TowerRunner";
import { getCognitiveTask } from "@/features/cognitive-lab/tasks";

export default function CognitiveTaskPage() {
  const params = useParams<{ taskId: string }>();

  // Tarefas com runner próprio (interações além de estímulo-resposta).
  switch (params.taskId) {
    case "digit-span":
      return <SpanTaskRunner variant="digit" />;
    case "corsi-block":
      return <SpanTaskRunner variant="corsi" />;
    case "trail-making":
      return <TrailMakingRunner />;
    case "busca-visual":
      return <VisualSearchRunner />;
    case "torre-np":
      return <TowerRunner />;
  }

  const task = getCognitiveTask(params.taskId);
  if (!task) {
    return (
      <div className="mx-auto max-w-md p-6 text-center text-sm">
        <p className="font-semibold">Tarefa não encontrada.</p>
        <Link href="/cognitive-lab" className="text-primary underline">Voltar ao Cognitive Lab</Link>
      </div>
    );
  }
  return <CognitiveTaskRunner task={task} />;
}
