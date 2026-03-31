'use client';

import * as React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { cn } from '@/lib/utils';
import { Dot } from 'lucide-react';

const InputOTP = React.forwardRef<React.ElementRef<typeof OTPInput>, React.ComponentPropsWithoutRef<typeof OTPInput>>(
    ({ className, containerClassName, ...props }, ref) => (
        <OTPInput
            ref={ref}
            containerClassName={cn('flex items-center gap-2 has-[:disabled]:opacity-50', containerClassName)}
            className={cn('disabled:cursor-not-allowed', className)}
            {...props}
        />
    )
);
InputOTP.displayName = 'InputOTP';

const InputOTPGroup = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center', className)} {...props} />
);
InputOTPGroup.displayName = 'InputOTPGroup';

const InputOTPSlot = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { index: number }>(
    ({ index, className, ...props }, ref) => {
        const inputOTPContext = React.useContext(OTPInputContext);
        const slot = inputOTPContext.slots[index];
        if (!slot) return null;

        return (
            <div
                ref={ref}
                className={cn(
                    'relative flex h-14 w-12 items-center justify-center border-y border-r border-input text-lg transition-all first:rounded-l-md first:border-l last:rounded-r-md',
                    slot.isActive && 'z-10 ring-2 ring-ring ring-offset-background',
                    className
                )}
                {...props}
            >
                {slot.char}
                {slot.hasFakeCaret && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="animate-caret-blink h-6 w-px bg-foreground duration-1000" />
                    </div>
                )}
            </div>
        );
    }
);
InputOTPSlot.displayName = 'InputOTPSlot';

const InputOTPSeparator = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
    ({ ...props }, ref) => (
        <div ref={ref} role="separator" {...props}>
            <Dot />
        </div>
    )
);
InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
