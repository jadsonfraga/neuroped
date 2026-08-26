import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { KeyRound, Volume2, VolumeX, Vibrate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUiPreferences } from "@/hooks/useUiPreferences";
import { softTap } from "@/lib/softSounds";
import { easing } from "@/lib/motion";
import { changePasswordRequest } from "@/lib/authClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OPEN_PREFERENCES_EVENT = "neuroped:open-preferences";

/**
 * Preferências de UI abertas sob demanda pelo centro único de ajuda.
 * Em sessão remota, também concentra a segurança da conta sem criar outra
 * superfície de navegação. `mustChangePassword` torna o diálogo não dispensável
 * até a troca ser concluída no backend canônico.
 */
export function PreferencesPanel() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const {
    soundOn,
    soundVolume,
    hapticOn,
    toggleSound,
    updateSoundVolume,
    toggleHaptic,
  } = useUiPreferences();
  const { accessMode, isAuthenticated, user } = useAuth();
  const remoteAccount = accessMode === "remote" && isAuthenticated;
  const passwordChangeRequired =
    remoteAccount && Boolean(user?.mustChangePassword);

  useEffect(() => {
    const openPreferences = () => setOpen(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, openPreferences);
    return () =>
      window.removeEventListener(OPEN_PREFERENCES_EVENT, openPreferences);
  }, []);

  useEffect(() => {
    if (passwordChangeRequired) setOpen(true);
  }, [passwordChangeRequired]);

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("A confirmação da nova senha não confere.");
      return;
    }
    if (newPassword.length < 12) {
      setPasswordError("A nova senha deve ter pelo menos 12 caracteres.");
      return;
    }

    setChangingPassword(true);
    try {
      await changePasswordRequest(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // authClient já substituiu access/refresh/user pela nova família emitida
      // pelo servidor. Reload reidrata o AuthContext sem manter o flag antigo.
      window.location.reload();
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Não foi possível trocar a senha.",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (passwordChangeRequired && !nextOpen) return;
        setOpen(nextOpen);
      }}
    >
      <DialogContent
        className="max-h-[88vh] max-w-sm overflow-y-auto rounded-2xl p-0"
        data-testid="preferences-panel"
      >
        <DialogHeader className="border-b border-card-border px-4 py-4 pr-12 text-left">
          <DialogTitle>
            {passwordChangeRequired
              ? "Troca de senha obrigatória"
              : "Preferências"}
          </DialogTitle>
          <DialogDescription>
            {passwordChangeRequired
              ? "Defina uma senha nova antes de continuar usando a sessão remota."
              : "Ajuste a interface e, em sessão remota, a segurança da sua conta."}
          </DialogDescription>
        </DialogHeader>

        {remoteAccount && (
          <form
            className="space-y-3 border-b border-card-border p-4"
            onSubmit={handlePasswordChange}
            data-testid="remote-password-change-form"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">Segurança da conta</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  A troca revoga as sessões de atualização anteriores e emite
                  uma família nova de tokens.
                </p>
              </div>
            </div>

            <label
              className="block space-y-1"
              htmlFor="account-current-password"
            >
              <span className="text-xs font-medium">Senha atual</span>
              <Input
                id="account-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                maxLength={256}
              />
            </label>
            <label className="block space-y-1" htmlFor="account-new-password">
              <span className="text-xs font-medium">Nova senha</span>
              <Input
                id="account-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={12}
                maxLength={128}
                aria-describedby="account-password-policy"
              />
            </label>
            <label
              className="block space-y-1"
              htmlFor="account-confirm-password"
            >
              <span className="text-xs font-medium">Confirmar nova senha</span>
              <Input
                id="account-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={12}
                maxLength={128}
              />
            </label>
            <p
              id="account-password-policy"
              className="text-[10px] leading-relaxed text-muted-foreground"
            >
              Use 12–128 caracteres com maiúscula, minúscula, número e símbolo.
              A nova senha deve ser diferente da atual.
            </p>
            {passwordError && (
              <p
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive"
                role="alert"
              >
                {passwordError}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              data-testid="button-change-password"
            >
              {changingPassword
                ? "Trocando senha…"
                : "Trocar senha e renovar sessão"}
            </Button>
          </form>
        )}

        {!passwordChangeRequired && (
          <div className="p-2">
            <PrefRow
              icon={soundOn ? Volume2 : VolumeX}
              label="Sons da interface"
              description="Toques sutis ao clicar e navegar"
              on={soundOn}
              onToggle={toggleSound}
              feedback={false}
            />
            <div className="px-3 pb-3 pt-0" data-testid="sound-volume-control">
              <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
                <label
                  htmlFor="sound-volume"
                  className="font-medium text-muted-foreground"
                >
                  Intensidade do som
                </label>
                <span
                  className="tabular-nums text-muted-foreground"
                  aria-live="polite"
                >
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
              <input
                id="sound-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={soundVolume}
                onChange={(event) =>
                  updateSoundVolume(Number(event.target.value))
                }
                disabled={!soundOn}
                aria-label="Intensidade dos sons da interface"
                className="h-1.5 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                data-testid="range-sound-volume"
              />
              <div className="mt-1 flex justify-between text-[9px] text-muted-foreground/80">
                <span>Silencioso</span>
                <span>Discreto</span>
                <span>Máximo</span>
              </div>
            </div>
            <PrefRow
              icon={Vibrate}
              label="Vibração tátil"
              description="Feedback no celular, quando disponível"
              on={hapticOn}
              onToggle={toggleHaptic}
            />
          </div>
        )}

        <div className="border-t border-card-border p-3">
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Preferências visuais ficam neste dispositivo. Senhas nunca são
            persistidas pelo NeuroPed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PrefRow({
  icon: Icon,
  label,
  description,
  on,
  onToggle,
  feedback,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  on: boolean;
  onToggle: () => void;
  feedback?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        if (feedback !== false) softTap();
        onToggle();
      }}
      className="flex min-h-14 w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: on ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
          color: on ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
        }}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{
          background: on ? "hsl(var(--primary))" : "hsl(var(--muted))",
        }}
        aria-hidden="true"
      >
        <motion.div
          animate={{ x: on ? 16 : 2 }}
          transition={{ duration: 0.2, ease: easing.smooth }}
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
        />
      </div>
    </button>
  );
}
