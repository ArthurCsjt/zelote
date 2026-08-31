/**
 * Utilitário de feedback sonoro e háptico (Beep + Vibração)
 * Utiliza a Web Audio API nativa para gerar sons na memória sem necessidade de arquivos externos.
 */
class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    return this.ctx;
  }

  /**
   * Toca um beep curto e agradável de sucesso (80ms, 1050Hz)
   */
  playSuccessBeep(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, now);

      // Volume inicial suave com fade-out rápido
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Falha silenciosa caso o navegador restrinja áudio
    }
  }

  /**
   * Toca um tom duplo grave de aviso (código já escaneado / alerta)
   */
  playWarningBeep(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Falha silenciosa
    }
  }

  /**
   * Executa vibração háptica no dispositivo se suportado
   */
  vibrate(pattern: number | number[] = 100): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  /**
   * Feedback completo de Sucesso: Beep + 1 vibração de 100ms
   */
  triggerSuccessFeedback(): void {
    this.playSuccessBeep();
    this.vibrate(100);
  }

  /**
   * Feedback completo de Aviso/Repetido: Tom grave + 3 vibrações rápidas
   */
  triggerWarningFeedback(): void {
    this.playWarningBeep();
    this.vibrate([50, 50, 50]);
  }
}

export const soundEffects = new SoundEffects();
