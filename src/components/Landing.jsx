import React from 'react'
import { useState } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [name,setName]=useState('');
  return (

    <>
      <input type="text" onChange={(e)=>{
        setName(e.target.value);
      }} />

      <Link to={`/room?name=${name}`}>Join Room</Link>
    </>
  )
}

export default Landing