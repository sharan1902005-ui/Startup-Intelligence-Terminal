from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from .model_loader import LABELS, embedding_model
    from .nearest_neighbors import find_similar
    from .predictor import predict_outcome, prepare_input, preprocess_rounds
except ImportError:
    from model_loader import LABELS, embedding_model
    from nearest_neighbors import find_similar
    from predictor import predict_outcome, prepare_input, preprocess_rounds


app = FastAPI(title="Startup Survival Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FundingRound(BaseModel):
    amount: float = Field(gt=0)
    days_since_last_round: float = Field(ge=0)
    round_number: int = Field(ge=1)
    round_type: int = Field(ge=0)


class StartupRequest(BaseModel):
    rounds: List[FundingRound]
    k: int = Field(default=5, ge=1, le=20)
    filter_by_prediction: bool = True


@app.get("/")
def home():
    return {
        "project": "Startup Survival Predictor",
        "status": "running",
        "docs": "/docs",
    }


@app.post("/predict")
def predict(request: StartupRequest):
    rounds = [round_data.model_dump() for round_data in request.rounds]
    features = preprocess_rounds(rounds)
    X = prepare_input(features)

    class_id, confidence = predict_outcome(X)
    prediction = LABELS[class_id]

    input_name = embedding_model.get_inputs()[0].name
    embedding = embedding_model.run(None, {input_name: X})[0][0]
    predicted_status = {
        "Shutdown": "closed",
        "Acquired": "acquired",
        "Growing": "operating",
    }[prediction] if request.filter_by_prediction else None
    similar = find_similar(
        embedding,
        k=request.k,
        predicted_status=predicted_status,
    )

    return {
        "prediction": prediction,
        "confidence": round(confidence * 100, 2),
        "similar_startups": similar,
    }
