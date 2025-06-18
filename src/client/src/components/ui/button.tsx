import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-sky-600 dark:text-sky-100 dark:hover:bg-sky-500",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-gray-400 bg-sky-50 hover:bg-sky-100 hover:text-sky-900 dark:border-gray-600 dark:bg-sky-800/50 dark:hover:bg-sky-700 dark:text-sky-100 dark:hover:text-sky-50",
        secondary: "bg-sky-50 text-sky-900 hover:bg-sky-100 dark:bg-sky-700 dark:text-sky-100 dark:hover:bg-sky-600",
        ghost: "hover:bg-sky-50 hover:text-sky-900 dark:hover:bg-sky-700 dark:hover:text-sky-100",
        link: "text-sky-500 underline-offset-4 hover:underline dark:text-sky-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
