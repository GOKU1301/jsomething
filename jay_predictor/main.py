from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from routers import process, predict
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="JayPredictor API",
    description="Exam topic prediction microservice for the JIIT Hub ecosystem.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(process.router, prefix="/process-document", tags=["Processing"])
app.include_router(predict.router, prefix="/predict", tags=["Predictions"])

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    print(f"Validation Error! Body: {body}")
    print(f"Details: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors(), "body": body.decode("utf-8")})



@app.get("/", tags=["Health"])
async def root():
    return {"service": "JayPredictor", "status": "online", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
