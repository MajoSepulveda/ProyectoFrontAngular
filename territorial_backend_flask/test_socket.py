
import os

import socketio

sio = socketio.Client()

@sio.event
def connect():
    print("Conectado al socket")

@sio.event
def disconnect():
    print("Desconectado")

@sio.on("official_tracking")
def on_tracking(data):
    print("Tracking:", data)

if __name__ == "__main__":
    socket_url = os.getenv("SOCKET_URL", "http://127.0.0.1:5000")
    sio.connect(socket_url)
    sio.wait()