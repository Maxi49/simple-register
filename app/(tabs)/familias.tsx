import { PersonManager } from '@/components/person-manager';
import {
  actualizarFamilia,
  eliminarFamilia,
  insertarFamilia,
  obtenerFamilias,
} from '@/db/database';

export default function FamiliasScreen() {
  return (
    <PersonManager
      title="Familias"
      entityLabel="familia"
      pluralLabel="familias"
      iconName="home-outline"
      subscriptionTable="familias"
      fetchAll={obtenerFamilias}
      onCreate={insertarFamilia}
      onUpdate={actualizarFamilia}
      onDelete={eliminarFamilia}
    />
  );
}
