import { Text, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

type AppTextProps = TextProps & {
  className?: string;
};

export function AppText({ className, ...props }: AppTextProps) {
  return <Text className={cn('text-base text-ink', className)} {...props} />;
}
