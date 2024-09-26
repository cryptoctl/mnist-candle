import BarChart from "@/components/BarChart";
import {useState} from "react";
export default function Test(){

    const [chartData, setChartData] = useState({
        labels: ['0','1','2', '3', '4', '5', '6', '8','9'],
        datasets: [{
            data: [0, 0, 0, 0.3, 0, 0, 0, 0, 0, 0],
            borderWidth: 1
        }]
    });

    const refreshData = ()=>{
        setChartData(
            {
                ...chartData,
                datasets:[
                    {
                        data: [0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0],
                        borderWidth: 1
                    }
                ]
            }
        );
        console.log('aaa...')
    }
    return (
        <div>
            <BarChart chartData={chartData} />
            <span>我滴妈妈。。。</span>
            <button onClick={()=>refreshData()} className={'btn'}> change data</button>
        </div>
    )
}