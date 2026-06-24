import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

from pathlib import Path
import tensorflow as tf
import keras
from keras import layers
import tf2onnx
import onnx

MODELS_DIR = Path(__file__).resolve().parent / "models"

model = keras.Sequential([
    layers.Masking(mask_value=0, input_shape=(15, 8), name="masking_layer"),
    layers.LSTM(64, name="lstm_layer"),
    layers.Dense(32, activation="relu", name="embedding_layer"),
    layers.Dense(3, activation="softmax", name="prediction_layer"),
])
model.load_weights(str(MODELS_DIR / "lstm_model.h5"))
print("Loaded weights successfully")

@tf.function(input_signature=[tf.TensorSpec((None, 15, 8), tf.float32, name="input")])
def predict_fn(x):
    return model(x, training=False)

onnx_model, _ = tf2onnx.convert.from_function(predict_fn, input_signature=[tf.TensorSpec((None, 15, 8), tf.float32, name="input")], opset=13)
onnx.save(onnx_model, str(MODELS_DIR / "lstm_model.onnx"))
print("Saved lstm_model.onnx")

embedding_model = keras.Model(inputs=model.inputs, outputs=model.get_layer("embedding_layer").output)

@tf.function(input_signature=[tf.TensorSpec((None, 15, 8), tf.float32, name="input")])
def embed_fn(x):
    return embedding_model(x, training=False)

onnx_emb, _ = tf2onnx.convert.from_function(embed_fn, input_signature=[tf.TensorSpec((None, 15, 8), tf.float32, name="input")], opset=13)
onnx.save(onnx_emb, str(MODELS_DIR / "embedding_model.onnx"))
print("Saved embedding_model.onnx")
