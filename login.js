import { auth,provider,db } from "./firebase.js"

import { signInWithPopup }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"

import { doc,getDoc }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

document.getElementById("loginBtn").onclick=login

async function login(){

const result=await signInWithPopup(auth,provider)

const uid=result.user.uid

const adminCheck=await getDoc(doc(db,"admins",uid))

if(adminCheck.exists()){

window.location="admin.html"

}else{

window.location="teacher.html"

}

}