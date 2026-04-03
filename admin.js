import { db,auth } from "./firebase.js"

import {
collection,
getDocs,
deleteDoc
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

import { signOut }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"

let chart

window.onload=loadData


async function loadData(){

const teachersContainer=document.getElementById("teachers")

teachersContainer.innerHTML="Loading..."

const users=await getDocs(collection(db,"users"))

teachersContainer.innerHTML=""

let totalTeachers=0
let totalStudents=0
let totalPresent=0
let totalAbsent=0


for(const user of users.docs){

totalTeachers++

const uid=user.id
const data=user.data()

const teacherName=data.teacherName || "Unknown"
const className=data.className || "Not Set"


// students

const studentsSnap=await getDocs(
collection(db,"users",uid,"students")
)

const studentCount=studentsSnap.size

totalStudents+=studentCount


// attendance

const historySnap=await getDocs(
collection(db,"users",uid,"attendanceHistory")
)

let present=0
let absent=0

historySnap.forEach(h=>{

const d=h.data()

present+=d.present
absent+=d.absent

})

totalPresent+=present
totalAbsent+=absent


teachersContainer.innerHTML+=`

<div class="teacher-card">

<b>Teacher:</b> ${teacherName}

<br>

<b>Class:</b> ${className}

<br>

<b>Students:</b> ${studentCount}

<br>

<b>Attendance Records:</b> ${historySnap.size}

</div>

`

}


// analytics

document.getElementById("totalTeachers").innerText=totalTeachers
document.getElementById("totalStudents").innerText=totalStudents

let percent=0

if(totalPresent+totalAbsent>0){

percent=Math.round(
(totalPresent/(totalPresent+totalAbsent))*100
)

}

document.getElementById("attendancePercent").innerText=
percent+"%"


drawCollegeChart(totalPresent,totalAbsent)

}



function drawCollegeChart(present,absent){

const ctx=document.getElementById("collegeChart")

if(chart) chart.destroy()

chart=new Chart(ctx,{

type:"pie",

data:{

labels:["Present","Absent"],

datasets:[{

data:[present,absent],

backgroundColor:[
"#2e7d32",
"#c62828"
]

}]

}

})

}



document.getElementById("viewDateReport").onclick=viewDateReport


async function viewDateReport(){

const date=document.getElementById("calendarDate").value

const result=document.getElementById("calendarResult")

result.innerHTML=""

const users=await getDocs(collection(db,"users"))

for(const user of users.docs){

const uid=user.id

const history=await getDocs(
collection(db,"users",uid,"attendanceHistory")
)

history.forEach(h=>{

const data=h.data()

if(data.date===date){

result.innerHTML+=`

<div class="history-card">

<b>Date:</b> ${date}

<br>

Present: ${data.present}

<br>

Absent: ${data.absent}

</div>

`

}

})

}

}



document.getElementById("resetDatabase").onclick=resetDatabase


async function resetDatabase(){

if(!confirm("Delete ALL database?"))return

const users=await getDocs(collection(db,"users"))

for(const user of users.docs){

const uid=user.id


const students=await getDocs(
collection(db,"users",uid,"students")
)

for(const s of students.docs){
await deleteDoc(s.ref)
}


const history=await getDocs(
collection(db,"users",uid,"attendanceHistory")
)

for(const h of history.docs){
await deleteDoc(h.ref)
}

}

alert("Database cleared")

loadData()

}



document.getElementById("logoutBtn").onclick=logout


function logout(){

signOut(auth)

window.location="index.html"

}