import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * MealVote Button
 * - default     primary brown CTA
 * - secondary   soft cream surface
 * - ghost       low-emphasis text action
 * - chain       amber highlight for blockchain actions
 * - outline     bordered neutral action
 * - destructive destructive action
 */
const buttonVariants = cva(
  [
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl text-[15px] font-bold",
    "min-h-[44px] px-5 py-2.5",
    "transition-[transform,box-shadow,background-color,border-color] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50"
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border border-[rgba(125,68,29,0.18)] bg-primary text-primary-foreground",
          "shadow-sketch-sm hover:-translate-y-0.5 hover:bg-[hsl(24_66%_30%)] hover:shadow-sketch",
          "active:translate-y-0 active:shadow-sketch-active"
        ].join(" "),
        secondary: [
          "border border-border bg-secondary text-secondary-foreground",
          "shadow-[0_10px_24px_rgba(76,49,28,0.08)] hover:-translate-y-0.5 hover:bg-card hover:shadow-sketch-sm",
          "active:translate-y-0 active:shadow-[0_6px_16px_rgba(76,49,28,0.08)]"
        ].join(" "),
        ghost: [
          "border border-transparent bg-transparent text-foreground",
          "hover:bg-secondary/70 hover:text-primary"
        ].join(" "),
        chain: [
          "border border-[rgba(186,110,39,0.22)] bg-accent text-accent-foreground",
          "shadow-sketch-gold hover:-translate-y-0.5 hover:bg-[hsl(30_80%_48%)] hover:shadow-[0_20px_42px_rgba(186,110,39,0.26)]",
          "active:translate-y-0 active:shadow-[0_10px_20px_rgba(186,110,39,0.2)]"
        ].join(" "),
        outline: [
          "border border-border bg-card/70 text-foreground",
          "hover:-translate-y-0.5 hover:bg-white hover:shadow-sketch-sm",
          "active:translate-y-0"
        ].join(" "),
        destructive: [
          "border border-[rgba(191,36,36,0.2)] bg-destructive text-destructive-foreground",
          "shadow-[0_14px_34px_rgba(180,54,54,0.2)] hover:-translate-y-0.5 hover:bg-[hsl(0_72%_47%)]",
          "active:translate-y-0"
        ].join(" ")
      },
      size: {
        default: "text-[15px]",
        sm: "min-h-[38px] px-4 py-2 text-[13px]",
        lg: "min-h-[52px] px-7 py-3 text-[17px]",
        icon: "h-11 w-11 p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
