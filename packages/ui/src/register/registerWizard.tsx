import { useState } from 'react';
import RoleStep from './roleStep';
import LevelStep from './student/levelStep';
import FormStep from './formStep';
import AnimatedBackground from './animatedBackground';
import Header from '../Header';
import axios from 'axios';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

import type { RoleType } from 'types/src/roles';
import type { LevelType } from 'types/src/levels';

export default function RegisterWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<LevelType | null>(null);
  const router = useRouter();

  const handleRegister = async (data: any) => {
    try {
      await axios.post('http://localhost:3000/auth/register', {
        ...data,
        role: selectedRole,
        level: selectedRole === 'STUDENT' ? selectedLevel : undefined,
      });
      router.push('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao registrar');
    }
  };

  return (
    <>
      <Header />
      <AnimatedBackground />
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
        }}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ x: -1000, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 1000, opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%' }}
            >
              <RoleStep
                onNext={() => {
                  if (selectedRole === 'TEACHER') setStep(3);
                  else setStep(2); // STUDENT → vai para LevelStep
                }}
                onSelect={setSelectedRole}
              />
            </motion.div>
          )}

          {step === 2 && selectedRole === 'STUDENT' && (
            <motion.div
              key="step2"
              initial={{ x: 1000, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -1000, opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%' }}
            >
              <LevelStep
                onNext={() => setStep(3)}
                onSelect={setSelectedLevel}
              />
            </motion.div>
          )}

          {step === 3 && selectedRole && (
            <motion.div
              key="step3"
              initial={{ x: 1000, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -1000, opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%' }}
            >
              <FormStep
                role={selectedRole}
                level={selectedLevel}
                onBack={() => {
                  if (selectedRole === 'STUDENT') setStep(2);
                  else setStep(1);
                }}
                onSubmit={handleRegister}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
