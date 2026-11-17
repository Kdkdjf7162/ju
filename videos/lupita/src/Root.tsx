import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { DURATION, FPS } from "./script";

export const Root: React.FC = () => (
  <Composition id="Lupita" component={Video} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1080} height={1920} />
);
