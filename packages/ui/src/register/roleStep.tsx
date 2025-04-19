import { RoleType } from "types/src/roles";

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
        </div>

        <div className="role-card" onClick={() => handleClick("TEACHER")}>
          <img src="/images/teacherIcon.png" alt="Ícone de Aluno" width={150} height={150} />
          <h2>Sou Professor</h2>
        </div>
      </div>

      <style>{`

        

        .step1-screen {
          height: 100vh;
          width: 100vw;
          overflow: hidden; 
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
          justify-content: center;
          gap: 3rem;
          margin-bottom: 120px;
        }

        .role-card {
          width: 750px;
          max-height: 100%;
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
          margin-top: 10px;
          color:#ff6a00;
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
