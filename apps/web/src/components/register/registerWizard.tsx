import { useState } from 'react';
import RoleStep from './roleStep';
import FormStep from './formStep';
import AnimatedBackground from './animatedBackground';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from './styles.module.css';

export type RoleType = 'STUDENT' | 'TEACHER';

export default function RegisterWizard() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const router = useRouter();

  const handleRegister = async (data: any) => {
    try {
      await axios.post('http://localhost:3000/auth/register', data);
      router.push('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao registrar');
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div>
        {step === 1 && <RoleStep onNext={setStep} onSelect={setSelectedRole} />}
        {step === 2 && selectedRole && (
          <FormStep role={selectedRole} onBack={() => setStep(1)} onSubmit={handleRegister} />
        )}
      </div>
    </>
  );
}
