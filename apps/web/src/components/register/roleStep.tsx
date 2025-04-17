import { RoleType } from "./registerWizard";

interface Props {
  onNext: (step: 1 | 2) => void;
  onSelect: (role: RoleType) => void;
}

export default function RoleStep({ onNext, onSelect }: Props) {
  const handleClick = (role: RoleType) => {
    onSelect(role);
    onNext(2);
  };

  return (
    <div className="step1-screen">
      <div className="cards-wrapper">
        <div className="role-card" onClick={() => handleClick("STUDENT")}>
          <div className="image">
          <img src="/images/studentIcon.png" alt="Ícone de Aluno" width={100} />
            </div>  
          <h2>Sou Aluno</h2>
          <p>
            Quero me cadastrar como estudante para participar de aulas, grupos e
            acompanhar meu progresso.
          </p>
        </div>

        <div className="role-card" onClick={() => handleClick("TEACHER")}>
        <img src="/images/teacherIcon.png" alt="Ícone de Aluno" width={150} height={150} />
          <h2>Sou Professor</h2>
          <p>
            Quero me cadastrar como professor para criar turmas, gerenciar
            conteúdos e acompanhar alunos.
          </p>
        </div>
      </div>

      <style jsx>{`
        .step1-screen {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          background-color: #fff;
        }

        .cards-wrapper {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 3rem; /* espaçamento entre os cards */
        }

        .role-card {
          width: 750px;
          height: 500px;
          display: flex;
          flex-direction: column;
          background-color: white;
          border-radius: 10px;
          padding: 3rem;
          margin: 1rem 0;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          justify-content: center;
          align-items: center;
          text-align: center;
          opacity: 1;
          backdrop-filter: none;
          z-index: 1;
        }

        .role-card:hover {
          transform: scale(1.03);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
        }

        .role-card h2 {
          font-size: 2.5rem;
          color:rgb(39, 39, 39);
          margin-bottom: 2rem;
        }
        .role-card h2:hover{
        }

        .role-card p {
          font-size: 1.1rem;
          color: #444;
        }
      `}</style>
    </div>
  );
}
