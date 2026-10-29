import { Settings } from 'lucide-react-native';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function SettingsScreen() {
  return (
    <PlaceholderScreen
      title="Ajustes"
      description="Aquí se administrarán el catálogo de paquetes, las versiones de la plantilla y los datos de marca."
      icon={Settings}
    />
  );
}
