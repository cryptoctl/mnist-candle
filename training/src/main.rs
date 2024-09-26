mod mnist_model;
use candle_core::{DType, Device, D};
use candle_nn::{loss, ops, Optimizer, VarBuilder, VarMap};
use mnist_model::ConvNet;
use rand::prelude::*;

//const IMAGE_DIM: usize = 784;
//const LABELS: usize = 10;

struct TrainingArgs {
    learning_rate: f64,
    load: Option<String>,
    save: Option<String>,
    epochs: usize,
}

fn training_loop_cnn(
    m: candle_datasets::vision::Dataset,
    args: &TrainingArgs,
) -> anyhow::Result<()> {
    const BSIZE: usize = 64;

    let dev = Device::cuda_if_available(0)?;

    let train_labels = m.train_labels;
    let train_images = m.train_images.to_device(&dev)?;
    let train_labels = train_labels.to_dtype(DType::U32)?.to_device(&dev)?;

    let mut varmap = VarMap::new();
    let vs = VarBuilder::from_varmap(&varmap, DType::F32, &dev);
    let model = ConvNet::new(vs.clone())?;

    if let Some(load) = &args.load {
        println!("loading weights from {load}");
        varmap.load(load)?
    }

    let adamw_params = candle_nn::ParamsAdamW {
        lr: args.learning_rate,
        ..Default::default()
    };
    
    let mut opt = candle_nn::AdamW::new(varmap.all_vars(), adamw_params)?;
    let test_images = m.test_images.to_device(&dev)?;
    let test_labels = m.test_labels.to_dtype(DType::U32)?.to_device(&dev)?;
    let n_batches = train_images.dim(0)? / BSIZE;
    let mut batch_idxs: Vec<usize> = (0..n_batches).collect::<Vec<usize>>();
    for epoch in 1..args.epochs {
        let mut sum_loss = 0f32;
        batch_idxs.shuffle(&mut thread_rng());
        for batch_idx in batch_idxs.iter() {
            let train_images = train_images.narrow(0, batch_idx * BSIZE, BSIZE)?;
            let train_labels = train_labels.narrow(0, batch_idx * BSIZE, BSIZE)?;
            let logits = model.forward(&train_images, true)?;
            let log_sm = ops::log_softmax(&logits, D::Minus1)?;
            let loss = loss::nll(&log_sm, &train_labels)?;
            opt.backward_step(&loss)?;
            sum_loss += loss.to_vec0::<f32>()?;
        }
        let avg_loss = sum_loss / n_batches as f32;

        let test_logits = model.forward(&test_images, false)?;
        let sum_ok = test_logits
            .argmax(D::Minus1)?
            .eq(&test_labels)?
            .to_dtype(DType::F32)?
            .sum_all()?
            .to_scalar::<f32>()?;
        let test_accuracy = sum_ok / test_labels.dims1()? as f32;
        println!(
            "{epoch:4} train loss {:8.5} test acc: {:5.2}%",
            avg_loss,
            100. * test_accuracy
        );
    }
    if let Some(save) = &args.save {
        println!("saving trained weights in {save}");
        varmap.save(save)?
    }
    Ok(())
}


fn main() -> anyhow::Result<()> {

    //let device = Device::new_cuda(0)?;
    /*
    let device = Device::cuda_if_available(0)?;

    
    let weight = Tensor::randn(0f32, 1.0, (100, 784), &device)?;
    let bias = Tensor::randn(0f32, 1.0, (100,  ), &device)?;

    let first = Linear::new(weight, Some(bias) );

    let weight = Tensor::randn(0f32, 1.0, (10, 100), &device)?;
    let bias = Tensor::randn(0f32, 1.0, (10,  ), &device)?;
    let second = Linear::new(weight, Some(bias));

    let model = Model{ first, second };

    let dummy_image = Tensor::randn(0f32, 1.0, (1, 784), &device)?;

    let digit = model.forward(&dummy_image)?;

    println!("Digit {digit:?} digit");
    */
    let m = candle_datasets::vision::mnist::load()?;

    println!("train-images: {:?}", m.train_images.shape());
    println!("train-labels: {:?}", m.train_labels.shape());
    println!("test-images: {:?}", m.test_images.shape());
    println!("test-labels: {:?}", m.test_labels.shape());

    let training_args = TrainingArgs {
        epochs: 10,
        learning_rate: 0.001,
        load: None,
        save: Some(String::from("../models/mnist_cnn.safetensors")),
    };
    
    training_loop_cnn(m, &training_args)
    

}
