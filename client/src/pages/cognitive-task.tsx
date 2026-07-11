/** Rota /cognitive-lab/:taskId — abre a tarefa cognitiva pelo runner único. */
import { Link, useParams } from "wouter";
import { CognitiveTaskRunner } from "@/features/cognitive-lab/CognitiveTaskRunner";
import { getCognitiveTask } from "@/features/cognitive-lab/tasks";

export default function CognitiveTaskPage() {
  const params = useParams<{ taskId: string }>();
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
