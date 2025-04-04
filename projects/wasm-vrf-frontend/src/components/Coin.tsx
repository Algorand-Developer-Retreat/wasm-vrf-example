import React from "react";

export interface CoinProps {
  headsImg: string;
  tailsImg: string;
  result?: "heads" | "tails";
}

export const Coin: React.FC<CoinProps> = ({ headsImg, tailsImg, result }) => {
  return (
    <div className="coin-flip-container">
      <style>
        {`
          .coin {
            position: relative;
            width: 200px;
            height: 200px;
            transform-style: preserve-3d;
            transform-origin: center;
          }

          .coin-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          }

          .heads {
            transform: rotateY(0deg);
          }

          .tails {
            transform: rotateY(180deg);
          }

          .coin.continuous-flip {
            animation: continuous-flip 2s linear infinite;
          }

          @keyframes continuous-flip {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(720deg); }
          }

          .coin img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 50%;
          }
        `}
      </style>

      <div className={`coin ${!result ? "continuous-flip" : ""} ${result || ""}`}>
        <div className="coin-face heads">
          <img src={headsImg} alt="Heads" />
        </div>
        <div className="coin-face tails">
          <img src={tailsImg} alt="Tails" />
        </div>
      </div>
    </div>
  );
};
