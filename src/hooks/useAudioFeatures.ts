// src/hooks/useAudioFeatures.ts
import { useRef, useState } from "react";

export type FeatureFrame = {
  t: number;      // ms
  rms: number;    // loudness proxy
  ste: number;    // short-time energy (unnormalized)
  zcr: number;    // zero-crossing rate
  centroid: number; // spectral centroid (Hz-ish)
  f0: number;     // pitch Hz (0 if unvoiced)
};

export type FeatureSummary = {
  durationSec: number;
  volumeAvg: number;
  volumeVar: number;
  energyAvg: number;
  energyVar: number;
  pitchMean: number;
  pitchStd: number;
  jitter: number;
  shimmer: number;
  brightnessMean: number;
  brightnessStd: number;
  voicedRatio: number;
};

export function useAudioFeatures() {
  const [frames, setFrames] = useState<FeatureFrame[]>([]);
  const [summary, setSummary] = useState<FeatureSummary | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const startMsRef = useRef<number>(0);
  const rmsSeriesRef = useRef<number[]>([]);
  const cenSeriesRef = useRef<number[]>([]);
  const pitchSeriesRef = useRef<number[]>([]);
  const voicedCountRef = useRef<number>(0);

  async function ensureWorklet(ctx: AudioContext) {
    if ((ctx as any)._ryWorkletLoaded) return;
    const code = `
    class RYFeatureProcessor extends AudioWorkletProcessor {
      constructor(options){ super(); this.fs=sampleRate; this.frameSize=(options?.processorOptions?.frameSize)||1024; this.buf=new Float32Array(this.frameSize); this.i=0; }
      process(inputs, outputs, parameters){
        const ch = inputs[0]?.[0]; if(!ch) return true;
        for(let k=0;k<ch.length;k++){
          this.buf[this.i++] = ch[k];
          if(this.i>=this.frameSize){
            const f = this.compute(this.buf);
            this.port.postMessage({type:'frame', f});
            this.i=0;
          }
        }
        return true;
      }
      compute(x){
        const N=x.length, fs=this.fs;
        // RMS & STE
        let s2=0; for(let i=0;i<N;i++) s2+=x[i]*x[i];
        const ste=s2, rms=Math.sqrt(s2/N);
        // ZCR
        let zc=0; for(let i=1;i<N;i++){ const a=x[i-1],b=x[i]; if((a>=0&&b<0)||(a<0&&b>=0)) zc++; }
        const zcr=zc/N;
        // Centroid (coarse Goertzel sweep)
        const bins=64; let num=0,den=0;
        for(let k=1;k<=bins;k++){
          const w=2*Math.PI*k/N;
          let re=0, im=0;
          for(let n=0;n<N;n++){ const c=Math.cos(w*n), s=Math.sin(w*n); re+=x[n]*c; im-=x[n]*s; }
          const mag=re*re+im*im; const freq=(k*fs)/(2*bins); num+=freq*mag; den+=mag;
        }
        const centroid = den>1e-9 ? num/den : 0;
        // Pitch via ACF 60..400 Hz
        const y = new Float32Array(N); let m=0; for(let i=0;i<N;i++) m+=x[i]; m/=N;
        for(let i=0;i<N;i++) y[i]=x[i]-m;
        const minLag=Math.floor(fs/400), maxLag=Math.floor(fs/60);
        let bestLag=-1, best=0;
        for(let lag=minLag; lag<=maxLag; lag++){
          let s=0; for(let i=0;i<N-lag;i++) s+=y[i]*y[i+lag];
          if(s>best){best=s; bestLag=lag;}
        }
        let e0=0; for(let i=0;i<N;i++) e0+=y[i]*y[i];
        const r = e0>1e-9 ? best/e0 : 0;
        const f0 = (bestLag>0 && r>0.3) ? fs/bestLag : 0;
        return {t: currentTime*1000, rms, ste, zcr, centroid, f0};
      }
    }
    registerProcessor('ry-feature-processor', RYFeatureProcessor);`;
    const blob = new Blob([code], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    await ctx.audioWorklet.addModule(url);
    (ctx as any)._ryWorkletLoaded = true;
  }

  async function start(stream: MediaStream) {
    // reset
    setFrames([]); setSummary(null);
    rmsSeriesRef.current = []; cenSeriesRef.current = []; pitchSeriesRef.current = [];
    voicedCountRef.current = 0;
    const ctx = new AudioContext({ sampleRate: 48000 });
    await ensureWorklet(ctx);
    const src = ctx.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(ctx, "ry-feature-processor", {
      numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1,
      processorOptions: { frameSize: 1024 }
    });
    src.connect(node).connect(ctx.destination); // keep graph alive
    startMsRef.current = performance.now();
    node.port.onmessage = (ev) => {
      const f = ev.data?.f as FeatureFrame;
      if (!f) return;
      setFrames(prev => prev.length < 2000 ? [...prev, f] : prev);
      rmsSeriesRef.current.push(f.rms);
      cenSeriesRef.current.push(f.centroid);
      if (f.f0 > 0) { pitchSeriesRef.current.push(f.f0); voicedCountRef.current++; }
    };
    ctxRef.current = ctx; nodeRef.current = node;
  }

  function stop() {
    nodeRef.current?.disconnect();
    if (ctxRef.current) { try { ctxRef.current.close(); } catch {} }
    nodeRef.current = null; ctxRef.current = null;
  }

  function finalize() {
    const dur = (performance.now() - startMsRef.current) / 1000;
    const rms = rmsSeriesRef.current, cen = cenSeriesRef.current, f0 = pitchSeriesRef.current;
    const mean = (a:number[]) => a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
    const variance = (a:number[], m:number) => a.reduce((s,v)=>s+(v-m)*(v-m),0)/Math.max(1,a.length);
    const volumeAvg = mean(rms), volumeVar = variance(rms, volumeAvg);
    const energyAvg = mean(frames.map(f=>f.ste)), energyVar = variance(frames.map(f=>f.ste), energyAvg);
    const pitchMean = f0.length ? mean(f0) : 0;
    const pitchStd = f0.length ? Math.sqrt(variance(f0, pitchMean)) : 0;
    const brightnessMean = mean(cen);
    const brightnessStd = Math.sqrt(variance(cen, brightnessMean));
    // jitter/shimmer
    let jitter=0; if (f0.length>2 && pitchMean>0){ let s=0; for(let i=1;i<f0.length;i++) s+=Math.abs(f0[i]-f0[i-1]); jitter = (s/(f0.length-1))/pitchMean; }
    let shimmer=0; if (rms.length>2 && volumeAvg>0){ let s=0; for(let i=1;i<rms.length;i++) s+=Math.abs(rms[i]-rms[i-1]); shimmer = (s/(rms.length-1))/volumeAvg; }
    setSummary({
      durationSec: dur, volumeAvg, volumeVar, energyAvg, energyVar,
      pitchMean, pitchStd, jitter, shimmer,
      brightnessMean, brightnessStd,
      voicedRatio: frames.length ? (voicedCountRef.current/frames.length) : 0,
    });
  }

  return { start, stop, finalize, frames, summary };
}
