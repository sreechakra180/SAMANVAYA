import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

const tw = (...args: Array<string | false | null | undefined>) => twMerge(args.filter(Boolean).join(' '))

export const cn = tw