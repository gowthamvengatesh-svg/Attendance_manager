import { db,auth } from "./firebase.js"

import {
collection,
doc,
writeBatch
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

export async function uploadExcel(){

const file=document.getElementById("excelFile").files[0]

if(!file){
alert("Please select Excel file")
return
}

const data=await file.arrayBuffer()

const workbook=XLSX.read(data)

const sheet=workbook.Sheets[workbook.SheetNames[0]]

const rows=XLSX.utils.sheet_to_json(sheet,{header:1})

const batch=writeBatch(db)

const studentsRef=collection(
db,
"users",
auth.currentUser.uid,
"students"
)

let count=0

for(let i=1;i<rows.length;i++){

const roll=rows[i][0]
const name=rows[i][1]

if(roll && name){

const newDoc=doc(studentsRef)

batch.set(newDoc,{
roll:String(roll),
name:String(name),
order:Date.now()+i
})

count++

}

}

await batch.commit()

alert(count+" students imported successfully")

window.loadStudents()

}