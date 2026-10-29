import type { ReactNode } from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

type ScreenProps = {
  children: ReactNode;
  className?: string;
  edges?: readonly Edge[];
};

const DEFAULT_EDGES: readonly Edge[] = ['top', 'left', 'right'];

export function Screen({ children, className, edges = DEFAULT_EDGES }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-canvas', className)}>
      {children}
    </SafeAreaView>
  );
}
