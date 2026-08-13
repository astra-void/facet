import { PortalProvider } from "@lattice-ui/react-layer";
import React, { StrictMode } from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../shared/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "../shared/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../shared/ui/alert-dialog";
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
import { Kbd, KbdGroup } from "../shared/ui/kbd";
import { Label } from "../shared/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../shared/ui/popover";
import { Progress } from "../shared/ui/progress";
import { RadioGroup, RadioGroupItem } from "../shared/ui/radio-group";
import { ScrollArea } from "../shared/ui/scroll-area";
import { Separator } from "../shared/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../shared/ui/sheet";
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
      {/* The group is the shortcut; the caps inside it are the keys. `E` should
          come out square on `min-w-5` and `Backspace` a lozenge on `w-fit`,
          from the one recipe. */}
      <KbdGroup>
        <Kbd Text="Ctrl" />
        <Kbd Text="E" />
      </KbdGroup>
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
      {/* `size` has to reach the fallback too — the small one drops to `text-xs`
          and the other two hold at `text-sm`, which is the whole reason shadcn's
          `group-data-[size]` selector needed replacing with a second prop. */}
      <Avatar size="sm">
        <AvatarFallback size="sm" Text="S" />
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback size="lg" Text="L" />
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
 *
 * Every trigger and close in the layered scenes spells out `button`'s
 * `size="sm"` recipe as a literal class string rather than reaching for
 * `asChild` around a `<Button>`, for two reasons Studio turned up:
 *
 *  - `asChild` around a *component* loses the primitive's behaviour. `Slot`
 *    rewrites the `Event` table into React's tag-keyed props, those keys are
 *    tables, and a component's `getPassthroughProps` skips every non-string
 *    key — so the handler that opens the dialog never reaches the instance.
 *    `asChild` onto a bare host element is unaffected; that is the case the
 *    roadmap verified.
 *  - the class has to be a literal, not a `const` holding the same string.
 *    Vela resolves a `className` on a component call site at compile time, and
 *    wraps a computed one in its runtime host, but a bare identifier is
 *    neither: it is dropped, and the trigger renders zero by zero.
 */
function Dialogs() {
  return (
    <frame className="w-full flex-row items-center gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Dialog>
        <DialogTrigger
          className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium text-foreground"
          Text="Open"
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle Text="Sell this item?" />
            <DialogDescription Text="It leaves your inventory immediately. This cannot be undone." />
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium text-foreground"
              Text="Cancel"
            />
            <DialogClose
              className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md bg-destructive hover:bg-destructive/90 text-sm font-medium text-destructive-foreground"
              Text="Sell"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger
          className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium text-foreground"
          Text="Open (insistent)"
        />
        <DialogContent showCloseButton={false} onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle Text="Read this first" />
            <DialogDescription Text="Clicking the dim does nothing here — the footer button is the only way out." />
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md bg-primary hover:bg-primary/90 text-sm font-medium text-primary-foreground"
              Text="Understood"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </frame>
  );
}

/**
 * What Studio has to answer here is whether the dim really swallows the press:
 * the second frame under `AlertDialogContent` is both the scrim and the
 * outside-press boundary, so clicking anywhere off the panel should do nothing
 * at all — no close, and no flicker.
 */
function AlertDialogs() {
  return (
    <frame className="w-full flex-row items-center gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <AlertDialog>
        <AlertDialogTrigger
          className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium text-foreground"
          Text="Delete save"
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle Text="Delete this save file?" />
            <AlertDialogDescription Text="Every item, every stat, gone. Clicking the dim will not get you out of this one." />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm" Text="Keep it" />
            <AlertDialogAction size="sm" variant="destructive" Text="Delete" onClick={() => print("deleted")} />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </frame>
  );
}

/** One trigger per side, because the geometry is the only thing `side` changes. */
function Sheets() {
  return (
    <frame className="w-full flex-row items-center gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Sheet>
        <SheetTrigger
          className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium text-foreground"
          Text="Right"
        />
        <SheetContent>
          <SheetHeader>
            <SheetTitle Text="Settings" />
            <SheetDescription Text="Pinned to the right edge, full height." />
          </SheetHeader>
          <SheetFooter>
            <SheetClose
              className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md bg-primary hover:bg-primary/90 text-sm font-medium text-primary-foreground"
              Text="Done"
            />
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger
          className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium text-foreground"
          Text="Left"
        />
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle Text="Inventory" />
            <SheetDescription Text="Same panel, other edge." />
          </SheetHeader>
        </SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger
          className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium text-foreground"
          Text="Bottom"
        />
        {/* `h-fit` on this side, so the panel is only as tall as what is in it —
            the axis to watch when the header text wraps. */}
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle Text="Quick actions" />
            <SheetDescription Text="Spans the width and hugs its own height." />
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </frame>
  );
}

/**
 * The first scene whose panel is placed against something in *this* tree rather
 * than against the screen, so it is the first where the portal boundary is
 * visible: the trigger stays in the scrolling column, the panel leaves for its
 * own `ScreenGui`, and the popper is what keeps them together.
 *
 * One trigger per side, because `placement` is the only thing that moves. Three
 * of the four are worth watching for different reasons:
 *
 *  - `bottom` is the default, and the one whose 4px `sideOffset` should read as
 *    a visible gap rather than a seam.
 *  - `top` is the collision case. These triggers sit low in a scrolling column,
 *    so a panel opening upward is the one that should get nudged back inside
 *    the screen by `collisionPadding` rather than clipping off it.
 *  - `right` is the cross-axis case: Lattice's popper centres on the axis it is
 *    not placing against, so this panel should straddle the trigger's midline —
 *    there is no `align="start"` to ask for anything else.
 *
 * The column scrolls, which is the other thing to watch: an open panel has to
 * follow its trigger when the page moves under it, or drift off it.
 */
function Popovers() {
  return (
    <frame className="w-full flex-row items-center gap-2" AutomaticSize={Enum.AutomaticSize.Y}>
      <Popover>
        <PopoverTrigger
          className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium text-foreground"
          Text="Below"
        />
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle Text="Server region" />
            <PopoverDescription Text="Players are matched to the closest region first." />
          </PopoverHeader>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger
          className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium text-foreground"
          Text="Above"
        />
        <PopoverContent placement="top">
          <PopoverHeader>
            <PopoverTitle Text="Opens upward" />
            <PopoverDescription Text="And gets pushed back on screen when there is no room up there." />
          </PopoverHeader>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger
          className="flex-row items-center justify-center w-fit h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium text-foreground"
          Text="Beside"
        />
        <PopoverContent placement="right" sideOffset={8}>
          <PopoverHeader>
            <PopoverTitle Text="Centred on the trigger" />
            <PopoverDescription Text="`alignOffset` is the only way to shift it up or down from here." />
          </PopoverHeader>
        </PopoverContent>
      </Popover>
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
          <AlertDialogs />
          <Sheets />
          <Popovers />
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
