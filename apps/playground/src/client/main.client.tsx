import React, { StrictMode } from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";
import { Button } from "../shared/ui/button";

function Playground() {
  return (
    <frame className="h-full w-full flex-col items-center justify-center gap-4 bg-background">
      <Button Text="Default" onClick={() => print("default")} />
      <Button variant="secondary" Text="Secondary" />
      <Button variant="outline" Text="Outline" />
      <Button variant="destructive" Text="Destructive" />
      <Button variant="ghost" Text="Ghost" />
      <Button size="lg" Text="Large" />
      <Button disabled Text="Disabled" />
    </frame>
  );
}

const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui");
const root = createRoot(new Instance("Folder"));

root.render(
  <StrictMode>
    {createPortal(
      <screengui ResetOnSpawn={false} IgnoreGuiInset ZIndexBehavior={Enum.ZIndexBehavior.Sibling}>
        <Playground />
      </screengui>,
      playerGui,
    )}
  </StrictMode>,
);
