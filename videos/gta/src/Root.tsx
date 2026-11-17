import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { TOTAL } from "./beats";

export const Root: React.FC = () => <Composition id="GTA" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />;
