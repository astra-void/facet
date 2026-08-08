import { PortalProvider } from "@lattice-ui/react-layer";
import React, { StrictMode } from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../shared/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "../shared/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../shared/ui/avatar";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../shared/ui/card";
import { Checkbox } from "../shared/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../shared/ui/dialog";
import { Kbd } from "../shared/ui/kbd";
import { Label } from "../shared/ui/label";
import { Progress } from "../shared/ui/progress";
import { RadioGroup, RadioGroupItem } from "../shared/ui/radio-group";
import { ScrollArea } from "../shared/ui/scroll-area";
import { Separator } from "../shared/ui/separator";
import { Skeleton } from "../shared/ui/skeleton";
import { Slider } from "../shared/ui/slider";
import { Switch } from "../shared/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../shared/ui/tabs";
import {
  TextField,
  TextFieldDescription,
  TextFieldInput,
  TextFieldLabel,
  TextFieldMessage,
} from "../shared/ui/text-field";
import { Textarea, TextareaInput, TextareaLabel } from "../shared/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "../shared/ui/toggle-group";

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

/**
 * One avatar with a source and one without: the first shows the image once it
 * loads, the second holds on its fallback initials forever — which is the only
 * way to see both sides of the load state at once.
 */
function Avatars() {
  return (
    <frame className="w-full flex-row items-center gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Avatar src="rbxthumb://type=AvatarHeadShot&id=1&w=48&h=48">
        <AvatarImage />
        <AvatarFallback Text="R" />
      </Avatar>
      <Avatar>
        <AvatarFallback Text="RF" />
      </Avatar>
    </frame>
  );
}

function Checkboxes() {
  return (
    <frame className="w-full flex-col gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <frame className="w-fit h-fit flex-row items-center gap-2">
        <Checkbox onCheckedChange={(checked) => print("checkbox", checked)} />
        <Label Text="Accept terms" />
      </frame>
      <frame className="w-fit h-fit flex-row items-center gap-2">
        <Checkbox defaultChecked="indeterminate" />
        <Label Text="Some selected" />
      </frame>
      <frame className="w-fit h-fit flex-row items-center gap-2">
        <Checkbox defaultChecked disabled />
        <Label Text="Locked on" />
      </frame>
    </frame>
  );
}

function Switches() {
  return (
    <frame className="w-full flex-row items-center gap-4" AutomaticSize={Enum.AutomaticSize.Y}>
      <Switch onCheckedChange={(checked) => print("switch", checked)} />
      <Switch defaultChecked />
      <Switch disabled />
    </frame>
  );
}

function Progresses() {
  return (
    <frame className="w-full flex-col gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Progress value={30} />
      {/* The sweep only proves itself by moving; a still frame of it looks
          like a stuck determinate bar. */}
      <Progress indeterminate />
    </frame>
  );
}

function Sliders() {
  return (
    <frame className="w-full flex-col gap-4" AutomaticSize={Enum.AutomaticSize.Y}>
      <Slider defaultValue={50} onValueCommit={(value) => print("slider", value)} />
      <Slider defaultValue={25} disabled />
    </frame>
  );
}

function ToggleGroups() {
  return (
    <frame className="w-full flex-row items-center gap-4" AutomaticSize={Enum.AutomaticSize.Y}>
      <ToggleGroup type="single" defaultValue="center">
        <ToggleGroupItem value="left" Text="Left" />
        <ToggleGroupItem value="center" Text="Center" />
        <ToggleGroupItem value="right" Text="Right" />
      </ToggleGroup>
      <ToggleGroup type="multiple" defaultValue={["bold"]}>
        <ToggleGroupItem value="bold" Text="B" />
        <ToggleGroupItem value="italic" Text="I" />
      </ToggleGroup>
    </frame>
  );
}

/**
 * `defaultValue` is not optional in practice: the styling mirror cannot see
 * the primitive's first-enabled-trigger fallback, so without one no trigger
 * would style as selected.
 */
function TabsDemo() {
  return (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account" Text="Account" />
        <TabsTrigger value="password" Text="Password" />
        <TabsTrigger value="admin" Text="Admin" disabled />
      </TabsList>
      <TabsContent value="account">
        <Label Text="Account settings live here." />
      </TabsContent>
      <TabsContent value="password">
        <Label Text="Password settings live here." />
      </TabsContent>
    </Tabs>
  );
}

function Accordions() {
  return (
    <Accordion type="single" collapsible defaultValue="what">
      <AccordionItem value="what">
        <AccordionTrigger Text="What is Facet?" />
        <AccordionContent Text="Copy-in components for roblox-ts, styled with Vela classes on Lattice behavior." />
      </AccordionItem>
      <AccordionItem value="why">
        <AccordionTrigger Text="Why copy instead of install?" />
        <AccordionContent Text="The source lands in your project, so restyling it is an edit rather than an override." />
      </AccordionItem>
    </Accordion>
  );
}

function TextFields() {
  return (
    <frame className="w-full flex-col gap-4" AutomaticSize={Enum.AutomaticSize.Y}>
      <TextField onValueCommit={(value) => print("text-field", value)}>
        <TextFieldLabel Text="Display name" />
        <TextFieldInput PlaceholderText="How others see you" />
        <TextFieldDescription Text="Shown on your profile." />
      </TextField>
      <TextField invalid defaultValue="not-an-email">
        <TextFieldLabel Text="Email" />
        <TextFieldInput invalid />
        <TextFieldMessage Text="That does not look like an email address." />
      </TextField>
    </frame>
  );
}

function Textareas() {
  return (
    <Textarea maxRows={6}>
      <TextareaLabel Text="Bio" />
      <TextareaInput PlaceholderText="A few lines about yourself" />
    </Textarea>
  );
}

function RadioGroups() {
  return (
    <RadioGroup defaultValue="normal" onValueChange={(value) => print("radio", value)}>
      <frame className="w-fit h-fit flex-row items-center gap-2">
        <RadioGroupItem value="easy" />
        <Label Text="Easy" />
      </frame>
      <frame className="w-fit h-fit flex-row items-center gap-2">
        <RadioGroupItem value="normal" />
        <Label Text="Normal" />
      </frame>
      <frame className="w-fit h-fit flex-row items-center gap-2">
        <RadioGroupItem value="hard" disabled />
        <Label Text="Hard (locked)" />
      </frame>
    </RadioGroup>
  );
}

/**
 * The first layered scene, so it is the first one whose interesting parts are
 * not on screen until something is clicked: the panel portals out of this tree
 * into `PlayerGui` under its own `ScreenGui`, above the dim.
 *
 * Two of them, because the dismissal paths differ. The first takes every one —
 * the corner ✕, the overlay, and a footer `DialogClose`. The second refuses the
 * outside press and drops the ✕, so the footer button is the only way out.
 */
function Dialogs() {
  return (
    <frame className="w-full flex-row items-center gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" Text="Open" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle Text="Sell this item?" />
            <DialogDescription Text="It leaves your inventory immediately. This cannot be undone." />
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button size="sm" variant="outline" Text="Cancel" />
            </DialogClose>
            <DialogClose asChild>
              <Button size="sm" variant="destructive" Text="Sell" />
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" Text="Open (insistent)" />
        </DialogTrigger>
        <DialogContent showClose={false} onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle Text="Read this first" />
            <DialogDescription Text="Clicking the dim does nothing here — the footer button is the only way out." />
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button size="sm" Text="Understood" />
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </frame>
  );
}

/**
 * The page itself is the scroll-area scene: the column below outgrew the
 * screen, so the whole gallery scrolls through one `ScrollArea` — if this
 * renders and scrolls, the component works.
 */
function Playground() {
  return (
    <frame className="h-full w-full flex-col items-center bg-background p-6">
      <ScrollArea className="w-96 h-full">
        <frame className="w-full flex-col gap-4 pb-6" AutomaticSize={Enum.AutomaticSize.Y}>
          <Label Text="Components" />
          <Separator />
          <Buttons />
          <Badges />
          <Keys />
          <Skeletons />
          <Alerts />
          <Avatars />
          <Checkboxes />
          <Switches />
          <Progresses />
          <Sliders />
          <ToggleGroups />
          <TabsDemo />
          <Accordions />
          <TextFields />
          <Textareas />
          <RadioGroups />
          <Dialogs />
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
      </ScrollArea>
    </frame>
  );
}

const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui");
const root = createRoot(new Instance("Folder"));

// `PortalProvider` wraps everything rather than just the dialog: Lattice reads
// it from a strict context to find the `BasePlayerGui` a layered component
// portals into, and every layered component after this one needs the same one.
root.render(
  <StrictMode>
    <PortalProvider container={playerGui as BasePlayerGui}>
      {createPortal(
        <screengui ResetOnSpawn={false} IgnoreGuiInset ZIndexBehavior={Enum.ZIndexBehavior.Sibling}>
          <Playground />
        </screengui>,
        playerGui,
      )}
    </PortalProvider>
  </StrictMode>,
);
