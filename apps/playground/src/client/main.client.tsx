import React, { StrictMode } from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";
import { Alert, AlertDescription, AlertTitle } from "../shared/ui/alert";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../shared/ui/card";
import { Kbd } from "../shared/ui/kbd";
import { Label } from "../shared/ui/label";
import { Separator } from "../shared/ui/separator";
import { Skeleton } from "../shared/ui/skeleton";

function Buttons() {
  return (
    <frame className="w-full flex-row items-center gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Button onClick={() => print("default")} Text="Default" />
      <Button variant="secondary" Text="Secondary" />
      <Button variant="outline" Text="Outline" />
      <Button variant="destructive" Text="Destructive" />
      <Button variant="ghost" Text="Ghost" />
      <Button disabled Text="Disabled" />
      {/* The bare child carries no styling of its own, so anything it ends up
          wearing came through `Slot` from the recipe. */}
      <Button asChild variant="secondary" size="sm">
        <textbutton key="AsChild" Text="AsChild" />
      </Button>
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

function Keys() {
  return (
    <frame className="w-full flex-row items-center gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Label Text="Press" />
      <Kbd Text="Ctrl" />
      <Kbd Text="E" />
      {/* A cap has to hold a word as readily as a letter, which is what
          `size-fit` plus padding is for. */}
      <Kbd Text="Backspace" />
    </frame>
  );
}

/**
 * Three lines of different widths, which is the only way to see whether a
 * skeleton is resolving its own size or inheriting one from the column.
 */
function Skeletons() {
  return (
    <frame className="w-full flex-col gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton />
      <Skeleton className="w-3/4" />
    </frame>
  );
}

function Alerts() {
  return (
    <frame className="w-full flex-col gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Alert>
        <AlertTitle Text="Heads up" />
        <AlertDescription Text="Nothing inherits here, so every part takes its own variant." />
      </Alert>
      <Alert variant="destructive">
        <AlertTitle variant="destructive" Text="Kicked" />
        <AlertDescription variant="destructive" Text="You were removed from the server." />
      </Alert>
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
        <Keys />
        <Skeletons />
        <Alerts />
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
