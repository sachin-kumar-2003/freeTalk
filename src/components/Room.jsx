import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
const URL="http://localhost:3000";
const Room = () => {
  const [searchParams,setSearchParams]=useSearchParams();
  const name=searchParams.get('name');
  const [socket,setSocket]=useState(null);
  useEffect(()=>{
   const socket=io(URL,{
    autoConnect:false
   });
   socket.on('send-offer',()=>{
     alert("send-offer");
   });
   socket.on("offer",()=>{
     alert("offer");
   });
   setSocket(socket);
  },[name])
  return (
    <div>hii {name}</div>
  )
}

export default Room