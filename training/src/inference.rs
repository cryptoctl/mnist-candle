mod mnist_model;
use anyhow::Ok;
use candle_core::{Device, DType, Tensor};
use candle_nn::ops::softmax;
use candle_nn::VarBuilder;
use mnist_model::ConvNet;
use image::ImageReader;

fn main() -> anyhow::Result<()>
{
    //let device = Device::cuda_if_available(0)?;
    let device = Device::Cpu;

    let model_path = "G:/ML/mnist-candle/models/mnist_cnn.safetensors";
    let vb= unsafe { VarBuilder::from_mmaped_safetensors(&[model_path], DType::F32, &device)? };

    // let net = safetensors::load(model_path.clone(), &device)?;
    // for (key, val) in net {
    //     println!("{}: {:}", key, val);
    // }

    let model = ConvNet::new(vb)?;

    let xs = ImageReader::open("G:/ML/mnist-candle/data/0.png")?.decode()?.into_bytes().to_vec();
    let input = Tensor::from_vec(xs.clone(), (1, 784), &device)?.to_dtype(DType::F32)?;
    let logits = model.forward(&input, false)?;

    // Convert the model output into probability distribution using softmax formula
    let output = softmax(&logits, 1);

    let output = output.unwrap().to_vec2::<f32>().unwrap();

    println!("This digit is: {}", output[0][1]);
    println!("This digit is: {}", output[1][2]);
    println!("This digit is: {}", output[2][3]);

    //println!("This digit is: {}", logits.argmax(1)?.to_vec1::<u32>()?[0]);
  //  let aa = logits.argmax(1)?.to_vec1::<f32>();

    //let aa = softmax(&logits, 1).unwrap();
    //let b = aa.to_vec1::<f32>()?;
    //println!("This digit is: {}", b[0]);

//    println!("{}", aa.unwrap().len());
    Ok(())
}