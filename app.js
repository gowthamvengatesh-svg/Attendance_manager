import { db,auth } from "./firebase.js"

import {
collection,
addDoc,
getDocs,
deleteDoc,
doc,
query,
orderBy,
setDoc,
updateDoc
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

import {
signOut,
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"

import { uploadExcel } from "./excel.js"
import { drawChart } from "./charts.js"

let attendance={}
let students=[]

document.getElementById("addStudent").onclick=addStudent
document.getElementById("uploadExcel").onclick=uploadExcel
document.getElementById("presentAll").onclick=presentAll
document.getElementById("removeAll").onclick=removeAllStudents
document.getElementById("exportExcel").onclick=exportExcel
document.getElementById("sendWhatsApp").onclick=sendWhatsApp
document.getElementById("saveProfile").onclick=saveProfile
document.getElementById("logoutBtn").onclick=logout
document.getElementById("viewHistory").onclick=viewHistory

onAuthStateChanged(auth,(user)=>{
if(user){
loadStudents()
}
})

async function saveProfile(){

const teacher=document.getElementById("teacherName").value
const cls=document.getElementById("className").value

document.getElementById("userInfo").innerText=
teacher+" | "+cls

await setDoc(
doc(db,"users",auth.currentUser.uid),
{
teacherName:teacher,
className:cls
},
{merge:true}
)

}

async function addStudent(){

const roll=document.getElementById("roll").value
const name=document.getElementById("name").value

if(!roll||!name)return

await addDoc(
collection(db,"users",auth.currentUser.uid,"students"),
{
roll,
name,
order:Date.now()
})

document.getElementById("roll").value=""
document.getElementById("name").value=""

loadStudents()

}

window.loadStudents=async function(){

const q = query(
collection(db,"users",auth.currentUser.uid,"students"),
orderBy("order")
)

const snapshot=await getDocs(q)

const container=document.getElementById("studentList")

container.innerHTML=""

students=[]
attendance={}

snapshot.forEach(docSnap=>{

const data=docSnap.data()

students.push({id:docSnap.id,...data})

attendance[docSnap.id]="Present"

let div=document.createElement("div")

div.className="student"
div.dataset.id=docSnap.id

div.innerHTML = `

<div>

<div class="avatar">${data.name.charAt(0)}</div>

<b>${data.name}</b>

<span class="roll">${data.roll}</span>

</div>

<div>

<button onclick="mark('${docSnap.id}','Present',this)">✔</button>

<button onclick="mark('${docSnap.id}','Absent',this)">✖</button>

<button onclick="moveUp('${docSnap.id}')">⬆</button>

<button onclick="moveDown('${docSnap.id}')">⬇</button>

<button onclick="removeStudent('${docSnap.id}')">🗑</button>

</div>

`

container.appendChild(div)

})

updateSummary()


}

window.mark=function(id,status,btn){

attendance[id]=status

const parent=btn.parentElement

const buttons=parent.querySelectorAll("button")

buttons[0].classList.remove("present-active")
buttons[1].classList.remove("absent-active")

if(status==="Present"){
buttons[0].classList.add("present-active")
}

if(status==="Absent"){
buttons[1].classList.add("absent-active")
}

updateSummary()

saveAttendance()

}

window.removeStudent = async function(id){

try{

await deleteDoc(
doc(db,"users",auth.currentUser.uid,"students",id)
)

loadStudents()

}catch(err){

console.error(err)

alert("Failed to remove student")

}

}

function presentAll(){

for(let id in attendance){
attendance[id]="Present"
}

updateSummary()

}

async function removeAllStudents(){

const snapshot=await getDocs(
collection(db,"users",auth.currentUser.uid,"students")
)

for(const s of snapshot.docs){
await deleteDoc(s.ref)
}

loadStudents()

}

function updateSummary(){

let present=0
let absent=0

for(let s in attendance){

if(attendance[s]=="Present")present++
else absent++

}

document.getElementById("summary").innerText=
"Present: "+present+" | Absent: "+absent

drawChart(present,absent)

}

function sendWhatsApp(){

let number=document.getElementById("whatsappNumber").value

let msg="Absent Students%0A"

students.forEach(s=>{

if(attendance[s.id]=="Absent"){

msg+=s.roll+" - "+s.name+"%0A"

}

})

window.open(`https://wa.me/${number}?text=${msg}`)

}

function exportExcel(){

let rows=[["Roll","Name","Status"]]

students.forEach(s=>{

rows.push([
s.roll,
s.name,
attendance[s.id]
])

})

let sheet=XLSX.utils.aoa_to_sheet(rows)

let wb=XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb,sheet,"Attendance")

XLSX.writeFile(wb,"attendance.xlsx")

}

function logout(){

signOut(auth)

window.location="index.html"

}

async function saveAttendance(){

const date=document.getElementById("attendanceDate").value

if(!date)return

let present=0
let absent=0

for(let s in attendance){

if(attendance[s]=="Present")present++
else absent++

}

await addDoc(
collection(db,"users",auth.currentUser.uid,"attendanceHistory"),
{
date,
present,
absent,
attendanceData:attendance
})

}

async function viewHistory(){

const snapshot=await getDocs(
collection(db,"users",auth.currentUser.uid,"attendanceHistory")
)

const container=document.getElementById("historyList")

container.innerHTML=""

snapshot.forEach(docSnap=>{

const data=docSnap.data()

container.innerHTML+=`

<div class="history-card">

<b>${data.date}</b>

<br>

Present: ${data.present}

<br>

Absent: ${data.absent}

</div>

`

})

}
window.moveUp = async function(id){

const index = students.findIndex(s => s.id === id)

if(index <= 0) return

const temp = students[index]
students[index] = students[index-1]
students[index-1] = temp

await updateStudentOrder()

}

window.moveDown = async function(id){

const index = students.findIndex(s => s.id === id)

if(index === students.length-1) return

const temp = students[index]
students[index] = students[index+1]
students[index+1] = temp

await updateStudentOrder()

}

async function updateStudentOrder(){

for(let i=0;i<students.length;i++){

await updateDoc(
doc(db,"users",auth.currentUser.uid,"students",students[i].id),
{order:i}
)

}

loadStudents()

}