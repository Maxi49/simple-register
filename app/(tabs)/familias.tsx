import { FamilyManager } from '@/components/family-manager';
import {
  actualizarFamilia,
  eliminarFamilia,
  insertarFamilia,
  obtenerFamilias,
} from '@/db/database';

export default function FamiliasScreen() {
  return (
    <FamilyManager
      fetchAll={obtenerFamilias}
      onCreate={insertarFamilia}
      onUpdate={actualizarFamilia}
      onDelete={eliminarFamilia}
    />
  );
}
