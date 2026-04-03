import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth,GoogleAuthProvider }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig={

apiKey:"AIzaSyDCJeiom2umgZCZRtyikAF8Ul53_4N08zs",
authDomain:"attendance-system-f914c.firebaseapp.com",
projectId:"attendance-system-f914c",
storageBucket:"attendance-system-f914c.appspot.com",
messagingSenderId:"1060849026863",
appId:"1:1060849026863:web:6764a7df75c4e2468243da"

}

const app=initializeApp(firebaseConfig)

export const db=getFirestore(app)
export const auth=getAuth(app)
export const provider=new GoogleAuthProvider()