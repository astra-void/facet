import React, { StrictMode } from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../shared/ui/card";
import { Label } from "../shared/ui/label";
import { Separator } from "../shared/ui/separator";

function Buttons() {
  return (
    <frame className="w-full flex-row items-center gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Button onClick={() => print("default")} Text="Default" />
      <Button variant="secondary" Text="Secondary" />
      <Button variant="outline" Text="Outline" />
      <Button variant="destructive" Text="Destructive" />
      <Button variant="ghost" Text="Ghost" />
      <Button disabled Text="Disabled" />
      {/* No `asChild` case here on purpose: it errors at runtime until Lattice's
          `Slot` recognises modifier siblings. See docs/roadmap.md. */}
    </frame>
  );
}

function Badges() {
  return (
    <frame className="w-full flex-row items-center gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Badge Text="Default" />
      <Badge variant="secondary" Text="Secondary" />
      <Badge variant="destructive" Text="Destructive" />
      <Badge variant="outline" Text="Outline" />
    </frame>
  );
}

function Playground() {
  return (
    <frame className="h-full w-full flex-col items-center justify-center gap-4 bg-background p-6">
      <frame className="w-96 flex-col gap-4" AutomaticSize={Enum.AutomaticSize.Y}>
        <Label Text="Components" />
        <Separator />
        <Buttons />
        <Badges />
        <Card>
          <CardHeader>
            <CardTitle Text="Shop" />
            <CardDescription Text="Everything here is a copied-in component, styled only by Vela classes." />
          </CardHeader>
          <CardContent>
            <Label Text="Nothing for sale yet." />
          </CardContent>
          <CardFooter>
            <Button size="sm" Text="Buy" />
            <Button size="sm" variant="outline" Text="Cancel" />
          </CardFooter>
        </Card>
      </frame>
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
