import React from "react";
import { Composition } from "remotion";
import { Short, END } from "./Short";

export const Root: React.FC = () => (
  <Composition id="Short" component={Short} durationInFrames={END} fps={30} width={1080} height={1920} />
);
