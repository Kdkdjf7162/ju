import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { TOTAL } from "./beats";
import { OneTake, TOTAL as TOTAL1 } from "./one/OneTake";

export const Root: React.FC = () => (
  <>
    <Composition id="GTA" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="GTAOne" component={OneTake} durationInFrames={TOTAL1} fps={30} width={1080} height={1920} />
  </>
);
