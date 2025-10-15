import { PersonManager } from '@/components/person-manager';
import {
  actualizarJoven,
  eliminarJoven,
  insertarJoven,
  obtenerJovenes,
} from '@/db/database';

export default function JovenesScreen() {
  return (
    <PersonManager
      title="Jovenes"
      entityLabel="joven"
      pluralLabel="jovenes"
      iconName="people-outline"
      subscriptionTable="jovenes"
      fetchAll={obtenerJovenes}
      onCreate={insertarJoven}
      onUpdate={actualizarJoven}
      onDelete={eliminarJoven}
    />
  );
}
