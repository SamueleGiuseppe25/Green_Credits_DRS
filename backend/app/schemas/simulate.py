from pydantic import BaseModel


class SimulateReturnRequest(BaseModel):
    bagCount: int


class SimulateReturnResponse(BaseModel):
    estimatedCredits: int
    message: str
    success: bool
# class SimulateCollectionRequest(BaseModel):
#     itemCount: int
