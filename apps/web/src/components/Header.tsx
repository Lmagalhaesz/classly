export default function Header() {
    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="logo">
                        <img src="/images/logo1.jpeg" alt="" />
                    </div>
                    <div className="button">
                        <button>Já possuo uma conta</button>
                    </div>
                </div>
            </header>

            <style jsx>{`
          .header {
            width: 100%;
            height: 80px;
            display: flex;
            justify-content: center;
            align-items: center;    
            background-color: #fff;
            padding: 0 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 2;
          }
            .container {
                display: flex;
                flex-direction: row;
                height: 100%;
                width: 1300px;
                align-items: center;
                justify-content: space-between;
            }
  
          .logo {
            height: 100%;
            width: auto;
          }
            .logo img{
                height: 100%;
                width: auto;
            }
          .button{
                width: 200px;
                background-color: orange;
                height: 50px;
                border-radius: 30px;
                margin-right: 50px;
          }
            .button button{
                height: 100%;
                width: 110%;
                background-color: rgb(255, 176, 4);
                border-radius: 30px;
                color: #ffff;
                border: 0px;
                cursor: pointer;
            }
                .button button:hover{
                    height: 52px;
                    width: 223px;
                    transition: 0.3s;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    background-color: rgb(255, 174, 0);
                }
        `}</style>
        </>
    );
}
