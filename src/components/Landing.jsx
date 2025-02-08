import React from 'react'
import { useState } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [name, setName] = useState('');
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.trim() === '') {
      alert("Name cannot be empty");
    } else {
      setName(value);
    }
  };

  return (

    <>
      <input type="text" onChange={handleInputChange} />


      <Link to={`/room?name=${name}`}>Join Room</Link>
    </>
  )
}

export default Landing
