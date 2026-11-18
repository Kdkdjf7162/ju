import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { TOTAL } from "./beats";
import { OneTake, TOTAL as TOTAL1 } from "./one/OneTake";
import { Why, TOTAL_WHY } from "./why/Why";

export const Root: React.FC = () => (
  <>
    <Composition id="GTA" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="GTAWhy" component={Why} durationInFrames={TOTAL_WHY} fps={30} width={1080} height={1920} />
    <Composition id="GTAOne" component={OneTake} durationInFrames={TOTAL1} fps={30} width={1080} height={1920} />
  </>
);
