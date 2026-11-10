import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { cn } from '@/lib/cn';

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl border border-border bg-surface p-5',
        className,
      )}>
      {title ? (
        <AppText className="text-lg font-semibold text-ink">{title}</AppText>
      ) : null}
      {description ? (
        <AppText className="mt-1 text-label text-ink-muted">{description}</AppText>
      ) : null}
      <View className={title || description ? 'mt-4' : undefined}>{children}</View>
    </View>
  );
}
