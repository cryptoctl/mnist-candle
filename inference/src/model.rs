use std::io::{Cursor, Read};
use candle_core::{Device, DType, Tensor};
use candle_core::test_utils::to_vec2_round;
use candle_nn::{Conv2d, Linear, VarBuilder};
use candle_nn::ops::softmax;
use image::ImageReader;
use wasm_bindgen::prelude::*;
use crate::console_log;

use js_sys::Array;
const LABELS: usize = 10;

#[derive(Debug)]
pub struct ConvNet {
    conv1: Conv2d,
    conv2: Conv2d,
    fc1: Linear,
    fc2: Linear,
    dropout: candle_nn::Dropout,
}

impl ConvNet {
    pub fn new(vs: VarBuilder) -> candle_core::Result<Self> {
        let conv1 = candle_nn::conv2d(1, 32, 5, Default::default(), vs.pp("c1"))?;
        let conv2 = candle_nn::conv2d(32, 64, 5, Default::default(), vs.pp("c2"))?;
        let fc1 = candle_nn::linear(1024, 1024, vs.pp("fc1"))?;
        let fc2 = candle_nn::linear(1024, LABELS, vs.pp("fc2"))?;
        let dropout = candle_nn::Dropout::new(0.5);
        std::prelude::rust_2015::Ok(Self {
            conv1,
            conv2,
            fc1,
            fc2,
            dropout,
        })
    }

    pub fn forward(&self, xs: &Tensor, train: bool) -> candle_core::Result<Tensor> {
        let (b_sz, _img_dim) = xs.dims2()?;

        let xs = xs
            .reshape((b_sz, 1, 28, 28))?
            .apply(&self.conv1)?
            .max_pool2d(2)?
            .apply(&self.conv2)?
            .max_pool2d(2)?
            .flatten_from(1)?
            .apply(&self.fc1)?
            .relu()?;

        self.dropout.forward(&xs, train)?.apply(&self.fc2)

    }
}

#[wasm_bindgen]
pub struct Model {
    mnist: ConvNet
}

#[wasm_bindgen]
impl Model {
    #[wasm_bindgen(constructor)]
    pub fn load(weights: Vec<u8>)-> Result<Model, JsError> {

        console_error_panic_hook::set_once();
        console_log!("loading model");

        let device = &Device::Cpu;
        let vb = VarBuilder::from_buffered_safetensors(weights, DType::F32, device)?;

        let model = ConvNet::new(vb).unwrap();

        Ok(Self { mnist:model })
    }

    pub fn inference(&self, image_data: Vec<u8>) -> Result<Array, String> {
        let device = Device::Cpu;
        let input = Tensor::from_vec(image_data, (1, 784), &device).unwrap().to_dtype(DType::F32).unwrap();
        let logits = self.mnist.forward(&input, false).unwrap();
        //logits.to_vec1::<f32>().unwrap()
        let output = softmax(&logits, 1);

        let output =to_vec2_round(&output.unwrap(), 10).unwrap();//
        //output.unwrap().to_vec2::<f32>().unwrap()[0].clone();

        let array = Array::new();
        for value in output[0].iter() {
            array.push(&(*value).into());
        }
        Ok(array)
        // logits.argmax(1).unwrap().to_vec1::<u32>().unwrap()[0]
    }

}