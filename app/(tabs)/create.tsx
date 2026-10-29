import { FilePlus2 } from 'lucide-react-native';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function CreateContractScreen() {
  return (
    <PlaceholderScreen
      title="Crear contrato"
      description="El formulario guiado de cliente, evento, servicio y pagos se habilitará cuando el esquema esté validado."
      icon={FilePlus2}
    />
  );
}
