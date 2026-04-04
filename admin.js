import { db,auth } from "./firebase.js"

import {
collection,
getDocs,
deleteDoc,
doc,
getDoc,
query,
orderBy
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

import { signOut }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"





let chart
let currentClassUID = null


window.onload = loadData


async function loadData(){

const container = document.getElementById("classesContainer")

if(!container) return

container.innerHTML = "Loading..."

const users = await getDocs(collection(db,"users"))

container.innerHTML = ""

let totalTeachers = 0
let totalStudents = 0
let totalPresent = 0
let totalAbsent = 0


for(const user of users.docs){

totalTeachers++

const uid = user.id
const data = user.data()

const teacher = data.teacherName || "Unknown"
const className = data.className || "No Class"


// fetch students
const studentsSnap = await getDocs(
collection(db,"users",uid,"students")
)

const studentCount = studentsSnap.size

totalStudents += studentCount


// fetch attendance history
const historySnap = await getDocs(
collection(db,"users",uid,"attendanceHistory")
)

let present = 0
let absent = 0

historySnap.forEach(h=>{

const d = h.data()

present += d.present || 0
absent += d.absent || 0

})

totalPresent += present
totalAbsent += absent


// create class card
container.innerHTML += `

<div class="class-card" onclick="openClass('${uid}','${className}')">

<b>Class:</b> ${className}<br>
<b>Teacher:</b> ${teacher}<br>
<b>Students:</b> ${studentCount}

</div>

`

}


// update analytics
const tTeachers = document.getElementById("totalTeachers")
const tStudents = document.getElementById("totalStudents")
const tPercent = document.getElementById("attendancePercent")

if(tTeachers) tTeachers.innerText = totalTeachers
if(tStudents) tStudents.innerText = totalStudents


let percent = 0

if(totalPresent + totalAbsent > 0){

percent = Math.round(
(totalPresent / (totalPresent + totalAbsent)) * 100
)

}

if(tPercent) tPercent.innerText = percent + "%"


drawCollegeChart(totalPresent,totalAbsent)

}



// ---------- CHART ----------

function drawCollegeChart(present,absent){

const ctx = document.getElementById("collegeChart")

if(!ctx) return

if(chart) chart.destroy()

chart = new Chart(ctx,{

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



// ---------- OPEN CLASS ----------

window.openClass = async function(uid,className){

currentClassUID = uid

const container = document.getElementById("classDetails")

if(!container) return

container.innerHTML = `<h3>${className}</h3>Loading...`


const studentsSnap = await getDocs(
collection(db,"users",uid,"students")
)

let html = `

<table class="student-table">

<tr>
<th>Roll</th>
<th>Name</th>
<th>Status</th>
</tr>

`


studentsSnap.forEach(s=>{

const d = s.data()

html += `

<tr>
<td>${d.roll}</td>
<td>${d.name}</td>
<td>--</td>
</tr>

`

})

html += `</table>`

container.innerHTML = html

}



// ---------- VIEW ATTENDANCE ----------

const viewBtn = document.getElementById("viewClassAttendance")

if(viewBtn){

viewBtn.onclick = viewClassAttendance

}



async function viewClassAttendance(){

const date = document.getElementById("classDate").value

if(!date || !currentClassUID) return


const attendanceDoc = await getDoc(
doc(db,"users",currentClassUID,"attendanceHistory",date)
)


if(!attendanceDoc.exists()){

alert("Attendance not marked for this date")

return

}


const attendanceData = attendanceDoc.data().attendanceData

const q = query(
collection(db,"users",currentClassUID,"students"),
orderBy("roll")
)

const studentsSnap = await getDocs(q)


let html = `
<table class="student-table">

<tr>
<th>Roll</th>
<th>Name</th>
<th>Status</th>
</tr>
`


studentsSnap.forEach(s=>{

const d = s.data()

const status = attendanceData[s.id] || "Present"

const cls = status === "Absent" ? "absent" : "present"

html += `
<tr>
<td>${d.roll}</td>
<td>${d.name}</td>
<td class="${cls}">${status}</td>
</tr>
`

})


html += `</table>`


document.getElementById("classDetails").innerHTML = html

}


// ---------- RESET DATABASE ----------

const resetBtn = document.getElementById("resetDatabase")

if(resetBtn){

resetBtn.onclick = resetDatabase

}


async function resetDatabase(){

if(!confirm("Delete ALL database?")) return

const users = await getDocs(collection(db,"users"))

for(const user of users.docs){

const uid = user.id


const students = await getDocs(
collection(db,"users",uid,"students")
)

for(const s of students.docs){

await deleteDoc(s.ref)

}


const history = await getDocs(
collection(db,"users",uid,"attendanceHistory")
)

for(const h of history.docs){

await deleteDoc(h.ref)

}

}

alert("Database cleared")

loadData()

}



// ---------- LOGOUT ----------

const logoutBtn = document.getElementById("logoutBtn")

if(logoutBtn){

logoutBtn.onclick = logout

}

function logout(){

signOut(auth)

window.location = "index.html"

}

async function viewCollegeAttendance(date){

const users = await getDocs(collection(db,"users"))

let result = ""

for(const user of users.docs){

const uid = user.id
const data = user.data()

const teacher = data.teacherName || "Unknown"
const className = data.className || "No Class"

const attendanceDoc = await getDoc(
doc(db,"users",uid,"attendanceHistory",date)
)

if(attendanceDoc.exists()){

const d = attendanceDoc.data()

result += `
<div class="class-card">

<b>${className}</b><br>
Teacher: ${teacher}<br>
Present: ${d.present}<br>
Absent: ${d.absent}

</div>
`

}else{

result += `
<div class="class-card">

<b>${className}</b><br>
Teacher: ${teacher}<br>
Attendance not marked

</div>
`

}

}

document.getElementById("calendarResult").innerHTML = result

}