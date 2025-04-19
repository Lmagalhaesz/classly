import { useState } from 'react';
import { LevelType } from 'types/src/levels';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  onNext: (step: 1 | 2) => void;
  onSelect: (level: LevelType) => void;
}

const levels: { value: LevelType; label: string; icon: string }[] = [
  { value: 'BASIC', label: 'BASIC', icon: '/images/levels/basic.png' },
  { value: 'LOWER_INTERMEDIATE', label: 'LOWER INTERMEDIATE', icon: '/images/levels/lower.png' },
  { value: 'INTERMEDIATE', label: 'INTERMEDIATE', icon: '/images/levels/intermediate.png' },
  { value: 'UPPER_INTERMEDIATE', label: 'UPPER INTERMEDIATE', icon: '/images/levels/upper.png' },
  { value: 'ADVANCED', label: 'ADVANCED', icon: '/images/levels/advanced.png' },
];

export default function LevelStep({ onNext, onSelect }: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1); // ← controle de animação

  const handleNext = () => {
    if (index < levels.length - 1) {
      setDirection(1);
      setIndex(index + 1);
    }
  };

  const handleBack = () => {
    if (index > 0) {
      setDirection(-1);
      setIndex(index - 1);
    }
  };

  const handleConfirm = () => {
    onSelect(levels[index].value);
    onNext(2);
  };

  const current = levels[index];

  return (
    <div className="step1-screen">
      <div className="card-container">
        <button onClick={handleBack} disabled={index === 0} className="arrow">◀</button>

        <div className="level-wrapper">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.value}
              initial={{ x: direction * 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -300, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="level-card"
            >
                <div className="level-card">
                <img src={current.icon} width={120} />
                <h2>{current.label}</h2>
                </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button onClick={handleNext} disabled={index === levels.length - 1} className="arrow">▶</button>
      </div>

      <button onClick={handleConfirm} className="confirm-button">Confirmar Nível</button>

      <style jsx>{`
        .step1-screen {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .card-container {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .level-wrapper {
          position: relative;
          width: 620px;
          height: 500px;
          overflow: hidden;
        }

        .arrow {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #ff6a00;
        }

        .arrow:disabled {
          opacity: 0.3;
          cursor: default;
        }

        .level-card {
          position: absolute;
          top: 0;
          left: 0;
          width: 620px;
          height: 500px;
          background: white;
          box-shadow: 0 12px 30px rgba(0,0,0,0.1);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .level-card h2 {
          margin-top: 5rem;
          color: #ff7f00;
          font-size: 40px;
        }

        .confirm-button {
          margin-top: 3rem;
          padding: 0.75rem 1.5rem;
          font-size: 1.2rem;
          background-color: #ff6a00;
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
            transition: 0.5s;
        }
        .confirm-button:hover {
            background-color: rgb(255, 174, 0);
            font-size: 1.3rem;
            transition: 0.5s;
        }
      `}</style>
    </div>
  );
}
