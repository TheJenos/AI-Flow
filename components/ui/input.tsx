import { cn } from "@/lib/utils"
import { ChangeEvent, InputHTMLAttributes } from "react"
import { cva, VariantProps } from "class-variance-authority"
import HighlightWithinTextarea from "react-highlight-within-textarea"
import { headlights } from "@/lib/logics"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&_div]:h-full [&_.DraftEditor-root]:flex-1",
  {
    variants: {
      sizeHeight: {
        medium: "h-10",
        small: "h-8",
      },
    },
    defaultVariants: {
      sizeHeight: 'medium'
    },
  }
)

export type InputProps = InputHTMLAttributes<HTMLInputElement>  & VariantProps<typeof inputVariants> & {
  valueHighlights?: boolean
}

export function Input({ className, value, onChange, sizeHeight, placeholder, readOnly, valueHighlights, ...props }: InputProps ) {

  if (valueHighlights) 
  return (
    <div className={cn(inputVariants({ sizeHeight }), className)} >
        <HighlightWithinTextarea highlight={headlights} placeholder={placeholder} readOnly={readOnly} value={value?.toString() || ''} onChange={(value) => onChange && onChange({ target: { value } } as ChangeEvent<HTMLInputElement>)} />
    </div>
  )

  return (
    <input
      className={cn(inputVariants({ sizeHeight }), className)}
      {...{value, onChange, placeholder, readOnly}}
      {...props}
    />
  )
}