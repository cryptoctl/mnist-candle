import {Model} from "inference";
import {useEffect, useRef, useState} from "react";
import {Canvas, PencilBrush} from 'fabric';
import {cropScaleGetImageData} from "@/utils";
import BarChart from "@/components/BarChart";

export default function Inference() {
    const model = useRef<Model>();
    const canvas = useRef<Canvas>();
    const canvasRef = useRef<HTMLCanvasElement>( null );
    const corpCanvasRef = useRef<HTMLCanvasElement>( null );
    const scaledCanvasRef = useRef<HTMLCanvasElement>( null );

    const mainContext = useRef<CanvasRenderingContext2D>();
    const cropContext =  useRef<CanvasRenderingContext2D>();
    const scaledContext =  useRef<CanvasRenderingContext2D>();

    let timeoutId:NodeJS.Timeout|number|undefined = undefined;
    let isDrawing = false;
    let isTimeOutSet = false;

    const [chartData, setChartData] = useState({
        labels: ['0','1','2', '3', '4', '5', '6', '7', '8','9'],
        datasets: [{
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderWidth: 1
        }]
    });

    async function fireOffInference() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            isTimeOutSet = true;
            const image = cropScaleGetImageData(mainContext.current!, cropContext.current!, scaledContext.current!);
            const rslt = model.current?.inference(image)
            //setResult(rslt)
            console.log('inference result= '+rslt)
            if(rslt){
                let arr: number[] = [];
                rslt.forEach(a=>{ arr.push(a.toFixed(2));})
                console.log(arr)
                setChartData(
                    {
                        ...chartData,
                        datasets:[
                            {
                                data: arr,
                                borderWidth: 1
                            }
                        ]
                    }
                );
            }
            isTimeOutSet = false;
        }, 50);
        isTimeOutSet = true;
    }

    useEffect(() => {
        const initModel = async () => {
            const response = await fetch(
                "/assets/mnist_cnn.safetensors",
                {
                    method: "GET",
                    mode: "cors",
                    cache: "force-cache",
                    credentials: "same-origin"
                });

            const data = await response.arrayBuffer();
            const weights = new Uint8Array(data);
            model.current = new Model(weights);
        };

        initModel().catch(err=>{
            console.log(err);
        });

        if(!canvas.current){
            mainContext.current = canvasRef.current!.getContext( "2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
            cropContext.current = corpCanvasRef.current!.getContext( "2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
            scaledContext.current = scaledCanvasRef.current!.getContext( "2d", { willReadFrequently: true }) as CanvasRenderingContext2D;

            canvas.current = new Canvas(canvasRef.current!, { width:300, height:320, isDrawingMode:true, backgroundColor:'white' });
            if (canvas.current instanceof Canvas) {
                const pencil = new PencilBrush(canvas.current);
                pencil.width = 20;
                pencil.color = "#000000";
                canvas.current.freeDrawingBrush = pencil;

                canvas.current.on('mouse:down', (evt )=>{
                    isDrawing = true;
                })
                canvas.current.on('mouse:move', async (evt) => {
                    if (isDrawing && !isTimeOutSet) {
                        await fireOffInference();
                    }
                })
                canvas.current.on('mouse:up', async (evt) => {
                    isDrawing = false;
                    await fireOffInference();
                })

                canvas.current.renderAll();
                //console.log(canvas.current._objects.length);
                console.log('fabric init...')
            }
        }

    },
    []);

    const clearCanvas = () => {
        canvas.current?.clear();
        scaledContext.current?.clearRect(0,0, 100, 100);
        cropContext.current?.clearRect(0,0, 28, 28);
        canvas.current?.renderAll();
    }

    return (
        <div className={`container flex flex-row justify-center bg-gray-500 bg-opacity-75`}>
            <div className={'flex-none'}>
                <div className={'m-2 p-2 bg-white rounded-md'}>
                <canvas ref={canvasRef} style={{width: '300px', height: '320px'}}></canvas>
                <div className={'flex justify-center'}><button type={'button'} className="btn btn-blue mt-2" onClick={() => clearCanvas()}>Clear</button></div>
                </div>
            </div>
            <div className={'flex-none m-2 p-2 bg-white rounded-md'} style={{maxHeight:'120px'}}>
                <canvas ref={scaledCanvasRef} width={28} height={28} style={{width: '100px', height: '100px'}}></canvas>
                <canvas ref={corpCanvasRef} style={{width: '28px', height: '28px', display: 'none'}}></canvas>
            </div>
            <div  className={'flex-none m-2 p-2 bg-white rounded-md'} style={{width: '620px', height: '328px'}}>
                <BarChart chartData={chartData} />
            </div>
        </div>
    );
}