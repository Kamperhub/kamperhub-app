
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
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
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild: buttonOwnAsChild = false, ...otherProps }, ref) => {
    // Destructure any 'asChild' prop from otherProps to prevent it from being spread if it's not meant for the final element.
    // This is to handle cases where a parent (like Link) passes its own asChild.
    const { asChild: forwardedAsChild, ...remainingOtherProps } = otherProps;

    if (buttonOwnAsChild) {
      // If the Button's own asChild is true, it renders a Slot.
      // The Slot will take remainingOtherProps (which should include href, onClick from Link)
      // and apply them to its child. The 'forwardedAsChild' is intentionally not used here
      // as Slot handles its child composition based on the props it receives (like href).
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...remainingOtherProps} // Pass props like href, onClick to Slot's child
        />
      );
    }

    // If Button's own asChild is false, it renders a DOM button.
    // We ensure that 'forwardedAsChild' (if any was passed) is not spread here.
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...remainingOtherProps}
      />
    );
  }
);
Button.displayName = "Button"

export { Button, buttonVariants }
