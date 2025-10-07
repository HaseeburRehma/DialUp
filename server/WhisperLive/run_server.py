import argparse
import os
import threading
import uvicorn
from fastapi import FastAPI
from whisper_live.server import TranscriptionServer

app = FastAPI()

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

def start_whisper_server(args):
    server = TranscriptionServer()
    server.run(
        "0.0.0.0",
        port=args.port,
        backend=args.backend,
        faster_whisper_custom_model_path=args.faster_whisper_custom_model_path,
        whisper_tensorrt_path=args.trt_model_path,
        trt_multilingual=args.trt_multilingual,
        trt_py_session=args.trt_py_session,
        single_model=not args.no_single_model,
        max_clients=args.max_clients,
        max_connection_time=args.max_connection_time,
        cache_path=args.cache_path
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", "-p", type=int, default=4000)
    parser.add_argument("--backend", "-b", type=str, default="faster_whisper")
    parser.add_argument("--faster_whisper_custom_model_path", "-fw", type=str, default=None)
    parser.add_argument("--trt_model_path", "-trt", type=str, default=None)
    parser.add_argument("--trt_multilingual", "-m", action="store_true")
    parser.add_argument("--trt_py_session", action="store_true")
    parser.add_argument("--omp_num_threads", "-omp", type=int, default=1)
    parser.add_argument("--no_single_model", "-nsm", action="store_true")
    parser.add_argument("--max_clients", type=int, default=4)
    parser.add_argument("--max_connection_time", type=int, default=1800)
    parser.add_argument("--cache_path", "-c", type=str, default="~/.cache/whisper-live/")
    args = parser.parse_args()

    if "OMP_NUM_THREADS" not in os.environ:
        os.environ["OMP_NUM_THREADS"] = str(args.omp_num_threads)

    # Start the Whisper WebSocket server in a background thread
    threading.Thread(target=start_whisper_server, args=(args,), daemon=True).start()

    # Start FastAPI health endpoint
    uvicorn.run(app, host="0.0.0.0", port=args.port + 1)
