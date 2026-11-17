import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SHOTS } from "./shots/Shots";
import { Captions, Finish } from "./overlays";
import { f } from "./script";
import { CUES } from "./sfx";

export const Video: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {SHOTS.map(({ t0, t1, C }, i) => (
      <Sequence key={i} from={f(t0)} durationInFrames={f(t1) - f(t0)}>
        <C len={f(t1) - f(t0)} />
      </Sequence>
    ))}
    <Finish />
    <Captions />
    {CUES.map((c, i) => (
      <Sequence key={"a" + i} from={f(c.t)} durationInFrames={Math.max(1, f(c.dur ?? 2))} layout="none">
        <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={c.vol ?? 1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
