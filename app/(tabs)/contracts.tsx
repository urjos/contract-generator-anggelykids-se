import { ClipboardList } from 'lucide-react-native';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function ContractsScreen() {
  return (
    <PlaceholderScreen
      title="Contratos"
      description="Aquí podrás buscar, filtrar y revisar todos los contratos por cliente, fecha, servicio o estado."
      icon={ClipboardList}
    />
  );
}
