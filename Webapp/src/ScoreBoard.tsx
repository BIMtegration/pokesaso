import React from 'react';

interface ScoreBoardProps {
  score: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ score }) => (
  <div className="score-board">
    <h3>Puntaje: {score}</h3>
  </div>
);

export default ScoreBoard;
