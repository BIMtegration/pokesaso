import React from 'react';

interface CardRevealProps {
  card: any; // Se puede tipar mejor tras definir la estructura de la carta
  guessed: boolean;
}

const CardReveal: React.FC<CardRevealProps> = ({ card, guessed }) => (
  <div className="card-reveal">
    <h2>{guessed ? '¡Correcto!' : 'Respuesta:'}</h2>
    <h3>{card?.name}</h3>
    {card?.imageUrl && <img src={card.imageUrl} alt={card.name} />}
    <p>{card?.description}</p>
    {/* Mostrar más detalles si se desea */}
  </div>
);

export default CardReveal;
