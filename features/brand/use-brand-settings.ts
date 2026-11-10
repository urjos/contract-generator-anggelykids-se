import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getBrandSettings, saveBrandSettings } from './brand-service';

export const brandKeys = {
  all: ['brand'] as const,
  settings: () => [...brandKeys.all, 'settings'] as const,
};

export function useBrandSettings() {
  return useQuery({
    queryKey: brandKeys.settings(),
    queryFn: getBrandSettings,
    staleTime: 30_000,
  });
}

export function useSaveBrandSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveBrandSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(brandKeys.settings(), data);
    },
  });
}
