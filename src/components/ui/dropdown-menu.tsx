"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

// Base UI has no boolean `asChild` prop — it uses `render={<Element/>}` to
// merge the primitive's own props (data-slot, aria-*, event handlers) onto a
// caller-supplied element instead of rendering its own default tag. This
// translates the Radix-style `asChild` call site so Header.tsx doesn't need
// to change.
function useAsChild(asChild: boolean | undefined, children: React.ReactNode) {
  if (asChild && React.isValidElement(children)) {
    return { render: children as React.ReactElement, children: undefined }
  }
  return { render: undefined, children }
}

// Verified (via a forced `defaultOpen`) that Root/Portal/Positioner/Popup/
// Item/Label/Separator all render, position, and animate correctly — the
// only broken piece is the library's own internal click-to-open wiring
// (Menu.Trigger's useClick/floating-ui-react interaction), which never
// toggles the store in this composition despite a fully correct, trusted
// mousedown/mouseup/click sequence reaching the element. Driving open
// state explicitly here sidesteps that internal chain rather than
// depending on it; Escape/outside-click/item-selection closing still
// flows through Base UI's own onOpenChange, so it stays in sync.
const DropdownMenuToggleContext = React.createContext<(() => void) | null>(null)

function DropdownMenu({
  open: openProp,
  onOpenChange,
  defaultOpen,
  ...props
}: MenuPrimitive.Root.Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen

  const handleOpenChange = React.useCallback<NonNullable<MenuPrimitive.Root.Props["onOpenChange"]>>(
    (nextOpen, eventDetails) => {
      if (!isControlled) setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen, eventDetails)
    },
    [isControlled, onOpenChange]
  )

  const toggleOpen = React.useCallback(() => {
    const nextOpen = !open
    if (!isControlled) setUncontrolledOpen(nextOpen)
    // Synthetic toggle, not a real Base UI-originated event — eventDetails
    // isn't consumed by any onOpenChange in this codebase.
    onOpenChange?.(nextOpen, {} as MenuPrimitive.Root.ChangeEventDetails)
  }, [open, isControlled, onOpenChange])

  return (
    <DropdownMenuToggleContext.Provider value={toggleOpen}>
      <MenuPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props} />
    </DropdownMenuToggleContext.Provider>
  )
}

function DropdownMenuPortal({
  ...props
}: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: MenuPrimitive.Trigger.Props & { asChild?: boolean }) {
  const asChildProps = useAsChild(asChild, children)
  const toggleOpen = React.useContext(DropdownMenuToggleContext)
  const elementRef = React.useRef<HTMLButtonElement | null>(null)

  // A React onClick prop here never fires: something in Menu.Trigger's own
  // interaction wiring (useClick/floating-ui-react) stops the native
  // event's propagation at the target, so it never reaches the root
  // listener React's synthetic event system dispatches from — confirmed by
  // instrumenting both the prop and a raw addEventListener side by side.
  // A listener attached directly to the DOM node fires regardless, since
  // it doesn't depend on the event continuing to bubble anywhere.
  React.useEffect(() => {
    const element = elementRef.current
    if (!element || !toggleOpen) return
    const handleNativeClick = () => toggleOpen()
    element.addEventListener("click", handleNativeClick)
    return () => element.removeEventListener("click", handleNativeClick)
  }, [toggleOpen])

  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      ref={elementRef}
      {...asChildProps}
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  side,
  align,
  alignOffset,
  forceMount,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "side" | "align" | "alignOffset"> & {
    sideOffset?: number
    /** Radix-style prop kept so callers don't change; maps to Portal's keepMounted. */
    forceMount?: boolean
  }) {
  return (
    <MenuPrimitive.Portal keepMounted={forceMount}>
      <MenuPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--available-height) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  asChild,
  children,
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
  asChild?: boolean
}) {
  const asChildProps = useAsChild(asChild, children)
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...asChildProps}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.CheckboxItemIndicator>
          <Check className="size-4" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.RadioItemIndicator>
          <Circle className="size-2 fill-current" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

// Not a Menu.GroupLabel: that part requires a Menu.Group ancestor, and this
// project uses the label standalone (account name/email header, not tied to
// a group of items below it) — a plain div is the correct, safe mapping.
function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto size-4" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  sideOffset = 0,
  ...props
}: MenuPrimitive.Popup.Props & { sideOffset?: number }) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner side="right" align="start" sideOffset={sideOffset}>
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-sub-content"
          className={cn(
            "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
