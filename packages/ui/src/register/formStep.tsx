import { useForm, SubmitHandler } from 'react-hook-form';
import { RoleType } from 'types/src/roles';
import styles from './styles.module.css';
import { LevelType } from 'types/src/levels';


interface FormProps {
  role: RoleType;
  level?: LevelType;
  onBack: () => void;
  onSubmit: (data: any) => void;
}

export default function FormStep({ role, onBack, onSubmit }: FormProps) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<any>();
  const isStudent = role === 'STUDENT';

  const handleForm: SubmitHandler<any> = (data) => {
    if (data.password !== data.confirmPassword) {
      alert('Senhas não coincidem.');
      return;
    }

    onSubmit({
      ...data,
      role,
      level: isStudent ? data.level : undefined,
      groupId: isStudent ? data.groupId : undefined,
    });
  };

  return (
    <div className={styles.formCard}>
        <form onSubmit={handleSubmit(handleForm)}>
      <h2>Registro de {role === 'STUDENT' ? 'Aluno' : 'Professor'}</h2>
      {/* Campos Nome, Email, Senha... */}
      {/* Campos de nível e grupoId se for STUDENT */}
      <div style={{ marginTop: 24 }}>
        <button type="button" onClick={onBack}>◀ Voltar</button>
        <button type="submit" style={{ marginLeft: 16 }}>Registrar</button>
      </div>
    </form>
    </div>
    
  );
}
