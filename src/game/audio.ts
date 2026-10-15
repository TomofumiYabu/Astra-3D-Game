export class HotelAudio {
  private context?: AudioContext;
  enabled = false;

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {
        /* Audio may be blocked by browser policy. */
      });
      this.play('bell');
    }
    return this.enabled;
  }

  play(kind: 'launch' | 'impact' | 'bell') {
    if (!this.enabled || !this.context) return;
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    const start = ctx.currentTime;
    const duration = kind === 'bell' ? 0.7 : 0.25;
    oscillator.type = kind === 'impact' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(
      kind === 'bell' ? 880 : kind === 'launch' ? 260 : 90,
      start,
    );
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'bell' ? 660 : 35, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }
}
