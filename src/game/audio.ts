export class ThrowAudio {
  private context?: AudioContext;
  private lastImpact = -1;
  enabled = false;
  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {
        /* Audio is optional. */
      });
      this.play('bell');
    }
    return this.enabled;
  }
  play(kind: 'launch' | 'impact' | 'bell', chain = false) {
    if (!this.enabled || !this.context) return;
    const ctx = this.context,
      start = ctx.currentTime;
    if (kind === 'impact' && start - this.lastImpact < 0.065) return;
    if (kind === 'impact') this.lastImpact = start;
    const duration = kind === 'bell' ? 0.55 : kind === 'launch' ? 0.4 : 0.3;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = kind === 'impact' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(
      kind === 'bell' ? 660 : kind === 'launch' ? 180 : chain ? 150 : 80,
      start,
    );
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'bell' ? 990 : 28, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.start(start);
    oscillator.stop(start + duration);
    if (kind !== 'bell') {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const noise = ctx.createBufferSource(),
        filter = ctx.createBiquadFilter(),
        volume = ctx.createGain();
      noise.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.value = kind === 'launch' ? 1300 : 2800;
      volume.gain.value = 0.13;
      noise.connect(filter);
      filter.connect(volume);
      volume.connect(ctx.destination);
      noise.start(start);
    }
  }
  dispose() {
    void this.context?.close();
  }
}
