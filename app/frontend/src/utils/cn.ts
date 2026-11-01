import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tail purged utility — single source of truth for class composition. */
export const cn = (...args: Array<string | false | null | undefined>) =>
  twMerge(args.filter(Boolean).join(' '))