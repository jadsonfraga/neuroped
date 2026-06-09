import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterContext } from "@/lib/blockingRules";

export interface FilterContextFormProps {
  onContextChange: (context: Partial<FilterContext>) => void;
}

export function FilterContextForm({ onContextChange }: FilterContextFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [canRead, setCanRead] = useState(false);
  const [readingLevel, setReadingLevel] = useState<"basico" | "nivel2" | "nivel3" | "fluente">();
  const [canWrite, setCanWrite] = useState(false);
  const [isVerbal, setIsVerbal] = useState(true);
  const [parentAvailable, setParentAvailable] = useState(true);
  const [schoolAvailable, setSchoolAvailable] = useState(false);
  const [professionalAvailable, setProfessionalAvailable] = useState(false);
  const [professionalType, setProfessionalType] = useState<string>();

  const handleContextUpdate = () => {
    onContextChange({
      canRead,
      readingLevel: canRead ? readingLevel : undefined,
      canWrite,
      isVerbal,
      parentAvailable,
      schoolAvailable,
      professionalAvailable,
      professionalType: professionalAvailable ? professionalType : undefined,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Contexto da Avaliação
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Informe sobre a criança e respondentes disponíveis para filtrar escalas apropriadas
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 w-6 p-0"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pb-4">
          {/* Habilidades de Leitura */}
          <div className="space-y-2 border-b pb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canRead"
                checked={canRead}
                onCheckedChange={(checked) => {
                  setCanRead(checked === true);
                  if (checked === false) setReadingLevel(undefined);
                  handleContextUpdate();
                }}
              />
              <Label htmlFor="canRead" className="text-sm font-medium cursor-pointer">
                Criança consegue ler?
              </Label>
            </div>

            {canRead && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="readingLevel" className="text-xs text-muted-foreground">
                  Nível de leitura:
                </Label>
                <Select value={readingLevel || ""} onValueChange={(val: any) => {
                  setReadingLevel(val);
                  handleContextUpdate();
                }}>
                  <SelectTrigger id="readingLevel" className="h-8 text-sm">
                    <SelectValue placeholder="Selecione nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico (letras/sílabas)</SelectItem>
                    <SelectItem value="nivel2">Nível 2 (palavras simples)</SelectItem>
                    <SelectItem value="nivel3">Nível 3 (frases/textos)</SelectItem>
                    <SelectItem value="fluente">Fluente (compreensão complexa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Habilidades de Escrita */}
          <div className="space-y-2 border-b pb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canWrite"
                checked={canWrite}
                onCheckedChange={(checked) => {
                  setCanWrite(checked === true);
                  handleContextUpdate();
                }}
              />
              <Label htmlFor="canWrite" className="text-sm font-medium cursor-pointer">
                Criança consegue escrever?
              </Label>
            </div>
          </div>

          {/* Habilidades de Linguagem */}
          <div className="space-y-2 border-b pb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVerbal"
                checked={isVerbal}
                onCheckedChange={(checked) => {
                  setIsVerbal(checked === true);
                  handleContextUpdate();
                }}
              />
              <Label htmlFor="isVerbal" className="text-sm font-medium cursor-pointer">
                Criança é verbal (consegue falar)?
              </Label>
            </div>
          </div>

          {/* Respondentes Disponíveis */}
          <div className="space-y-3 border-b pb-4">
            <Label className="text-sm font-medium">Quem está disponível para responder:</Label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="parentAvailable"
                checked={parentAvailable}
                onCheckedChange={(checked) => {
                  setParentAvailable(checked === true);
                  handleContextUpdate();
                }}
              />
              <Label htmlFor="parentAvailable" className="text-sm cursor-pointer">
                Pais/responsáveis
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="schoolAvailable"
                checked={schoolAvailable}
                onCheckedChange={(checked) => {
                  setSchoolAvailable(checked === true);
                  handleContextUpdate();
                }}
              />
              <Label htmlFor="schoolAvailable" className="text-sm cursor-pointer">
                Professor/escola
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="professionalAvailable"
                checked={professionalAvailable}
                onCheckedChange={(checked) => {
                  setProfessionalAvailable(checked === true);
                  if (checked === false) setProfessionalType(undefined);
                  handleContextUpdate();
                }}
              />
              <Label htmlFor="professionalAvailable" className="text-sm cursor-pointer">
                Profissional especializado
              </Label>
            </div>

            {professionalAvailable && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="professionalType" className="text-xs text-muted-foreground">
                  Tipo de profissional:
                </Label>
                <Select value={professionalType || ""} onValueChange={(val: string) => {
                  setProfessionalType(val);
                  handleContextUpdate();
                }}>
                  <SelectTrigger id="professionalType" className="h-8 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fonoaudiólogo">Fonoaudiólogo</SelectItem>
                    <SelectItem value="psicólogo">Psicólogo</SelectItem>
                    <SelectItem value="neuropsicólogo">Neuropsicólogo</SelectItem>
                    <SelectItem value="neuropediatra">Neuropediatra</SelectItem>
                    <SelectItem value="pediatra">Pediatra</SelectItem>
                    <SelectItem value="terapeuta_ocupacional">Terapeuta Ocupacional</SelectItem>
                    <SelectItem value="fisioterapeuta">Fisioterapeuta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            ℹ️ Essas informações ajudam a filtrar escalas apropriadas e evitar bloqueios desnecessários.
          </div>
        </CardContent>
      )}
    </Card>
  );
}
