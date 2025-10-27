import { memo } from "react";

const Card = memo(({ className, children, ...props }) => {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export { Card };
