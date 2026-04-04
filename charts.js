let chart

export function drawChart(present,absent){

const ctx=document.getElementById("chart")

if(chart) chart.destroy()

chart=new Chart(ctx,{

type:"doughnut",

data:{
labels:["Present","Absent"],
datasets:[{
data:[present,absent],
backgroundColor:["#2e7d32","#c62828"]
}]
}

})

}