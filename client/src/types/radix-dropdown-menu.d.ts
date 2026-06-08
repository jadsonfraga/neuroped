declare module "@radix-ui/react-dropdown-menu" {
  import * as React from "react";

  type AnyProps = React.HTMLAttributes<HTMLElement> & {
    asChild?: boolean;
    checked?: boolean;
    disabled?: boolean;
    forceMount?: true;
    loop?: boolean;
    modal?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
    align?: "start" | "center" | "end";
    alignOffset?: number;
    value?: string;
    onValueChange?: (value: string) => void;
  };

  type PrimitiveComponent = React.ForwardRefExoticComponent<AnyProps & React.RefAttributes<HTMLElement>> & {
    displayName?: string;
  };

  export const Root: React.FC<AnyProps>;
  export const Trigger: PrimitiveComponent;
  export const Group: React.FC<AnyProps>;
  export const Portal: React.FC<AnyProps>;
  export const Sub: React.FC<AnyProps>;
  export const RadioGroup: React.FC<AnyProps>;
  export const SubTrigger: PrimitiveComponent;
  export const SubContent: PrimitiveComponent;
  export const Content: PrimitiveComponent;
  export const Item: PrimitiveComponent;
  export const CheckboxItem: PrimitiveComponent;
  export const RadioItem: PrimitiveComponent;
  export const Label: PrimitiveComponent;
  export const Separator: PrimitiveComponent;
  export const ItemIndicator: PrimitiveComponent;
}
