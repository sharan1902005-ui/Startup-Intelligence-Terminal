import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import numpy as np
from pathlib import Path
from tensorflow.keras.models import Model, load_model
import tf2onnx
import onnx

MODELS_DIR = Path(__file__).resolve().parent / "models"

model = load_model(MODELS_DIR / "lstm_model.h5")

# Convert main prediction model
input_sig = [tf2onnx.tf_loader.tf.TensorSpec((None, 15, 8), tf2onnx.tf_loader.tf.float32, name="input")]
onnx_model, _ = tf2onnx.convert.from_keras(model, input_signature=input_sig, opset=13)
onnx.save(onnx_model, str(MODELS_DIR / "lstm_model.onnx"))
print("Saved lstm_model.onnx")

# Convert embedding model
embedding_model = Model(
    inputs=model.inputs,
    outputs=model.get_layer("embedding_layer").output,
)
onnx_emb, _ = tf2onnx.convert.from_keras(embedding_model, input_signature=input_sig, opset=13)
onnx.save(onnx_emb, str(MODELS_DIR / "embedding_model.onnx"))
print("Saved embedding_model.onnx")
