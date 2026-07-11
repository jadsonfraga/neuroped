import { useState } from "react";
import { MessageCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { haptic } from "@/lib/haptic";
import { softSuccess, softTap } from "@/lib/softSounds";

interface WhatsAppShareProps {
  scaleName: string;
  reportText: string;
  totalScore?: number;
}

function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, "");
  // If it's a Brazilian number (11 digits starting with 55 or not), format it
  if (digits.length === 11 && !digits.startsWith("55")) {
    return `55${digits}`;
  }
  if (digits.length === 13 && digits.startsWith("55")) {
    return digits;
  }
  if (digits.length >= 10) {
    return digits;
  }
  return "";
}

function isValidPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return formatted.length >= 10 && /^\d{10,15}$/.test(formatted);
}

export function WhatsAppShare({ scaleName, reportText, totalScore }: WhatsAppShareProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    softTap();
    haptic.tap();

    if (!isValidPhone(phone)) {
      toast({
        title: "Número inválido",
        description: "Digite um número de WhatsApp válido (ex: 85 98765-4321)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formatted = formatPhoneNumber(phone);
      const scoreLine = totalScore === undefined || totalScore === null ? "" : `Pontuação: ${totalScore}\n\n`;
      const message = `*${scaleName}*\n\n${scoreLine}${reportText.slice(0, 3000)}\n\n📱 NeuroPed — Escalas de Neuropediatria`;

      // Try to send via API first (if backend supports it)
      try {
        await fetch("/api/send-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: formatted,
            message,
          }),
        });
      } catch {
        // Fallback: Open WhatsApp web
        const whatsappUrl = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
      }

      softSuccess();
      haptic.success();
      setSent(true);
      toast({
        title: "Enviado!",
        description: "Relatório compartilhado com sucesso.",
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setPhone("");
        setSent(false);
      }, 3000);
    } catch (_error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente ou copie o relatório manualmente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-foreground">
            Compartilhar com a Mãe via WhatsApp
          </h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Informe o número de WhatsApp para receber o resultado da avaliação.
        </p>

        {sent ? (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Relatório enviado!
            </span>
          </div>
        ) : (
          <form onSubmit={handleSendWhatsApp} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="whatsapp" className="text-sm font-medium text-foreground">
                WhatsApp da Mãe
              </label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(85) 98765-4321 ou 5585987654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="h-10"
                autoComplete="tel"
              />
              <p className="text-xs text-muted-foreground">
                Número com DDD (Brasil). Pode incluir parênteses, traços e espaços.
              </p>
            </div>

            <Button
              type="submit"
              disabled={!phone || loading || !isValidPhone(phone)}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  Enviar pelo WhatsApp
                </>
              )}
            </Button>

            {phone && !isValidPhone(phone) && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Número inválido. Digite apenas números ou use: (XX) XXXXX-XXXX
              </p>
            )}
          </form>
        )}

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3">
          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            <strong>Privacidade:</strong> O número é usado apenas para este compartilhamento.
            Não é salvo em nossos servidores.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
