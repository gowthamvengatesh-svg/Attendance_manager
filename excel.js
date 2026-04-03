import { db,auth } from "./firebase.js"
import { collection,addDoc }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

export async function uploadExcel(){

const file=document.getElementById("excelFile").files[0]

if(!file){
alert("Select an Excel file")
return
}

const data=await file.arrayBuffer()

const workbook=XLSX.read(data)

const sheet=workbook.Sheets[workbook.SheetNames[0]]

const rows=XLSX.utils.sheet_to_json(sheet,{header:1})

for(let i=1;i<rows.length;i++){

let roll=rows[i][0]
let name=rows[i][1]

if(roll && name){

await addDoc(
collection(db,"users",auth.currentUser.uid,"students"),
{
roll,
name,
order:Date.now()
})

}

}

alert("Students imported successfully")

window.loadStudents()   // VERY IMPORTANT

}