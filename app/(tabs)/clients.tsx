import { Users } from 'lucide-react-native';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function ClientsScreen() {
  return (
    <PlaceholderScreen
      title="Clientes"
      description="Los clientes se reutilizarán entre contratos para evitar duplicados y conservar su historial."
      icon={Users}
    />
  );
}
