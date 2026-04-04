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


// ---------- GLOBAL LOADER + TOAST ----------

window.showLoader=function(){
const loader=document.getElementById("loader")
if(loader) loader.style.display="flex"
}

window.hideLoader=function(){
const loader=document.getElementById("loader")
if(loader) loader.style.display="none"
}

window.showToast=function(msg){
const toast=document.getElementById("toast")
if(!toast) return
toast.innerText=msg
toast.classList.add("show")
setTimeout(()=>toast.classList.remove("show"),3000)
}


// ---------- AUTH ----------

onAuthStateChanged(auth,(user)=>{

if(user){

loadStudents()

const pic=document.getElementById("profilePic")
const name=document.getElementById("teacherNameDisplay")

if(pic) pic.src=user.photoURL
if(name) name.innerText=user.displayName

}

})


// ---------- BUTTON EVENTS ----------

document.getElementById("addStudent").onclick=addStudent
document.getElementById("uploadExcel").onclick=uploadExcel
document.getElementById("presentAll").onclick=presentAll
document.getElementById("removeAll").onclick=removeAllStudents
document.getElementById("exportExcel").onclick=exportExcel
document.getElementById("sendWhatsApp").onclick=sendWhatsApp
document.getElementById("saveProfile").onclick=saveProfile
document.getElementById("logoutBtn").onclick=logout
document.getElementById("viewHistory").onclick=viewHistory


// ---------- PROFILE ----------

async function saveProfile(){

const teacher=document.getElementById("teacherName").value
const cls=document.getElementById("className").value

await setDoc(
doc(db,"users",auth.currentUser.uid),
{
teacherName:teacher,
className:cls
},
{merge:true}
)

document.getElementById("teacherNameDisplay").innerText=teacher
document.getElementById("classDisplay").innerText=cls

showToast("Profile saved")

}


// ---------- ADD STUDENT ----------

async function addStudent(){

const roll=document.getElementById("roll").value.trim()
const name=document.getElementById("name").value.trim()

if(!roll||!name){
showToast("Enter student details")
return
}

showLoader()

await addDoc(
collection(db,"users",auth.currentUser.uid,"students"),
{
roll,
name,
order:Date.now()
})

hideLoader()

showToast("Student added")

document.getElementById("roll").value=""
document.getElementById("name").value=""

loadStudents()

}


// ---------- LOAD STUDENTS ----------

window.loadStudents=async function(){

const q=query(
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

div.innerHTML=`

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


// ---------- MARK ATTENDANCE ----------

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

}


// ---------- REMOVE STUDENT ----------

window.removeStudent=async function(id){

await deleteDoc(
doc(db,"users",auth.currentUser.uid,"students",id)
)

showToast("Student removed")

loadStudents()

}


// ---------- PRESENT ALL ----------

function presentAll(){

for(let id in attendance){
attendance[id]="Present"
}

updateSummary()

}


// ---------- REMOVE ALL ----------

async function removeAllStudents(){

if(!confirm("Remove all students?")) return

const snapshot=await getDocs(
collection(db,"users",auth.currentUser.uid,"students")
)

for(const s of snapshot.docs){
await deleteDoc(s.ref)
}

showToast("All students removed")

loadStudents()

}


// ---------- SUMMARY ----------

function updateSummary(){

let present=0
let absent=0

for(let s in attendance){

if(attendance[s]=="Present") present++
else absent++

}

document.getElementById("summary").innerText=
`Present: ${present} | Absent: ${absent}`

drawChart(present,absent)

}


// ---------- WHATSAPP ----------

function sendWhatsApp(){

let number=document.getElementById("whatsappNumber").value

let msg="Absent Students%0A"

students.forEach(s=>{

if(attendance[s.id]=="Absent"){

msg+=`${s.roll} - ${s.name}%0A`

}

})

window.open(`https://wa.me/${number}?text=${msg}`)

}


// ---------- EXPORT EXCEL ----------

function exportExcel(){

let rows=[["Roll","Name","Status"]]

students.forEach(s=>{
rows.push([s.roll,s.name,attendance[s.id]])
})

let sheet=XLSX.utils.aoa_to_sheet(rows)

let wb=XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb,sheet,"Attendance")

XLSX.writeFile(wb,"attendance.xlsx")

}


// ---------- LOGOUT ----------

function logout(){

signOut(auth)

window.location="index.html"

}


// ---------- SAVE ATTENDANCE ----------

async function saveAttendance(){

const date=document.getElementById("attendanceDate").value

if(!date) return

let present=0
let absent=0

for(let s in attendance){

if(attendance[s]=="Present") present++
else absent++

}

await addDoc(
collection(db,"users",auth.currentUser.uid,"attendanceHistory"),
{
date,
present,
absent
})

}


// ---------- VIEW HISTORY ----------

async function viewHistory(){

await saveAttendance()

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


// ---------- MOVE ORDER ----------

window.moveUp=async function(id){

const index=students.findIndex(s=>s.id===id)

if(index<=0) return

const temp=students[index]
students[index]=students[index-1]
students[index-1]=temp

await updateOrder()

}

window.moveDown=async function(id){

const index=students.findIndex(s=>s.id===id)

if(index===students.length-1) return

const temp=students[index]
students[index]=students[index+1]
students[index+1]=temp

await updateOrder()

}

async function updateOrder(){

for(let i=0;i<students.length;i++){

await updateDoc(
doc(db,"users",auth.currentUser.uid,"students",students[i].id),
{order:i}
)

}

loadStudents()

}